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
    const search = searchParams.get("search");
    const assignedTo = searchParams.get("assignedTo");
    const leadIds = searchParams.get("leadIds"); // Comma-separated IDs for selected export

    // Build where clause (same logic as GET /api/leads)
    const where: any = {};
    
    if (campaignId) {
      where.campaignId = campaignId;
      
      // For BD users, verify they have access to this campaign
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
      }
    } else {
      // If no campaignId specified, for BD users, only show leads from their assigned campaigns
      if (session.user.role === "BD") {
        const assignedCampaigns = await prisma.campaignAssignment.findMany({
          where: { userId: session.user.id },
          select: { campaignId: true },
        });
        
        const assignedCampaignIds = assignedCampaigns.map((a) => a.campaignId);
        
        if (assignedCampaignIds.length === 0) {
          // Return empty CSV
          const csvContent = "First Name,Last Name,Email,Phone,Job Title,Status,Assigned BD,Campaign,Created At\n";
          return new NextResponse(csvContent, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
            },
          });
        }
        
        where.campaignId = { in: assignedCampaignIds };
      }
    }
    
    if (status) where.status = status;
    if (assignedTo) where.assignedBdId = assignedTo;

    // If specific lead IDs provided, use those
    if (leadIds) {
      const ids = leadIds.split(",").filter(Boolean);
      where.id = { in: ids };
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

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedBD: {
          select: {
            email: true,
          },
        },
        campaign: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get campaign schema config for custom fields
    let schemaConfig: any[] = [];
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { schemaConfig: true },
      });
      schemaConfig = (campaign?.schemaConfig as any[]) || [];
    }

    // Generate CSV
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Job Title",
      "Status",
      "Assigned BD",
      "Campaign",
      "Created At",
      ...schemaConfig.map((field: any) => field.label),
    ];

    const rows = leads.map((lead) => {
      const standardData = lead.standardData as any;
      const customData = lead.customData as any;

      const row = [
        standardData?.firstName || "",
        standardData?.lastName || "",
        standardData?.email || "",
        standardData?.phone || "",
        standardData?.jobTitle || "",
        lead.status,
        lead.assignedBD?.email || "",
        lead.campaign?.name || "",
        new Date(lead.createdAt).toLocaleDateString(),
        ...schemaConfig.map((field: any) => {
          const value = customData?.[field.key];
          if (value === null || value === undefined) return "";
          if (Array.isArray(value)) return value.join("; ");
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        }),
      ];

      // Escape CSV values
      return row.map((cell) => {
        const str = String(cell);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leads:", error);
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    );
  }
}

