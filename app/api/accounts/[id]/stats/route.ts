import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify account exists
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            leads: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get all leads across all campaigns
    const allLeads = account.campaigns.flatMap((c) => c.leads);
    const totalLeads = allLeads.length;

    // Calculate leads by status
    const leadsByStatus = allLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate contact rate (Contacted, Qualified, Nurture)
    const contactedLeads = allLeads.filter((l) =>
      ["Contacted", "Qualified", "Nurture"].includes(l.status)
    ).length;
    const contactRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

    // Calculate conversion rate (Qualified)
    const qualifiedLeads = allLeads.filter((l) => l.status === "Qualified").length;
    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    // Active campaigns count
    const activeCampaigns = account.campaigns.filter((c) => c.status === "Active").length;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await prisma.activityLog.findMany({
      where: {
        lead: {
          campaign: {
            accountId: id,
          },
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        lead: {
          select: {
            id: true,
            campaign: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Calculate trends (current period vs previous period - last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current period leads
    const currentPeriodLeads = allLeads.filter(
      (lead) => new Date(lead.createdAt) >= thirtyDaysAgo
    ).length;

    // Previous period leads
    const previousPeriodLeads = allLeads.filter(
      (lead) =>
        new Date(lead.createdAt) >= sixtyDaysAgo && new Date(lead.createdAt) < thirtyDaysAgo
    ).length;

    const leadsTrend = {
      current: currentPeriodLeads,
      previous: previousPeriodLeads,
      change: previousPeriodLeads > 0
        ? ((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100
        : currentPeriodLeads > 0
        ? 100
        : 0,
      isPositive: currentPeriodLeads >= previousPeriodLeads,
    };

    // Current period activities
    const currentPeriodActivities = await prisma.activityLog.count({
      where: {
        lead: {
          campaign: {
            accountId: id,
          },
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const previousPeriodActivities = await prisma.activityLog.count({
      where: {
        lead: {
          campaign: {
            accountId: id,
          },
        },
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const activitiesTrend = {
      current: currentPeriodActivities,
      previous: previousPeriodActivities,
      change: previousPeriodActivities > 0
        ? ((currentPeriodActivities - previousPeriodActivities) / previousPeriodActivities) * 100
        : currentPeriodActivities > 0
        ? 100
        : 0,
      isPositive: currentPeriodActivities >= previousPeriodActivities,
    };

    // Calculate average response time (time between lead creation and first activity)
    // This is a simplified calculation
    let averageResponseTime = 0;
    const leadsWithActivities = await prisma.lead.findMany({
      where: {
        campaign: {
          accountId: id,
        },
        activities: {
          some: {},
        },
      },
      include: {
        activities: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (leadsWithActivities.length > 0) {
      const responseTimes = leadsWithActivities.map((lead) => {
        if (lead.activities.length > 0) {
          const firstActivity = lead.activities[0];
          const responseTime = firstActivity.createdAt.getTime() - lead.createdAt.getTime();
          return responseTime / (1000 * 60 * 60); // Convert to hours
        }
        return 0;
      });

      averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    return NextResponse.json({
      totalLeads,
      activeCampaigns,
      contactRate: Math.round(contactRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      recentActivityCount: recentActivities.length,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10, // in hours
      leadsByStatus,
      trends: {
        leads: leadsTrend,
        activities: activitiesTrend,
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        createdAt: activity.createdAt,
        leadId: activity.lead.id,
        campaignName: activity.lead.campaign.name,
        userEmail: activity.user.email,
      })),
    });
  } catch (error) {
    console.error("Error fetching account stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch account stats" },
      { status: 500 }
    );
  }
}



