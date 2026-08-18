import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Trash2,
  Settings,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { InboxNotification } from "../../features/notifications/types/notification";
import { color, tw, zIndexTokens } from "../utils/utils";
import { useLanguage } from "../../contexts/LanguageContext";
import DateFormatter from "./DateFormatter";

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
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") {
      return !notif.is_read;
    }
    return true;
  });

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px for mt-2, using viewport coordinates for fixed positioning
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener("mousedown", handleClickOutside);
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isOpen, onClose, updateDropdownPosition]);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
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
    [markAsRead],
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
    [deleteNotification],
  );

  const handleNotificationClick = useCallback(
    async (notification: InboxNotification) => {
      if (!notification.is_read) {
        await markAsRead([notification.id]);
      }

      let route: string | null = null;

      if (notification.notification_action?.match(/^\/[\w-]+\/?(\/([\w-]+))?$/)) {
        // If action has an ID (e.g., /offers/123), use it as-is
        if (notification.notification_action.match(/\/[\w-]+$/)) {
          route = `/dashboard${notification.notification_action}`;
        }
        // If action is just /entity-type/ (no ID) but payload has id, construct full route
        else if (notification.payload?.id) {
          const entityType = notification.notification_action.match(/^\/(\w+)/)?.[1];
          route = `/dashboard/${entityType}/${notification.payload.id}`;
        }
      }

      if (route) {
        setIsOpen(false);
        navigate(route);
      }
    },
    [markAsRead, navigate],
  );

  const unreadCount = stats?.unread || 0;
  const displayNotifications = filteredNotifications.slice(0, 4);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ zIndex: zIndexTokens.header + 200 }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 text-white/90 hover:text-white ${tw.rounded} transition-colors`}
        title={t.notifications.dropdownTitle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Portaled outside header */}
      {isOpen &&
        createPortal(
          <div
            ref={containerRef}
            className={`fixed w-96 bg-white dark:bg-[#394247] ${tw.rounded} shadow-xl border border-gray-200 dark:border-gray-700 max-h-[600px] flex flex-col`}
            style={{
              zIndex: zIndexTokens.notificationDropdown,
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 dark:bg-[#394247]">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t.notifications.dropdownTitle}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {t.notifications.dropdownNew.replace(
                      "{count}",
                      unreadCount.toString(),
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
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t.notifications.dropdownMarkAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/dashboard/notification-settings");
                  }}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={t.notifications.dropdownViewAll}
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  filter === "all"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t.notifications.dropdownAll}
                {filter === "all" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color.primary.accent }}
                  />
                )}
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                  filter === "unread"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t.notifications.dropdownUnread}
                {filter === "unread" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color.primary.accent }}
                  />
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {t.notifications.dropdownLoading}
                  </p>
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {filter === "unread"
                      ? t.notifications.dropdownNoUnread
                      : t.notifications.dropdownNoNotifications}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {filter === "unread"
                      ? t.notifications.dropdownAllCaughtUp
                      : t.notifications.dropdownNoNotificationsYet}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {displayNotifications.map((notification) => {
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer dark:bg-[#394247]`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    !notification.is_read
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  <DateFormatter
                                    date={notification.created_at}
                                    useUserTimezone
                                    includeTime
                                  />
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: color.primary.accent }}></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col gap-1">
                            {!notification.is_read && (
                              <button
                                onClick={(e) =>
                                  handleMarkAsRead(notification.id, e)
                                }
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title={t.notifications.markAllAsRead}
                              ></button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-1 icon-delete rounded transition-colors"
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
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 dark:bg-[#394247]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/dashboard/notifications");
                  }}
                  className="w-full text-center text-sm font-medium py-2 rounded transition-colors"
                  style={{ color: color.primary.accent }}
                >
                  {t.notifications.dropdownViewAllNotifications}
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
