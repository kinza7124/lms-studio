'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, GraduationCap, Megaphone, Clock, FileText, ClipboardList, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Notification = {
  notification_id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
      if (isOpen) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications?limit=20');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.notification_id);
    
    // Navigate based on notification type
    if (notification.related_type === 'assignment' && notification.related_id) {
      router.push(`/student/assignments/${notification.related_id}`);
    } else if (notification.related_type === 'announcement' && notification.related_id) {
      // Find course ID from announcement
      router.push(`/course/${notification.related_id}`);
    } else if (notification.type === 'grade') {
      router.push('/dashboard');
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return GraduationCap;
      case 'announcement':
        return Megaphone;
      case 'deadline':
        return Clock;
      case 'assignment':
        return FileText;
      case 'quiz':
        return ClipboardList;
      case 'assessment':
        return BarChart3;
      default:
        return Bell;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[600px] overflow-hidden">
          <Card className="overflow-hidden bg-white/95 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[15px]">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 px-2.5 text-xs text-primary hover:bg-primary/5"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y divide-border/70">
                    {notifications.map((notification) => (
                      <div
                        key={notification.notification_id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer hover:bg-secondary/60 transition-colors ${
                          !notification.read ? 'bg-primary/[0.03]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {(() => {
                            const Icon = getNotificationIcon(notification.type);
                            return (
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </span>
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-foreground truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-primary shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

