import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { setLanguageSettings } from "../../../shared/services/languageService";
import { formatDate } from "../../../shared/services/dateService";
import {  tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
// import DateFormatter from "../../../shared/components/DateFormatter";
import countries from "world-countries";
import currencyCodes from "currency-codes";

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
}

export default function SettingsPage() {
  const { success: showToast } = useToast();
  const { setLanguage, t } = useLanguage();

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
        <div className="flex flex-row items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium rounded-md text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap bg-[#252829]"
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
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-0">
        {/* Location Card */}
        <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 lg:p-8">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-2">
                Automatically set based on selected country
              </p>
            </div>
          </div>
        </div>

        {/* Localization Card */}
        <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 lg:p-8">
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
        <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 lg:p-8">
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
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(new Date(), { customFormat: settings.date_format })}
              </p>
            </div>
          </div>
        </div>

        {/* Currency & Number Formatting Card */}
        <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 lg:p-8">
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
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
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
      </div>
    </div>
  );
}
