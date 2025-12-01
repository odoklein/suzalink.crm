"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  X,
  Loader2,
  Ticket,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  PhoneCall,
  UserPlus,
  CheckCircle,
  Info,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { 
  Notification, 
  groupNotificationsByDate 
} from "@/lib/notifications";

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

type FilterType = 'All' | 'Lead' | 'Task' | 'Email' | 'System';

const filterLabels: Record<FilterType, string> = {
  All: 'Tout',
  Lead: 'Prospects',
  Task: 'Tâches',
  Email: 'Emails',
  System: 'Système',
};

// Enhanced icon mapping with proper Lucide icons and colors
const getNotificationIconConfig = (type: Notification['type']) => {
  switch (type) {
    case 'lead_assigned':
    case 'lead_qualified':
      return { 
        Icon: Ticket, 
        bgColor: 'bg-[#1A6BFF]/10', 
        iconColor: 'text-[#1A6BFF]' 
      };
    case 'task_due':
      return { 
        Icon: Calendar, 
        bgColor: 'bg-[#FFAA00]/10', 
        iconColor: 'text-[#FFAA00]' 
      };
    case 'email_opened':
    case 'sequence_completed':
      return { 
        Icon: Mail, 
        bgColor: 'bg-[#1A6BFF]/10', 
        iconColor: 'text-[#1A6BFF]' 
      };
    case 'call_missed':
      return { 
        Icon: Phone, 
        bgColor: 'bg-[#00D985]/10', 
        iconColor: 'text-[#00D985]' 
      };
    default:
      return { 
        Icon: Bell, 
        bgColor: 'bg-gray-100', 
        iconColor: 'text-gray-600' 
      };
  }
};

// Filter notifications by type
const filterNotifications = (notifications: Notification[], filter: FilterType): Notification[] => {
  if (filter === 'All') return notifications;
  
  const typeMap: Record<FilterType, Notification['type'][]> = {
    All: [],
    Lead: ['lead_assigned', 'lead_qualified'],
    Task: ['task_due'],
    Email: ['email_opened', 'sequence_completed'],
    System: ['system', 'call_missed']
  };
  
  return notifications.filter(n => typeMap[filter].includes(n.type));
};

// Format time as "10:04 am" style
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<NotificationResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "mark_read",
          notificationIds: [notificationId]
        }),
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<NotificationResponse>(["notifications"]);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<NotificationResponse>(["notifications"], {
          ...previousData,
          notifications: previousData.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        });
      }

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Filter notifications based on active filter
  const filteredNotifications = filterNotifications(notifications, activeFilter);
  
  // Group filtered notifications by date
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  
  // Sort date groups: Aujourd'hui, Hier, then specific dates, then Plus ancien
  const sortedDateGroups = Object.keys(groupedNotifications).sort((a, b) => {
    const order: Record<string, number> = { "Aujourd'hui": 0, 'Hier': 1, 'Plus ancien': 999 };
    if (order[a] !== undefined && order[b] !== undefined) {
      return order[a] - order[b];
    }
    if (order[a] !== undefined) return -1;
    if (order[b] !== undefined) return 1;
    // For specific dates, sort by date (newest first)
    return new Date(groupedNotifications[b][0]?.createdAt || 0).getTime() - 
           new Date(groupedNotifications[a][0]?.createdAt || 0).getTime();
  });

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filterTabs: FilterType[] = ['All', 'Lead', 'Task', 'Email', 'System'];

  return (
    <>
      {/* Trigger Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.35)] z-40 transition-opacity duration-[320ms] ease-[cubic-bezier(0.24,0.8,0.32,1)]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Container */}
      <div
        className={`fixed top-6 right-6 z-50 bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] max-w-[400px] w-[calc(100vw-48px)] max-h-[calc(100vh-48px)] flex flex-col transition-all duration-[320ms] ease-[cubic-bezier(0.24,0.8,0.32,1)] ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-[-10px] scale-95 pointer-events-none'
        }`}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-[20px] font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          {filterTabs.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-[#E7F0FF] text-[#0F4FCC] font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterLabels[filter]}
            </button>
          ))}
        </div>

        {/* Mark All Read Link */}
        {filteredNotifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end px-6 pt-3 pb-2 flex-shrink-0">
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              className="text-sm font-medium text-[#FF6B4A] hover:text-[#CC543A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllReadMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Marquage...
                </span>
              ) : (
                'Tout marquer comme lu'
              )}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#1A6BFF]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-500">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDateGroups.map((dateGroup) => (
                <div key={dateGroup} className="space-y-3">
                  {/* Date Header */}
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {dateGroup}
                  </div>
                  
                  {/* Notifications in this date group */}
                  <div className="space-y-0">
                    {groupedNotifications[dateGroup].map((notification) => {
                      const { Icon, bgColor, iconColor } = getNotificationIconConfig(notification.type);
                      const content = (
                        <>
                          {/* Icon Container */}
                          <div className={`flex justify-center items-center shrink-0 size-10 rounded-full ${bgColor}`}>
                            <Icon className={`inline-flex size-5 ${iconColor}`} strokeWidth={2} />
                          </div>
                          
                          {/* Content Block */}
                          <div className="grow min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <div className="grow">
                                <div className="font-semibold text-sm text-gray-900 mb-0.5">
                                  {notification.title}
                                </div>
                                <div className="text-sm text-gray-700 leading-5">
                                  {notification.message}
                                </div>
                              </div>
                              {!notification.isRead && (
                                <div className="shrink-0 mt-1.5 size-2 rounded-full bg-[#EF4444]"></div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </div>
                          </div>
                        </>
                      );

                      return notification.actionUrl ? (
                        <Link
                          key={notification.id}
                          href={notification.actionUrl}
                          className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer rounded-md px-2 -mx-2"
                          onClick={() => {
                            handleNotificationClick(notification);
                            setIsOpen(false);
                          }}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          key={notification.id}
                          className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors rounded-md px-2 -mx-2 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <Link href="/notifications">
              <Button 
                size="sm"
                className="h-10 rounded-lg text-sm font-semibold bg-[#1A6BFF] hover:bg-[#0F4FCC] text-white"
                onClick={() => setIsOpen(false)}
              >
                Voir toutes les notifications
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
