import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import moment from "moment";

export default function NotificationPanel({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Subscribe to real-time notifications
      const unsubscribe = base44.entities.Notification.subscribe((event) => {
        if (event.type === 'create' && event.data.user_email === user.email) {
          setNotifications(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
        } else if (event.type === 'delete') {
          setNotifications(prev => prev.filter(n => n.id !== event.id));
        }
      });
      return unsubscribe;
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await base44.entities.Notification.filter(
      { user_email: user.email },
      "-created_date",
      50
    );
    setNotifications(data);
    setIsLoading(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(
      unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
    );
    loadNotifications();
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    const icons = {
      task_assigned: "📋",
      stage_change: "🔄",
      payment_received: "💰",
      deadline_approaching: "⏰",
      project_assigned: "📁",
      comment: "💬",
      other: "🔔"
    };
    return icons[type] || icons.other;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border z-50">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {moment(notification.created_date).fromNow()}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => deleteNotification(notification.id, e)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}