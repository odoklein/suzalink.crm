/**
 * Email Folders API
 * 
 * GET /api/email/folders - List email folders with counts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface FolderInfo {
  name: string;
  displayName: string;
  icon: string;
  count: number;
  unreadCount: number;
  isSystem: boolean;
}

// System folders configuration
const SYSTEM_FOLDERS = [
  { name: "INBOX", displayName: "Inbox", icon: "inbox" },
  { name: "STARRED", displayName: "Starred", icon: "star" },
  { name: "SENT", displayName: "Sent", icon: "send" },
  { name: "DRAFTS", displayName: "Drafts", icon: "file" },
  { name: "SPAM", displayName: "Spam", icon: "alert-triangle" },
  { name: "TRASH", displayName: "Trash", icon: "trash" },
  { name: "ALL", displayName: "All Mail", icon: "mail" },
];

// GET - List folders with counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get counts for system folders
    const [
      inboxCount,
      inboxUnread,
      starredCount,
      sentCount,
      draftsCount,
      spamCount,
      trashCount,
      allCount,
      allUnread,
    ] = await Promise.all([
      prisma.email.count({ where: { userId, folder: "INBOX", isTrash: false, isSpam: false } }),
      prisma.email.count({ where: { userId, folder: "INBOX", isTrash: false, isSpam: false, isRead: false } }),
      prisma.email.count({ where: { userId, isStarred: true, isTrash: false } }),
      prisma.email.count({ where: { userId, isSent: true, isTrash: false } }),
      prisma.email.count({ where: { userId, isDraft: true, isTrash: false } }),
      prisma.email.count({ where: { userId, isSpam: true } }),
      prisma.email.count({ where: { userId, isTrash: true } }),
      prisma.email.count({ where: { userId, isTrash: false, isSpam: false } }),
      prisma.email.count({ where: { userId, isTrash: false, isSpam: false, isRead: false } }),
    ]);

    const systemFolders: FolderInfo[] = [
      { name: "INBOX", displayName: "Inbox", icon: "inbox", count: inboxCount, unreadCount: inboxUnread, isSystem: true },
      { name: "STARRED", displayName: "Starred", icon: "star", count: starredCount, unreadCount: 0, isSystem: true },
      { name: "SENT", displayName: "Sent", icon: "send", count: sentCount, unreadCount: 0, isSystem: true },
      { name: "DRAFTS", displayName: "Drafts", icon: "file", count: draftsCount, unreadCount: draftsCount, isSystem: true },
      { name: "SPAM", displayName: "Spam", icon: "alert-triangle", count: spamCount, unreadCount: spamCount, isSystem: true },
      { name: "TRASH", displayName: "Trash", icon: "trash", count: trashCount, unreadCount: 0, isSystem: true },
      { name: "ALL", displayName: "All Mail", icon: "mail", count: allCount, unreadCount: allUnread, isSystem: true },
    ];

    // Get custom folders (unique folder names from emails)
    const customFolderNames = await prisma.email.groupBy({
      by: ["folder"],
      where: {
        userId,
        folder: {
          notIn: ["INBOX", "Sent", "Drafts", "Spam", "Trash"],
        },
      },
      _count: { id: true },
    });

    // Get unread counts for custom folders
    const customFolders: FolderInfo[] = await Promise.all(
      customFolderNames.map(async (f) => {
        const unreadCount = await prisma.email.count({
          where: { userId, folder: f.folder, isRead: false },
        });
        return {
          name: f.folder,
          displayName: f.folder,
          icon: "folder",
          count: f._count.id,
          unreadCount,
          isSystem: false,
        };
      })
    );

    // Get labels with counts
    const labels = await prisma.emailLabel.findMany({
      where: { userId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { assignments: true } },
      },
    });

    const labelFolders = labels.map((l) => ({
      id: l.id,
      name: l.name,
      displayName: l.name,
      icon: "tag",
      color: l.color,
      count: l._count.assignments,
      unreadCount: 0, // Would need additional query for unread
      isSystem: l.isSystem,
      isLabel: true,
    }));

    return NextResponse.json({
      folders: [...systemFolders, ...customFolders],
      labels: labelFolders,
      summary: {
        total: allCount,
        unread: allUnread,
      },
    });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders", details: error.message },
      { status: 500 }
    );
  }
}










