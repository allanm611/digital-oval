/**
 * Settings Helper Utilities
 * Provides functions to read and manage application settings from localStorage
 */

export interface AppSettings {
  country?: string;
  country_code?: string;
  language?: string;
  timezone?: string;
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

/**
 * All available timezone options
 */
export const TIMEZONE_OPTIONS = [
  { label: "UTC", value: "UTC" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "America/Chicago", value: "America/Chicago" },
  { label: "America/Denver", value: "America/Denver" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "America/Toronto", value: "America/Toronto" },
  { label: "America/Vancouver", value: "America/Vancouver" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Paris", value: "Europe/Paris" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
  { label: "Europe/Rome", value: "Europe/Rome" },
  { label: "Europe/Madrid", value: "Europe/Madrid" },
  { label: "Europe/Amsterdam", value: "Europe/Amsterdam" },
  { label: "Europe/Brussels", value: "Europe/Brussels" },
  { label: "Europe/Zurich", value: "Europe/Zurich" },
  { label: "Europe/Vienna", value: "Europe/Vienna" },
  { label: "Europe/Stockholm", value: "Europe/Stockholm" },
  { label: "Europe/Oslo", value: "Europe/Oslo" },
  { label: "Europe/Copenhagen", value: "Europe/Copenhagen" },
  { label: "Europe/Helsinki", value: "Europe/Helsinki" },
  { label: "Europe/Warsaw", value: "Europe/Warsaw" },
  { label: "Europe/Lisbon", value: "Europe/Lisbon" },
  { label: "Europe/Athens", value: "Europe/Athens" },
  { label: "Europe/Dublin", value: "Europe/Dublin" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
  { label: "Asia/Seoul", value: "Asia/Seoul" },
  { label: "Asia/Shanghai", value: "Asia/Shanghai" },
  { label: "Asia/Hong_Kong", value: "Asia/Hong_Kong" },
  { label: "Asia/Singapore", value: "Asia/Singapore" },
  { label: "Asia/Kuala_Lumpur", value: "Asia/Kuala_Lumpur" },
  { label: "Asia/Bangkok", value: "Asia/Bangkok" },
  { label: "Asia/Jakarta", value: "Asia/Jakarta" },
  { label: "Asia/Manila", value: "Asia/Manila" },
  { label: "Asia/Ho_Chi_Minh", value: "Asia/Ho_Chi_Minh" },
  { label: "Asia/Dubai", value: "Asia/Dubai" },
  { label: "Asia/Riyadh", value: "Asia/Riyadh" },
  { label: "Asia/Jerusalem", value: "Asia/Jerusalem" },
  { label: "Asia/Istanbul", value: "Asia/Istanbul" },
  { label: "Asia/Moscow", value: "Asia/Moscow" },
  { label: "Africa/Johannesburg", value: "Africa/Johannesburg" },
  { label: "Africa/Cairo", value: "Africa/Cairo" },
  { label: "Africa/Lagos", value: "Africa/Lagos" },
  { label: "Africa/Nairobi", value: "Africa/Nairobi" },
  { label: "Africa/Dar_es_Salaam", value: "Africa/Dar_es_Salaam" },
  { label: "Africa/Kampala", value: "Africa/Kampala" },
  { label: "Africa/Accra", value: "Africa/Accra" },
  { label: "America/Sao_Paulo", value: "America/Sao_Paulo" },
  { label: "America/Buenos_Aires", value: "America/Buenos_Aires" },
  { label: "America/Mexico_City", value: "America/Mexico_City" },
  { label: "America/Santiago", value: "America/Santiago" },
  { label: "America/Bogota", value: "America/Bogota" },
];
