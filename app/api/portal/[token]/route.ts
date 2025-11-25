import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const account = await prisma.account.findUnique({
      where: { guestToken: token },
      include: {
        campaigns: {
          include: {
            leads: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Calculate statistics
    const allLeads = account.campaigns.flatMap((c) => c.leads);
    const totalLeads = allLeads.length;

    const leadsByStatus = allLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusArray = Object.entries(leadsByStatus).map(([status, count]) => ({
      status,
      count,
    }));

    const contactedLeads = allLeads.filter((l) =>
      ["Contacted", "Qualified", "Nurture"].includes(l.status)
    ).length;
    const contactRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

    const qualifiedLeads = allLeads.filter((l) => l.status === "Qualified").length;
    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = await prisma.activityLog.findMany({
      where: {
        lead: {
          campaign: {
            accountId: account.id,
          },
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      account: {
        id: account.id,
        companyName: account.companyName,
        logoUrl: account.logoUrl,
      },
      stats: {
        totalLeads,
        leadsByStatus: statusArray,
        contactRate,
        conversionRate,
      },
      recentActivity: recentActivities,
    });
  } catch (error) {
    console.error("Error fetching portal data:", error);
    return NextResponse.json(
      { error: "Failed to fetch portal data" },
      { status: 500 }
    );
  }
}

