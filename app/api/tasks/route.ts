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
    const leadId = searchParams.get('leadId');
    const campaignId = searchParams.get('campaignId');
    const projectId = searchParams.get('projectId');
    const dueDate = searchParams.get('dueDate'); // 'today', 'overdue', 'upcoming'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }
    
    if (leadId) {
      where.leadId = leadId;
    }
    
    if (campaignId) {
      where.campaignId = campaignId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (dueDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (dueDate) {
        case 'today':
          where.dueDate = {
            gte: today,
            lt: tomorrow,
          };
          break;
        case 'overdue':
          where.dueDate = {
            lt: today,
          };
          where.status = {
            not: 'completed',
          };
          break;
        case 'upcoming':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          where.dueDate = {
            gte: tomorrow,
            lte: nextWeek,
          };
          break;
      }
    }

    // Fetch tasks from database
    const tasks = await prisma.task.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
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
        { status: 'asc' }, // Pending first
        { priority: 'desc' }, // High priority first
        { dueDate: 'asc' }, // Earliest due date first
      ],
      take: limit,
    });

    // Transform to match expected format
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      userId: task.userId,
      leadId: task.leadId,
      campaignId: task.campaignId,
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
      lead: task.lead ? {
        id: task.lead.id,
        name: `${task.lead.standardData?.firstName || ''} ${task.lead.standardData?.lastName || ''}`.trim(),
        company: task.lead.standardData?.company || '',
        campaign: task.lead.campaign,
      } : null,
      campaign: task.campaign,
      project: task.project,
    }));

    return NextResponse.json({
      tasks: transformedTasks,
      total: transformedTasks.length,
    });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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

    const taskData = await request.json();
    
    // Validate required fields
    if (!taskData.title || !taskData.type || !taskData.dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, dueDate" },
        { status: 400 }
      );
    }

    // Create task in database
    const newTask = await prisma.task.create({
      data: {
        userId: session.user.id,
        leadId: taskData.leadId || null,
        campaignId: taskData.campaignId || null,
        projectId: taskData.projectId || null,
        title: taskData.title,
        description: taskData.description || null,
        type: taskData.type,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        dueDate: new Date(taskData.dueDate),
        metadata: taskData.metadata || null,
      },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match expected format
    const transformedTask = {
      id: newTask.id,
      userId: newTask.userId,
      leadId: newTask.leadId,
      campaignId: newTask.campaignId,
      projectId: newTask.projectId,
      title: newTask.title,
      description: newTask.description,
      type: newTask.type,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate.toISOString(),
      completedAt: newTask.completedAt?.toISOString(),
      metadata: newTask.metadata,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
      lead: newTask.lead ? {
        id: newTask.lead.id,
        name: `${newTask.lead.standardData?.firstName || ''} ${newTask.lead.standardData?.lastName || ''}`.trim(),
        company: newTask.lead.standardData?.company || '',
        campaign: newTask.lead.campaign,
      } : null,
      campaign: newTask.campaign,
      project: newTask.project,
    };

    return NextResponse.json(transformedTask, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, ...updateData } = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const data: any = {};
    
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.status !== undefined) {
      data.status = updateData.status;
      if (updateData.status === 'completed' && !updateData.completedAt) {
        data.completedAt = new Date();
      } else if (updateData.status !== 'completed') {
        data.completedAt = null;
      }
    }
    if (updateData.priority !== undefined) data.priority = updateData.priority;
    if (updateData.dueDate !== undefined) data.dueDate = new Date(updateData.dueDate);
    if (updateData.completedAt !== undefined) {
      data.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : null;
    }
    if (updateData.metadata !== undefined) data.metadata = updateData.metadata;
    if (updateData.projectId !== undefined) data.projectId = updateData.projectId || null;

    // Update task in database
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
        userId: session.user.id, // Ensure user can only update their own tasks
      },
      data,
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to match expected format
    const transformedTask = {
      id: updatedTask.id,
      userId: updatedTask.userId,
      leadId: updatedTask.leadId,
      campaignId: updatedTask.campaignId,
      projectId: updatedTask.projectId,
      title: updatedTask.title,
      description: updatedTask.description,
      type: updatedTask.type,
      status: updatedTask.status,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate.toISOString(),
      completedAt: updatedTask.completedAt?.toISOString(),
      metadata: updatedTask.metadata,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
      lead: updatedTask.lead ? {
        id: updatedTask.lead.id,
        name: `${updatedTask.lead.standardData?.firstName || ''} ${updatedTask.lead.standardData?.lastName || ''}`.trim(),
        company: updatedTask.lead.standardData?.company || '',
        campaign: updatedTask.lead.campaign,
      } : null,
      campaign: updatedTask.campaign,
      project: updatedTask.project,
    };

    return NextResponse.json(transformedTask);
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

