import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;

    // Check if conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Users can remove themselves, or creator can remove others (for groups)
    const isCreator = conversation.createdById === session.user.id;
    const isRemovingSelf = userId === session.user.id;

    if (!isRemovingSelf && !isCreator) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove participant error:", error);
    return NextResponse.json(
      { error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}

