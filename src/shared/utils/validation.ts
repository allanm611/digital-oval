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
 *
 * Examples of invalid formats:
 * - 0712345678 (local format without country code)
 * - 0754567890 (local format)
 * - 075... (local format)
 * - 070... (local format)
 *
 * @param msisdn - Phone number string (digits only or with +/-/space/parentheses)
 * @returns true if phone number is valid, false otherwise
 */
export function isValidCountryCodePhone(msisdn: string): boolean {
  if (!msisdn) return false;

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
