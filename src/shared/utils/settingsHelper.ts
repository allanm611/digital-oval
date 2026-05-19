/**
 * Settings Helper Utilities
 * Provides functions to read and manage application settings from localStorage
 */

export interface AppSettings {
  country?: string;
  country_code?: string;
  language?: string;
  timezone?: string;
  timezone_offset?: string;
  date_format?: string;
  currency?: string;
  number_formatting?: string;
  character_set?: string;
  default_communication_channel?: string;
  default_sender_id?: string;
  default_route?: string;
  dnd_enabled?: boolean;
  dnd_start_time?: string;
  dnd_end_time?: string;
  dnd_days?: string;
  notificationSound?: string;
  theme?: "light" | "dark";
}

/**
 * Get all application settings from localStorage
 */
export const getAppSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem("appSettings");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading settings from localStorage:", error);
  }
  return {};
};

/**
 * Get timezone from settings, with fallback to UTC
 */
export const getSettingsTimezone = (): string => {
  const settings = getAppSettings();
  return settings.timezone || "UTC";
};

/**
 * Get timezone offset from settings, with fallback to +00:00
 */
export const getSettingsTimezoneOffset = (): string => {
  const settings = getAppSettings();
  return settings.timezone_offset || "+00:00";
};

/**
 * Get default communication channel from settings, with fallback to SMS
 */
export const getSettingsCommunicationChannel = (): string => {
  const settings = getAppSettings();
  return settings.default_communication_channel || "SMS";
};

/**
 * Get language from settings
 */
export const getSettingsLanguage = (): string => {
  const settings = getAppSettings();
  return settings.language || "English";
};

/**
 * Get country from settings
 */
export const getSettingsCountry = (): string => {
  const settings = getAppSettings();
  return settings.country || "Kenya";
};

/**
 * Get date format from settings
 */
export const getSettingsDateFormat = (): string => {
  const settings = getAppSettings();
  return settings.date_format || "YYYY-MM-DD";
};

/**
 * Get currency from settings
 */
export const getSettingsCurrency = (): string => {
  const settings = getAppSettings();
  return settings.currency || "KES";
};

/**
 * Get theme from settings
 */
export const getSettingsTheme = (): "light" | "dark" => {
  const settings = getAppSettings();
  return settings.theme || "light";
};

