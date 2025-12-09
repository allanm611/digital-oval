import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, Filter, X, ExternalLink, Search } from "lucide-react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { notificationService } from "../services/notificationService";
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from "../types/notification";
import { NOTIFICATION_TYPE_METADATA } from "../types/notification";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    notifications,
    stats,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
    deleteAllRead,
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<
    (string | number)[]
  >([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "mark-read" | "delete" | null
  >(null);
  const [filter, setFilter] = useState<{
    type?: NotificationType;
    priority?: NotificationPriority;
    isRead?: boolean;
    search?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Refresh notifications and get pagination
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({
          page,
          pageSize,
          ...filter,
        });
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
        } else {
          // Fallback: calculate from notifications length
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setTotalPages(1);
      }
    };
    loadNotifications();
    refreshNotifications({
      page,
      pageSize,
      ...filter,
    });
  }, [page, filter, refreshNotifications, pageSize]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter.type && notif.type !== filter.type) return false;
    if (filter.priority && notif.priority !== filter.priority) return false;
    if (filter.isRead !== undefined && notif.isRead !== filter.isRead)
      return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        notif.title.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSelectNotification = (id: string | number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await markAsRead(selectedNotifications);
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      await deleteNotifications(selectedNotifications);
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Failed to delete notifications:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const notificationTypes = Object.keys(
    NOTIFICATION_TYPE_METADATA
  ) as NotificationType[];
  const priorities: NotificationPriority[] = [
    "low",
    "medium",
    "high",
    "urgent",
  ];

  const priorityLabel = (priority: NotificationPriority) =>
    t.notifications.priority[priority] || priority;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary} mb-2`}>
              {t.notifications.title}
            </h1>
            {stats && (
              <p className={`${tw.textSecondary} text-sm`}>
                {stats.total} {t.notifications.totalLabel} • {stats.unread}{" "}
                {t.notifications.unreadLabel}
              </p>
            )}
          </div>
          {filteredNotifications.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    if (!bulkMode) {
                      // Enable bulk mode and select all unread notifications
                      const unreadIds = filteredNotifications
                        .filter((n) => !n.isRead)
                        .map((n) => n.id);
                      setSelectedNotifications(unreadIds);
                      setBulkActionType("mark-read");
                      setBulkMode(true);
                    } else {
                      // If already in bulk mode, execute the action
                      if (selectedNotifications.length > 0) {
                        await markAsRead(selectedNotifications);
                        setBulkMode(false);
                        setBulkActionType(null);
                        setSelectedNotifications([]);
                      }
                    }
                  } catch (err) {
                    console.error("Failed to mark all as read:", err);
                  }
                }}
                className={`${tw.button} text-sm px-4 py-2`}
              >
                {t.notifications.markAllAsRead}
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!bulkMode) {
                      // Enable bulk mode and select all notifications
                      const allIds = filteredNotifications.map((n) => n.id);
                      setSelectedNotifications(allIds);
                      setBulkActionType("delete");
                      setBulkMode(true);
                    } else {
                      // If already in bulk mode, execute the action
                      if (selectedNotifications.length > 0) {
                        await deleteNotifications(selectedNotifications);
                        setBulkMode(false);
                        setBulkActionType(null);
                        setSelectedNotifications([]);
                      }
                    }
                  } catch (err) {
                    console.error("Failed to delete notifications:", err);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 rounded-md cursor-pointer"
              >
                {t.notifications.deleteAll}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.notifications.searchPlaceholder}
              value={filter.search || ""}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <HeadlessSelect
            value={filter.type || ""}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                type: value ? (value as NotificationType) : undefined,
              }))
            }
            options={[
              { label: t.notifications.typeAll, value: "" },
              ...notificationTypes.map((type) => ({
                label: NOTIFICATION_TYPE_METADATA[type].label,
                value: type,
              })),
            ]}
            placeholder={t.notifications.typeAll}
            className="w-full"
          />

          {/* Priority Filter */}
          <HeadlessSelect
            value={filter.priority || ""}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                priority: value ? (value as NotificationPriority) : undefined,
              }))
            }
            options={[
              { label: t.notifications.priorityAll, value: "" },
              ...priorities.map((priority) => ({
                label: priorityLabel(priority),
                value: priority,
              })),
            ]}
            placeholder={t.notifications.priorityAll}
            className="w-full"
          />

          {/* Read Status Filter */}
          <HeadlessSelect
            value={
              filter.isRead === undefined
                ? ""
                : filter.isRead
                ? "read"
                : "unread"
            }
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                isRead: value === "" ? undefined : value === "read",
              }))
            }
            options={[
              { label: t.notifications.statusAll, value: "" },
              { label: t.notifications.statusUnread, value: "unread" },
              { label: t.notifications.statusRead, value: "read" },
            ]}
            placeholder={t.notifications.statusAll}
            className="w-full"
          />
        </div>

        {/* Clear Filters */}
        {(filter.type ||
          filter.priority !== undefined ||
          filter.isRead !== undefined ||
          filter.search) && (
          <button
            onClick={() => setFilter({})}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            {t.notifications.clearFilters}
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {bulkMode && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-gray-900 hover:text-gray-700 font-medium text-left sm:text-center"
            >
              {selectedNotifications.length === filteredNotifications.length
                ? t.notifications.deselectAll
                : t.notifications.selectAll}
            </button>
            <span className="text-sm font-medium text-gray-900">
              {selectedNotifications.length > 0
                ? t.notifications.selectedCount.replace(
                    "{count}",
                    String(selectedNotifications.length)
                  )
                : t.notifications.selectPrompt}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {selectedNotifications.length > 0 && (
              <>
                {bulkActionType === "mark-read" && (
                  <button
                    onClick={handleMarkSelectedAsRead}
                    className={`${tw.button} text-sm px-4 py-2`}
                  >
                    {t.notifications.bulkMarkAsRead}
                  </button>
                )}
                {bulkActionType === "delete" && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 rounded-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.notifications.bulkDelete}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                setBulkMode(false);
                setBulkActionType(null);
                setSelectedNotifications([]);
              }}
              style={{
                borderColor: color.primary.action,
                color: color.primary.action,
              }}
              className={`${tw.borderedButton} text-sm px-4 py-2`}
            >
              {t.notifications.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isLoading && filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">
              {t.notifications.loadingNotifications}
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {t.notifications.emptyTitle}
            </p>
            <p className="text-sm text-gray-600">
              {Object.keys(filter).length > 0
                ? t.notifications.emptyFiltered
                : t.notifications.emptyNoData}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const metadata =
                  NOTIFICATION_TYPE_METADATA[notification.type] ||
                  NOTIFICATION_TYPE_METADATA.general;
                const isSelected = selectedNotifications.includes(
                  notification.id
                );

                return (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleSelectNotification(notification.id)
                          }
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                      )}
                      <div
                        onClick={() =>
                          !bulkMode && handleNotificationClick(notification)
                        }
                        className={`flex-1 min-w-0 ${
                          !bulkMode ? "cursor-pointer" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3
                                  className={`text-sm font-semibold ${
                                    !notification.isRead
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                    notification.priority === "urgent"
                                      ? "bg-red-100 text-red-700"
                                      : notification.priority === "high"
                                      ? "bg-orange-100 text-orange-700"
                                      : notification.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {priorityLabel(notification.priority)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 break-words">
                                {notification.message}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                <span className="whitespace-nowrap">
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleString()}
                                </span>
                                <span className="text-gray-400">
                                  {metadata.label}
                                </span>
                                {notification.actionUrl && (
                                  <span
                                    className={`flex items-center gap-1 text-sm ${tw.link}`}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {notification.actionLabel ||
                                      t.notifications.viewDetails}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!bulkMode && (
                            <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-auto">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await markAsRead([notification.id]);
                                }}
                                style={{
                                  borderColor: color.primary.action,
                                  color: color.primary.action,
                                }}
                                className={`${tw.borderedButton} text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap`}
                                title={t.notifications.bulkMarkAsRead}
                              >
                                {t.notifications.bulkMarkAsRead}
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await deleteNotification(notification.id);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                title={t.notifications.bulkDelete}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.notifications.previous}
                </button>
                <span className="text-sm text-gray-600">
                  {t.notifications.pageOf
                    .replace("{page}", String(page))
                    .replace("{total}", String(totalPages))}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.notifications.next}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
