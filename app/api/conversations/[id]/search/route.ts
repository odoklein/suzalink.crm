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

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

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

    // Search messages in this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        content: {
          contains: query,
          mode: "insensitive",
        },
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
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit results
    });

    return NextResponse.json({
      results: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        user: msg.user,
      })),
    });
  } catch (error) {
    console.error("Message search error:", error);
    return NextResponse.json(
      { error: "Failed to search messages" },
      { status: 500 }
    );
  }
}

