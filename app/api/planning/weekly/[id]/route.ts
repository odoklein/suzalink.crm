import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get a single weekly assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.weeklyAssignment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                companyName: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // BD users can only see their own assignments
    if (session.user.role === "BD" && assignment.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error fetching weekly assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly assignment" },
      { status: 500 }
    );
  }
}

// PUT - Update a weekly assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can update assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    const assignment = await prisma.weeklyAssignment.update({
      where: { id },
      data: { notes },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                companyName: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error("Error updating weekly assignment:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to update weekly assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a weekly assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete assignments
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.weeklyAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting weekly assignment:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to delete weekly assignment" },
      { status: 500 }
    );
  }
}

