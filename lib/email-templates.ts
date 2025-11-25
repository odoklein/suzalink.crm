export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'cold_outreach' | 'follow_up' | 'nurture' | 'proposal' | 'closing';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: 'lead_status' | 'time_delay' | 'manual' | 'lead_score';
    conditions: Record<string, any>;
  };
  steps: EmailSequenceStep[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EmailSequenceStep {
  id: string;
  order: number;
  templateId: string;
  template?: EmailTemplate;
  delay: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  conditions?: {
    type: 'lead_score' | 'lead_status' | 'activity' | 'custom';
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }[];
}

export interface EmailAutomationExecution {
  id: string;
  sequenceId: string;
  leadId: string;
  currentStepId: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  nextExecutionAt?: string;
  executionHistory: {
    stepId: string;
    executedAt: string;
    status: 'sent' | 'failed' | 'skipped';
    emailId?: string;
    error?: string;
  }[];
}

// Default email templates
export const DEFAULT_EMAIL_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[] = [
  {
    name: "Cold Outreach - Introduction",
    subject: "Quick question about {{company}}",
    content: `Hi {{firstName}},

I hope this email finds you well. I came across {{company}} and was impressed by {{companyDescription}}.

I'm reaching out because we help companies like yours {{valueProposition}}.

Would you be open to a brief 15-minute call this week to discuss how we might be able to help {{company}} {{specificBenefit}}?

Best regards,
{{senderName}}
{{senderTitle}}
{{senderCompany}}`,
    variables: ['firstName', 'company', 'companyDescription', 'valueProposition', 'specificBenefit', 'senderName', 'senderTitle', 'senderCompany'],
    category: 'cold_outreach',
    isActive: true,
  },
  {
    name: "Follow-up - No Response",
    subject: "Re: Quick question about {{company}}",
    content: `Hi {{firstName}},

I wanted to follow up on my previous email about helping {{company}} {{specificBenefit}}.

I understand you're probably busy, but I thought you might be interested in knowing that we recently helped {{similarCompany}} achieve {{specificResult}}.

If this resonates with you, I'd love to share more details. Would you have 10 minutes for a quick call this week?

Best regards,
{{senderName}}`,
    variables: ['firstName', 'company', 'specificBenefit', 'similarCompany', 'specificResult', 'senderName'],
    category: 'follow_up',
    isActive: true,
  },
  {
    name: "Nurture - Value Content",
    subject: "Thought you might find this interesting, {{firstName}}",
    content: `Hi {{firstName}},

I came across this article and thought it might be relevant to the challenges we discussed regarding {{specificChallenge}} at {{company}}.

{{contentLink}}

The key takeaway is {{keyInsight}}, which aligns with what we've been seeing across the industry.

If you'd like to discuss how this applies to your specific situation, I'm happy to jump on a quick call.

Best regards,
{{senderName}}`,
    variables: ['firstName', 'specificChallenge', 'company', 'contentLink', 'keyInsight', 'senderName'],
    category: 'nurture',
    isActive: true,
  },
  {
    name: "Proposal Follow-up",
    subject: "Following up on our proposal for {{company}}",
    content: `Hi {{firstName}},

I wanted to follow up on the proposal I sent over for {{company}} last week.

I'm excited about the opportunity to help you {{proposalBenefit}} and wanted to see if you had any questions about our approach or timeline.

The key benefits we outlined were:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Would you be available for a brief call this week to discuss next steps?

Best regards,
{{senderName}}`,
    variables: ['firstName', 'company', 'proposalBenefit', 'benefit1', 'benefit2', 'benefit3', 'senderName'],
    category: 'proposal',
    isActive: true,
  },
  {
    name: "Closing - Final Attempt",
    subject: "Last chance: {{offer}} for {{company}}",
    content: `Hi {{firstName}},

I hope you're doing well. I wanted to reach out one last time regarding our discussion about helping {{company}} {{specificGoal}}.

I understand timing might not be perfect right now, but I wanted to let you know that our {{offer}} expires at the end of this month.

If there's any interest in moving forward, or if you'd like to discuss this further down the line, please don't hesitate to reach out.

I'll be here whenever you're ready.

Best regards,
{{senderName}}`,
    variables: ['firstName', 'offer', 'company', 'specificGoal', 'senderName'],
    category: 'closing',
    isActive: true,
  },
];

// Default email sequences
export const DEFAULT_EMAIL_SEQUENCES: Omit<EmailSequence, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[] = [
  {
    name: "Cold Outreach Sequence",
    description: "5-step cold outreach sequence for new leads",
    isActive: true,
    trigger: {
      type: 'lead_status',
      conditions: {
        status: 'New',
        hasEmail: true,
      },
    },
    steps: [
      {
        id: 'step-1',
        order: 1,
        templateId: 'cold-outreach-intro',
        delay: { value: 0, unit: 'minutes' },
      },
      {
        id: 'step-2',
        order: 2,
        templateId: 'follow-up-no-response',
        delay: { value: 3, unit: 'days' },
        conditions: [
          {
            type: 'activity',
            operator: 'equals',
            value: 'no_response',
          },
        ],
      },
      {
        id: 'step-3',
        order: 3,
        templateId: 'nurture-value-content',
        delay: { value: 5, unit: 'days' },
        conditions: [
          {
            type: 'activity',
            operator: 'equals',
            value: 'no_response',
          },
        ],
      },
      {
        id: 'step-4',
        order: 4,
        templateId: 'follow-up-no-response',
        delay: { value: 7, unit: 'days' },
        conditions: [
          {
            type: 'activity',
            operator: 'equals',
            value: 'no_response',
          },
        ],
      },
      {
        id: 'step-5',
        order: 5,
        templateId: 'closing-final-attempt',
        delay: { value: 14, unit: 'days' },
        conditions: [
          {
            type: 'activity',
            operator: 'equals',
            value: 'no_response',
          },
        ],
      },
    ],
  },
  {
    name: "Qualified Lead Nurture",
    description: "Nurture sequence for qualified leads",
    isActive: true,
    trigger: {
      type: 'lead_status',
      conditions: {
        status: 'Qualified',
      },
    },
    steps: [
      {
        id: 'step-1',
        order: 1,
        templateId: 'nurture-value-content',
        delay: { value: 1, unit: 'days' },
      },
      {
        id: 'step-2',
        order: 2,
        templateId: 'proposal-follow-up',
        delay: { value: 7, unit: 'days' },
        conditions: [
          {
            type: 'lead_score',
            operator: 'greater_than',
            value: 70,
          },
        ],
      },
    ],
  },
];

export function parseEmailTemplate(template: string, variables: Record<string, string>): string {
  let parsedTemplate = template;
  
  // Replace variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    parsedTemplate = parsedTemplate.replace(regex, value || `[${key}]`);
  });
  
  return parsedTemplate;
}

export function extractVariablesFromTemplate(template: string): string[] {
  const variableRegex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

export function validateEmailTemplate(template: EmailTemplate): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!template.name.trim()) {
    errors.push("Template name is required");
  }
  
  if (!template.subject.trim()) {
    errors.push("Email subject is required");
  }
  
  if (!template.content.trim()) {
    errors.push("Email content is required");
  }
  
  // Check if all variables in content are listed in variables array
  const contentVariables = extractVariablesFromTemplate(template.content);
  const subjectVariables = extractVariablesFromTemplate(template.subject);
  const allVariables = [...contentVariables, ...subjectVariables];
  
  const missingVariables = allVariables.filter(v => !template.variables.includes(v));
  if (missingVariables.length > 0) {
    errors.push(`Missing variables in template definition: ${missingVariables.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateNextExecutionTime(delay: EmailSequenceStep['delay'], fromDate: Date = new Date()): Date {
  const nextExecution = new Date(fromDate);
  
  switch (delay.unit) {
    case 'minutes':
      nextExecution.setMinutes(nextExecution.getMinutes() + delay.value);
      break;
    case 'hours':
      nextExecution.setHours(nextExecution.getHours() + delay.value);
      break;
    case 'days':
      nextExecution.setDate(nextExecution.getDate() + delay.value);
      break;
    case 'weeks':
      nextExecution.setDate(nextExecution.getDate() + (delay.value * 7));
      break;
  }
  
  return nextExecution;
}





