/**
 * Email API - Single email endpoints
 * 
 * GET /api/email/[id] - Get single email with full content
 * PATCH /api/email/[id] - Update email flags
 * DELETE /api/email/[id] - Move to trash or permanently delete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single email
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const email = await prisma.email.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        attachments: true,
        labels: {
          include: {
            label: true,
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
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Get thread emails if this is part of a thread
    let threadEmails: any[] = [];
    if (email.threadId) {
      threadEmails = await prisma.email.findMany({
        where: {
          userId: session.user.id,
          threadId: email.threadId,
          id: { not: email.id },
        },
        orderBy: { receivedAt: "asc" },
        select: {
          id: true,
          subject: true,
          fromAddress: true,
          fromName: true,
          snippet: true,
          receivedAt: true,
          isRead: true,
        },
      });
    }

    // Mark as read
    if (!email.isRead) {
      await prisma.email.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      email: {
        ...email,
        labels: email.labels.map(l => l.label),
      },
      thread: threadEmails,
    });
  } catch (error: any) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update email flags
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.email.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Allowed updates
    const allowedFields = [
      "isRead",
      "isStarred",
      "isArchived",
      "isSpam",
      "isTrash",
      "folder",
      "leadId",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const email = await prisma.email.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ email });
  } catch (error: any) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Failed to update email", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Move to trash or permanently delete
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    // Verify ownership
    const existing = await prisma.email.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (permanent) {
      // Permanently delete
      await prisma.email.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Email permanently deleted" });
    } else {
      // Move to trash
      await prisma.email.update({
        where: { id },
        data: { isTrash: true },
      });
      return NextResponse.json({ message: "Email moved to trash" });
    }
  } catch (error: any) {
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Failed to delete email", details: error.message },
      { status: 500 }
    );
  }
}




