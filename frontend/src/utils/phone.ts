export const E164_EXAMPLE = '+919876543210';

export function isE164(phone: string) {
  if (!phone || typeof phone !== 'string') return false;
  const e164 = /^\+[1-9]\d{7,14}$/;
  return e164.test(phone.trim());
}

export default isE164;
