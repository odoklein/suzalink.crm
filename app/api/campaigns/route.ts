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
    const accountId = searchParams.get("accountId");
    const statusFilter = searchParams.get("status"); // comma-separated
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const leadCountMin = searchParams.get("leadCountMin");
    const leadCountMax = searchParams.get("leadCountMax");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};
    
    // Filter by account if specified
    if (accountId) {
      where.accountId = accountId;
    }

    // Filter by status (multi-select)
    if (statusFilter) {
      const statuses = statusFilter.split(",").filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) {
        where.startDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.startDate.lte = new Date(dateTo);
      }
    }

    // For BD users, only show campaigns where they have leads assigned to them
    if (session.user.role === "BD") {
      // Find campaigns where BD has assigned leads
      const leadsAssignedToBD = await prisma.lead.findMany({
        where: { 
          assignedBdId: session.user.id,
        },
        select: { 
          campaignId: true,
        },
        distinct: ['campaignId'],
      });
      
      const campaignIdsWithAssignedLeads = leadsAssignedToBD.map((lead) => lead.campaignId);
      
      // If BD has no assigned leads, return empty array
      if (campaignIdsWithAssignedLeads.length === 0) {
        return NextResponse.json([]);
      }
      
      // Filter to only campaigns where BD has assigned leads
      where.id = { in: campaignIdsWithAssignedLeads };
    }
    // ADMIN and MANAGER can see all campaigns (no additional filter)

    // Build orderBy
    const orderBy: any = {};
    switch (sortBy) {
      case "name":
        orderBy.name = sortOrder;
        break;
      case "status":
        orderBy.status = sortOrder;
        break;
      case "startDate":
        orderBy.startDate = sortOrder;
        break;
      case "leadCount":
        // We'll sort after fetching by lead count
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    // For BD users, recalculate lead counts to only include assigned leads
    let processedCampaigns = campaigns;
    if (session.user.role === "BD") {
      // Get lead counts for each campaign assigned to this BD
      const leadCountsByCampaign = await prisma.lead.groupBy({
        by: ['campaignId'],
        where: {
          campaignId: { in: campaigns.map(c => c.id) },
          assignedBdId: session.user.id,
        },
        _count: {
          id: true,
        },
      });

      const leadCountMap = new Map(
        leadCountsByCampaign.map(item => [item.campaignId, item._count.id])
      );

      // Update campaign lead counts
      processedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        _count: {
          leads: leadCountMap.get(campaign.id) || 0,
        },
      }));
    }

    // Filter by lead count range if specified
    let filteredCampaigns = processedCampaigns;
    if (leadCountMin || leadCountMax) {
      filteredCampaigns = processedCampaigns.filter((campaign) => {
        const leadCount = campaign._count?.leads || 0;
        if (leadCountMin && leadCount < parseInt(leadCountMin)) return false;
        if (leadCountMax && leadCount > parseInt(leadCountMax)) return false;
        return true;
      });
    }

    // Sort by lead count if needed (after filtering)
    if (sortBy === "leadCount") {
      filteredCampaigns.sort((a, b) => {
        const aCount = a._count?.leads || 0;
        const bCount = b._count?.leads || 0;
        return sortOrder === "asc" ? aCount - bCount : bCount - aCount;
      });
    }

    return NextResponse.json(filteredCampaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can create campaigns
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { accountId, name, status, startDate, schemaConfig } = body;

    if (!accountId || !name) {
      return NextResponse.json(
        { error: "Account ID and name are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        accountId,
        name,
        status: status || "Draft",
        startDate: startDate ? new Date(startDate) : null,
        schemaConfig: schemaConfig || [],
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

