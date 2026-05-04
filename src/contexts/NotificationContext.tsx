import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { notificationService } from "../features/notifications/services/notificationService";
import {
  InboxNotification,
  NotificationStats,
} from "../features/notifications/types/notification";
import { useNotificationSettings } from "./NotificationSettingsContext";
import { useToast } from "./ToastContext";
import { playNotificationSound } from "../shared/utils/notificationSound";

interface NotificationContextType {
  notifications: InboxNotification[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (ids: (string | number)[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string | number) => Promise<void>;
  deleteNotifications: (ids: (string | number)[]) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
  pollInterval?: number; // Polling interval in milliseconds (default: 30 seconds)
}

export function NotificationProvider({
  children,
  pollInterval = 30000, // 30 seconds default
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const seenNotificationIdsRef = useRef<Set<string | number>>(new Set());
  const { settings: notificationSettings } = useNotificationSettings();

  // Fetch notifications from inbox
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationService.getInboxNotifications();
      if (isMountedRef.current) {
        setNotifications(response.data || []);
        // Calculate stats from notifications
        const unread = response.data?.filter((n) => !n.is_read).length || 0;

        // Detect truly new notifications by ID
        const newNotifications = (response.data || []).filter(
          (n) => !seenNotificationIdsRef.current.has(n.id)
        );

        if (newNotifications.length > 0) {
          // Play sound if enabled
          if (notificationSettings.in_app_sound_enabled) {
            playNotificationSound(notificationSettings.notification_sound || "default");
          }

          // Add new notification IDs to seen set
          newNotifications.forEach((n) => seenNotificationIdsRef.current.add(n.id));
        }

        // Ensure all current notifications are in the seen set
        (response.data || []).forEach((n) => seenNotificationIdsRef.current.add(n.id));

        setStats({
          total: response.data?.length || 0,
          unread,
          byType: {},
          byPriority: {},
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        let errorMessage = "Unable to load notifications";
        if (err instanceof Error) {
          if (err.message.includes("500")) {
            errorMessage = "Notification service is temporarily unavailable";
          } else if (err.message.includes("401")) {
            errorMessage = "Please log in again to view notifications";
          } else if (err.message.includes("403")) {
            errorMessage = "You don't have permission to view notifications";
          } else if (err.message.includes("Network")) {
            errorMessage = "Network error - please check your connection";
          }
        }
        setError(errorMessage);
        console.error("Failed to fetch notifications:", err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [notificationSettings]);

  // Mark single notification as read
  const markAsRead = useCallback(async (ids: (string | number)[]) => {
    try {
      // Mark each notification as read
      for (const id of ids) {
        await notificationService.markNotificationAsRead(id);
      }
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          ids.includes(notif.id) ? { ...notif, is_read: true } : notif
        )
      );
      // Update stats
      setStats((prev) => {
        if (!prev) return null;
        const unread = Math.max(0, prev.unread - ids.length);
        return { ...prev, unread };
      });
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllInboxAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      // Update stats
      setStats((prev) => {
        if (!prev) return null;
        return { ...prev, unread: 0 };
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string | number) => {
    try {
      await notificationService.deleteInboxNotification(id);
      // Update local state
      setNotifications((prev) => {
        const wasUnread = prev.find((n) => n.id === id)?.is_read === false;
        // Update stats based on deletion
        setStats((prevStats) => {
          if (!prevStats) return null;
          return {
            ...prevStats,
            total: Math.max(0, prevStats.total - 1),
            unread: wasUnread ? Math.max(0, prevStats.unread - 1) : prevStats.unread,
          };
        });
        return prev.filter((notif) => notif.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      throw err;
    }
  }, []);

  // Delete multiple notifications
  const deleteNotifications = useCallback(async (ids: (string | number)[]) => {
    try {
      // Delete each notification
      for (const id of ids) {
        await notificationService.deleteInboxNotification(id);
      }
      // Update local state
      setNotifications((prev) => {
        const unreadCount = ids.filter(
          (id) => prev.find((n) => n.id === id)?.is_read === false
        ).length;
        // Update stats based on deletions
        setStats((prevStats) => {
          if (!prevStats) return null;
          return {
            ...prevStats,
            total: Math.max(0, prevStats.total - ids.length),
            unread: Math.max(0, prevStats.unread - unreadCount),
          };
        });
        return prev.filter((notif) => !ids.includes(notif.id));
      });
    } catch (err) {
      console.error("Failed to delete notifications:", err);
      throw err;
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, pollInterval);
  }, [pollInterval, refreshNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    refreshNotifications();

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [refreshNotifications, stopPolling]);

  const value: NotificationContextType = {
    notifications,
    stats,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
    startPolling,
    stopPolling,
    isPolling,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
