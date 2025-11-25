import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_SEQUENCES } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch sequences from database
    const sequences = await prisma.emailSequence.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        steps: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform sequences to match frontend interface
    const transformedSequences = sequences.map((seq) => ({
      id: seq.id,
      name: seq.name,
      description: seq.description || '',
      isActive: seq.isActive,
      trigger: {
        type: seq.triggerType || 'manual',
        conditions: seq.triggerData || {},
      },
      steps: seq.steps.map((step) => ({
        id: step.id,
        order: step.stepOrder,
        templateId: step.templateId,
        template: step.template,
        delay: {
          value: step.delayDays * 24 + step.delayHours,
          unit: step.delayDays > 0 ? 'days' : step.delayHours > 0 ? 'hours' : 'minutes',
        },
        conditions: step.conditions,
      })),
      createdAt: seq.createdAt.toISOString(),
      updatedAt: seq.updatedAt.toISOString(),
      userId: seq.userId,
    }));

    return NextResponse.json(transformedSequences);
  } catch (error) {
    console.error("Email sequences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email sequences" },
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

    const sequenceData = await request.json();
    
    // Validate sequence data
    if (!sequenceData.name || !sequenceData.steps || !Array.isArray(sequenceData.steps)) {
      return NextResponse.json(
        { error: "Invalid sequence data" },
        { status: 400 }
      );
    }

    // Extract trigger data from frontend format
    const triggerType = sequenceData.trigger?.type || sequenceData.triggerType || 'manual';
    const triggerData = sequenceData.trigger?.conditions || sequenceData.triggerData || null;

    // Create sequence in database with transaction
    const newSequence = await prisma.$transaction(async (tx) => {
      // Create the sequence
      const sequence = await tx.emailSequence.create({
        data: {
          userId: session.user.id,
          name: sequenceData.name,
          description: sequenceData.description || null,
          triggerType: triggerType,
          triggerData: triggerData,
          isActive: sequenceData.isActive !== false,
        },
      });

      // Create the steps
      if (sequenceData.steps && sequenceData.steps.length > 0) {
        await Promise.all(
          sequenceData.steps.map((step: any, index: number) => {
            // Transform delay from frontend format to database format
            const delayValue = step.delay?.value || 0;
            const delayUnit = step.delay?.unit || 'days';
            
            let delayDays = 0;
            let delayHours = 0;
            
            if (delayUnit === 'days') {
              delayDays = delayValue;
            } else if (delayUnit === 'hours') {
              delayHours = delayValue;
            } else if (delayUnit === 'weeks') {
              delayDays = delayValue * 7;
            } else if (delayUnit === 'minutes') {
              delayHours = Math.floor(delayValue / 60);
            }

            return tx.emailSequenceStep.create({
              data: {
                sequenceId: sequence.id,
                templateId: step.templateId,
                stepOrder: step.order || index + 1,
                delayDays: delayDays,
                delayHours: delayHours,
                conditions: step.conditions || null,
                isActive: step.isActive !== false,
              },
            });
          })
        );
      }

      // Return sequence with steps
      const createdSequence = await tx.emailSequence.findUnique({
        where: { id: sequence.id },
        include: {
          steps: {
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                  subject: true,
                },
              },
            },
            orderBy: {
              stepOrder: 'asc',
            },
          },
        },
      });

      if (!createdSequence) {
        throw new Error("Failed to retrieve created sequence");
      }

      // Transform to match frontend interface
      return {
        id: createdSequence.id,
        name: createdSequence.name,
        description: createdSequence.description || '',
        isActive: createdSequence.isActive,
        trigger: {
          type: createdSequence.triggerType || 'manual',
          conditions: createdSequence.triggerData || {},
        },
        steps: createdSequence.steps.map((step) => ({
          id: step.id,
          order: step.stepOrder,
          templateId: step.templateId,
          template: step.template,
          delay: {
            value: step.delayDays * 24 + step.delayHours,
            unit: step.delayDays > 0 ? 'days' : step.delayHours > 0 ? 'hours' : 'minutes',
          },
          conditions: step.conditions,
        })),
        createdAt: createdSequence.createdAt.toISOString(),
        updatedAt: createdSequence.updatedAt.toISOString(),
        userId: createdSequence.userId,
      };
    });

    return NextResponse.json(newSequence, { status: 201 });
  } catch (error) {
    console.error("Create sequence error:", error);
    return NextResponse.json(
      { error: "Failed to create email sequence" },
      { status: 500 }
    );
  }
}
