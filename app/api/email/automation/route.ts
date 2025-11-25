import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  parseEmailTemplate, 
  calculateNextExecutionTime,
  DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_EMAIL_SEQUENCES 
} from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, sequenceId, action } = await request.json();

    if (action === 'start') {
      return await startEmailSequence(leadId, sequenceId, session.user.id);
    } else if (action === 'pause') {
      return await pauseEmailSequence(leadId, sequenceId);
    } else if (action === 'resume') {
      return await resumeEmailSequence(leadId, sequenceId);
    } else if (action === 'stop') {
      return await stopEmailSequence(leadId, sequenceId);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Email automation error:", error);
    return NextResponse.json(
      { error: "Failed to process email automation" },
      { status: 500 }
    );
  }
}

async function startEmailSequence(leadId: string, sequenceId: string, userId: string) {
  // Get lead data
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Get sequence (from defaults for now)
  const sequence = DEFAULT_EMAIL_SEQUENCES.find(s => `sequence-${DEFAULT_EMAIL_SEQUENCES.indexOf(s) + 1}` === sequenceId);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }

  // Check if sequence is already running for this lead
  const existingExecution = await prisma.activity.findFirst({
    where: {
      leadId,
      type: 'EMAIL_SEQUENCE',
      metadata: {
        path: ['sequenceId'],
        equals: sequenceId,
      },
    },
  });

  if (existingExecution) {
    return NextResponse.json({ error: "Sequence already running for this lead" }, { status: 400 });
  }

  // Create automation execution record
  const execution = {
    id: `exec-${Date.now()}`,
    sequenceId,
    leadId,
    currentStepId: sequence.steps[0].id,
    status: 'active' as const,
    startedAt: new Date().toISOString(),
    nextExecutionAt: calculateNextExecutionTime(sequence.steps[0].delay).toISOString(),
    executionHistory: [],
  };

  // Store execution in activity log
  await prisma.activity.create({
    data: {
      leadId,
      userId,
      type: 'EMAIL_SEQUENCE',
      metadata: {
        action: 'started',
        sequenceId,
        sequenceName: sequence.name,
        execution,
      },
    },
  });

  // Execute first step if delay is 0
  if (sequence.steps[0].delay.value === 0) {
    await executeEmailStep(leadId, sequenceId, sequence.steps[0].id, userId);
  }

  return NextResponse.json({ 
    message: "Email sequence started successfully",
    executionId: execution.id,
  });
}

async function executeEmailStep(leadId: string, sequenceId: string, stepId: string, userId: string) {
  // Get lead data for template variables
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: {
        include: {
          account: true,
        },
      },
    },
  });

  if (!lead) return;

  // Get sequence and step
  const sequence = DEFAULT_EMAIL_SEQUENCES.find(s => `sequence-${DEFAULT_EMAIL_SEQUENCES.indexOf(s) + 1}` === sequenceId);
  if (!sequence) return;

  const step = sequence.steps.find(s => s.id === stepId);
  if (!step) return;

  // Get template
  const templateIndex = DEFAULT_EMAIL_TEMPLATES.findIndex(t => `template-${DEFAULT_EMAIL_TEMPLATES.indexOf(t) + 1}` === step.templateId);
  const template = DEFAULT_EMAIL_TEMPLATES[templateIndex];
  if (!template) return;

  // Prepare template variables
  const standardData = lead.standardData as any || {};
  const variables = {
    firstName: standardData.firstName || 'there',
    lastName: standardData.lastName || '',
    email: standardData.email || '',
    company: standardData.company || lead.campaign?.account?.companyName || 'your company',
    jobTitle: standardData.jobTitle || '',
    senderName: 'Sales Team',
    senderTitle: 'Business Development',
    senderCompany: 'Facturix CRM',
    companyDescription: 'innovative solutions',
    valueProposition: 'streamline your sales process',
    specificBenefit: 'increase your conversion rates',
    similarCompany: 'a similar company',
    specificResult: 'a 30% increase in qualified leads',
    specificChallenge: 'lead management',
    contentLink: 'https://example.com/article',
    keyInsight: 'automation can significantly improve efficiency',
    proposalBenefit: 'achieve your sales goals',
    benefit1: 'Increased efficiency',
    benefit2: 'Better lead tracking',
    benefit3: 'Improved conversion rates',
    offer: 'special discount',
    specificGoal: 'improve your sales process',
  };

  // Parse template
  const subject = parseEmailTemplate(template.subject, variables);
  const content = parseEmailTemplate(template.content, variables);

  // Send email (simulate for now)
  const emailSent = await sendEmail({
    to: standardData.email,
    subject,
    content,
    leadId,
    templateId: step.templateId,
  });

  // Log activity
  await prisma.activity.create({
    data: {
      leadId,
      userId,
      type: 'EMAIL',
      metadata: {
        subject,
        templateId: step.templateId,
        sequenceId,
        stepId,
        sent: emailSent,
        automated: true,
      },
    },
  });

  return emailSent;
}

async function sendEmail(emailData: {
  to: string;
  subject: string;
  content: string;
  leadId: string;
  templateId: string;
}) {
  // In a real implementation, you'd use your email service (Nodemailer, SendGrid, etc.)
  // For now, we'll simulate sending
  console.log('Sending automated email:', {
    to: emailData.to,
    subject: emailData.subject,
    leadId: emailData.leadId,
    templateId: emailData.templateId,
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return true; // Simulate successful send
}

async function pauseEmailSequence(leadId: string, sequenceId: string) {
  // Update execution status in activity log
  await prisma.activity.create({
    data: {
      leadId,
      userId: 'system',
      type: 'EMAIL_SEQUENCE',
      metadata: {
        action: 'paused',
        sequenceId,
      },
    },
  });

  return NextResponse.json({ message: "Email sequence paused" });
}

async function resumeEmailSequence(leadId: string, sequenceId: string) {
  await prisma.activity.create({
    data: {
      leadId,
      userId: 'system',
      type: 'EMAIL_SEQUENCE',
      metadata: {
        action: 'resumed',
        sequenceId,
      },
    },
  });

  return NextResponse.json({ message: "Email sequence resumed" });
}

async function stopEmailSequence(leadId: string, sequenceId: string) {
  await prisma.activity.create({
    data: {
      leadId,
      userId: 'system',
      type: 'EMAIL_SEQUENCE',
      metadata: {
        action: 'stopped',
        sequenceId,
      },
    },
  });

  return NextResponse.json({ message: "Email sequence stopped" });
}





