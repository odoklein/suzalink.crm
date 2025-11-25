/**
 * Email Threads API
 * 
 * GET /api/email/threads - List email threads (grouped conversations)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List email threads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const skip = (page - 1) * limit;

    // Filters
    const folder = searchParams.get("folder") || "INBOX";
    const search = searchParams.get("search");

    // Build where clause for most recent email per thread
    const where: any = {
      userId: session.user.id,
      isTrash: false,
      isSpam: false,
    };

    if (folder !== "ALL") {
      if (folder === "STARRED") {
        where.isStarred = true;
      } else if (folder === "UNREAD") {
        where.isRead = false;
      } else if (folder === "SENT") {
        where.isSent = true;
      } else {
        where.folder = folder;
      }
    }

    // Get distinct thread IDs with their latest email
    const threads = await prisma.$queryRaw<any[]>`
      WITH RankedEmails AS (
        SELECT 
          e.*,
          ROW_NUMBER() OVER (PARTITION BY e.thread_id ORDER BY e.received_at DESC) as rn
        FROM emails e
        WHERE e.user_id = ${session.user.id}
          AND e.is_trash = false
          AND e.is_spam = false
          ${folder === "INBOX" ? prisma.$queryRaw`AND e.folder = 'INBOX'` : prisma.$queryRaw``}
      )
      SELECT 
        thread_id,
        id,
        subject,
        from_address,
        from_name,
        snippet,
        received_at,
        is_read,
        is_starred,
        has_attachments,
        (SELECT COUNT(*) FROM emails WHERE thread_id = re.thread_id AND user_id = ${session.user.id}) as message_count,
        (SELECT COUNT(*) FROM emails WHERE thread_id = re.thread_id AND user_id = ${session.user.id} AND is_read = false) as unread_count
      FROM RankedEmails re
      WHERE rn = 1
      ORDER BY received_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `.catch(() => []);

    // Fallback to simple query if raw query fails
    if (threads.length === 0) {
      const emails = await prisma.email.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        distinct: ["threadId"],
        take: limit,
        skip,
        select: {
          id: true,
          threadId: true,
          subject: true,
          fromAddress: true,
          fromName: true,
          snippet: true,
          receivedAt: true,
          isRead: true,
          isStarred: true,
          hasAttachments: true,
        },
      });

      // Get thread counts
      const threadsWithCounts = await Promise.all(
        emails.map(async (email) => {
          const [messageCount, unreadCount] = await Promise.all([
            prisma.email.count({
              where: { userId: session.user.id, threadId: email.threadId },
            }),
            prisma.email.count({
              where: { userId: session.user.id, threadId: email.threadId, isRead: false },
            }),
          ]);
          return {
            ...email,
            messageCount,
            unreadCount,
          };
        })
      );

      return NextResponse.json({
        threads: threadsWithCounts,
        pagination: {
          page,
          limit,
          hasNext: emails.length === limit,
          hasPrev: page > 1,
        },
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.email.groupBy({
      by: ["threadId"],
      where,
    }).then(r => r.length);

    return NextResponse.json({
      threads: threads.map(t => ({
        id: t.id,
        threadId: t.thread_id,
        subject: t.subject,
        fromAddress: t.from_address,
        fromName: t.from_name,
        snippet: t.snippet,
        receivedAt: t.received_at,
        isRead: t.is_read,
        isStarred: t.is_starred,
        hasAttachments: t.has_attachments,
        messageCount: Number(t.message_count),
        unreadCount: Number(t.unread_count),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads", details: error.message },
      { status: 500 }
    );
  }
}

