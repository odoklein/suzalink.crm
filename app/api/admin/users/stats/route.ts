import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date info for trends
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total users count
    const totalUsers = await prisma.user.count();

    // Active users count
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Inactive users count
    const inactiveUsers = await prisma.user.count({
      where: { isActive: false },
    });

    // New users this month
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // New users last month (for trend calculation)
    const newUsersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // Users by role
    const usersByRoleRaw = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    const usersByRole = {
      ADMIN: 0,
      MANAGER: 0,
      BD: 0,
      DEVELOPER: 0,
    };

    usersByRoleRaw.forEach((item) => {
      usersByRole[item.role as keyof typeof usersByRole] = item._count.role;
    });

    // Calculate average login frequency (users who logged in within last 7 days / total active users)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const usersLoggedInLastWeek = await prisma.user.count({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const avgLoginFrequency = activeUsers > 0 ? (usersLoggedInLastWeek / activeUsers) * 7 : 0;

    // Calculate trends (comparing this month to last month)
    const totalUsersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          lt: startOfMonth,
        },
      },
    });

    const activeUsersLastMonth = await prisma.user.count({
      where: {
        isActive: true,
        createdAt: {
          lt: startOfMonth,
        },
      },
    });

    const totalChange =
      totalUsersLastMonth > 0
        ? Math.round(((totalUsers - totalUsersLastMonth) / totalUsersLastMonth) * 100)
        : newUsersThisMonth > 0
        ? 100
        : 0;

    const activeChange =
      activeUsersLastMonth > 0
        ? Math.round(((activeUsers - activeUsersLastMonth) / activeUsersLastMonth) * 100)
        : activeUsers > 0
        ? 100
        : 0;

    // ========================================
    // LEADS STATISTICS
    // ========================================
    
    // Total leads count
    const totalLeads = await prisma.lead.count();
    
    // Leads with bookings (converted to RDV)
    const leadsWithBookings = await prisma.lead.count({
      where: {
        bookings: {
          some: {},
        },
      },
    });

    // Conversion rate (leads with bookings / total leads)
    const leadToRdvRate = totalLeads > 0 ? Math.round((leadsWithBookings / totalLeads) * 100) : 0;

    // ========================================
    // CAMPAIGNS STATISTICS
    // ========================================
    
    // All campaigns with stats
    const allCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        account: {
          select: {
            companyName: true,
          },
        },
        _count: {
          select: {
            leads: true,
            dailyAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const activeCampaigns = allCampaigns.filter((c) => c.status === "Active");
    const totalCampaigns = allCampaigns.length;

    // ========================================
    // BOOKINGS STATISTICS
    // ========================================
    
    // Today's date range (use UTC to avoid timezone issues)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Total bookings
    const totalBookings = await prisma.booking.count();

    // Bookings today (by startTime OR createdAt today)
    const bookingsToday = await prisma.booking.count({
      where: {
        OR: [
          {
            startTime: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
          {
            createdAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        ],
      },
    });

    // Pending approvals
    const pendingApprovals = await prisma.booking.count({
      where: {
        approvalStatus: "on_hold",
      },
    });

    // Bookings today per campaign
    const bookingsTodayByCampaign = await prisma.booking.groupBy({
      by: ["userId"],
      where: {
        OR: [
          { startTime: { gte: startOfToday, lte: endOfToday } },
          { createdAt: { gte: startOfToday, lte: endOfToday } },
        ],
      },
      _count: {
        id: true,
      },
    });

    // Get recent & upcoming bookings (last 7 days + next 30 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Bookings details (today + upcoming + recently created)
    const bookingsTodayDetails = await prisma.booking.findMany({
      where: {
        OR: [
          // Today's bookings by start time
          { startTime: { gte: startOfToday, lte: endOfToday } },
          // Upcoming bookings
          { startTime: { gt: endOfToday, lte: thirtyDaysFromNow } },
          // Recently created (even if scheduled for later)
          { createdAt: { gte: sevenDaysAgo } },
        ],
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        status: true,
        approvalStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 50, // Limit to avoid too much data
    });

    // Group bookings by user
    const bookingsByUser: Record<string, { email: string; count: number; bookings: any[] }> = {};
    bookingsTodayDetails.forEach((booking) => {
      const userId = booking.user.id;
      if (!bookingsByUser[userId]) {
        bookingsByUser[userId] = {
          email: booking.user.email,
          count: 0,
          bookings: [],
        };
      }
      bookingsByUser[userId].count++;
      bookingsByUser[userId].bookings.push({
        id: booking.id,
        title: booking.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        approvalStatus: booking.approvalStatus,
        leadName: booking.lead?.standardData 
          ? `${(booking.lead.standardData as any).firstName || ""} ${(booking.lead.standardData as any).lastName || ""}`.trim()
          : "N/A",
        campaignName: booking.lead?.campaign?.name || "N/A",
      });
    });

    // Group bookings by campaign
    const bookingsByCampaign: Record<string, { name: string; count: number }> = {};
    bookingsTodayDetails.forEach((booking) => {
      const campaignId = booking.lead?.campaign?.id || "no-campaign";
      const campaignName = booking.lead?.campaign?.name || "Sans campagne";
      if (!bookingsByCampaign[campaignId]) {
        bookingsByCampaign[campaignId] = { name: campaignName, count: 0 };
      }
      bookingsByCampaign[campaignId].count++;
    });

    // ========================================
    // RECENT USER ACTIVITY
    // ========================================
    
    // Users with recent activity (last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentlyActiveUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        lastLoginAt: true,
        _count: {
          select: {
            assignedLeads: true,
            activities: true,
          },
        },
      },
      orderBy: {
        lastLoginAt: "desc",
      },
      take: 10,
    });

    // BD performance (bookings created this week)
    const bdPerformance = await prisma.user.findMany({
      where: {
        role: "BD",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            assignedLeads: true,
          },
        },
        bookings: {
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const bdStats = bdPerformance.map((bd) => ({
      id: bd.id,
      email: bd.email,
      leadsAssigned: bd._count.assignedLeads,
      bookingsThisWeek: bd.bookings.length,
    })).sort((a, b) => b.bookingsThisWeek - a.bookingsThisWeek);

    return NextResponse.json({
      // User stats
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      usersByRole,
      avgLoginFrequency,
      usersLoggedInToday: recentlyActiveUsers.length,
      trends: {
        totalChange,
        activeChange,
      },
      // Leads stats
      leads: {
        total: totalLeads,
        convertedToRdv: leadsWithBookings,
        conversionRate: leadToRdvRate,
      },
      // Campaigns stats
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns.length,
        list: allCampaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          accountName: c.account.companyName,
          leadCount: c._count.leads,
        })),
      },
      // Bookings stats
      bookings: {
        total: totalBookings,
        today: bookingsToday,
        pendingApprovals,
        byUser: Object.values(bookingsByUser),
        byCampaign: Object.values(bookingsByCampaign),
        todayDetails: bookingsTodayDetails.map((b) => ({
          id: b.id,
          title: b.title,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          approvalStatus: b.approvalStatus,
          userName: b.user.email.split("@")[0],
          leadName: b.lead?.standardData 
            ? `${(b.lead.standardData as any).firstName || ""} ${(b.lead.standardData as any).lastName || ""}`.trim()
            : "N/A",
          campaignName: b.lead?.campaign?.name || "N/A",
        })),
      },
      // Activity
      recentlyActiveUsers: recentlyActiveUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        lastLoginAt: u.lastLoginAt,
        leadsCount: u._count.assignedLeads,
        activitiesCount: u._count.activities,
      })),
      bdPerformance: bdStats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}








