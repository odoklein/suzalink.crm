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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    // Fetch notifications from database
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { isRead: 'asc' }, // Unread first
          { priority: 'desc' }, // High priority first
          { createdAt: 'desc' }, // Newest first
        ],
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    // Transform to match expected format
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      priority: notification.priority,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
      total: transformedNotifications.length,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, notificationIds } = await request.json();

    if (action === 'mark_read') {
      const where: any = {
        userId: session.user.id,
      };

      if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ 
        message: `Marked ${result.count} notifications as read`,
        count: result.count,
      });
    } else if (action === 'mark_unread') {
      const where: any = {
        userId: session.user.id,
      };

      if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: false,
          readAt: null,
        },
      });

      return NextResponse.json({ 
        message: `Marked ${result.count} notifications as unread`,
        count: result.count,
      });
    } else if (action === 'delete') {
      const where: any = {
        userId: session.user.id,
      };

      if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
      }

      const result = await prisma.notification.deleteMany({
        where,
      });

      return NextResponse.json({ 
        message: `Deleted ${result.count} notifications`,
        count: result.count,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notification action error:", error);
    return NextResponse.json(
      { error: "Failed to process notification action" },
      { status: 500 }
    );
  }
}
