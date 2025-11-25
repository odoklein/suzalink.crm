import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; reactionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reactionId } = await params;

    // Check if reaction exists and belongs to user
    const reaction = await prisma.messageReaction.findFirst({
      where: {
        id: reactionId,
        userId: session.user.id,
      },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.messageReaction.delete({
      where: {
        id: reactionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reaction deletion error:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}

