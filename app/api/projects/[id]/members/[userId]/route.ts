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

    // Check if user has permission to remove members
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
    const isAdmin = session.user.role === "ADMIN";
    const isMemberWithEditRights =
      project.members.some(
        (m) => m.userId === session.user.id && m.role !== "viewer"
      ) || isOwner;

    // Can't remove the owner
    if (userId === project.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove project owner" },
        { status: 400 }
      );
    }

    // Users can remove themselves, or owner/admin/member with edit rights can remove others
    if (
      userId !== session.user.id &&
      !isOwner &&
      !isAdmin &&
      !isMemberWithEditRights
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove project member error:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    // Check if user has permission to update member roles (owner or admin only)
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Can't change owner role
    if (userId === project.ownerId && role !== "owner") {
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
      data: {
        role: role === "owner" ? "member" : role, // Prevent setting owner role
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
    });
  } catch (error) {
    console.error("Update project member role error:", error);
    return NextResponse.json(
      { error: "Failed to update project member role" },
      { status: 500 }
    );
  }
}

