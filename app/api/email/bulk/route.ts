/**
 * Email Bulk Operations API
 * 
 * POST /api/email/bulk - Perform bulk operations on emails
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type BulkAction = 
  | "markRead"
  | "markUnread"
  | "archive"
  | "unarchive"
  | "star"
  | "unstar"
  | "trash"
  | "untrash"
  | "spam"
  | "notSpam"
  | "delete"
  | "move"
  | "addLabel"
  | "removeLabel";

// POST - Bulk operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emailIds, action, data } = body as {
      emailIds: string[];
      action: BulkAction;
      data?: {
        folder?: string;
        labelId?: string;
      };
    };

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: "No emails specified" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Verify all emails belong to user
    const emails = await prisma.email.findMany({
      where: {
        id: { in: emailIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (emails.length !== emailIds.length) {
      return NextResponse.json(
        { error: "Some emails not found or unauthorized" },
        { status: 400 }
      );
    }

    let result: { count: number } = { count: 0 };

    switch (action) {
      case "markRead":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isRead: true },
        });
        break;

      case "markUnread":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isRead: false },
        });
        break;

      case "archive":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isArchived: true },
        });
        break;

      case "unarchive":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isArchived: false },
        });
        break;

      case "star":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isStarred: true },
        });
        break;

      case "unstar":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isStarred: false },
        });
        break;

      case "trash":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isTrash: true },
        });
        break;

      case "untrash":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isTrash: false, folder: "INBOX" },
        });
        break;

      case "spam":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isSpam: true },
        });
        break;

      case "notSpam":
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { isSpam: false, folder: "INBOX" },
        });
        break;

      case "delete":
        result = await prisma.email.deleteMany({
          where: { id: { in: emailIds }, userId: session.user.id },
        });
        break;

      case "move":
        if (!data?.folder) {
          return NextResponse.json(
            { error: "Folder is required for move action" },
            { status: 400 }
          );
        }
        result = await prisma.email.updateMany({
          where: { id: { in: emailIds }, userId: session.user.id },
          data: { folder: data.folder },
        });
        break;

      case "addLabel":
        if (!data?.labelId) {
          return NextResponse.json(
            { error: "Label ID is required" },
            { status: 400 }
          );
        }
        // Verify label belongs to user
        const labelToAdd = await prisma.emailLabel.findFirst({
          where: { id: data.labelId, userId: session.user.id },
        });
        if (!labelToAdd) {
          return NextResponse.json(
            { error: "Label not found" },
            { status: 404 }
          );
        }
        // Create assignments (ignore duplicates)
        for (const emailId of emailIds) {
          await prisma.emailLabelAssignment.upsert({
            where: {
              emailId_labelId: { emailId, labelId: data.labelId },
            },
            create: { emailId, labelId: data.labelId },
            update: {},
          });
        }
        result = { count: emailIds.length };
        break;

      case "removeLabel":
        if (!data?.labelId) {
          return NextResponse.json(
            { error: "Label ID is required" },
            { status: 400 }
          );
        }
        result = await prisma.emailLabelAssignment.deleteMany({
          where: {
            emailId: { in: emailIds },
            labelId: data.labelId,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      affected: result.count,
    });
  } catch (error: any) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation", details: error.message },
      { status: 500 }
    );
  }
}










