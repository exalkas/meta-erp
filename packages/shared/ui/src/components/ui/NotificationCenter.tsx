import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  Mail,
} from "lucide-react";
import { Button } from "./Button";

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read?: boolean;
  persistent?: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "destructive";
  }[];
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDelete?: (id: string) => void;
  onClearAll?: () => void;
  onMarkAllAsRead?: () => void;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationRead,
  onNotificationDelete,
  onClearAll,
  onMarkAllAsRead,
  className = "",
  maxHeight = "max-h-96",
  showHeader = true,
  showActions = true,
  emptyMessage = "No notifications",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onNotificationRead) {
      onNotificationRead(notification.id);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNotificationDelete) {
      onNotificationDelete(id);
    }
  };

  const handleToggleRead = (
    notification: Notification,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (onNotificationRead) {
      onNotificationRead(notification.id);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    const iconClasses = "w-4 h-4 flex-shrink-0";
    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case "warning":
        return <AlertCircle className={`${iconClasses} text-amber-500`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-red-500`} />;
      default:
        return <Info className={`${iconClasses} text-blue-500`} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          {showHeader && (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action buttons */}
              {showActions && notifications.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {unreadCount > 0 && onMarkAllAsRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMarkAllAsRead}
                      className="text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                  {onClearAll && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearAll}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notifications List */}
          <div className={`${maxHeight} overflow-y-auto`}>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>{emptyMessage}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {getIcon(notification.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {notification.title && (
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 ml-2">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </div>

                      {notification.actions && (
                        <div className="flex space-x-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant || "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                              }}
                              className="text-xs"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-1">
                      {onNotificationRead && (
                        <button
                          onClick={(e) => handleToggleRead(notification, e)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                          aria-label={
                            notification.read
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                        >
                          <Mail size={14} />
                        </button>
                      )}

                      {onNotificationDelete && (
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                          aria-label="Delete notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
