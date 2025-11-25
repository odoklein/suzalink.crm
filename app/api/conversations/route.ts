import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'DIRECT' or 'GROUP'

    const organizationId = session.user.organizationId;

    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        organizationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
        ...(type ? { type: type as "DIRECT" | "GROUP" } : {}),
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
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
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
        _count: {
          select: {
            messages: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [
        { archivedAt: 'asc' }, // Non-archived first (nulls come first in asc)
        { updatedAt: 'desc' }, // Then by update time
      ],
    });

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: conv.id,
              userId: session.user.id,
            },
          },
        });

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            userId: { not: session.user.id },
            deletedAt: null,
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
          },
        });

        // For direct messages, get the other participant
        const otherParticipant =
          conv.type === "DIRECT"
            ? conv.participants.find((p) => p.userId !== session.user.id)
            : null;

        return {
          id: conv.id,
          type: conv.type,
          name:
            conv.type === "DIRECT"
              ? otherParticipant?.user.email || "Unknown"
              : conv.name,
          organizationId: conv.organizationId,
          createdById: conv.createdById,
          pinnedMessageId: conv.pinnedMessageId,
          archivedAt: conv.archivedAt?.toISOString() || null,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          createdBy: conv.createdBy,
          participants: conv.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            joinedAt: p.joinedAt.toISOString(),
            lastReadAt: p.lastReadAt?.toISOString(),
            user: p.user,
          })),
          lastMessage: conv.messages[0]
            ? {
                id: conv.messages[0].id,
                content: conv.messages[0].content,
                userId: conv.messages[0].userId,
                createdAt: conv.messages[0].createdAt.toISOString(),
                user: conv.messages[0].user,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithUnread,
      total: conversationsWithUnread.length,
    });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
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

    const body = await request.json();
    const { type, participantIds, name } = body;

    if (!type || (type !== "DIRECT" && type !== "GROUP")) {
      return NextResponse.json(
        { error: "Invalid conversation type" },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // For direct messages, ensure exactly one other participant
    if (type === "DIRECT") {
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length !== 1) {
        return NextResponse.json(
          { error: "Direct messages require exactly one other participant" },
          { status: 400 }
        );
      }

      // Check if direct conversation already exists
      const existingConv = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          organizationId,
          participants: {
            every: {
              userId: {
                in: [session.user.id, participantIds[0]],
              },
            },
          },
        },
        include: {
          participants: true,
        },
      });

      if (existingConv && existingConv.participants.length === 2) {
        // Return existing conversation
        return NextResponse.json({
          id: existingConv.id,
          type: existingConv.type,
          name: null,
          organizationId: existingConv.organizationId,
          createdById: existingConv.createdById,
          createdAt: existingConv.createdAt.toISOString(),
          updatedAt: existingConv.updatedAt.toISOString(),
        }, { status: 200 });
      }
    }

    // For group channels, name is required
    if (type === "GROUP" && !name) {
      return NextResponse.json(
        { error: "Group channels require a name" },
        { status: 400 }
      );
    }

    // Verify all participants are in the same organization
    const participants = [session.user.id, ...(participantIds || [])];
    const users = await prisma.user.findMany({
      where: {
        id: { in: participants },
        organizationId,
      },
    });

    if (users.length !== participants.length) {
      return NextResponse.json(
        { error: "Some participants are not in your organization" },
        { status: 400 }
      );
    }

    // Create conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        type: type as "DIRECT" | "GROUP",
        name: type === "GROUP" ? name : null,
        organizationId,
        createdById: session.user.id,
        participants: {
          create: participants.map((userId) => ({
            userId,
          })),
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

    return NextResponse.json(
      {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        organizationId: conversation.organizationId,
        createdById: conversation.createdById,
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Conversation creation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

