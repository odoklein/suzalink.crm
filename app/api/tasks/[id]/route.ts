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

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id, // Ensure user can only access their own tasks
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
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Transform to match expected format
    const transformedTask = {
      id: task.id,
      userId: task.userId,
      leadId: task.leadId,
      campaignId: task.campaignId,
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
    };

    return NextResponse.json(transformedTask);
  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const updateData = await request.json();

    // Prepare update data
    const data: any = {};
    
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.status !== undefined) {
      data.status = updateData.status;
      // Handle completedAt based on status
      if (updateData.status === 'completed') {
        // If status is completed, set completedAt if not already provided
        if (updateData.completedAt !== undefined) {
          data.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : new Date();
        } else {
          data.completedAt = new Date();
        }
      } else if (updateData.status === 'pending') {
        // If status is pending, clear completedAt
        data.completedAt = null;
      }
    }
    if (updateData.priority !== undefined) data.priority = updateData.priority;
    if (updateData.dueDate !== undefined) data.dueDate = new Date(updateData.dueDate);
    // Handle completedAt separately if status wasn't updated
    if (updateData.completedAt !== undefined && updateData.status === undefined) {
      data.completedAt = updateData.completedAt ? new Date(updateData.completedAt) : null;
    }
    if (updateData.metadata !== undefined) data.metadata = updateData.metadata;

    // Update task in database
    const updatedTask = await prisma.task.update({
      where: {
        id,
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
      },
    });

    // Transform to match expected format
    const transformedTask = {
      id: updatedTask.id,
      userId: updatedTask.userId,
      leadId: updatedTask.leadId,
      campaignId: updatedTask.campaignId,
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
    };

    return NextResponse.json(transformedTask);
  } catch (error: any) {
    console.error("Task update error:", error);
    
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update task" },
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

    // Delete task
    await prisma.task.delete({
      where: {
        id,
        userId: session.user.id, // Ensure user can only delete their own tasks
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Task deletion error:", error);
    
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

