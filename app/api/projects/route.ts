import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const organizationId = session.user.organizationId;

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    // For non-admin users, only show projects they're members of or own
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      where.OR = [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
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
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const transformedProjects = projects.map(project => ({
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
      taskCount: project._count.tasks,
      memberCount: project._count.members,
    }));

    return NextResponse.json({
      projects: transformedProjects,
      total: transformedProjects.length,
    });
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, status, startDate, endDate, memberIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Create project with owner as first member
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: status || "Planning",
        ownerId: session.user.id,
        organizationId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
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
      },
    });

    // Add additional members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const membersToAdd = memberIds
        .filter((id: string) => id !== session.user.id)
        .map((userId: string) => ({
          projectId: project.id,
          userId,
          role: "member",
        }));

      if (membersToAdd.length > 0) {
        await prisma.projectMember.createMany({
          data: membersToAdd,
        });

        // Fetch updated project with all members
        const updatedProject = await prisma.project.findUnique({
          where: { id: project.id },
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

        if (updatedProject) {
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
          }, { status: 201 });
        }
      }
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
    }, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

