import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Check if message exists and belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or access denied" },
        { status: 404 }
      );
    }

    // Check if user is still a participant
    if (message.conversation.participants.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content: content.trim(),
        editedAt: new Date(),
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

    const messageData = {
      id: updatedMessage.id,
      conversationId: updatedMessage.conversationId,
      userId: updatedMessage.userId,
      content: updatedMessage.content,
      editedAt: updatedMessage.editedAt?.toISOString(),
      deletedAt: updatedMessage.deletedAt?.toISOString(),
      createdAt: updatedMessage.createdAt.toISOString(),
      user: updatedMessage.user,
    };

    // Emit Socket.io event if available
    try {
      const { emitToConversation } = await import("@/lib/socket-server");
      emitToConversation(updatedMessage.conversationId, "message:updated", messageData);
    } catch (error) {
      console.log("Socket.io not available");
    }

    return NextResponse.json(messageData);
  } catch (error) {
    console.error("Message update error:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
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

    const { id } = await params;

    // Check if message exists and belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or access denied" },
        { status: 404 }
      );
    }

    // Check if user is still a participant
    if (message.conversation.participants.length === 0) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Soft delete
    const deletedMessage = await prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: {
        conversationId: true,
      },
    });

    // Emit Socket.io event if available
    try {
      const { emitToConversation } = await import("@/lib/socket-server");
      emitToConversation(deletedMessage.conversationId, "message:deleted", {
        messageId: id,
        conversationId: deletedMessage.conversationId,
      });
    } catch (error) {
      console.log("Socket.io not available");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Message deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}

