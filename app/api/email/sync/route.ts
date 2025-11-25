/**
 * Email Sync API
 * 
 * POST /api/email/sync - Trigger email sync
 * GET /api/email/sync - Get sync status
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  queueFullSync, 
  queueIncrementalSync, 
  queueFolderSync,
  getEmailQueue 
} from "@/lib/email-queue";
import { syncUserEmails } from "@/lib/email-sync-v2";

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sync states for all folders
    const syncStates = await prisma.emailSyncState.findMany({
      where: { userId: session.user.id },
      orderBy: { folder: "asc" },
    });

    // Get pending jobs
    const queue = getEmailQueue();
    const stats = await queue.getStats(session.user.id);

    // Calculate overall sync status
    const isSyncing = syncStates.some(s => s.syncStatus === "syncing");
    const hasErrors = syncStates.some(s => s.syncStatus === "error");
    const lastSyncAt = syncStates.reduce((latest, s) => {
      if (!s.lastSyncAt) return latest;
      return !latest || s.lastSyncAt > latest ? s.lastSyncAt : latest;
    }, null as Date | null);

    // Get email counts
    const [totalEmails, unreadEmails] = await Promise.all([
      prisma.email.count({ where: { userId: session.user.id, isTrash: false } }),
      prisma.email.count({ where: { userId: session.user.id, isRead: false, isTrash: false } }),
    ]);

    return NextResponse.json({
      status: isSyncing ? "syncing" : hasErrors ? "error" : "idle",
      lastSyncAt,
      folders: syncStates.map(s => ({
        folder: s.folder,
        status: s.syncStatus,
        progress: s.syncProgress,
        totalMessages: s.totalMessages,
        syncedMessages: s.syncedMessages,
        lastSyncAt: s.lastSyncAt,
        errorMessage: s.errorMessage,
      })),
      queue: stats,
      counts: {
        total: totalEmails,
        unread: unreadEmails,
      },
    });
  } catch (error: any) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Trigger email sync
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { type = "incremental", folder, immediate = false } = body;

    console.log(`📧 Email sync requested: type=${type}, folder=${folder || 'ALL'}, immediate=${immediate}`);

    // Check if user has email settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailSettings: true, email: true },
    });

    if (!user?.emailSettings) {
      console.log("❌ No email settings configured for user:", session.user.email);
      return NextResponse.json(
        { error: "Email settings not configured" },
        { status: 400 }
      );
    }

    const settings = user.emailSettings as any;
    console.log(`📧 Email settings found: host=${settings.imap_host}, user=${settings.imap_user}`);

    let jobId: string | undefined;

    if (immediate) {
      // Sync immediately (blocking)
      console.log("📧 Starting immediate sync...");
      try {
        const result = await syncUserEmails(session.user.id, {
          folder: folder || undefined,
          fullSync: type === "full",
        });

        console.log("📧 Sync result:", JSON.stringify(result, null, 2));

        return NextResponse.json({
          message: "Sync completed",
          result,
        });
      } catch (syncError: any) {
        console.error("❌ Sync error:", syncError);
        return NextResponse.json(
          { error: "Sync failed", details: syncError.message },
          { status: 500 }
        );
      }
    } else {
      // Queue sync job
      if (folder) {
        jobId = await queueFolderSync(session.user.id, folder, 5);
      } else if (type === "full") {
        jobId = await queueFullSync(session.user.id, 5);
      } else {
        jobId = await queueIncrementalSync(session.user.id, 5);
      }

      return NextResponse.json({
        message: "Sync queued",
        jobId,
      });
    }
  } catch (error: any) {
    console.error("❌ Error triggering sync:", error);
    return NextResponse.json(
      { error: "Failed to trigger sync", details: error.message },
      { status: 500 }
    );
  }
}

