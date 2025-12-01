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
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // TODO: Implement communications model or use Notification model
    // For now, return empty array as placeholder
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching communications:", error);
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, content } = body;

    // TODO: Implement communications model
    // For now, create a notification as placeholder
    const communication = await prisma.notification.create({
      data: {
        userId: id,
        type: type || "internal_note",
        title: "Note interne",
        message: content,
        priority: "low",
      },
    });

    return NextResponse.json(communication, { status: 201 });
  } catch (error) {
    console.error("Error creating communication:", error);
    return NextResponse.json({ error: "Failed to create communication" }, { status: 500 });
  }
}












