import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Trash2,
  ExternalLink,
  Settings,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { Notification } from "../../features/notifications/types/notification";
import { color, tw } from "../utils/utils";
import { useLanguage } from "../../contexts/LanguageContext";

interface NotificationDropdownProps {
  onClose?: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead: markAllAsReadContext,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") {
      return !notif.isRead;
    }
    return true;
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      refreshNotifications({ pageSize: 10 });
    }
  }, [isOpen, refreshNotifications]);

  const handleMarkAsRead = useCallback(
    async (id: string | number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      try {
        await markAsRead([id]);
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    },
    [markAsRead]
  );

  const handleDelete = useCallback(
    async (id: string | number, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await deleteNotification(id);
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },
    [deleteNotification]
  );

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) {
        markAsRead([notification.id]);
      }
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
        setIsOpen(false);
        onClose?.();
      }
    },
    [navigate, markAsRead, onClose]
  );

  const unreadCount = stats?.unread || 0;
  const displayNotifications = filteredNotifications.slice(0, 10);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-white/90 hover:text-white rounded-md transition-colors"
        title={t.notifications.dropdownTitle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {t.notifications.dropdownTitle}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  {t.notifications.dropdownNew.replace(
                    "{count}",
                    unreadCount.toString()
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {filteredNotifications.length > 0 && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await markAllAsReadContext();
                    } catch (err) {
                      console.error("Failed to mark all as read:", err);
                    }
                  }}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title={t.notifications.dropdownMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/notifications");
                }}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title={t.notifications.dropdownViewAll}
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setFilter("unread")}
              style={{
                borderBottomColor:
                  filter === "unread" ? color.primary.accent : "transparent",
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === "unread"
                  ? "text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.notifications.dropdownUnread}
            </button>
            <button
              onClick={() => setFilter("all")}
              style={{
                borderBottomColor:
                  filter === "all" ? color.primary.accent : "transparent",
              }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === "all"
                  ? "text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.notifications.dropdownAll}
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-600">
                  {t.notifications.dropdownLoading}
                </p>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {filter === "unread"
                    ? t.notifications.dropdownNoUnread
                    : t.notifications.dropdownNoNotifications}
                </p>
                <p className="text-xs text-gray-600">
                  {filter === "unread"
                    ? t.notifications.dropdownAllCaughtUp
                    : t.notifications.dropdownNoNotificationsYet}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayNotifications.map((notification) => {
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  !notification.isRead
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          {notification.actionUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <ExternalLink className={`h-3 w-3 ${tw.link}`} />
                              <span className={`text-sm ${tw.link}`}>
                                {notification.actionLabel ||
                                  t.notifications.viewDetails}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex flex-col gap-1">
                          {!notification.isRead && (
                            <button
                              onClick={(e) =>
                                handleMarkAsRead(notification.id, e)
                              }
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={t.notifications.markAllAsRead}
                            ></button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title={t.notifications.bulkDelete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/dashboard/notifications");
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
              >
                {t.notifications.dropdownViewAllNotifications}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
