import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const statusId = searchParams.get("statusId");
    const search = searchParams.get("search");
    const assignedTo = searchParams.get("assignedTo");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    // Enforce pagination limits - min 1, max 100, default 50
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "50");
    const page = Math.max(1, rawPage);
    const limit = Math.min(Math.max(1, rawLimit), 100); // Min 1, Max 100, Default 50
    const skip = (page - 1) * limit;
    
    // Log warning if someone tries to fetch too many leads at once
    if (rawLimit > 100) {
      console.warn(`Lead fetch request with limit ${rawLimit} exceeded maximum of 100. Clamping to 100.`);
    }

    const where: any = {};
    if (campaignId) {
      where.campaignId = campaignId;
      
      // For BD users, verify they have access to this campaign and filter by assignment
      if (session.user.role === "BD") {
        const assignment = await prisma.campaignAssignment.findUnique({
          where: {
            campaignId_userId: {
              campaignId,
              userId: session.user.id,
            },
          },
        });

        if (!assignment) {
          return NextResponse.json(
            { error: "Access denied to this campaign" },
            { status: 403 }
          );
        }

        // BD users only see leads assigned to them in the campaign
        where.assignedBdId = session.user.id;
      }
    } else {
      // If no campaignId specified, for BD users, only show leads assigned to them
      if (session.user.role === "BD") {
        // BD users only see leads assigned to them
        where.assignedBdId = session.user.id;
      }
    }
    
    if (statusId) {
      where.statusId = statusId;
    } else if (status) {
      // Check if status is a UUID (might be passed as status param)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(status);
      
      if (isUuid) {
        where.statusId = status;
      } else {
        // It's a name. Check if it's a legacy enum value
        const legacyStatuses = ["New", "Locked", "Contacted", "Qualified", "Nurture", "Lost"];
        
        if (legacyStatuses.includes(status)) {
          where.OR = [
            { status: status },
            { statusConfig: { name: status } }
          ];
        } else {
          // Dynamic status name only
          where.statusConfig = { name: status };
        }
      }
    }
    
    if (assignedTo) where.assignedBdId = assignedTo;

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Search in standard data (name, email, phone)
    if (search) {
      where.OR = [
        {
          standardData: {
            path: ["firstName"],
            string_contains: search,
          },
        },
        {
          standardData: {
            path: ["lastName"],
            string_contains: search,
          },
        },
        {
          standardData: {
            path: ["email"],
            string_contains: search,
          },
        },
        {
          standardData: {
            path: ["phone"],
            string_contains: search,
          },
        },
      ];
    }

    // Build orderBy - handle different sort keys
    const orderBy: any = {};
    
    switch (sortBy) {
      case "name":
        // Sort by firstName (JSONB field)
        // Note: Prisma doesn't support direct JSONB field sorting, so we'll fetch and sort in memory
        // For now, fallback to createdAt - in production, consider adding computed columns
        orderBy.createdAt = sortOrder;
        break;
      case "email":
        // Sort by email in standardData JSONB
        // Prisma limitation - will fetch and sort in memory or use computed column
        orderBy.createdAt = sortOrder;
        break;
      case "phone":
        // Sort by phone in standardData JSONB
        orderBy.createdAt = sortOrder;
        break;
      case "status":
        orderBy.status = sortOrder;
        break;
      case "assignedTo":
        // Sort by assigned BD - need to join through assignedBD relation
        // For now, sort by assignedBdId
        orderBy.assignedBdId = sortOrder;
        break;
      case "lastActivity":
        // Sort by most recent activity - needs special handling
        // For now, sort by createdAt of activities
        orderBy.createdAt = sortOrder;
        break;
      case "createdAt":
        orderBy.createdAt = sortOrder;
        break;
      case "updatedAt":
        orderBy.updatedAt = sortOrder;
        break;
      default:
        // Handle custom fields (custom.fieldKey format)
        if (sortBy.startsWith("custom.")) {
          const fieldKey = sortBy.replace("custom.", "");
          // Custom fields in customData JSONB - can't sort directly
          // Fallback to createdAt
          orderBy.createdAt = sortOrder;
        } else {
          orderBy.createdAt = sortOrder;
        }
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignedBD: {
            select: {
              id: true,
              email: true,
              avatar: true,
            },
          },
          lockedByUser: {
            select: {
              id: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          statusConfig: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          activities: {
            select: {
              id: true,
              type: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          tasks: {
            where: {
              status: {
                in: ["pending", "in_progress"],
              },
            },
            select: {
              id: true,
              title: true,
              dueDate: true,
              type: true,
            },
            orderBy: {
              dueDate: "asc",
            },
            take: 1,
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    // Apply in-memory sorting for fields that can't be sorted in database
    let sortedLeads = leads;
    if (sortBy === "name" || sortBy === "email" || sortBy === "phone") {
      sortedLeads = [...leads].sort((a, b) => {
        const aValue = sortBy === "name" 
          ? `${(a.standardData as any)?.firstName || ""} ${(a.standardData as any)?.lastName || ""}`.trim().toLowerCase()
          : sortBy === "email"
          ? ((a.standardData as any)?.email || "").toLowerCase()
          : ((a.standardData as any)?.phone || "").toLowerCase();
        
        const bValue = sortBy === "name"
          ? `${(b.standardData as any)?.firstName || ""} ${(b.standardData as any)?.lastName || ""}`.trim().toLowerCase()
          : sortBy === "email"
          ? ((b.standardData as any)?.email || "").toLowerCase()
          : ((b.standardData as any)?.phone || "").toLowerCase();
        
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sortBy === "lastActivity") {
      sortedLeads = [...leads].sort((a, b) => {
        const aActivity = a.activities?.[0]?.createdAt ? new Date(a.activities[0].createdAt).getTime() : 0;
        const bActivity = b.activities?.[0]?.createdAt ? new Date(b.activities[0].createdAt).getTime() : 0;
        if (sortOrder === "asc") {
          return aActivity - bActivity;
        }
        return bActivity - aActivity;
      });
    } else if (sortBy === "assignedTo") {
      sortedLeads = [...leads].sort((a, b) => {
        const aEmail = a.assignedBD?.email?.toLowerCase() || "";
        const bEmail = b.assignedBD?.email?.toLowerCase() || "";
        if (aEmail < bEmail) return sortOrder === "asc" ? -1 : 1;
        if (aEmail > bEmail) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    } else if (sortBy.startsWith("custom.")) {
      const fieldKey = sortBy.replace("custom.", "");
      sortedLeads = [...leads].sort((a, b) => {
        const aValue = String((a.customData as any)?.[fieldKey] || "").toLowerCase();
        const bValue = String((b.customData as any)?.[fieldKey] || "").toLowerCase();
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return NextResponse.json({
      leads: sortedLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

