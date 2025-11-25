import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Archive conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive conversation error:", error);
    return NextResponse.json(
      { error: "Failed to archive conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Unarchive conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        archivedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unarchive conversation error:", error);
    return NextResponse.json(
      { error: "Failed to unarchive conversation" },
      { status: 500 }
    );
  }
}

