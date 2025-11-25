import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if prisma is available
    if (!prisma) {
      console.error("Prisma client is not available");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Get current date ranges for comparisons
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel with error handling
    const [
      totalAccounts,
      activeCampaigns,
      totalLeads,
      qualifiedLeads,
      contactedLeads,
      recentActivities,
      monthlyLeads,
      lastMonthLeads,
      weeklyActivities,
      lastWeekActivities,
      leadsByStatus,
      campaignPerformance,
      recentDeals
    ] = await Promise.all([
      // Total accounts
      prisma.account.count().catch(() => 0),
      
      // Active campaigns
      prisma.campaign.count({
        where: { status: "Active" }
      }).catch(() => 0),
      
      // Total leads
      prisma.lead.count().catch(() => 0),
      
      // Qualified leads
      prisma.lead.count({
        where: { status: "Qualified" }
      }).catch(() => 0),
      
      // Contacted leads
      prisma.lead.count({
        where: { status: "Contacted" }
      }).catch(() => 0),
      
      // Recent activities (last 7 days)
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }).catch(() => 0),
      
      // Monthly leads
      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }).catch(() => 0),
      
      // Last month leads
      prisma.lead.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }).catch(() => 0),
      
      // Weekly activities
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      }).catch(() => 0),
      
      // Last week activities
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: startOfLastWeek,
            lt: startOfWeek
          }
        }
      }).catch(() => 0),
      
      // Leads by status
      prisma.lead.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }).catch(() => []),
      
      // Campaign performance
      prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              leads: true
            }
          }
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      }).catch(() => []),
      
      // Recent deals/qualified leads
      prisma.lead.findMany({
        where: {
          status: "Qualified"
        },
        select: {
          id: true,
          standardData: true,
          status: true,
          createdAt: true,
          campaign: {
            select: {
              name: true
            }
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      }).catch(() => [])
    ]);

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";
    
    // Calculate trends
    const leadsTrend = lastMonthLeads > 0 ? 
      (((monthlyLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(1) : "0";
    
    const activitiesTrend = lastWeekActivities > 0 ? 
      (((weeklyActivities - lastWeekActivities) / lastWeekActivities) * 100).toFixed(1) : "0";

    // Format leads by status for charts
    const statusDistribution = leadsByStatus.map(item => ({
      status: item.status,
      count: item._count.id,
      percentage: totalLeads > 0 ? ((item._count.id / totalLeads) * 100).toFixed(1) : "0"
    }));

    // Calculate pipeline velocity (average days from New to Qualified)
    let avgPipelineVelocity = 0;
    try {
      const pipelineVelocity = await prisma.$queryRaw`
        SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
        FROM "Lead"
        WHERE status = 'Qualified'
        AND created_at >= ${startOfMonth}
      ` as any[];

      avgPipelineVelocity = pipelineVelocity[0]?.avg_days ? 
        Math.round(Number(pipelineVelocity[0].avg_days)) : 0;
    } catch (error) {
      console.error("Pipeline velocity query error:", error);
      avgPipelineVelocity = 0;
    }

    return NextResponse.json({
      overview: {
        totalAccounts,
        activeCampaigns,
        totalLeads,
        conversionRate: `${conversionRate}%`,
        trends: {
          leads: {
            current: monthlyLeads,
            previous: lastMonthLeads,
            change: `${leadsTrend}%`,
            isPositive: Number(leadsTrend) >= 0
          },
          activities: {
            current: weeklyActivities,
            previous: lastWeekActivities,
            change: `${activitiesTrend}%`,
            isPositive: Number(activitiesTrend) >= 0
          }
        }
      },
      metrics: {
        qualifiedLeads,
        contactedLeads,
        recentActivities,
        pipelineVelocity: avgPipelineVelocity
      },
      charts: {
        statusDistribution,
        campaignPerformance: campaignPerformance.map(campaign => ({
          name: campaign.name,
          leads: campaign._count.leads,
          status: campaign.status
        }))
      },
      recentDeals: recentDeals.map(lead => ({
        id: lead.id,
        name: `${lead.standardData?.firstName || ''} ${lead.standardData?.lastName || ''}`.trim() || 'Unknown',
        company: lead.standardData?.company || 'Unknown Company',
        campaign: lead.campaign?.name || 'Unknown Campaign',
        status: lead.status,
        createdAt: lead.createdAt
      }))
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
