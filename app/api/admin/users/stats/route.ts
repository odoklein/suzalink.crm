import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      usersByRole,
      avgLoginFrequency,
      trends: {
        totalChange,
        activeChange,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

