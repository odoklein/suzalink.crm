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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      projectId: id,
    };

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json({
      tasks: tasks.map(task => ({
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
        project: task.project,
      })),
      total: tasks.length,
    });
  } catch (error) {
    console.error("Project tasks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tasks" },
      { status: 500 }
    );
  }
}

