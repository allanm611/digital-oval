import { useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useNotificationSettings } from "../../../contexts/NotificationSettingsContext";
import { useToast } from "../../../contexts/ToastContext";
import { notificationService } from "../services/notificationService";
import { notificationCategoryService } from "../services/notificationCategoryService";
import { color, tw } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import BackButton from "../../../shared/components/ui/BackButton";

interface NotificationSubscription {
  rule_id: number;
  name: string;
  description?: string;
  table_name: string;
  action_type: string;
  category_id?: string | number;
  is_subscribed: boolean;
}

const NOTIFICATION_SOUNDS = [
  { label: "Default", value: "default" },
  { label: "Chime", value: "chime" },
  { label: "Ding", value: "ding" },
  { label: "Pop", value: "pop" },
  { label: "Tone", value: "tone" },
];

const EMAIL_DIGEST_OPTIONS = [
  { label: "Instant", value: "instant" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Never", value: "never" },
];

// DND Days
const DND_DAYS = [
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
  { value: "weekends", label: "Weekends (Sat-Sun)" },
  { value: "daily", label: "Daily" },
  { value: "custom", label: "Custom Days" },
];

// Days of week for custom DND selection
const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings, updateSettings } = useNotificationSettings();
  const { success, error: showError } = useToast();

  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [localSubscriptions, setLocalSubscriptions] = useState<NotificationSubscription[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [localSettings, setLocalSettings] = useState(settings);

  // DND Settings State
  const [dndSettings, setDndSettings] = useState({
    dnd_enabled: true,
    dnd_start_time: "21:00",
    dnd_end_time: "08:00",
    dnd_days: "daily",
    custom_dnd_days: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const loadSubscriptions = useCallback(async () => {
    setIsLoadingSubscriptions(true);
    try {
      const [subscriptionResult, categories] = await Promise.all([
        notificationService.getNotificationSubscriptions(),
        notificationCategoryService.getNotificationCategories(),
      ]);

      if (subscriptionResult.success && subscriptionResult.data) {
        setSubscriptions(subscriptionResult.data as NotificationSubscription[]);
        setLocalSubscriptions(subscriptionResult.data as NotificationSubscription[]);
      }

      // Create category map
      const map: Record<string, string> = {};
      (Array.isArray(categories) ? categories : []).forEach((cat: any) => {
        if (cat.id) {
          map[String(cat.id)] = cat.name || "";
        }
      });
      setCategoryMap(map);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
      showError(
        t.notifications.settings.loadingError || "Failed to load subscriptions",
      );
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }, [t, showError]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleSubscriptionToggle = (ruleId: number) => {
    setLocalSubscriptions((prev) =>
      prev.map((sub) =>
        sub.rule_id === ruleId ? { ...sub, is_subscribed: !sub.is_subscribed } : sub,
      ),
    );
    setHasChanges(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  // DND Handlers
  const handleDNDEnabledChange = (enabled: boolean) => {
    setDndSettings({ ...dndSettings, dnd_enabled: enabled });
  };

  const handleDNDStartTimeChange = (dnd_start_time: string) => {
    setDndSettings({ ...dndSettings, dnd_start_time });
  };

  const handleDNDEndTimeChange = (dnd_end_time: string) => {
    setDndSettings({ ...dndSettings, dnd_end_time });
  };

  const handleDNDDaysChange = (dnd_days: string) => {
    setDndSettings({ ...dndSettings, dnd_days });
  };

  const handleToggleDayOfWeek = (day: number) => {
    setDndSettings((prev) => ({
      ...prev,
      custom_dnd_days: prev.custom_dnd_days.includes(day)
        ? prev.custom_dnd_days.filter((d) => d !== day)
        : [...prev.custom_dnd_days, day].sort(),
    }));
  };

  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);

      // Save DND settings to localStorage
      localStorage.setItem("dndSettings", JSON.stringify(dndSettings));

      const subscriptionResult = await notificationService.updateNotificationSubscriptions(
        localSubscriptions.map((sub) => ({
          rule_id: sub.rule_id,
          is_subscribed: sub.is_subscribed,
        })),
      );

      if (subscriptionResult.success) {
        setSubscriptions(localSubscriptions);
        setHasChanges(false);
        success(
          t.notifications.settings.saveSuccess || "Settings saved successfully",
        );
      } else {
        showError(
          subscriptionResult.message ||
            t.notifications.settings.saveError ||
            "Failed to save settings",
        );
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      showError(
        t.notifications.settings.saveError || "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, localSubscriptions, dndSettings, updateSettings, t, success, showError]);

  const handleCancel = () => {
    setLocalSettings(settings);
    setLocalSubscriptions(subscriptions);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb and Buttons */}
      <div className="mb-8 flex items-center justify-between">
        <BackButton
          currentLabel="Notification Settings"
          showBreadcrumb={true}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className={`${tw.borderedButton} px-6 py-2`}
            style={{
              borderColor: color.primary.action,
              color: color.primary.action,
            }}
          >
            {t.notifications.cancel}
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`${tw.button} px-6 py-2 flex items-center gap-2 disabled:opacity-50`}
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t.notifications.save}
          </button>
        </div>
      </div>

      {/* Sound Settings and Notification Channels - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sound Settings Card */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {t.notifications.settings.soundTitle}
            </h2>
            <p className="text-sm text-gray-500">
              {t.notifications.settings.soundSubtitle}
            </p>
          </div>

          <div className="pr-4 py-4 bg-gray-50 rounded space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {localSettings.in_app_sound_enabled ? (
                  <Volume2 className="h-5 w-5 text-gray-600" />
                ) : (
                  <VolumeX className="h-5 w-5 text-gray-400" />
                )}
                <label htmlFor="sound-enabled" className="text-sm font-medium text-gray-900">
                  {t.notifications.settings.soundEnabled}
                </label>
              </div>
              <Checkbox
                checked={localSettings.in_app_sound_enabled}
                onChange={(checked) =>
                  handleSettingChange("in_app_sound_enabled", checked)
                }
                id="sound-enabled"
              />
            </div>

            {localSettings.in_app_sound_enabled && (
              <div className="space-y-6 ">
                <label className="text-sm font-medium mt-6 text-gray-700">
                  {t.notifications.settings.soundType}
                </label>
                <HeadlessSelect
                  options={NOTIFICATION_SOUNDS}
                  value={localSettings.notification_sound}
                  onChange={(value) =>
                    handleSettingChange("notification_sound", value)
                  }
                  placeholder="Select sound..."
                />
              </div>
            )}
          </div>
        </div>

      {/* Notification Channels Card */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t.notifications.settings.channelsTitle}
          </h2>
          <p className="text-sm text-gray-500">
            {t.notifications.settings.channelsSubtitle}
          </p>
        </div>

        <div className="space-y-4">
          {/* SMS Alerts */}
          <div className="flex items-center justify-between pb-1 bg-gray-50 rounded">
            <label htmlFor="sms-enabled" className="text-sm font-medium text-gray-900">
              {t.notifications.settings.smsAlerts}
            </label>
            <Checkbox
              checked={localSettings.sms_alerts_enabled}
              onChange={(checked) =>
                handleSettingChange("sms_alerts_enabled", checked)
              }
              id="sms-enabled"
            />
          </div>

          {/* Desktop Notifications */}
          <div className="flex items-center justify-between pb-1  bg-gray-50 rounded">
            <label htmlFor="desktop-enabled" className="text-sm font-medium text-gray-900">
              {t.notifications.settings.desktopNotifications}
            </label>
            <Checkbox
              checked={localSettings.desktop_notifications_enabled}
              onChange={(checked) =>
                handleSettingChange("desktop_notifications_enabled", checked)
              }
              id="desktop-enabled"
            />
          </div>

          {/* Email Notifications */}
          <div>
            <div className="flex items-center justify-between pb-1 bg-gray-50 rounded">
              <label htmlFor="email-enabled" className="text-sm font-medium text-gray-900">
                {t.notifications.settings.emailNotifications}
              </label>
              <Checkbox
                checked={localSettings.email_notifications_enabled}
                onChange={(checked) =>
                  handleSettingChange("email_notifications_enabled", checked)
                }
                id="email-enabled"
              />
            </div>
            {localSettings.email_notifications_enabled && (
              <div className="mt-3 ml-0">
                <HeadlessSelect
                  options={EMAIL_DIGEST_OPTIONS}
                  value={localSettings.email_digest_frequency}
                  onChange={(value) =>
                    handleSettingChange("email_digest_frequency", value)
                  }
                  placeholder="Select frequency..."
                />
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Message Delivery Quiet Hours Card */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6`}>
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Message Delivery Quiet Hours
            </h2>
            <p className="text-sm text-gray-500">
              Set quiet hours when messages will not be delivered
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quiet Hours Enabled */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleDNDEnabledChange(!dndSettings.dnd_enabled)}>
            <Checkbox
              id="dnd-enabled"
              checked={dndSettings.dnd_enabled}
              onChange={() => handleDNDEnabledChange(!dndSettings.dnd_enabled)}
              className="w-5 h-5 text-emerald-600 rounded"
            />
            <span className="text-sm font-semibold text-gray-700">
              Enable Quiet Hours
            </span>
          </div>

          {/* DND Settings - Only show if enabled */}
          {dndSettings.dnd_enabled && (
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DND Days */}
                <div>
                  <label
                    htmlFor="dnd-days"
                    className="block text-sm font-semibold text-gray-700 mb-2.5"
                  >
                    Apply To
                  </label>
                  <HeadlessSelect
                    value={dndSettings.dnd_days}
                    onChange={(value) => handleDNDDaysChange(value as string)}
                    options={DND_DAYS}
                    placeholder="Select days"
                  />
                </div>

                {/* DND Start Time */}
                <div>
                  <label
                    htmlFor="dnd-start-time"
                    className="block text-sm font-semibold text-gray-700 mb-2.5"
                  >
                    Start Time (DND begins)
                  </label>
                  <input
                    id="dnd-start-time"
                    type="time"
                    value={dndSettings.dnd_start_time}
                    onChange={(e) => handleDNDStartTimeChange(e.target.value)}
                    className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {/* DND End Time */}
                <div>
                  <label
                    htmlFor="dnd-end-time"
                    className="block text-sm font-semibold text-gray-700 mb-2.5"
                  >
                    End Time (DND ends)
                  </label>
                  <input
                    id="dnd-end-time"
                    type="time"
                    value={dndSettings.dnd_end_time}
                    onChange={(e) => handleDNDEndTimeChange(e.target.value)}
                    className={`w-full ${tw.rounded} border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              {/* Custom Days Selector - Only show when custom is selected */}
              {dndSettings.dnd_days === "custom" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Days
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center">
                        <Checkbox
                          id={`dnd-day-${day.value}`}
                          checked={(dndSettings.custom_dnd_days || []).includes(day.value)}
                          onChange={() => handleToggleDayOfWeek(day.value)}
                        />
                        <label
                          htmlFor={`dnd-day-${day.value}`}
                          className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {day.label.slice(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  Quiet Hours Preview:
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {dndSettings.dnd_days === "weekdays" && "Monday - Friday: "}
                  {dndSettings.dnd_days === "weekends" && "Saturday - Sunday: "}
                  {dndSettings.dnd_days === "daily" && "Daily: "}
                  {dndSettings.dnd_days === "custom" &&
                    `${(dndSettings.custom_dnd_days || [])
                      .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.label.slice(0, 3))
                      .join(", ")}: `
                  }
                  {dndSettings.dnd_start_time} to {dndSettings.dnd_end_time}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  No outgoing messages will be delivered during these quiet hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscriptions Card */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t.notifications.settings.subscriptionsTitle}
          </h2>
          <p className="text-sm text-gray-500">
            {t.notifications.settings.subscriptionsSubtitle}
          </p>
        </div>

        <div>
          {isLoadingSubscriptions ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">
                {t.notifications.settings.loadingSubscriptions}
              </p>
            </div>
          ) : localSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p className="text-sm">{t.notifications.settings.noSubscriptions}</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100">
              {(() => {
                // Group subscriptions by category
                const grouped: Record<string, NotificationSubscription[]> = {};
                localSubscriptions.forEach((sub) => {
                  const catId = String(sub.category_id || "Categories");
                  if (!grouped[catId]) {
                    grouped[catId] = [];
                  }
                  grouped[catId].push(sub);
                });

                // Only show categories that have subscriptions
                return Object.entries(grouped).map(([categoryId, subs]) => {
                  const categoryName =
                    categoryId !== "Categories"
                      ? categoryMap[categoryId] || "Categories"
                      : "Categories";

                  const isExpanded = expandedCategories[categoryId] ?? true;

                  return (
                    <div key={categoryId} className="py-4">
                      <button
                        onClick={() => toggleCategoryExpansion(categoryId)}
                        className="w-full flex items-center gap-3 text-left hover:bg-gray-50 -mx-6 px-6 py-2"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-gray-600 transition-transform ${
                            isExpanded ? "" : "-rotate-90"
                          }`}
                        />
                        <h3 className="text-sm font-semibold text-gray-900 flex-1 flex items-center gap-2">
                          {categoryName}
                          <span
                            className="text-xs text-white px-2 py-0.5 rounded"
                            style={{ backgroundColor: color.primary.accent }}
                          >
                            {subs.length}
                          </span>
                        </h3>
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 mt-3 ml-7">
                          {subs.map((subscription) => (
                            <div
                              key={subscription.rule_id}
                              className="flex items-center gap-3 py-2 hover:bg-gray-50 transition-colors rounded px-2"
                            >
                              <div className="flex-shrink-0">
                                <Checkbox
                                  id={`subscription-${subscription.rule_id}`}
                                  checked={subscription.is_subscribed}
                                  onChange={() =>
                                    handleSubscriptionToggle(subscription.rule_id)
                                  }
                                />
                              </div>
                              <label
                                htmlFor={`subscription-${subscription.rule_id}`}
                                className="text-sm text-gray-900 cursor-pointer flex-1"
                              >
                                {subscription.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
