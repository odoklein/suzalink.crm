/**
 * Email Labels API
 * 
 * GET /api/email/labels - List user's labels
 * POST /api/email/labels - Create new label
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - List labels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const labels = await prisma.emailLabel.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isSystem: "desc" },
        { displayOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    return NextResponse.json({
      labels: labels.map(l => ({
        ...l,
        emailCount: l._count.assignments,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create label
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.emailLabel.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Label already exists" },
        { status: 400 }
      );
    }

    // Get max display order
    const maxOrder = await prisma.emailLabel.aggregate({
      where: { userId: session.user.id },
      _max: { displayOrder: true },
    });

    const label = await prisma.emailLabel.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        color: color || "#6B7280",
        displayOrder: (maxOrder._max.displayOrder || 0) + 1,
      },
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating label:", error);
    return NextResponse.json(
      { error: "Failed to create label", details: error.message },
      { status: 500 }
    );
  }
}












