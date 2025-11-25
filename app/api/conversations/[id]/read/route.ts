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

    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: session.user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark conversation as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark conversation as read" },
      { status: 500 }
    );
  }
}

