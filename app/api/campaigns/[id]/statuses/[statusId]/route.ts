import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Get a single status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; statusId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, statusId } = await params;

    const status = await prisma.leadStatusConfig.findFirst({
      where: { id: statusId, campaignId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!status) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

// PUT - Update a status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; statusId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can update statuses
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, statusId } = await params;
    const body = await request.json();
    const { name, color, isDefault, isFinal } = body;

    // Verify status exists and belongs to campaign
    const existingStatus = await prisma.leadStatusConfig.findFirst({
      where: { id: statusId, campaignId },
    });

    if (!existingStatus) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingStatus.isDefault) {
      await prisma.leadStatusConfig.updateMany({
        where: { campaignId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const status = await prisma.leadStatusConfig.update({
      where: { id: statusId },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
        isFinal: isFinal !== undefined ? isFinal : undefined,
      },
    });

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Error updating status:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A status with this name already exists in this campaign" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; statusId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can delete statuses
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: campaignId, statusId } = await params;

    // Verify status exists and belongs to campaign
    const existingStatus = await prisma.leadStatusConfig.findFirst({
      where: { id: statusId, campaignId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!existingStatus) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    // Don't allow deleting if there are leads with this status
    if (existingStatus._count.leads > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete status with existing leads",
          leadCount: existingStatus._count.leads,
        },
        { status: 400 }
      );
    }

    // Don't allow deleting if it's the only status
    const statusCount = await prisma.leadStatusConfig.count({
      where: { campaignId },
    });

    if (statusCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last status" },
        { status: 400 }
      );
    }

    // If deleting the default status, set another one as default
    if (existingStatus.isDefault) {
      const anotherStatus = await prisma.leadStatusConfig.findFirst({
        where: { campaignId, id: { not: statusId } },
        orderBy: { order: "asc" },
      });

      if (anotherStatus) {
        await prisma.leadStatusConfig.update({
          where: { id: anotherStatus.id },
          data: { isDefault: true },
        });
      }
    }

    await prisma.leadStatusConfig.delete({
      where: { id: statusId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting status:", error);
    return NextResponse.json(
      { error: "Failed to delete status" },
      { status: 500 }
    );
  }
}

