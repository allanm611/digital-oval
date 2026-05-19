import { useEffect, useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useNotificationSettings } from "../../../contexts/NotificationSettingsContext";
import { useToast } from "../../../contexts/ToastContext";
import { notificationService } from "../services/notificationService";
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

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings, updateSettings } = useNotificationSettings();
  const { success, error: showError } = useToast();

  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [localSubscriptions, setLocalSubscriptions] = useState<NotificationSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const loadSubscriptions = useCallback(async () => {
    setIsLoadingSubscriptions(true);
    try {
      const result = await notificationService.getNotificationSubscriptions();
      if (result.success && result.data) {
        setSubscriptions(result.data as NotificationSubscription[]);
        setLocalSubscriptions(result.data as NotificationSubscription[]);
      }
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

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);

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
  }, [localSettings, localSubscriptions, updateSettings, t, success, showError]);

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
          fallbackTo="/dashboard/notifications"
          parentLabel="Notifications"
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
            <div className="divide-y divide-gray-100">
              {localSubscriptions.map((subscription) => (
                <div
                  key={subscription.rule_id}
                  className="flex items-start gap-3 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="pt-1 flex-shrink-0">
                    <Checkbox
                      id={`subscription-${subscription.rule_id}`}
                      checked={subscription.is_subscribed}
                      onChange={() =>
                        handleSubscriptionToggle(subscription.rule_id)
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {subscription.name}
                    </p>
                    {subscription.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {subscription.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {subscription.table_name} • {subscription.action_type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
