import { useState, useEffect } from "react";
import Input from '../../../shared/components/ui/Input';
import { Save } from "lucide-react";
import { playNotificationSound, NotificationSoundType } from "../../../shared/utils/notificationSound";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useNotificationSettings } from "../../../contexts/NotificationSettingsContext";
import { setLanguageSettings } from "../../../shared/services/languageService";
import { formatDate } from "../../../shared/services/dateService";
import { tw } from "../../../shared/utils/utils";
import { colors } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
// import DateFormatter from "../../../shared/components/DateFormatter";
import { getCountriesList, getCurrenciesList } from "../../../shared/services/countryDataService";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { characterSetService } from "../../configurations/services/characterSetService";
import { senderIdService } from "../../configurations/services/senderIdService";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { timezoneService } from "../../configurations/services/timezoneService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { WHATSAPP_ROUTES_DUMMY_DATA } from "../../routes/services/whatsappRouteService";
import { PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA } from "../../routes/services/pushNotificationRouteService";
import { USSD_ROUTES_DUMMY_DATA } from "../../routes/services/ussdRouteService";
import { SMSRoute } from "../../routes/types/smsRoute";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import { hardcodedEmailRoutes } from "../../configurations/configs/configurationPageConfigs";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { notificationService } from "../../notifications/services/notificationService";
import { NotificationSubscription } from "../../notifications/types/notification";
import { TimeZone } from "../../configurations/types/timezone";

const countriesList = getCountriesList();
const currenciesList = getCurrenciesList();

// System-wide languages - using ISO 639-1 codes
const languages = [
  { name: "English", code: "en" },
  { name: "French", code: "fr" },
  { name: "Spanish", code: "es" },
  { name: "Swahili", code: "sw" },
];

const dateFormats = [
  "YYYY-MM-DD",
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
  "YYYY/MM/DD",
];

// Currencies are now loaded from currency-codes library above

const numberFormats = ["1,234.56", "1 234,56", "1.234,56", "1'234.56"];

// DND Days
const dndDays = [
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
  { value: "weekends", label: "Weekends (Sat-Sun)" },
  { value: "daily", label: "Daily" },
  { value: "custom", label: "Custom Days" },
];

// Days of week for custom DND selection
const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Notification Channels
const notificationChannels = [
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
  { id: "ussd", label: "USSD" },
  { id: "push", label: "Push" },
  { id: "ivr", label: "IVR" },
  { id: "voice", label: "Voice" },
  { id: "whatsapp", label: "WhatsApp" },
];

// Notification Sounds (Web Audio API generated)
const notificationSounds = [
  { value: "default", label: "Default" },
  { value: "chime", label: "Chime" },
  { value: "ding", label: "Ding" },
  { value: "pop", label: "Pop" },
  { value: "tone", label: "Tone" },
];

// Time options for DND hours
const timeOptions = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, "0")}:00`,
  label: `${String(i).padStart(2, "0")}:00`,
}));

// Helper function to get country by name
const getCountryByName = (countryName: string) => {
  return countriesList.find((c) => c.name === countryName);
};

interface SettingsType {
  country: string;
  country_code: string;
  language: string;
  timezone: string;
  timezone_offset?: string; // e.g., "+03:00"
  date_format: string;
  currency: string;
  number_formatting: string;
  character_set: string;
  default_communication_channel: string;
  default_sender_id: string;
  default_sms_route_id: number | null;
  default_email_route_id: number | null;
  default_ussd_route_id: number | null;
  default_whatsapp_route_id: number | null;
  default_push_route_id: number | null;
  dnd_enabled: boolean;
  dnd_start_time: string;
  dnd_end_time: string;
  dnd_days: string;
  custom_dnd_days: number[];
  notificationSound?: string;
  theme: "light" | "dark";
}

export default function SettingsPage() {
  const { success: showToast } = useToast();
  const { setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
  } = useNotificationSettings();

  // Load settings from localStorage or use defaults (Kenya/KES)
  const loadSettings = (): SettingsType => {
    try {
      const stored = localStorage.getItem("appSettings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          country: parsed.country || "Kenya",
          country_code: parsed.country_code || "KE",
          language: parsed.language || "English",
          timezone: parsed.timezone || "Africa/Nairobi",
          timezone_offset: parsed.timezone_offset || "+03:00",
          date_format: parsed.date_format || "YYYY-MM-DD",
          currency: parsed.currency || "KES",
          number_formatting: parsed.number_formatting || "1,234.56",
          character_set: parsed.character_set || "",
          default_communication_channel:
            parsed.default_communication_channel || "sms",
          default_sender_id: parsed.default_sender_id || "",
          default_sms_route_id: parsed.default_sms_route_id || null,
          default_email_route_id: parsed.default_email_route_id || null,
          default_ussd_route_id: parsed.default_ussd_route_id || null,
          default_whatsapp_route_id: parsed.default_whatsapp_route_id || null,
          default_push_route_id: parsed.default_push_route_id || null,
          dnd_enabled:
            parsed.dnd_enabled !== undefined ? parsed.dnd_enabled : true,
          dnd_start_time: parsed.dnd_start_time || "21:00",
          dnd_end_time: parsed.dnd_end_time || "08:00",
          dnd_days: parsed.dnd_days || "daily",
          custom_dnd_days: parsed.custom_dnd_days || [1, 2, 3, 4, 5],
          notificationSound: parsed.notificationSound || "default",
          theme: parsed.theme || "light",
        };
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    // Default to Kenya
    return {
      country: "Kenya",
      country_code: "KE",
      language: "English",
      timezone: "Africa/Nairobi",
      timezone_offset: "+03:00",
      date_format: "YYYY-MM-DD",
      currency: "KES",
      number_formatting: "1,234.56",
      character_set: "",
      default_communication_channel: "sms",
      default_sender_id: "",
      default_sms_route_id: null,
      default_email_route_id: null,
      default_ussd_route_id: null,
      default_whatsapp_route_id: null,
      default_push_route_id: null,
      dnd_enabled: true,
      dnd_start_time: "21:00",
      dnd_end_time: "08:00",
      dnd_days: "daily",
      custom_dnd_days: [1, 2, 3, 4, 5],
      notificationSound: "default",
      theme: "light",
    };
  };

  const [settings, setSettings] = useState<SettingsType>(loadSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [originalSettings] = useState<SettingsType>(loadSettings());
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [characterSetOptions, setCharacterSetOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [senderIdOptions, setSenderIdOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [communicationChannelOptions, setCommunicationChannelOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [characterSetDescriptions, setCharacterSetDescriptions] = useState<
    Record<string, string>
  >({});
  const [timezoneList, setTimezoneList] = useState<TimeZone[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(true);

  // Notification subscriptions from API
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsSavingId, setSubscriptionsSavingId] = useState<number | null>(null);

  // Preferred channels for notifications
  const [preferredNotificationChannels, setPreferredNotificationChannels] =
    useState<string[]>(() => {
      const stored = localStorage.getItem("preferredNotificationChannels");
      if (stored) {
        return JSON.parse(stored);
      }
      // Default: SMS and Email
      return ["sms", "email"];
    });

  // Play sound when notification sound setting changes
  useEffect(() => {
    if (settings.notificationSound && settings.notificationSound !== originalSettings.notificationSound) {
      playNotificationSound(settings.notificationSound as NotificationSoundType);
    }
  }, [settings.notificationSound]);

  // Routes and communication channels
  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([]);
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(false);

  // Hardcoded routes from configuration
  const ussdRoutes = USSD_ROUTES_DUMMY_DATA;
  const whatsappRoutes = WHATSAPP_ROUTES_DUMMY_DATA;
  const pushRoutes = PUSH_ROUTES_PUSH_ROUTES_DUMMY_DATA;
  const emailRoutes = hardcodedEmailRoutes.map(r => ({
    id: r.id,
    name: r.name,
    is_active: r.isActive || r.is_active
  }));

  // Load timezones from API on mount
  useEffect(() => {
    const loadTimezones = async () => {
      try {
        setTimezonesLoading(true);
        const data = await timezoneService.getTimezones();
        if (Array.isArray(data)) {
          setTimezoneList(data.filter((tz) => tz && tz.is_active === true));
        } else {
          setTimezoneList([]);
        }
      } catch (error) {
        console.error("Failed to load timezones:", error);
        setTimezoneList([]);
      } finally {
        setTimezonesLoading(false);
      }
    };
    loadTimezones();
  }, []);

  // Load subscriptions from API on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setSubscriptionsLoading(true);
        const response = await notificationService.getNotificationSubscriptions();
        if (response.success && response.data) {
          setSubscriptions(response.data);
        }
      } catch (error) {
        console.error("Failed to load notification subscriptions:", error);
      } finally {
        setSubscriptionsLoading(false);
      }
    };
    loadSubscriptions();
  }, []);

  // Load SMS routes and communication channels
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setSmsRoutesLoading(true);
        const smsRoutesData = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(smsRoutesData) ? smsRoutesData.filter((r: any) => r.is_active) : []);
      } catch {
        setSmsRoutes([]);
      } finally {
        setSmsRoutesLoading(false);
      }
    };

    const loadCommunicationChannels = async () => {
      try {
        const channels = await communicationChannelService.getAll();
        const activeChannels = Array.isArray(channels) ? channels.filter((ch) => ch.is_active) : [];
        setCommunicationChannels(activeChannels);
      } catch {
        setCommunicationChannels([]);
      }
    };

    loadRoutes();
    loadCommunicationChannels();
  }, []);

  // Handle subscription toggle
  const handleSubscriptionToggle = async (
    ruleId: number,
    currentSubscribed: boolean
  ) => {
    try {
      setSubscriptionsSavingId(ruleId);
      // Update local state optimistically
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.rule_id === ruleId
            ? { ...sub, is_subscribed: !currentSubscribed }
            : sub
        )
      );
      // Call API
      const updatedSubscriptions = subscriptions.map((sub) =>
        sub.rule_id === ruleId
          ? { rule_id: sub.rule_id, is_subscribed: !currentSubscribed }
          : { rule_id: sub.rule_id, is_subscribed: sub.is_subscribed }
      );
      await notificationService.updateNotificationSubscriptions(updatedSubscriptions);
      showToast("Notification preference updated");
    } catch (error) {
      console.error("Failed to update subscription:", error);
      // Revert optimistic update
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.rule_id === ruleId
            ? { ...sub, is_subscribed: currentSubscribed }
            : sub
        )
      );
    } finally {
      setSubscriptionsSavingId(null);
    }
  };

  // Cross-tab synchronization: Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "appSettings" && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
          // Update language context if language changed
          if (newSettings.language) {
            setLanguageSettings(newSettings.language);
            setLanguage(newSettings.language);
          }
        } catch (error) {
          console.error("Error parsing settings from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setLanguage]);

  useEffect(() => {
    const loadDynamicOptions = async () => {
      try {
        const [characterSetResponse, senderIdResponse, channelsResponse] = await Promise.all([
          characterSetService.getCharacterSets(),
          senderIdService.getSenderIds(),
          communicationChannelService.getAll(),
        ]);

        const characterSets = Array.isArray(characterSetResponse)
          ? characterSetResponse
          : (
              characterSetResponse as {
                success?: boolean;
                data?: Array<{
                  name?: string;
                  description?: string;
                  is_active?: boolean;
                }>;
              }
            )?.data || [];

        const activeCharacterSets = characterSets.filter(
          (item) => item?.is_active ?? true,
        );

        const fetchedCharacterSetOptions = activeCharacterSets
          .map((item) => ({
            value: String(item?.name || "").trim(),
            label: String(item?.name || "").trim(),
          }))
          .filter((item) => item.value);

        const fetchedCharacterSetDescriptions = activeCharacterSets.reduce(
          (acc, item) => {
            const key = String(item?.name || "").trim();
            if (key) {
              acc[key] = String(item?.description || "").trim();
            }
            return acc;
          },
          {} as Record<string, string>,
        );

        setCharacterSetOptions(fetchedCharacterSetOptions);
        setCharacterSetDescriptions(fetchedCharacterSetDescriptions);

        const senderIds = Array.isArray(senderIdResponse)
          ? senderIdResponse
          : (
              senderIdResponse as {
                success?: boolean;
                data?: Array<{ name?: string; is_active?: boolean }>;
              }
            )?.data || [];

        const fetchedSenderIdOptions = senderIds
          .filter((item) => item?.is_active ?? true)
          .map((item) => ({
            value: String(item?.name || "").trim(),
            label: String(item?.name || "").trim(),
          }))
          .filter((item) => item.value);

        setSenderIdOptions(fetchedSenderIdOptions);

        const channels = Array.isArray(channelsResponse)
          ? channelsResponse
          : channelsResponse || [];

        const fetchedChannelOptions = channels
          .filter((item) => item?.is_active ?? true)
          .map((item) => ({
            value: String(item?.id || "").trim(),
            label: String(item?.name || "").trim(),
          }))
          .filter((item) => item.value && item.label);

        setCommunicationChannelOptions(fetchedChannelOptions);

        setSettings((prev) => ({
          ...prev,
          character_set: fetchedCharacterSetOptions.some(
            (option) => option.value === prev.character_set,
          )
            ? prev.character_set
            : fetchedCharacterSetOptions[0]?.value || prev.character_set,
          default_sender_id: fetchedSenderIdOptions.some(
            (option) => option.value === prev.default_sender_id,
          )
            ? prev.default_sender_id
            : fetchedSenderIdOptions[0]?.value || prev.default_sender_id,
          default_communication_channel: fetchedChannelOptions.some(
            (option) => option.value === prev.default_communication_channel,
          )
            ? prev.default_communication_channel
            : fetchedChannelOptions[0]?.value || prev.default_communication_channel,
        }));
      } catch (error) {
        console.error("Failed to fetch character sets, sender IDs, or channels:", error);
        setCharacterSetOptions([]);
        setSenderIdOptions([]);
        setCommunicationChannelOptions([]);
        setCharacterSetDescriptions({});
      }
    };

    loadDynamicOptions();
  }, []);

  const handleCountryChange = (countryName: string) => {
    const selectedCountry = getCountryByName(countryName);
    setSettings({
      ...settings,
      country: countryName,
      country_code: selectedCountry?.code || "",
    });
  };

  const handleLanguageChange = (language: string) => {
    // Only update local state - don't apply until Save is clicked
    setSettings({ ...settings, language });
  };

  const handleTimezoneChange = (timezone: string) => {
    // Find the timezone in the list to get its offset
    const selectedTz = timezoneList.find((tz) => tz.value === timezone);
    setSettings({
      ...settings,
      timezone,
      timezone_offset: selectedTz?.utc_offset || "+00:00",
    });
  };

  const handleDateFormatChange = (date_format: string) => {
    setSettings({ ...settings, date_format });
  };

  const handleCurrencyChange = (currency: string) => {
    setSettings({ ...settings, currency });
  };

  const handleNumberFormatChange = (number_formatting: string) => {
    setSettings({ ...settings, number_formatting });
  };

  const handleCharacterSetChange = (character_set: string) => {
    setSettings({ ...settings, character_set });
  };

  const handleCommunicationChannelChange = (
    default_communication_channel: string,
  ) => {
    setSettings({ ...settings, default_communication_channel });
  };

  const handleSenderIdChange = (default_sender_id: string) => {
    setSettings({ ...settings, default_sender_id });
  };

  const handleRouteChange = (routeId: number | string, channelType: string) => {
    const id = typeof routeId === 'string' ? Number(routeId) : routeId;
    const channelUpper = channelType.toUpperCase();
    if (channelUpper.includes("SMS")) {
      setSettings({ ...settings, default_sms_route_id: id });
    } else if (channelUpper === "EMAIL") {
      setSettings({ ...settings, default_email_route_id: id });
    } else if (channelUpper === "USSD") {
      setSettings({ ...settings, default_ussd_route_id: id });
    } else if (channelUpper.includes("WHATSAPP")) {
      setSettings({ ...settings, default_whatsapp_route_id: id });
    } else if (channelUpper.includes("PUSH")) {
      setSettings({ ...settings, default_push_route_id: id });
    }
  };


  const handleThemeChange = (newTheme: "light" | "dark") => {
    setSettings({ ...settings, theme: newTheme });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Save to localStorage
      localStorage.setItem("appSettings", JSON.stringify(settings));
      localStorage.setItem(
        "preferredNotificationChannels",
        JSON.stringify(preferredNotificationChannels),
      );
      // Dispatch custom event for settings update
      window.dispatchEvent(new CustomEvent("appSettingsChanged", { detail: settings }));
      // Update language if it changed
      setLanguageSettings(settings.language);
      setLanguage(settings.language);
      // Update theme if it changed
      setTheme(settings.theme);
      showToast(t.messages.saved);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSection = async (sectionName: string) => {
    try {
      setSavingSection(sectionName);
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Save to localStorage
      localStorage.setItem("appSettings", JSON.stringify(settings));
      localStorage.setItem(
        "preferredNotificationChannels",
        JSON.stringify(preferredNotificationChannels),
      );
      // Dispatch custom event for settings update
      window.dispatchEvent(new CustomEvent("appSettingsChanged", { detail: settings }));
      // Update language if it changed
      if (sectionName === "localization") {
        setLanguageSettings(settings.language);
        setLanguage(settings.language);
      }
      // Update theme if it changed
      if (sectionName === "theme") {
        setTheme(settings.theme);
      }
      showToast(`${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} saved successfully`);
    } catch (err) {
      console.error(`Failed to save ${sectionName}:`, err);
      showToast(`Failed to save ${sectionName}`, "error");
    } finally {
      setSavingSection(null);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
  };

  // Prepare options for HeadlessSelect
  const countryOptions = countriesList.map((country) => ({
    value: country.name,
    label: `${country.flag} ${country.name} (${country.code})`,
  }));

  const languageOptions = languages.map((lang) => ({
    value: lang.name,
    label: lang.name,
  }));

  const timezoneOptions = Array.isArray(timezoneList)
    ? timezoneList
        .filter((tz) => tz && tz.value && tz.label)
        .map((tz) => ({
          value: tz.value || "",
          label: `${tz.label || ""} (${tz.utc_offset || ""})`,
        }))
    : [];

  const dateFormatOptions = dateFormats.map((format) => ({
    value: format,
    label: format,
  }));

  const currencyOptions = currenciesList.map((curr) => ({
    value: curr.code,
    label: curr.name,
  }));

  const numberFormatOptions = numberFormats.map((format) => ({
    value: format,
    label: format,
  }));

  const dndDaysOptions = dndDays;

  const startTimeOptions = timeOptions;

  const endTimeOptions = timeOptions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200">
        <div className="min-w-0">
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.settings.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage the system preferences and regional settings
          </p>
        </div>

        {/* Save and Cancel - COMMENTED OUT */}
        {/* <div className="flex flex-row items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap">
          <PermissionGate permission="system.settings.manage">
            <>
              <button
                onClick={handleReset}
                className={`px-5 py-2.5 text-sm font-medium ${tw.rounded} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex-shrink-0 whitespace-nowrap`}
              >
                {t.common.cancel}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-5 py-2.5 text-sm font-medium ${tw.rounded} text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap bg-[#252829]`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t.common.loading}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </>
          </PermissionGate>
        </div> */}
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-0">
        {/* Location Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t.settings.location}
              </h2>
              <p className="text-sm text-gray-500">
                Set your country and regional information
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('location')}
              disabled={savingSection === 'location'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'location' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.country}
              </label>
              <HeadlessSelect
                value={settings.country}
                onChange={(value) => handleCountryChange(value as string)}
                options={countryOptions}
                placeholder="Select country"
                searchable={true}
              />
            </div>

            <div>
              <label
                htmlFor="country-code"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.countryCode}
              </label>
              <Input
                id="country-code"
                type="text"
                value={settings.country_code}
                readOnly
                className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} bg-gray-50 text-sm text-gray-700 cursor-not-allowed`}
              />
              <p className="text-xs text-gray-400 mt-2">
                Automatically set based on selected country
              </p>
            </div>
          </div>
        </div>

        {/* Localization Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Localization
              </h2>
              <p className="text-sm text-gray-500">
                Configure language and timezone preferences
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('localization')}
              disabled={savingSection === 'localization'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'localization' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.language}
              </label>
              <HeadlessSelect
                value={settings.language}
                onChange={(value) => handleLanguageChange(value as string)}
                options={languageOptions}
                placeholder="Select language"
              />
            </div>

            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.timezone}
              </label>
              <HeadlessSelect
                value={settings.timezone}
                onChange={(value) => handleTimezoneChange(value as string)}
                options={timezoneOptions}
                placeholder="Select timezone"
                searchable={true}
              />
            </div>
          </div>
        </div>

        {/* Date Format Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t.settings.dateFormat}
              </h2>
              <p className="text-sm text-gray-500">
                Choose how dates are displayed throughout the system
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('dateFormat')}
              disabled={savingSection === 'dateFormat'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'dateFormat' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div>
            <label
              htmlFor="date-format"
              className="block text-sm font-semibold text-gray-700 mb-2.5"
            >
              Format
            </label>
            <HeadlessSelect
              value={settings.date_format}
              onChange={(value) => handleDateFormatChange(value as string)}
              options={dateFormatOptions}
              placeholder="Select date format"
            />
            <div
              className={`mt-3 p-3 bg-gray-50 ${tw.rounded} border border-gray-200`}
            >
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(new Date(), { customFormat: settings.date_format })}
              </p>
            </div>
          </div>
        </div>

        {/* Currency & Number Formatting Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t.settings.currency} & Formatting
              </h2>
              <p className="text-sm text-gray-500">
                Set currency and number display preferences
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('currency')}
              disabled={savingSection === 'currency'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'currency' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.currency}
              </label>
              <HeadlessSelect
                value={settings.currency}
                onChange={(value) => handleCurrencyChange(value as string)}
                options={currencyOptions}
                placeholder="Select currency"
                searchable={true}
              />
            </div>

            <div>
              <label
                htmlFor="number-format"
                className="block text-sm font-semibold text-gray-700 mb-2.5"
              >
                {t.settings.numberFormatting}
              </label>
              <HeadlessSelect
                value={settings.number_formatting}
                onChange={(value) => handleNumberFormatChange(value as string)}
                options={numberFormatOptions}
                placeholder="Select number format"
              />
              <div
                className={`mt-3 p-3 bg-gray-50 ${tw.rounded} border border-gray-200`}
              >
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(() => {
                    const testValue = 1234.56;
                    if (settings.number_formatting === "1,234.56") {
                      return testValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    } else if (settings.number_formatting === "1 234,56") {
                      return testValue.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    } else if (settings.number_formatting === "1.234,56") {
                      return testValue.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    } else if (settings.number_formatting === "1'234.56") {
                      return testValue.toLocaleString("de-CH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    }
                    return testValue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Character Sets Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Character Sets
              </h2>
              <p className="text-sm text-gray-500">
                Select SMS text encoding for message delivery
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('characterSet')}
              disabled={savingSection === 'characterSet'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'characterSet' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div>
            <label
              htmlFor="character-set"
              className="block text-sm font-semibold text-gray-700 mb-2.5"
            >
              Encoding
            </label>
            <HeadlessSelect
              value={settings.character_set}
              onChange={(value) => handleCharacterSetChange(value as string)}
              options={characterSetOptions}
              placeholder="Select character set"
            />
          </div>
        </div>

        {/* Sender ID Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Default Sender ID
              </h2>
              <p className="text-sm text-gray-500">
                Set the default SMS sender ID for campaigns
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('senderId')}
              disabled={savingSection === 'senderId'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'senderId' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div>
            <label
              htmlFor="sender-id"
              className="block text-sm font-semibold text-gray-700 mb-2.5"
            >
              Sender ID
            </label>
            <HeadlessSelect
              value={settings.default_sender_id}
              onChange={(value) => handleSenderIdChange(value as string)}
              options={senderIdOptions}
              placeholder="Select sender ID"
            />
          </div>
        </div>

        {/* Communication Channel & Route Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Default Communication Channel & Route
              </h2>
              <p className="text-sm text-gray-500">
                Set the default channel and its corresponding route
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('communication')}
              disabled={savingSection === 'communication'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'communication' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          {(() => {
            const selectedChannelLabel = communicationChannelOptions?.find(
              (opt) => opt.value === settings.default_communication_channel
            )?.label || "";
            const selectedChannelUpper = selectedChannelLabel.toUpperCase();

            // Determine which routes to show
            let routesList: any[] = [];
            let routeLoading = false;
            let routeType = "";
            let selectedRouteId: number | null = null;

            if (selectedChannelUpper.includes("SMS")) {
              routesList = smsRoutes;
              routeLoading = smsRoutesLoading;
              routeType = "SMS";
              selectedRouteId = settings.default_sms_route_id;
            } else if (selectedChannelUpper === "EMAIL") {
              routesList = emailRoutes.filter((r: any) => r.is_active);
              routeLoading = false;
              routeType = "Email";
              selectedRouteId = settings.default_email_route_id;
            } else if (selectedChannelUpper === "USSD") {
              routesList = ussdRoutes.filter((r: any) => r.is_active);
              routeLoading = false;
              routeType = "USSD";
              selectedRouteId = settings.default_ussd_route_id;
            } else if (selectedChannelUpper.includes("WHATSAPP")) {
              routesList = whatsappRoutes.filter((r: any) => r.is_active);
              routeLoading = false;
              routeType = "WhatsApp";
              selectedRouteId = settings.default_whatsapp_route_id;
            } else if (selectedChannelUpper.includes("PUSH")) {
              routesList = pushRoutes.filter((r: any) => r.is_active);
              routeLoading = false;
              routeType = "Push Notification";
              selectedRouteId = settings.default_push_route_id;
            }

            // If no routes available, channel takes full width
            const hasRoutes = routesList.length > 0;

            return (
              <div className={!hasRoutes ? "" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
                {/* Communication Channel */}
                <div>
                  <label
                    htmlFor="communication-channel"
                    className="block text-sm font-semibold text-gray-700 mb-2.5"
                  >
                    Channel
                  </label>
                  <HeadlessSelect
                    value={settings.default_communication_channel}
                    onChange={(value) =>
                      handleCommunicationChannelChange(value as string)
                    }
                    options={communicationChannelOptions}
                    placeholder="Select default channel"
                  />
                </div>

                {/* Route - only show if routes available */}
                {hasRoutes && (
                  <div>
                    <label
                      htmlFor="route"
                      className="block text-sm font-semibold text-gray-700 mb-2.5"
                    >
                      {routeType} Route
                    </label>
                    <HeadlessSelect
                      options={
                        routesList?.map((route: any) => ({
                          value: String(route.id),
                          label: route.name,
                        })) || []
                      }
                      disabled={routeLoading}
                      value={selectedRouteId ? String(selectedRouteId) : ""}
                      onChange={(value) => {
                        if (!value) return;
                        handleRouteChange(Number(value), selectedChannelLabel);
                      }}
                      placeholder={
                        routeLoading ? "Loading..." : `Select ${routeType} route`
                      }
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>


        {/* Notifications Settings Card - COMMENTED OUT
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Notifications
            </h2>
            <p className="text-sm text-gray-500">
              Configure your notification preferences
            </p>
          </div>

          {/* Notification Sound and Preferred Channels *//*
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Notification Sound
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select the sound to play
              </p>
              <HeadlessSelect
                options={notificationSounds}
                value={settings.notificationSound || "default"}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    notificationSound: value,
                  })
                }
                placeholder="Select a sound"
                className="w-full"
              />

            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Preferred Channels
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select channels for all notifications
              </p>
              <HeadlessSelect
                options={notificationChannels.map((ch) => ({
                  value: ch.id,
                  label: ch.label,
                }))}
                value={preferredNotificationChannels[0] || ""}
                onChange={(value) => {
                  if (!preferredNotificationChannels.includes(value)) {
                    setPreferredNotificationChannels([
                      ...preferredNotificationChannels,
                      value,
                    ]);
                  } else {
                    setPreferredNotificationChannels(
                      preferredNotificationChannels.filter((c) => c !== value),
                    );
                  }
                }}
                placeholder="Select channels..."
                className="w-full"
              />
              {preferredNotificationChannels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {preferredNotificationChannels.map((ch) => (
                    <span
                      key={ch}
                      className={`inline-flex items-center gap-1 px-2 py-1  text-xs rounded-full`}
                      style={{ backgroundColor: "#00BBCC" }}
                    >
                      {notificationChannels.find((c) => c.id === ch)?.label}
                      <button
                        onClick={() => {
                          setPreferredNotificationChannels(
                            preferredNotificationChannels.filter(
                              (c) => c !== ch,
                            ),
                          );
                        }}
                        className="font-bold hover:opacity-80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notification Types *//*
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Notification Preferences
            </h3>
            {subscriptionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-sm text-gray-500">No notification types available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.rule_id}
                    className="flex items-start gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() =>
                      handleSubscriptionToggle(subscription.rule_id, subscription.is_subscribed)
                    }
                  >
                    <Checkbox
                      id={`notification-${subscription.rule_id}`}
                      checked={subscription.is_subscribed}
                      onChange={() =>
                        handleSubscriptionToggle(subscription.rule_id, subscription.is_subscribed)
                      }
                      disabled={subscriptionsSavingId === subscription.rule_id}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {subscription.name}
                      </p>
                      {/* <p className="text-xs text-gray-500 mt-0.5">
                        {subscription.description || `${subscription.table_name} - ${subscription.action_type}`}
                      </p> *//*
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        */}

        {/* Theme Settings Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Display Theme
              </h2>
              <p className="text-sm text-gray-500">
                Choose your preferred color scheme
              </p>
            </div>
            <button
              onClick={() => handleSaveSection('theme')}
              disabled={savingSection === 'theme'}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#252829]`}
            >
              {savingSection === 'theme' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : null}
              Save
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              Theme
            </label>
            <HeadlessSelect
              value={settings.theme}
              onChange={(value) => handleThemeChange(value as "light" | "dark")}
              options={[
                { label: "Light - Bright and clean", value: "light" },
                { label: "Dark - Easy on the eyes", value: "dark" },
              ]}
              placeholder="Select theme"
            />
            <p className="text-xs text-gray-400 mt-3">
              Changes apply immediately when saved
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
