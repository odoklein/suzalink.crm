export interface Notification {
  id: string;
  userId: string;
  type: 'lead_assigned' | 'lead_qualified' | 'email_opened' | 'call_missed' | 'task_due' | 'sequence_completed' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ActivityFeedItem {
  id: string;
  type: 'lead_created' | 'lead_updated' | 'email_sent' | 'call_made' | 'note_added' | 'status_changed' | 'campaign_created';
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  target?: {
    id: string;
    type: 'lead' | 'campaign' | 'account';
    name: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const NOTIFICATION_TYPES = {
  lead_assigned: {
    icon: '👤',
    color: 'blue',
    title: 'Lead Assigned',
  },
  lead_qualified: {
    icon: '⭐',
    color: 'green',
    title: 'Lead Qualified',
  },
  email_opened: {
    icon: '📧',
    color: 'blue',
    title: 'Email Opened',
  },
  call_missed: {
    icon: '📞',
    color: 'red',
    title: 'Missed Call',
  },
  task_due: {
    icon: '⏰',
    color: 'orange',
    title: 'Task Due',
  },
  sequence_completed: {
    icon: '✅',
    color: 'green',
    title: 'Sequence Completed',
  },
  system: {
    icon: '🔔',
    color: 'gray',
    title: 'System Notification',
  },
};

export const ACTIVITY_TYPES = {
  lead_created: {
    icon: '👤',
    color: 'blue',
    template: '{actor} created lead {target}',
  },
  lead_updated: {
    icon: '✏️',
    color: 'gray',
    template: '{actor} updated lead {target}',
  },
  email_sent: {
    icon: '📧',
    color: 'blue',
    template: '{actor} sent email to {target}',
  },
  call_made: {
    icon: '📞',
    color: 'green',
    template: '{actor} called {target}',
  },
  note_added: {
    icon: '📝',
    color: 'gray',
    template: '{actor} added note to {target}',
  },
  status_changed: {
    icon: '🔄',
    color: 'orange',
    template: '{actor} changed status of {target}',
  },
  campaign_created: {
    icon: '📢',
    color: 'purple',
    template: '{actor} created campaign {target}',
  },
};

export function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  options: {
    data?: Record<string, any>;
    priority?: Notification['priority'];
    actionUrl?: string;
    actionLabel?: string;
  } = {}
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    data: options.data,
    isRead: false,
    priority: options.priority || 'medium',
    createdAt: new Date().toISOString(),
    actionUrl: options.actionUrl,
    actionLabel: options.actionLabel,
  };
}

export function createActivityFeedItem(
  type: ActivityFeedItem['type'],
  actor: ActivityFeedItem['actor'],
  action: string,
  description: string,
  options: {
    target?: ActivityFeedItem['target'];
    metadata?: Record<string, any>;
  } = {}
): ActivityFeedItem {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    actor,
    target: options.target,
    action,
    description,
    metadata: options.metadata,
    createdAt: new Date().toISOString(),
  };
}

export function formatActivityDescription(item: ActivityFeedItem): string {
  const activityType = ACTIVITY_TYPES[item.type];
  if (!activityType) return item.description;

  let formatted = activityType.template;
  formatted = formatted.replace('{actor}', item.actor.name);
  
  if (item.target) {
    formatted = formatted.replace('{target}', item.target.name);
  }

  return formatted;
}

export function getNotificationIcon(type: Notification['type']): string {
  return NOTIFICATION_TYPES[type]?.icon || '🔔';
}

export function getNotificationColor(type: Notification['type']): string {
  return NOTIFICATION_TYPES[type]?.color || 'gray';
}

export function getActivityIcon(type: ActivityFeedItem['type']): string {
  return ACTIVITY_TYPES[type]?.icon || '📝';
}

export function getActivityColor(type: ActivityFeedItem['type']): string {
  return ACTIVITY_TYPES[type]?.color || 'gray';
}

export function getPriorityColor(priority: Notification['priority']): string {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function sortNotificationsByPriority(notifications: Notification[]): Notification[] {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  
  return notifications.sort((a, b) => {
    // First sort by read status (unread first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    
    // Then by priority
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const notificationDate = new Date(date);
    notificationDate.setHours(0, 0, 0, 0);
    
    let groupKey: string;
    
    if (notificationDate.getTime() === today.getTime()) {
      groupKey = 'Today';
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday';
    } else if (date.getTime() > sevenDaysAgo.getTime()) {
      // Format as "24 May" style
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      groupKey = `${day} ${month}`;
    } else {
      groupKey = 'Earlier';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  return groups;
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead).length;
}

// Mock notification generators for demo purposes
export function generateMockNotifications(userId: string, count: number = 10): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();
  
  const mockData = [
    {
      type: 'lead_qualified' as const,
      title: 'New Qualified Lead',
      message: 'John Doe from Acme Corp has been qualified',
      priority: 'high' as const,
      actionUrl: '/leads/123',
      actionLabel: 'View Lead',
    },
    {
      type: 'email_opened' as const,
      title: 'Email Opened',
      message: 'Your email to Jane Smith was opened',
      priority: 'medium' as const,
    },
    {
      type: 'task_due' as const,
      title: 'Task Due Soon',
      message: 'Follow up with Mike Johnson is due in 1 hour',
      priority: 'urgent' as const,
      actionUrl: '/tasks/456',
      actionLabel: 'View Task',
    },
    {
      type: 'call_missed' as const,
      title: 'Missed Call',
      message: 'Missed call from Sarah Wilson at 2:30 PM',
      priority: 'high' as const,
    },
    {
      type: 'sequence_completed' as const,
      title: 'Email Sequence Completed',
      message: 'Cold outreach sequence for Bob Davis has completed',
      priority: 'low' as const,
    },
  ];
  
  for (let i = 0; i < count; i++) {
    const template = mockData[i % mockData.length];
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    notifications.push({
      id: `notif-${i}`,
      userId,
      type: template.type,
      title: template.title,
      message: template.message,
      isRead: Math.random() > 0.6, // 40% chance of being unread
      priority: template.priority,
      createdAt: createdAt.toISOString(),
      actionUrl: template.actionUrl,
      actionLabel: template.actionLabel,
    });
  }
  
  return sortNotificationsByPriority(notifications);
}

export function generateMockActivityFeed(count: number = 20): ActivityFeedItem[] {
  const activities: ActivityFeedItem[] = [];
  const now = new Date();
  
  const mockActors = [
    { id: '1', name: 'John Smith', email: 'john@company.com' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com' },
    { id: '3', name: 'Mike Davis', email: 'mike@company.com' },
  ];
  
  const mockTargets = [
    { id: '1', type: 'lead' as const, name: 'Acme Corp Lead' },
    { id: '2', type: 'lead' as const, name: 'TechStart Lead' },
    { id: '3', type: 'campaign' as const, name: 'Q4 Outreach Campaign' },
  ];
  
  const mockActivities = [
    { type: 'lead_created' as const, action: 'created', description: 'Created new lead' },
    { type: 'email_sent' as const, action: 'sent email', description: 'Sent follow-up email' },
    { type: 'call_made' as const, action: 'made call', description: 'Called prospect' },
    { type: 'note_added' as const, action: 'added note', description: 'Added meeting notes' },
    { type: 'status_changed' as const, action: 'updated status', description: 'Changed lead status to Qualified' },
  ];
  
  for (let i = 0; i < count; i++) {
    const actor = mockActors[Math.floor(Math.random() * mockActors.length)];
    const target = mockTargets[Math.floor(Math.random() * mockTargets.length)];
    const activity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    activities.push({
      id: `activity-${i}`,
      type: activity.type,
      actor,
      target,
      action: activity.action,
      description: activity.description,
      createdAt: createdAt.toISOString(),
    });
  }
  
  return activities.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}





