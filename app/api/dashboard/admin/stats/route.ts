import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or manager
    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week";

    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = startDate;
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = startDate;
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEndDate = startDate;
        break;
      default: // week
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = startDate;
    }

    // Fetch all data in parallel
    const [
      totalLeads,
      qualifiedLeadsThisPeriod,
      qualifiedLeadsPreviousPeriod,
      activitiesThisPeriod,
      activitiesPreviousPeriod,
      campaigns,
      bdUsers,
      staleLeads,
      leadsByStatus,
      bookingsThisPeriod,
      totalAccounts,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count(),

      // Qualified leads this period
      prisma.lead.count({
        where: {
          status: "Qualified",
          updatedAt: { gte: startDate },
        },
      }),

      // Previous period qualified
      prisma.lead.count({
        where: {
          status: "Qualified",
          updatedAt: { gte: previousStartDate, lt: previousEndDate },
        },
      }),

      // Activities this period
      prisma.activityLog.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Previous activities
      prisma.activityLog.count({
        where: {
          createdAt: { gte: previousStartDate, lt: previousEndDate },
        },
      }),

      // All campaigns with stats
      prisma.campaign.findMany({
        where: { status: { in: ["Active", "Paused"] } },
        include: {
          account: { select: { companyName: true } },
          _count: { select: { leads: true } },
          leads: {
            select: { status: true, updatedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // BD users with their activities
      prisma.user.findMany({
        where: { role: "BD", isActive: true },
        include: {
          _count: {
            select: { activities: true, assignedLeads: true },
          },
        },
      }),

      // Stale leads (no activity for 7 days)
      prisma.lead.count({
        where: {
          status: { in: ["New", "Contacted", "Locked"] },
          updatedAt: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Leads by status for pipeline
      prisma.lead.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Bookings this period
      prisma.booking.count({
        where: { startTime: { gte: startDate } },
      }),

      // Total accounts
      prisma.account.count(),
    ]);

    // Get detailed BD stats
    const bdStatsPromises = bdUsers.map(async (bd) => {
      const [callsThisPeriod, qualifiedByBD, meetingsByBD] = await Promise.all([
        prisma.activityLog.count({
          where: {
            userId: bd.id,
            type: "CALL",
            createdAt: { gte: startDate },
          },
        }),
        prisma.lead.count({
          where: {
            assignedBdId: bd.id,
            status: "Qualified",
            updatedAt: { gte: startDate },
          },
        }),
        prisma.booking.count({
          where: {
            userId: bd.id,
            startTime: { gte: startDate },
          },
        }),
      ]);

      // Get call trend for last 7 days
      const callsTrend: number[] = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayCalls = await prisma.activityLog.count({
          where: {
            userId: bd.id,
            type: "CALL",
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        });
        callsTrend.push(dayCalls);
      }

      const totalActivities = await prisma.activityLog.count({
        where: {
          userId: bd.id,
          createdAt: { gte: startDate },
        },
      });

      const conversionRate = bd._count.assignedLeads > 0
        ? Math.round((qualifiedByBD / bd._count.assignedLeads) * 100)
        : 0;

      // Performance score based on activities, qualification, and meetings
      const activityScore = Math.min(totalActivities / 50, 1) * 40; // Max 40 points
      const qualificationScore = Math.min(qualifiedByBD / 10, 1) * 40; // Max 40 points
      const meetingScore = Math.min(meetingsByBD / 5, 1) * 20; // Max 20 points
      const performance = Math.round(activityScore + qualificationScore + meetingScore);

      // Check if user has activity in last 24 hours
      const lastActivity = await prisma.activityLog.findFirst({
        where: { userId: bd.id },
        orderBy: { createdAt: "desc" },
      });

      const isRecentlyActive = lastActivity &&
        lastActivity.createdAt > new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return {
        id: bd.id,
        name: bd.email.split("@")[0],
        avatar: bd.avatar || undefined,
        role: "BD",
        stats: {
          calls: callsThisPeriod,
          callsTrend,
          leadsQualified: qualifiedByBD,
          conversionRate,
          meetings: meetingsByBD,
        },
        performance: Math.min(100, performance),
        status: isRecentlyActive ? "active" : "inactive" as const,
      };
    });

    const teamMembers = await Promise.all(bdStatsPromises);

    // Calculate health score
    const conversionRate = totalLeads > 0
      ? Math.round((qualifiedLeadsThisPeriod / totalLeads) * 100)
      : 0;
    const activityRate = bdUsers.length > 0
      ? Math.round(activitiesThisPeriod / bdUsers.length)
      : 0;

    const healthMetrics = {
      conversionRate: {
        label: "Taux de conversion",
        value: conversionRate,
        target: 20,
        status: conversionRate >= 15 ? "good" : conversionRate >= 8 ? "warning" : "critical" as const,
      },
      activityRate: {
        label: "Activités/BD",
        value: activityRate,
        target: 50,
        status: activityRate >= 40 ? "good" : activityRate >= 20 ? "warning" : "critical" as const,
      },
      responseTime: {
        label: "Temps réponse (h)",
        value: 24, // Placeholder - would need tracking
        target: 24,
        status: "good" as const,
      },
      qualifiedLeads: {
        label: "Leads qualifiés",
        value: qualifiedLeadsThisPeriod,
        target: Math.max(50, Math.round(totalLeads * 0.2)),
        status: qualifiedLeadsThisPeriod >= 40 ? "good" : qualifiedLeadsThisPeriod >= 20 ? "warning" : "critical" as const,
      },
    };

    // Calculate overall health score
    const metrics = Object.values(healthMetrics);
    const goodCount = metrics.filter((m) => m.status === "good").length;
    const warningCount = metrics.filter((m) => m.status === "warning").length;
    const healthScore = Math.round((goodCount * 25 + warningCount * 12.5));

    const previousHealthScore = Math.max(0, healthScore - 5);

    // Build pipeline from lead statuses
    const statusMap = new Map(leadsByStatus.map((s) => [s.status, s._count.id]));
    const estimatedDealValue = 5000; // Average deal value estimate

    const pipeline = {
      stages: [
        {
          id: "new",
          name: "Nouveau",
          count: statusMap.get("New") || 0,
          value: (statusMap.get("New") || 0) * estimatedDealValue * 0.1,
          conversionFromPrevious: 100,
          color: "#4C85FF",
        },
        {
          id: "contacted",
          name: "Contacté",
          count: statusMap.get("Contacted") || 0,
          value: (statusMap.get("Contacted") || 0) * estimatedDealValue * 0.2,
          conversionFromPrevious: statusMap.get("New")
            ? Math.round(((statusMap.get("Contacted") || 0) / statusMap.get("New")!) * 100)
            : 0,
          color: "#A46CFF",
        },
        {
          id: "qualified",
          name: "Qualifié",
          count: statusMap.get("Qualified") || 0,
          value: (statusMap.get("Qualified") || 0) * estimatedDealValue * 0.5,
          conversionFromPrevious: statusMap.get("Contacted")
            ? Math.round(((statusMap.get("Qualified") || 0) / statusMap.get("Contacted")!) * 100)
            : 0,
          color: "#3BBF7A",
        },
        {
          id: "nurture",
          name: "Nurturing",
          count: statusMap.get("Nurture") || 0,
          value: (statusMap.get("Nurture") || 0) * estimatedDealValue * 0.3,
          conversionFromPrevious: 0,
          color: "#FFA445",
        },
      ],
      totalValue: totalLeads * estimatedDealValue * 0.2,
      predictedRevenue: (statusMap.get("Qualified") || 0) * estimatedDealValue,
    };

    // Format campaigns with real data
    const avgConversion = campaigns.length > 0
      ? campaigns.reduce((sum, c) => {
          const qualified = c.leads.filter((l) => l.status === "Qualified").length;
          return sum + (c._count.leads > 0 ? (qualified / c._count.leads) * 100 : 0);
        }, 0) / campaigns.length
      : 0;

    const formattedCampaigns = campaigns.map((c) => {
      const qualified = c.leads.filter((l) => l.status === "Qualified").length;
      const convRate = c._count.leads > 0 ? Math.round((qualified / c._count.leads) * 100) : 0;

      // Calculate trend based on recent updates
      const recentQualified = c.leads.filter(
        (l) => l.status === "Qualified" && l.updatedAt >= startDate
      ).length;
      const trend = recentQualified > 0 ? Math.min(recentQualified * 5, 20) : -5;

      return {
        id: c.id,
        name: c.name,
        accountName: c.account?.companyName || "N/A",
        status: c.status as "Active" | "Paused" | "Completed",
        totalLeads: c._count.leads,
        qualifiedLeads: qualified,
        conversionRate: convRate,
        trend,
        isTopPerformer: convRate > avgConversion * 1.3,
        isUnderperforming: convRate < avgConversion * 0.5 && c._count.leads > 10,
      };
    });

    // Build alerts from real data
    const alerts: Array<{
      id: string;
      type: "stale_leads" | "inactive_bd" | "campaign_attention" | "low_conversion";
      title: string;
      description: string;
      severity: "high" | "medium" | "low";
      actionUrl: string;
      actionLabel: string;
      createdAt: string;
    }> = [];

    if (staleLeads > 10) {
      alerts.push({
        id: "stale-leads",
        type: "stale_leads",
        title: `${staleLeads} leads inactifs`,
        description: "Ces leads n'ont pas eu d'activité depuis plus de 7 jours",
        severity: staleLeads > 50 ? "high" : "medium",
        actionUrl: "/campaigns",
        actionLabel: "Voir les leads",
        createdAt: now.toISOString(),
      });
    }

    const inactiveBDs = teamMembers.filter((m) => m.status === "inactive");
    if (inactiveBDs.length > 0) {
      alerts.push({
        id: "inactive-bds",
        type: "inactive_bd",
        title: `${inactiveBDs.length} BD inactif${inactiveBDs.length > 1 ? "s" : ""}`,
        description: `${inactiveBDs.map((b) => b.name).join(", ")} - pas d'activité depuis 24h`,
        severity: inactiveBDs.length > 2 ? "high" : "medium",
        actionUrl: "/admin/users",
        actionLabel: "Gérer l'équipe",
        createdAt: now.toISOString(),
      });
    }

    const underperformingCampaigns = formattedCampaigns.filter((c) => c.isUnderperforming);
    if (underperformingCampaigns.length > 0) {
      alerts.push({
        id: "low-conversion",
        type: "low_conversion",
        title: `${underperformingCampaigns.length} campagne${underperformingCampaigns.length > 1 ? "s" : ""} sous-performante${underperformingCampaigns.length > 1 ? "s" : ""}`,
        description: `${underperformingCampaigns.slice(0, 3).map((c) => c.name).join(", ")}`,
        severity: "medium",
        actionUrl: "/campaigns",
        actionLabel: "Voir les campagnes",
        createdAt: now.toISOString(),
      });
    }

    // Build lead flow data from real activity
    const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const leadFlowDataPromises = Array.from({ length: 7 }, async (_, i) => {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [incoming, outgoing] = await Promise.all([
        prisma.lead.count({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        }),
        prisma.lead.count({
          where: {
            status: { in: ["Qualified", "Lost"] },
            updatedAt: { gte: dayStart, lt: dayEnd },
          },
        }),
      ]);

      return {
        date: dayStart.toISOString(),
        label: dayLabels[i],
        incoming,
        outgoing,
        net: incoming - outgoing,
      };
    });

    const leadFlowData = await Promise.all(leadFlowDataPromises);
    const totalIncoming = leadFlowData.reduce((sum, d) => sum + d.incoming, 0);
    const totalOutgoing = leadFlowData.reduce((sum, d) => sum + d.outgoing, 0);

    const response = {
      healthScore: {
        score: Math.min(100, Math.max(0, healthScore)),
        previousScore: Math.min(100, Math.max(0, previousHealthScore)),
        metrics: healthMetrics,
      },
      teamMembers,
      pipeline,
      campaigns: formattedCampaigns.slice(0, 10),
      alerts,
      leadFlow: {
        data: leadFlowData,
        totalIncoming,
        totalOutgoing,
        trend: totalIncoming > totalOutgoing ? 10 : -5,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Admin dashboard stats" },
      { status: 500 }
    );
  }
}
