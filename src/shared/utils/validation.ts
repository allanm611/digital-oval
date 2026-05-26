// Valid country codes
const VALID_COUNTRY_CODES = new Set([
  "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41",
  "43", "44", "45", "46", "47", "48", "49", "51", "52", "53", "54", "55", "56",
  "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86",
  "90", "91", "92", "93", "94", "95", "98", "212", "213", "216", "218", "220",
  "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231",
  "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242",
  "243", "244", "245", "246", "248", "249", "250", "251", "252", "253", "254",
  "255", "256", "257", "258", "260", "261", "262", "263", "264", "265", "266",
  "267", "268", "269", "290", "291", "297", "298", "299", "350", "351", "352",
  "353", "354", "355", "356", "357", "358", "359", "370", "371", "372", "373",
  "374", "375", "376", "377", "378", "380", "381", "382", "383", "384", "385",
  "386", "387", "389", "420", "421", "423", "500", "501", "502", "503", "504",
  "505", "506", "507", "508", "509", "590", "591", "592", "593", "594", "595",
  "596", "597", "598", "599", "670", "672", "673", "674", "675", "676", "677",
  "678", "679", "680", "681", "682", "683", "684", "685", "686", "687", "688",
  "689", "690", "691", "692", "850", "852", "853", "855", "856", "880", "886",
  "960", "961", "962", "963", "964", "965", "966", "967", "968", "970", "971",
  "972", "973", "974", "975", "976", "977", "992", "993", "994", "995", "996",
  "998",
]);

/**
 * Phone number validation utilities
 * Ensures phone numbers follow international format with country code
 */

/**
 * Validates that phone number starts with country code (not local format like 075, 070)
 * Accepts phone numbers without the "+" prefix but starting with country code digits
 *
 * Examples of valid formats:
 * - 254712345678 (Kenya +254)
 * - 254750902921 (Kenya +254)
 * - 1234567890 (USA +1)
 * - 33612345678 (France +33)
 * - 447911123456 (UK +44)
 * - +254 764 555 247 (formatted with spaces)
 * - (254) 764-5524 (formatted with parentheses and dash)
 *
 * Examples of invalid formats:
 * - 0712345678 (local format without country code)
 * - 0754567890 (local format)
 * - abc254764555247 (contains letters)
 * - 254abc5555 (contains letters)
 *
 * @param msisdn - Phone number string (digits only or with +/-/space/parentheses formatting)
 * @returns true if phone number is valid, false otherwise
 */
export function isValidCountryCodePhone(msisdn: string): boolean {
  if (!msisdn) return false;

  // First check: reject if it contains letters (invalid for phone numbers)
  if (/[a-zA-Z]/.test(msisdn)) return false;

  // Remove all non-digits
  const digits = msisdn.replace(/\D/g, "");

  // Must be at least 10 digits and at most 15 digits (standard international format)
  if (digits.length < 10 || digits.length > 15) return false;

  // Reject local formats starting with 0 (like 07xx, 06xx, 08xx, etc.)
  if (/^0/.test(digits)) return false;

  // Must start with 1-9 (country code prefix ranges from 1 to 99x)
  // Pattern: starts with 1-9, followed by 1-2 more digits (country code), then at least 6 more digits (subscriber number)
  // This ensures it starts with a country code, not a local number
  return /^[1-9]\d{1,2}\d{6,}$/.test(digits);
}

/**
 * Validates MSISDN and returns specific error message
 * @param msisdn - Phone number string
 * @returns Object with valid flag and specific error message if invalid
 */
export function validateMSISDN(msisdn: string): {
  valid: boolean;
  error?: string;
} {
  if (!msisdn || !msisdn.trim()) {
    return { valid: false, error: "MSISDN is required" };
  }

  // Check for letters
  if (/[a-zA-Z]/.test(msisdn)) {
    return { valid: false, error: "MSISDN cannot contain letters" };
  }

  // Remove all non-digits
  const digits = msisdn.replace(/\D/g, "");

  // Check length
  if (digits.length < 10) {
    return { valid: false, error: "MSISDN is too short (minimum 10 digits)" };
  }
  if (digits.length > 15) {
    return { valid: false, error: "MSISDN is too long (maximum 15 digits)" };
  }

  // Check for local format
  if (/^0/.test(digits)) {
    return { valid: false, error: "MSISDN must include country code" };
  }

  // Extract country code (1-3 digits)
  const countryCode = digits.match(/^[1-9]\d{0,2}/)?.[0];
  if (!countryCode) {
    return { valid: false, error: "MSISDN must start with a valid country code" };
  }

  // Validate country code exists
  if (!VALID_COUNTRY_CODES.has(countryCode)) {
    return { valid: false, error: `Country code +${countryCode} is not valid` };
  }

  // Validate format
  if (!/^[1-9]\d{1,2}\d{6,}$/.test(digits)) {
    return { valid: false, error: "MSISDN format is invalid. Use format: country code + number (e.g., 254712345678)" };
  }

  return { valid: true };
}

/**
 * Validates phone numbers (phone-only, no emails)
 * Used in phone-specific contexts like SMS/WhatsApp channels
 * @param phoneNumbers - Array of phone number strings
 * @returns Object with valid flag and array of invalid phone numbers
 */
export function validatePhoneOnly(phoneNumbers: string[]): {
  valid: boolean;
  invalidLines: string[];
} {
  const invalidLines: string[] = [];

  for (const phone of phoneNumbers) {
    if (!phone.trim()) continue;

    if (!isValidCountryCodePhone(phone)) {
      invalidLines.push(phone.trim());
    }
  }

  return {
    valid: invalidLines.length === 0,
    invalidLines,
  };
}

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that all contact entries are either valid emails or valid phone numbers
 * @param contacts - Array of contact strings (emails or phone numbers)
 * @returns true if all contacts are valid, false otherwise
 */
export function validateContacts(contacts: string[]): {
  valid: boolean;
  invalidLines: string[];
} {
  const invalidLines: string[] = [];

  for (const contact of contacts) {
    if (!contact.trim()) continue;

    const isValidPhoneNumber = isValidCountryCodePhone(contact);
    const isValidEmailAddress = isValidEmail(contact);

    if (!isValidPhoneNumber && !isValidEmailAddress) {
      invalidLines.push(contact.trim());
    }
  }

  return {
    valid: invalidLines.length === 0,
    invalidLines,
  };
}
