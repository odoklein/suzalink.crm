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

    const userId = session.user.id;
    const userName = session.user.name || session.user.email || "Utilisateur";

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Fetch all data in parallel
    const [
      assignedCampaigns,
      todayActivitiesRaw,
      weekActivitiesRaw,
      todayQualifiedLeads,
      recentActivitiesRaw,
      userTasks,
      allBDsWithActivities,
      totalUserLeads,
      qualifiedUserLeads,
    ] = await Promise.all([
      // Get assigned campaigns with lead stats
      prisma.campaignAssignment.findMany({
        where: { userId },
        include: {
          campaign: {
            include: {
              _count: {
                select: { leads: true },
              },
              leads: {
                select: {
                  id: true,
                  status: true,
                  assignedBdId: true,
                },
              },
              account: {
                select: { companyName: true },
              },
            },
          },
        },
      }),

      // Today's activities count
      prisma.activityLog.findMany({
        where: {
          userId,
          createdAt: { gte: startOfDay },
        },
        select: { type: true },
      }),

      // Week activities for trend
      prisma.activityLog.findMany({
        where: {
          userId,
          createdAt: { gte: startOfWeek },
        },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: "asc" },
      }),

      // Today's qualified leads by this BD
      prisma.lead.count({
        where: {
          assignedBdId: userId,
          status: "Qualified",
          updatedAt: { gte: startOfDay },
        },
      }),

      // Recent activities for feed
      prisma.activityLog.findMany({
        where: { userId },
        include: {
          lead: {
            select: {
              standardData: true,
              campaign: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // User's tasks
      prisma.task.findMany({
        where: {
          userId,
          status: { not: "completed" },
        },
        include: {
          lead: {
            select: { standardData: true },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),

      // All BDs stats for leaderboard
      prisma.user.findMany({
        where: {
          role: "BD",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          avatar: true,
          _count: {
            select: {
              activities: true,
            },
          },
        },
      }),

      // Total leads assigned to this BD
      prisma.lead.count({
        where: { assignedBdId: userId },
      }),

      // Qualified leads by this BD
      prisma.lead.count({
        where: {
          assignedBdId: userId,
          status: "Qualified",
        },
      }),
    ]);

    // Calculate today's calls
    const todayCalls = todayActivitiesRaw.filter((a) => a.type === "CALL").length;
    const todayEmails = todayActivitiesRaw.filter((a) => a.type === "EMAIL").length;
    const todayActivities = todayActivitiesRaw.length;

    // Calculate call trends (last 7 days)
    const callsTrend: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCount = weekActivitiesRaw.filter(
        (a) =>
          a.type === "CALL" &&
          a.createdAt >= dayStart &&
          a.createdAt < dayEnd
      ).length;
      callsTrend.push(dayCount);
    }

    // Calculate streak (consecutive days with activity)
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(startOfDay);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasActivity = await prisma.activityLog.findFirst({
        where: {
          userId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      });

      if (hasActivity || i === 0) {
        streak++;
      } else {
        break;
      }
    }

    // Format campaigns - filter for active campaigns only
    const campaigns = assignedCampaigns
      .filter((a) => a.campaign && a.campaign.status === "Active")
      .map((a) => {
        const campaign = a.campaign!;
        const totalLeads = campaign._count.leads;
        const remainingLeads = campaign.leads.filter(
          (l) => l.status === "New" || l.status === "Contacted" || l.status === "Locked"
        ).length;
        const qualifiedLeads = campaign.leads.filter(
          (l) => l.status === "Qualified"
        ).length;

        return {
          id: campaign.id,
          name: campaign.name,
          accountName: campaign.account?.companyName || "N/A",
          totalLeads,
          remainingLeads,
          qualifiedLeads,
          status: campaign.status as "Active" | "Paused" | "Draft",
        };
      });

    // Format activities for feed
    const activities = recentActivitiesRaw.map((a) => {
      const standardData = a.lead?.standardData as any || {};
      const leadName = standardData.firstName || standardData.name || standardData.lastName || "Lead";
      const campaignName = a.lead?.campaign?.name || "Campagne";

      let type: "call" | "email" | "meeting" | "qualified" | "lost" | "note" | "assigned" = "note";
      if (a.type === "CALL") type = "call";
      else if (a.type === "EMAIL") type = "email";
      else if (a.type === "STATUS_CHANGE") type = "note";
      else if (a.type === "NOTE") type = "note";

      const metadata = a.metadata as any || {};
      const description = metadata.description || metadata.outcome || `${a.type} enregistré`;

      return {
        id: a.id,
        type,
        leadName,
        campaignName,
        description,
        createdAt: a.createdAt.toISOString(),
      };
    });

    // Calculate leaderboard from real activity data
    const weekStart = new Date(startOfWeek);
    const leaderboardData = await Promise.all(
      allBDsWithActivities.map(async (bd) => {
        const weekActivities = await prisma.activityLog.count({
          where: {
            userId: bd.id,
            createdAt: { gte: weekStart },
          },
        });

        return {
          id: bd.id,
          name: bd.email.split("@")[0],
          avatar: bd.avatar || undefined,
          score: weekActivities,
          change: 0,
          isCurrentUser: bd.id === userId,
        };
      })
    );

    const leaderboard = leaderboardData.sort((a, b) => b.score - a.score);

    // Format tasks
    const overdueTasks = userTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed"
    );

    const tasks = {
      items: userTasks.slice(0, 5).map((t) => {
        const leadData = t.lead?.standardData as any || {};
        return {
          id: t.id,
          title: t.title,
          leadName: leadData.firstName || leadData.name || undefined,
          dueDate: t.dueDate?.toISOString() || new Date().toISOString(),
          priority: (t.priority || "medium") as "urgent" | "high" | "medium" | "low",
          completed: t.status === "completed",
        };
      }),
      overdueCount: overdueTasks.length,
    };

    // Calculate daily goals (base: 20 activities per day)
    const dailyGoal = 20;
    const currentProgress = todayActivities;

    // Calculate conversion rate
    const conversionRate = totalUserLeads > 0
      ? Math.round((qualifiedUserLeads / totalUserLeads) * 100)
      : 0;

    // Calculate average call duration from metadata (if available)
    const callActivities = await prisma.activityLog.findMany({
      where: {
        userId,
        type: "CALL",
        createdAt: { gte: startOfWeek },
      },
      select: { metadata: true },
    });

    let avgDuration = 0;
    let durationCount = 0;
    callActivities.forEach((a) => {
      const meta = a.metadata as any;
      if (meta?.duration) {
        avgDuration += meta.duration;
        durationCount++;
      }
    });

    const avgCallDuration = durationCount > 0
      ? `${Math.floor(avgDuration / durationCount / 60)}m ${Math.floor((avgDuration / durationCount) % 60)}s`
      : "N/A";

    const response = {
      user: {
        name: userName,
        id: userId,
      },
      mission: {
        dailyGoal,
        currentProgress,
        streak: Math.min(streak, 30),
      },
      todayStats: {
        callsMade: todayCalls,
        callsTarget: 15,
        callsTrend,
        leadsQualified: todayQualifiedLeads,
        leadsTarget: 5,
        avgCallDuration,
        conversionRate,
        conversionChange: 0, // Would need historical data
      },
      campaigns,
      activities,
      leaderboard,
      tasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("BD Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch BD dashboard stats" },
      { status: 500 }
    );
  }
}
