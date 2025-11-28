import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Get user to verify exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get leads statistics
    const totalLeads = await prisma.lead.count({
      where: { assignedBdId: userId },
    });

    const convertedLeads = await prisma.lead.count({
      where: {
        assignedBdId: userId,
        status: "Qualified",
      },
    });

    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      where: { assignedBdId: userId },
      _count: { status: true },
    });

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Get average time to convert (simplified - based on created to qualified status)
    const convertedLeadsData = await prisma.lead.findMany({
      where: {
        assignedBdId: userId,
        status: "Qualified",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgTimeToConvert = 0;
    if (convertedLeadsData.length > 0) {
      const totalDays = convertedLeadsData.reduce((sum, lead) => {
        const days = Math.ceil(
          (lead.updatedAt.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgTimeToConvert = Math.round(totalDays / convertedLeadsData.length);
    }

    // Get tasks statistics
    const totalTasks = await prisma.task.count({
      where: { userId },
    });

    const completedTasks = await prisma.task.count({
      where: { userId, status: "completed" },
    });

    const pendingTasks = await prisma.task.count({
      where: { userId, status: "pending" },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        userId,
        status: { in: ["pending", "in_progress"] },
        dueDate: { lt: now },
      },
    });

    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get activities statistics
    const totalActivities = await prisma.activityLog.count({
      where: { userId },
    });

    const activitiesByType = await prisma.activityLog.groupBy({
      by: ["type"],
      where: { userId },
      _count: { type: true },
    });

    const activitiesThisWeek = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
    });

    const activitiesLastWeek = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo,
        },
      },
    });

    // Get team averages for comparison
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const totalTeamLeads = await prisma.lead.count({
      where: {
        assignedBdId: { in: allUsers.map((u) => u.id) },
      },
    });

    const avgLeadsPerUser = allUsers.length > 0 ? totalTeamLeads / allUsers.length : 0;

    const teamConvertedLeads = await prisma.lead.count({
      where: {
        assignedBdId: { in: allUsers.map((u) => u.id) },
        status: "Qualified",
      },
    });

    const avgTeamConversionRate =
      totalTeamLeads > 0 ? (teamConvertedLeads / totalTeamLeads) * 100 : 0;

    const totalTeamTasks = await prisma.task.count({
      where: {
        userId: { in: allUsers.map((u) => u.id) },
      },
    });

    const avgTasksPerUser = allUsers.length > 0 ? totalTeamTasks / allUsers.length : 0;

    // Calculate comparisons
    const leadsVsAvg =
      avgLeadsPerUser > 0 ? Math.round(((totalLeads - avgLeadsPerUser) / avgLeadsPerUser) * 100) : 0;

    const conversionVsAvg =
      avgTeamConversionRate > 0
        ? Math.round(((conversionRate - avgTeamConversionRate) / avgTeamConversionRate) * 100)
        : 0;

    const tasksVsAvg =
      avgTasksPerUser > 0
        ? Math.round(((totalTasks - avgTasksPerUser) / avgTasksPerUser) * 100)
        : 0;

    // Get timeline data (last 30 days)
    const dailyLeads = await prisma.lead.groupBy({
      by: ["createdAt"],
      where: {
        assignedBdId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Build activity type counts
    const activityCounts = {
      calls: 0,
      emails: 0,
      notes: 0,
    };

    activitiesByType.forEach((item) => {
      if (item.type === "CALL") activityCounts.calls = item._count.type;
      if (item.type === "EMAIL") activityCounts.emails = item._count.type;
      if (item.type === "NOTE") activityCounts.notes = item._count.type;
    });

    // Format leads by status
    const formattedLeadsByStatus = leadsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return NextResponse.json({
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate,
        avgTimeToConvert,
        byStatus: formattedLeadsByStatus,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completionRate: taskCompletionRate,
      },
      activities: {
        total: totalActivities,
        calls: activityCounts.calls,
        emails: activityCounts.emails,
        notes: activityCounts.notes,
        thisWeek: activitiesThisWeek,
        lastWeek: activitiesLastWeek,
      },
      comparison: {
        leadsVsAvg,
        conversionVsAvg,
        tasksVsAvg,
      },
      timeline: [],
    });
  } catch (error) {
    console.error("Error fetching user performance:", error);
    return NextResponse.json({ error: "Failed to fetch performance" }, { status: 500 });
  }
}








