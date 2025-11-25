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

    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if conversation exists and is a group
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        type: "GROUP",
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Group conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: "User is already a participant" },
        { status: 400 }
      );
    }

    // Verify user is in the same organization
    const userToAdd = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found in organization" },
        { status: 404 }
      );
    }

    const participant = await prisma.conversationParticipant.create({
      data: {
        conversationId: id,
        userId,
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

    return NextResponse.json(
      {
        id: participant.id,
        userId: participant.userId,
        joinedAt: participant.joinedAt.toISOString(),
        lastReadAt: participant.lastReadAt?.toISOString(),
        user: participant.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add participant error:", error);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}

