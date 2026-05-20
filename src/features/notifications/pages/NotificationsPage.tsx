import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, X, Settings } from "lucide-react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { InboxNotification } from "../types/notification";
import { color, tw } from "../../../shared/utils/utils";
import { buttons } from "../../../shared/utils/tokens";
import Checkbox from "../../../shared/components/ui/Checkbox";
import SearchInput from "../../../shared/components/ui/SearchInput";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";

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
  const [loadingMarkAllRead, setLoadingMarkAllRead] = useState(false);
  const [loadingDeleteAll, setLoadingDeleteAll] = useState(false);
  const [loadingBulkAction, setLoadingBulkAction] = useState(false);
  const [loadingIndividual, setLoadingIndividual] = useState<Record<string | number, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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
      setLoadingBulkAction(true);
      await markAsRead(selectedNotifications);
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    } finally {
      setLoadingBulkAction(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    try {
      setLoadingBulkAction(true);
      await deleteNotifications(selectedNotifications);
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Failed to delete notifications:", err);
    } finally {
      setLoadingBulkAction(false);
    }
  };

  const getRouteFromNotification = (notification: InboxNotification): string | null => {
    const entityId = notification.payload?.id;
    if (!entityId) return null;

    const ruleName = notification.rule_name?.toLowerCase() || "";

    // Campaign-related notifications
    if (ruleName.includes("campaign")) {
      return `/dashboard/campaigns/${entityId}`;
    }

    // Offer-related notifications
    if (ruleName.includes("offer")) {
      return `/dashboard/offers/${entityId}`;
    }

    // Segment-related notifications
    if (ruleName.includes("segment")) {
      return `/dashboard/segments/${entityId}`;
    }

    // Default to campaign if no rule match
    return `/dashboard/campaigns/${entityId}`;
  };

  const handleNotificationClick = async (notification: InboxNotification) => {
    try {
      setLoadingIndividual((prev) => ({ ...prev, [notification.id]: "navigating" }));

      if (!notification.is_read) {
        await markAsRead([notification.id]);
      }

      // Navigate to appropriate details page based on entity type
      const route = getRouteFromNotification(notification);
      if (route) {
        navigate(route);
      }
    } finally {
      setLoadingIndividual((prev) => {
        const updated = { ...prev };
        delete updated[notification.id];
        return updated;
      });
    }
  };

  const handleDeleteClick = (notification: InboxNotification) => {
    setDeleteConfirmId(notification.id);
    setDeleteConfirmTitle(notification.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setIsDeleting(true);
      await deleteNotification(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmTitle("");
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setIsDeleting(false);
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
                        setLoadingMarkAllRead(true);
                        await markAsRead(selectedNotifications);
                        setBulkMode(false);
                        setBulkActionType(null);
                        setSelectedNotifications([]);
                      }
                    }
                  } catch (err) {
                    console.error("Failed to mark all as read:", err);
                  } finally {
                    setLoadingMarkAllRead(false);
                  }
                }}
                disabled={loadingMarkAllRead}
                className={`${tw.button} text-sm px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {loadingMarkAllRead ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin" />
                    {t.notifications.markAllAsRead}
                  </>
                ) : (
                  t.notifications.markAllAsRead
                )}
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
                        setLoadingDeleteAll(true);
                        await deleteNotifications(selectedNotifications);
                        setBulkMode(false);
                        setBulkActionType(null);
                        setSelectedNotifications([]);
                      }
                    }
                  } catch (err) {
                    console.error("Failed to delete notifications:", err);
                  } finally {
                    setLoadingDeleteAll(false);
                  }
                }}
                disabled={loadingDeleteAll}
                className={`bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 ${tw.rounded} cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {loadingDeleteAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.notifications.deleteAll}
                  </>
                ) : (
                  t.notifications.deleteAll
                )}
              </button>
              <button
                onClick={() => navigate("/dashboard/notification-settings")}
                style={{
                  background: buttons.secondaryAction.background,
                  color: buttons.secondaryAction.color,
                }}
                className={`text-sm font-medium transition-colors px-4 py-2 ${tw.rounded} cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-100`}
              >
                <Settings className="w-4 h-4" />
                Notification Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <SearchInput
          placeholder={t.notifications.searchPlaceholder}
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />

        {/* Read Status Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: "all", label: t.notifications.statusAll },
            { id: "unread", label: t.notifications.statusUnread },
            { id: "read", label: t.notifications.statusRead },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReadFilter(tab.id as "all" | "read" | "unread")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                readFilter === tab.id
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {readFilter === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {(searchTerm || readFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setReadFilter("all");
            }}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
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
                    disabled={loadingBulkAction}
                    className={`${tw.button} text-sm px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    {loadingBulkAction ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin" />
                        {t.notifications.bulkMarkAsRead}
                      </>
                    ) : (
                      t.notifications.bulkMarkAsRead
                    )}
                  </button>
                )}
                {bulkActionType === "delete" && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={loadingBulkAction}
                    className={`bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors px-4 py-2 ${tw.rounded} cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    {loadingBulkAction ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t.notifications.bulkDelete}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {t.notifications.bulkDelete}
                      </>
                    )}
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
      <div>
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
          <div className="p-12  text-center">
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
          {/* <div className="p-4 bg-red-900"> */}
            <div className=" space-y-4">
              {filteredNotifications.map((notification) => {
                const isSelected = selectedNotifications.includes(
                  notification.id,
                );

                return (
                  <div
                    key={notification.id}
                    className={`bg-white ${tw.rounded} border border-gray-200 p-4 hover:bg-gray-50 transition-colors ${
                      loadingIndividual[notification.id] ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {bulkMode && (
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() =>
                            handleSelectNotification(notification.id)
                          }
                        >
                          <Checkbox
                            id={`notification-${notification.id}`}
                            checked={isSelected}
                            onChange={() =>
                              handleSelectNotification(notification.id)
                            }
                          />
                        </div>
                      )}
                      <div
                        onClick={() =>
                          !bulkMode && !loadingIndividual[notification.id] && handleNotificationClick(notification)
                        }
                        className={`flex-1 min-w-0 ${
                          !bulkMode && !loadingIndividual[notification.id]
                            ? "cursor-pointer"
                            : loadingIndividual[notification.id]
                              ? "cursor-wait"
                              : ""
                        }`}
                      >
                        <div className="flex flex-col  sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
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
                                  <DateFormatter
                                    date={notification.created_at}
                                    useUserTimezone
                                    includeTime
                                  />
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
                                    try {
                                      setLoadingIndividual((prev) => ({ ...prev, [notification.id]: "marking" }));
                                      await markAsRead([notification.id]);
                                    } finally {
                                      setLoadingIndividual((prev) => {
                                        const updated = { ...prev };
                                        delete updated[notification.id];
                                        return updated;
                                      });
                                    }
                                  }}
                                  style={{
                                    borderColor: color.primary.action,
                                    color: color.primary.action,
                                  }}
                                  disabled={loadingIndividual[notification.id] === "marking"}
                                  className={`${tw.borderedButton} text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap flex items-center justify-center gap-1 disabled:opacity-50`}
                                  title={t.notifications.bulkMarkAsRead}
                                >
                                  {loadingIndividual[notification.id] === "marking" ? (
                                    <>
                                      <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
                                      {t.notifications.bulkMarkAsRead}
                                    </>
                                  ) : (
                                    t.notifications.bulkMarkAsRead
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(notification);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0 disabled:opacity-50 flex items-center justify-center"
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
            {/* </div> */}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteConfirmTitle("");
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        itemName={deleteConfirmTitle}
        isLoading={isDeleting}
        confirmText="Delete"
      />
    </div>
  );
}
