import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

// Example phone number in E.164 format - India
export const E164_EXAMPLE = '+919876543210';

/**
 * Validates phone number format using libphonenumber-js for robust E.164 validation
 * @param phone - Phone number to validate
 * @param defaultCountry - Default country code if number doesn't include country code (e.g., 'IN' for India)
 * @returns true if phone number is valid E.164 format
 */
export function isE164(phone: string, defaultCountry?: string): boolean {
  if (!phone || typeof phone !== 'string') return false;

  const trimmed = phone.trim();

  try {
    // Use libphonenumber-js to validate the phone number
    // This properly validates against real country codes and phone number rules
    return isValidPhoneNumber(trimmed, defaultCountry as any);
  } catch {
    return false;
  }
}

/**
 * Formats a phone number to E.164 format
 * @param phone - Phone number to format
 * @param defaultCountry - Default country code if number doesn't include country code
 * @returns E.164 formatted phone number or null if invalid
 */
export function formatToE164(phone: string, defaultCountry?: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  try {
    const parsed = parsePhoneNumber(phone.trim(), defaultCountry as any);
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets the country code from a phone number
 * @param phone - Phone number to extract country code from
 * @param defaultCountry - Default country code if number doesn't include country code
 * @returns Country code or null if unable to parse
 */
export function getCountryCode(phone: string, defaultCountry?: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  try {
    const parsed = parsePhoneNumber(phone.trim(), defaultCountry as any);
    if (parsed) {
      return parsed.country || null;
    }
    return null;
  } catch {
    return null;
  }
}

export default isE164;
