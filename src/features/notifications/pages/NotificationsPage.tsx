import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, X, ExternalLink, Search } from "lucide-react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { InboxNotification } from "../types/notification";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";

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
    deleteNotification,
    deleteNotifications,
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<
    (string | number)[]
  >([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "mark-read" | "delete" | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");

  // Refresh notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (readFilter === "read" && !notif.is_read) return false;
    if (readFilter === "unread" && notif.is_read) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notif.title.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleSelectNotification = (id: string | number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id],
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

  const handleNotificationClick = async (notification: InboxNotification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
  };


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
                className={`bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 ${tw.rounded} cursor-pointer`}
              >
                {t.notifications.deleteAll}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.notifications.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-5 py-3 bg-white border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Read Status Filter */}
          <HeadlessSelect
            value={readFilter}
            onChange={(value) => setReadFilter(value as "all" | "read" | "unread")}
            options={[
              { label: t.notifications.statusAll, value: "all" },
              { label: t.notifications.statusUnread, value: "unread" },
              { label: t.notifications.statusRead, value: "read" },
            ]}
            placeholder={t.notifications.statusAll}
            className="w-full"
          />
        </div>

        {/* Clear Filters */}
        {(searchTerm || readFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setReadFilter("all");
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            {t.notifications.clearFilters}
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {bulkMode && (
        <div
          className={`${tw.rounded} px-4 py-3 mb-4 bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
        >
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
                    String(selectedNotifications.length),
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
                    className={`bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 ${tw.rounded} cursor-pointer flex items-center justify-center gap-2`}
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
      <div
        className={`bg-white ${tw.rounded} border border-gray-200 overflow-hidden`}
      >
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
              {searchTerm || readFilter !== "all"
                ? t.notifications.emptyFiltered
                : t.notifications.emptyNoData}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const isSelected = selectedNotifications.includes(
                  notification.id,
                );

                return (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {bulkMode && (
                        <Checkbox
                          id={`notification-${notification.id}`}
                          checked={isSelected}
                          onChange={() =>
                            handleSelectNotification(notification.id)
                          }
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
                                    !notification.is_read
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2 break-words">
                                {notification.message}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                <span className="whitespace-nowrap">
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!bulkMode && (
                            <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-auto">
                              {!notification.is_read && (
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
                              )}
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
          </>
        )}
      </div>
    </div>
  );
}
