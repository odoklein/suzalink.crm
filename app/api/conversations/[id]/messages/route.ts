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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
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

    const where: any = {
      conversationId: id,
      deletedAt: null,
    };

    if (cursor) {
      where.createdAt = {
        lt: new Date(cursor),
      };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        attachments: true,
        reactions: {
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore
      ? messagesToReturn[messagesToReturn.length - 1].createdAt.toISOString()
      : null;

    // Group reactions by emoji
    const formatReactions = (reactions: any[]) => {
      const grouped = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.user);
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(grouped).map(([emoji, users]) => ({
        emoji,
        count: users.length,
        users,
      }));
    };

    return NextResponse.json({
      messages: messagesToReturn
        .reverse()
        .map((msg) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          userId: msg.userId,
          content: msg.content,
          editedAt: msg.editedAt?.toISOString(),
          deletedAt: msg.deletedAt?.toISOString(),
          createdAt: msg.createdAt.toISOString(),
          user: msg.user,
          attachments: (msg.attachments || []).map((att: any) => ({
            id: att.id,
            fileName: att.fileName,
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            fileSize: att.fileSize,
            thumbnailUrl: att.thumbnailUrl,
          })),
          reactions: formatReactions(msg.reactions || []),
        })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, attachmentIds } = body;

    if ((!content || content.trim().length === 0) && (!attachmentIds || attachmentIds.length === 0)) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
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

    // Create message and update conversation's updatedAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          userId: session.user.id,
          content: content?.trim() || "",
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
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Update attachments with message ID if provided
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      await prisma.messageAttachment.updateMany({
        where: {
          id: { in: attachmentIds },
        },
        data: {
          messageId: message.id,
        },
      });
    }

    // Fetch message with attachments
    const messageWithAttachments = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        attachments: true,
      },
    });

    const messageData = {
      id: message.id,
      conversationId: message.conversationId,
      userId: message.userId,
      content: message.content,
      editedAt: message.editedAt?.toISOString(),
      deletedAt: message.deletedAt?.toISOString(),
      createdAt: message.createdAt.toISOString(),
      user: message.user,
      attachments: (messageWithAttachments?.attachments || []).map((att) => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
        thumbnailUrl: att.thumbnailUrl,
      })),
    };

    // Create notifications for other participants
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { participants: true },
      });

      const otherParticipants = conversation?.participants.filter(
        (p) => p.userId !== session.user.id
      );

      if (otherParticipants && otherParticipants.length > 0) {
        await prisma.notification.createMany({
          data: otherParticipants.map((p) => ({
            userId: p.userId,
            type: "new_message",
            title: "Nouveau message",
            message: `Vous avez reçu un nouveau message de ${session.user.email}`,
            data: { conversationId: id, messageId: message.id },
            actionUrl: `/communication?conversation=${id}`,
            actionLabel: "Voir le message",
          })),
        });
      }
    } catch (error) {
      // Log error but don't fail message creation if notifications fail
      console.error("Error creating notifications:", error);
    }

    // Emit Socket.io event if available
    try {
      const { emitToConversation } = await import("@/lib/socket-server");
      emitToConversation(id, "message:new", messageData);
    } catch (error) {
      // Socket.io not available, continue without real-time update
      console.log("Socket.io not available, message created without real-time update");
    }

    return NextResponse.json(messageData, { status: 201 });
  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

