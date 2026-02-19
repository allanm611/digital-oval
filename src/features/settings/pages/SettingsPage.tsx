import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useNotificationSettings } from "../../../contexts/NotificationSettingsContext";
import { setLanguageSettings } from "../../../shared/services/languageService";
import { formatDate } from "../../../shared/services/dateService";
import { tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
// import DateFormatter from "../../../shared/components/DateFormatter";
import countries from "world-countries";
import currencyCodes from "currency-codes";
import { PermissionGate } from "../../auth/components/PermissionGate";

// Get all countries from world-countries library, sorted alphabetically
const countriesList = countries
  .map((country) => ({
    name: country.name.common,
    code: country.cca2, // ISO 3166-1 alpha-2 code
    flag: country.flag, // Emoji flag
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Get all currencies from currency-codes library
const currenciesList = currencyCodes
  .codes()
  .map((code) => {
    const currency = currencyCodes.code(code);
    return {
      code: code || "",
      name: currency ? `${currency.currency} (${code})` : code,
    };
  })
  .filter((c) => c.code && c.name && c.name !== `${c.code} (${c.code})`)
  .sort((a, b) => a.code.localeCompare(b.code));

// System-wide languages - using ISO 639-1 codes
const languages = [
  { name: "English", code: "en" },
  { name: "French", code: "fr" },
  { name: "Spanish", code: "es" },
  { name: "Swahili", code: "sw" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Lisbon",
  "Europe/Athens",
  "Europe/Dublin",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Ho_Chi_Minh",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Jerusalem",
  "Asia/Istanbul",
  "Asia/Moscow",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Dar_es_Salaam",
  "Africa/Kampala",
  "Africa/Accra",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "America/Mexico_City",
  "America/Santiago",
  "America/Bogota",
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

// Character Sets for SMS encoding
const characterSets = [
  { value: "gsm-7", label: "GSM-7 (Standard SMS)" },
  { value: "utf-8", label: "UTF-8 (Unicode)" },
  { value: "ascii", label: "ASCII (English only)" },
  { value: "ucs-2", label: "UCS-2 (Full Unicode)" },
];

// Default communication channels
const communicationChannels = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "ussd", label: "USSD" },
  { value: "push", label: "Push Notification" },
  { value: "ivr", label: "IVR" },
  { value: "voice", label: "Voice" },
];

// Default Sender IDs - Using actual hardcoded data from configurationPageConfigs
const senderIds = [
  { value: "Effortel", label: "Effortel" },
  { value: "Equitel", label: "Equitel" },
  { value: "EquitelKE", label: "EquitelKE" },
  { value: "EquitelAlert", label: "EquitelAlert" },
  { value: "EquitelPromo", label: "EquitelPromo" },
];

// Routes - Using actual hardcoded data from configurationPageConfigs
const routes = [
  { value: "Route 1", label: "Route 1" },
  { value: "Route 2", label: "Route 2" },
  { value: "Route 3", label: "Route 3" },
  { value: "Route 4", label: "Route 4" },
  { value: "Route 5", label: "Route 5" },
];

// DND Days
const dndDays = [
  { value: "weekdays", label: "Weekdays (Mon-Fri)" },
  { value: "weekends", label: "Weekends (Sat-Sun)" },
  { value: "daily", label: "Daily" },
  { value: "custom", label: "Custom Days" },
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
  date_format: string;
  currency: string;
  number_formatting: string;
  character_set: string;
  default_communication_channel: string;
  default_sender_id: string;
  default_route: string;
  dnd_enabled: boolean;
  dnd_start_time: string;
  dnd_end_time: string;
  dnd_days: string;
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
          date_format: parsed.date_format || "YYYY-MM-DD",
          currency: parsed.currency || "KES",
          number_formatting: parsed.number_formatting || "1,234.56",
          character_set: parsed.character_set || "gsm-7",
          default_communication_channel:
            parsed.default_communication_channel || "sms",
          default_sender_id: parsed.default_sender_id || "Effortel",
          default_route: parsed.default_route || "Route 1",
          dnd_enabled:
            parsed.dnd_enabled !== undefined ? parsed.dnd_enabled : true,
          dnd_start_time: parsed.dnd_start_time || "21:00",
          dnd_end_time: parsed.dnd_end_time || "08:00",
          dnd_days: parsed.dnd_days || "daily",
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
      date_format: "YYYY-MM-DD",
      currency: "KES",
      number_formatting: "1,234.56",
      character_set: "gsm-7",
      default_communication_channel: "sms",
      default_sender_id: "Effortel",
      default_route: "Route 1",
      dnd_enabled: true,
      dnd_start_time: "21:00",
      dnd_end_time: "08:00",
      dnd_days: "daily",
      theme: "light",
    };
  };

  const [settings, setSettings] = useState<SettingsType>(loadSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [originalSettings] = useState<SettingsType>(loadSettings());

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
    setSettings({ ...settings, timezone });
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

  const handleRouteChange = (default_route: string) => {
    setSettings({ ...settings, default_route });
  };

  const handleDNDEnabledChange = (enabled: boolean) => {
    setSettings({ ...settings, dnd_enabled: enabled });
  };

  const handleDNDStartTimeChange = (dnd_start_time: string) => {
    setSettings({ ...settings, dnd_start_time });
  };

  const handleDNDEndTimeChange = (dnd_end_time: string) => {
    setSettings({ ...settings, dnd_end_time });
  };

  const handleDNDDaysChange = (dnd_days: string) => {
    setSettings({ ...settings, dnd_days });
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setSettings({ ...settings, theme: newTheme });
    setTheme(newTheme);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Save to localStorage
      localStorage.setItem("appSettings", JSON.stringify(settings));
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

  const timezoneOptions = timezones.map((tz) => ({
    value: tz,
    label: tz,
  }));

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

  const characterSetOptions = characterSets;

  const communicationChannelOptions = communicationChannels;

  const senderIdOptions = senderIds;

  const routeOptions = routes;

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
            Manage your system preferences and regional settings
          </p>
        </div>

        {/* Save and Cancel Buttons */}
        <PermissionGate permission="system.settings.manage">
          <div className="flex flex-row items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap">
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
                  {t.settings.saveChanges}
                </>
              )}
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-0">
        {/* Location Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t.settings.location}
            </h2>
            <p className="text-sm text-gray-500">
              Set your country and regional information
            </p>
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
              <input
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
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Localization
            </h2>
            <p className="text-sm text-gray-500">
              Configure language and timezone preferences
            </p>
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
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t.settings.dateFormat}
            </h2>
            <p className="text-sm text-gray-500">
              Choose how dates are displayed throughout the system
            </p>
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
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t.settings.currency} & Formatting
            </h2>
            <p className="text-sm text-gray-500">
              Set currency and number display preferences
            </p>
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
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Character Sets
            </h2>
            <p className="text-sm text-gray-500">
              Select SMS text encoding for message delivery
            </p>
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
            <p className="text-xs text-gray-500 mt-3">
              {settings.character_set === "gsm-7" &&
                "Standard SMS encoding, supports most languages with optimal message length."}
              {settings.character_set === "utf-8" &&
                "Full Unicode support for complex characters and multiple languages."}
              {settings.character_set === "ascii" &&
                "English-only encoding, most compact format."}
              {settings.character_set === "ucs-2" &&
                "Complete Unicode support for all international characters."}
            </p>
          </div>
        </div>

        {/* Communication Channel Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Default Communication Channel
            </h2>
            <p className="text-sm text-gray-500">
              Set the default channel when none is specified
            </p>
          </div>

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
            <p className="text-xs text-gray-500 mt-3">
              This channel will be used as the default for campaigns when no
              specific channel is selected.
            </p>
          </div>
        </div>

        {/* Sender ID Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Default Sender ID
            </h2>
            <p className="text-sm text-gray-500">
              Set the default SMS sender ID for campaigns
            </p>
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
            <p className="text-xs text-gray-500 mt-3">
              The sender ID that will appear on SMS messages by default.
            </p>
          </div>
        </div>

        {/* Routes Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Default Route
            </h2>
            <p className="text-sm text-gray-500">
              Set the default message routing strategy
            </p>
          </div>

          <div>
            <label
              htmlFor="route"
              className="block text-sm font-semibold text-gray-700 mb-2.5"
            >
              Route
            </label>
            <HeadlessSelect
              value={settings.default_route}
              onChange={(value) => handleRouteChange(value as string)}
              options={routeOptions}
              placeholder="Select route"
            />
            <p className="text-xs text-gray-500 mt-3">
              Determines which carrier or gateway handles message delivery.
            </p>
          </div>
        </div>

        {/* Do Not Disturb (DND) Settings Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Do Not Disturb (DND) Settings
            </h2>
            <p className="text-sm text-gray-500">
              Configure default quiet hours for message delivery
            </p>
          </div>

          <div className="space-y-6">
            {/* DND Enabled */}
            <div className="flex items-center gap-4">
              <input
                id="dnd-enabled"
                type="checkbox"
                checked={settings.dnd_enabled}
                onChange={(e) => handleDNDEnabledChange(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded"
              />
              <label
                htmlFor="dnd-enabled"
                className="text-sm font-semibold text-gray-700"
              >
                Enable Do Not Disturb
              </label>
            </div>

            {/* DND Settings - Only show if enabled */}
            {settings.dnd_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                {/* DND Days */}
                <div>
                  <label
                    htmlFor="dnd-days"
                    className="block text-sm font-semibold text-gray-700 mb-2.5"
                  >
                    Apply To
                  </label>
                  <HeadlessSelect
                    value={settings.dnd_days}
                    onChange={(value) => handleDNDDaysChange(value as string)}
                    options={dndDaysOptions}
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
                  <HeadlessSelect
                    value={settings.dnd_start_time}
                    onChange={(value) =>
                      handleDNDStartTimeChange(value as string)
                    }
                    options={startTimeOptions}
                    placeholder="Select start time"
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
                  <HeadlessSelect
                    value={settings.dnd_end_time}
                    onChange={(value) =>
                      handleDNDEndTimeChange(value as string)
                    }
                    options={endTimeOptions}
                    placeholder="Select end time"
                  />
                </div>

                {/* Preview */}
                <div className="md:col-span-2 p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">
                    DND Window Preview:
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {settings.dnd_days === "weekdays" && "Monday - Friday: "}
                    {settings.dnd_days === "weekends" && "Saturday - Sunday: "}
                    {settings.dnd_days === "daily" && "Daily: "}
                    {settings.dnd_days === "custom" && "Custom Days: "}
                    {settings.dnd_start_time} to {settings.dnd_end_time}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Messages will not be delivered during these hours.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Settings Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Display Theme
            </h2>
            <p className="text-sm text-gray-500">
              Choose your preferred color scheme
            </p>
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

        {/* Notification Preferences Card */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 lg:p-8 lg:col-span-2`}
        >
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Notification Preferences
            </h2>
            <p className="text-sm text-gray-500">
              Configure how and when you receive notifications
            </p>
          </div>

          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive updates via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.email_notifications_enabled}
                  onChange={(e) =>
                    updateNotificationSettings({
                      email_notifications_enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </div>

              {notificationSettings.email_notifications_enabled && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Email Digest Frequency
                  </label>
                  <HeadlessSelect
                    value={notificationSettings.email_digest_frequency}
                    onChange={(value) =>
                      updateNotificationSettings({
                        email_digest_frequency: value as any,
                      })
                    }
                    options={[
                      {
                        label: "Instant - Get notified immediately",
                        value: "instant",
                      },
                      {
                        label: "Daily Digest - Summary once per day",
                        value: "daily",
                      },
                      {
                        label: "Weekly Digest - Summary once per week",
                        value: "weekly",
                      },
                      {
                        label: "Never - Disable email notifications",
                        value: "never",
                      },
                    ]}
                    placeholder="Select frequency"
                  />
                </div>
              )}
            </div>

            {/* In-App Notifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    In-App Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Show notifications in the app
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.in_app_notifications_enabled}
                  onChange={(e) =>
                    updateNotificationSettings({
                      in_app_notifications_enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </div>

              {notificationSettings.in_app_notifications_enabled && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notificationSettings.in_app_sound_enabled}
                      onChange={(e) =>
                        updateNotificationSettings({
                          in_app_sound_enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Play sound for notifications
                    </span>
                  </label>
                  {notificationSettings.in_app_sound_enabled && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notification Sound
                      </label>
                      <HeadlessSelect
                        value={
                          notificationSettings.notification_sound || "default"
                        }
                        onChange={(value) =>
                          updateNotificationSettings({
                            notification_sound: value as any,
                          })
                        }
                        options={[
                          {
                            label: "Default - Classic notification",
                            value: "default",
                          },
                          { label: "Chime - Soft bell sound", value: "chime" },
                          { label: "Ding - Quick alert", value: "ding" },
                          { label: "Pop - Subtle pop", value: "pop" },
                          { label: "Tone - Professional tone", value: "tone" },
                        ]}
                        placeholder="Select sound"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Browser Notifications */}
            <div className="bg-gray-50 pb-2 rounded-lg">
              <div className="flex items-center justify-between  ">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Browser Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Desktop push notifications even when app is closed
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.desktop_notifications_enabled}
                  onChange={(e) =>
                    updateNotificationSettings({
                      desktop_notifications_enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </div>
            </div>

            {/* SMS Alerts */}
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="flex items-center justify-between ">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    SMS Alerts
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Critical alerts via SMS (may incur charges)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.sms_alerts_enabled}
                  onChange={(e) =>
                    updateNotificationSettings({
                      sms_alerts_enabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-emerald-600 rounded"
                />
              </div>
            </div>

            {/* Notification Categories */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Notification Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(
                  notificationSettings.notification_categories,
                ).map(([category, enabled]) => (
                  <label key={category} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        updateNotificationSettings({
                          notification_categories: {
                            ...notificationSettings.notification_categories,
                            [category]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {category.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
