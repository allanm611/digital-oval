import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface NotificationSettings {
  email_notifications_enabled: boolean;
  email_digest_frequency: "instant" | "daily" | "weekly" | "never";
  in_app_notifications_enabled: boolean;
  in_app_sound_enabled: boolean;
  notification_sound?: "default" | "chime" | "ding" | "pop" | "tone";
  desktop_notifications_enabled: boolean;
  sms_alerts_enabled: boolean;
  notification_categories: {
    campaigns: boolean;
    offers: boolean;
    products: boolean;
    segments: boolean;
    system_alerts: boolean;
    team_updates: boolean;
  };
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: NotificationSettings = {
  email_notifications_enabled: true,
  email_digest_frequency: "daily",
  in_app_notifications_enabled: true,
  in_app_sound_enabled: true,
  notification_sound: "default",
  desktop_notifications_enabled: true,
  sms_alerts_enabled: false,
  notification_categories: {
    campaigns: true,
    offers: true,
    products: true,
    segments: true,
    system_alerts: true,
    team_updates: true,
  },
};

const defaultNotificationContext: NotificationContextType = {
  settings: defaultSettings,
  updateSettings: () => {
    console.warn("NotificationProvider is not initialized yet.");
  },
  resetSettings: () => {
    console.warn("NotificationProvider is not initialized yet.");
  },
};

const NotificationContext = createContext<NotificationContextType>(
  defaultNotificationContext,
);

export function NotificationSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem("notificationSettings");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(defaultSettings),
    );
  };

  return (
    <NotificationContext.Provider
      value={{ settings, updateSettings, resetSettings }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationSettings() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationSettings must be used within a NotificationSettingsProvider",
    );
  }
  return context;
}
