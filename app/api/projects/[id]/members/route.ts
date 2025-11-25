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

    const { id } = await params;

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
          ...(session.user.role === "ADMIN" || session.user.role === "MANAGER"
            ? [{}]
            : []),
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
    });
  } catch (error) {
    console.error("Project members fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

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
    const { userId, role = "member" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to add members
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.ownerId === session.user.id;
    const isAdminOrManager =
      session.user.role === "ADMIN" || session.user.role === "MANAGER";
    const isMemberWithEditRights =
      project.members.some(
        (m) => m.userId === session.user.id && m.role !== "viewer"
      ) || isOwner;

    if (!isOwner && !isAdminOrManager && !isMemberWithEditRights) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
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

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId,
        role: role === "owner" ? "member" : role, // Prevent creating another owner
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: member.user,
    }, { status: 201 });
  } catch (error) {
    console.error("Add project member error:", error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 }
    );
  }
}

