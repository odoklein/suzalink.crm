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
          // Admins and managers can see all projects in their org
          ...(session.user.role === "ADMIN" || session.user.role === "MANAGER"
            ? [{}]
            : []),
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        tasks: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
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

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      ownerId: project.ownerId,
      organizationId: project.organizationId,
      startDate: project.startDate?.toISOString(),
      endDate: project.endDate?.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      owner: project.owner,
      members: project.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
      tasks: project.tasks.map(task => ({
        id: task.id,
        userId: task.userId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        metadata: task.metadata,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        user: task.user,
      })),
      taskCount: project._count.tasks,
      memberCount: project._count.members,
    });
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();

    // Check if user has permission to update (owner or admin/manager)
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

    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined)
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      status: updatedProject.status,
      ownerId: updatedProject.ownerId,
      organizationId: updatedProject.organizationId,
      startDate: updatedProject.startDate?.toISOString(),
      endDate: updatedProject.endDate?.toISOString(),
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
      owner: updatedProject.owner,
      members: updatedProject.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
    });
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user has permission to delete (owner or admin)
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

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

