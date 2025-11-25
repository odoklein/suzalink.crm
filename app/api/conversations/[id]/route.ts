import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // For direct messages, get the other participant's name
    const otherParticipant =
      conversation.type === "DIRECT"
        ? conversation.participants.find((p) => p.userId !== session.user.id)
        : null;

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type,
      name:
        conversation.type === "DIRECT"
          ? otherParticipant?.user.email || "Unknown"
          : conversation.name,
      organizationId: conversation.organizationId,
      createdById: conversation.createdById,
      pinnedMessageId: conversation.pinnedMessageId,
      archivedAt: conversation.archivedAt?.toISOString() || null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      createdBy: conversation.createdBy,
      participants: conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        joinedAt: p.joinedAt.toISOString(),
        lastReadAt: p.lastReadAt?.toISOString(),
        user: p.user,
      })),
    });
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

