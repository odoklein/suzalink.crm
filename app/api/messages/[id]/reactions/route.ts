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

    const { id: messageId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: "Emoji is required" },
        { status: 400 }
      );
    }

    // Check if message exists and user has access
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        deletedAt: null,
      },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!message || message.conversation.participants.length === 0) {
      return NextResponse.json(
        { error: "Message not found or access denied" },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: session.user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction if it already exists (toggle)
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id,
        },
      });
      return NextResponse.json({ removed: true });
    }

    // Create reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: reaction.id,
      emoji: reaction.emoji,
      userId: reaction.userId,
      user: reaction.user,
      createdAt: reaction.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Reaction creation error:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;

    // Get all reactions for this message
    const reactions = await prisma.messageReaction.findMany({
      where: {
        messageId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Group by emoji
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof reactions>);

    const result = Object.entries(grouped).map(([emoji, reactions]) => ({
      emoji,
      count: reactions.length,
      users: reactions.map((r) => r.user),
    }));

    return NextResponse.json({ reactions: result });
  } catch (error) {
    console.error("Reactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

