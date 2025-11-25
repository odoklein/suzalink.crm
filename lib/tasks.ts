export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'custom';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  userId: string;
  leadId?: string;
  campaignId?: string;
  accountId?: string;
  
  // Task-specific data
  metadata?: {
    reminderSent?: boolean;
    reminderCount?: number;
    lastReminderAt?: string;
    estimatedDuration?: number; // in minutes
    actualDuration?: number; // in minutes
    notes?: string;
    outcome?: string;
  };
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  type: Task['type'];
  priority: Task['priority'];
  defaultDueDays: number; // Days from creation
  estimatedDuration: number; // in minutes
  isActive: boolean;
  
  // Auto-creation rules
  triggers: {
    leadStatusChange?: string[];
    campaignEvent?: string[];
    timeDelay?: {
      after: string; // 'lead_created', 'last_contact', etc.
      days: number;
    };
  };
  
  // Template content
  template: {
    title: string;
    description: string;
    instructions?: string;
  };
}

export interface TaskReminder {
  id: string;
  taskId: string;
  type: 'email' | 'notification' | 'sms';
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  
  // Reminder content
  subject?: string;
  message: string;
  
  // Recipient info
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export const TASK_TYPES = {
  call: {
    icon: '📞',
    label: 'Call',
    color: 'blue',
    defaultDuration: 15,
  },
  email: {
    icon: '📧',
    label: 'Email',
    color: 'green',
    defaultDuration: 10,
  },
  meeting: {
    icon: '🤝',
    label: 'Meeting',
    color: 'purple',
    defaultDuration: 60,
  },
  follow_up: {
    icon: '🔄',
    label: 'Follow Up',
    color: 'orange',
    defaultDuration: 20,
  },
  demo: {
    icon: '🎯',
    label: 'Demo',
    color: 'indigo',
    defaultDuration: 45,
  },
  proposal: {
    icon: '📋',
    label: 'Proposal',
    color: 'teal',
    defaultDuration: 120,
  },
  custom: {
    icon: '⚡',
    label: 'Custom',
    color: 'gray',
    defaultDuration: 30,
  },
};

export const TASK_PRIORITIES = {
  low: {
    label: 'Low',
    color: 'text-gray-600 bg-gray-100',
    value: 1,
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600 bg-blue-100',
    value: 2,
  },
  high: {
    label: 'High',
    color: 'text-orange-600 bg-orange-100',
    value: 3,
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600 bg-red-100',
    value: 4,
  },
};

export const DEFAULT_TASK_TEMPLATES: Omit<TaskTemplate, 'id'>[] = [
  {
    name: 'Initial Contact Call',
    description: 'Make first contact call to new lead',
    type: 'call',
    priority: 'high',
    defaultDueDays: 1,
    estimatedDuration: 15,
    isActive: true,
    triggers: {
      leadStatusChange: ['New'],
    },
    template: {
      title: 'Initial contact call - {{leadName}}',
      description: 'Make first contact call to {{leadName}} at {{company}}',
      instructions: 'Introduce yourself, understand their needs, and qualify the lead.',
    },
  },
  {
    name: 'Follow-up Email',
    description: 'Send follow-up email after initial contact',
    type: 'email',
    priority: 'medium',
    defaultDueDays: 2,
    estimatedDuration: 10,
    isActive: true,
    triggers: {
      leadStatusChange: ['Contacted'],
    },
    template: {
      title: 'Follow-up email - {{leadName}}',
      description: 'Send follow-up email to {{leadName}} after initial contact',
      instructions: 'Thank them for their time, provide additional information, and suggest next steps.',
    },
  },
  {
    name: 'Demo Scheduling',
    description: 'Schedule product demo for qualified lead',
    type: 'demo',
    priority: 'high',
    defaultDueDays: 3,
    estimatedDuration: 45,
    isActive: true,
    triggers: {
      leadStatusChange: ['Qualified'],
    },
    template: {
      title: 'Schedule demo - {{leadName}}',
      description: 'Schedule product demo for {{leadName}} at {{company}}',
      instructions: 'Prepare demo materials, confirm requirements, and schedule at convenient time.',
    },
  },
  {
    name: 'Proposal Follow-up',
    description: 'Follow up on sent proposal',
    type: 'follow_up',
    priority: 'high',
    defaultDueDays: 7,
    estimatedDuration: 20,
    isActive: true,
    triggers: {
      timeDelay: {
        after: 'proposal_sent',
        days: 7,
      },
    },
    template: {
      title: 'Proposal follow-up - {{leadName}}',
      description: 'Follow up on proposal sent to {{leadName}}',
      instructions: 'Check if they have questions, address concerns, and discuss next steps.',
    },
  },
  {
    name: 'Nurture Check-in',
    description: 'Regular check-in for nurture leads',
    type: 'call',
    priority: 'low',
    defaultDueDays: 30,
    estimatedDuration: 10,
    isActive: true,
    triggers: {
      leadStatusChange: ['Nurture'],
      timeDelay: {
        after: 'last_contact',
        days: 30,
      },
    },
    template: {
      title: 'Nurture check-in - {{leadName}}',
      description: 'Regular check-in call with {{leadName}}',
      instructions: 'Check on their current situation, provide value, and maintain relationship.',
    },
  },
];

export function createTask(
  userId: string,
  data: Partial<Task> & { title: string; type: Task['type']; dueDate: string }
): Task {
  const now = new Date().toISOString();
  
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: '',
    status: 'pending',
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
    userId,
    metadata: {},
    ...data,
  };
}

export function createTaskFromTemplate(
  template: TaskTemplate,
  userId: string,
  context: {
    leadId?: string;
    campaignId?: string;
    accountId?: string;
    leadName?: string;
    company?: string;
  }
): Task {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + template.defaultDueDays);
  
  // Replace template variables
  const title = template.template.title
    .replace('{{leadName}}', context.leadName || 'Lead')
    .replace('{{company}}', context.company || 'Company');
    
  const description = template.template.description
    .replace('{{leadName}}', context.leadName || 'Lead')
    .replace('{{company}}', context.company || 'Company');

  return createTask(userId, {
    title,
    description,
    type: template.type,
    priority: template.priority,
    dueDate: dueDate.toISOString(),
    leadId: context.leadId,
    campaignId: context.campaignId,
    accountId: context.accountId,
    metadata: {
      estimatedDuration: template.estimatedDuration,
      notes: template.template.instructions,
    },
  });
}

export function getTaskStatus(task: Task): Task['status'] {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return task.status;
  }
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  if (dueDate < now && task.status !== 'completed') {
    return 'overdue';
  }
  
  return task.status;
}

export function getTaskPriorityScore(task: Task): number {
  const priorityScore = TASK_PRIORITIES[task.priority].value;
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Increase priority as due date approaches
  let urgencyMultiplier = 1;
  if (hoursUntilDue < 0) {
    urgencyMultiplier = 3; // Overdue
  } else if (hoursUntilDue < 24) {
    urgencyMultiplier = 2; // Due today
  } else if (hoursUntilDue < 48) {
    urgencyMultiplier = 1.5; // Due tomorrow
  }
  
  return priorityScore * urgencyMultiplier;
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const aScore = getTaskPriorityScore(a);
    const bScore = getTaskPriorityScore(b);
    
    if (aScore !== bScore) {
      return bScore - aScore; // Higher score first
    }
    
    // If same priority score, sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function getTasksForToday(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tasks.filter(task => {
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  
  return tasks.filter(task => {
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    
    const dueDate = new Date(task.dueDate);
    return dueDate < now;
  });
}

export function shouldCreateReminder(task: Task, reminderOffsetHours: number = 24): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return false;
  }
  
  if (task.metadata?.reminderSent) {
    return false;
  }
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const reminderTime = new Date(dueDate.getTime() - (reminderOffsetHours * 60 * 60 * 1000));
  
  return now >= reminderTime;
}

export function createTaskReminder(
  task: Task,
  recipientId: string,
  type: TaskReminder['type'] = 'notification',
  offsetHours: number = 1
): TaskReminder {
  const reminderTime = new Date(new Date(task.dueDate).getTime() - (offsetHours * 60 * 60 * 1000));
  
  return {
    id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId: task.id,
    type,
    scheduledFor: reminderTime.toISOString(),
    status: 'pending',
    retryCount: 0,
    recipientId,
    subject: `Reminder: ${task.title}`,
    message: `You have a ${task.type} task due: ${task.title}`,
  };
}

export function formatTaskDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function getTaskTypeIcon(type: Task['type']): string {
  return TASK_TYPES[type]?.icon || '⚡';
}

export function getTaskTypeColor(type: Task['type']): string {
  return TASK_TYPES[type]?.color || 'gray';
}

export function getTaskPriorityColor(priority: Task['priority']): string {
  return TASK_PRIORITIES[priority]?.color || 'text-gray-600 bg-gray-100';
}





