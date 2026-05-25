export const COUNTRIES = [
  { code: '+233', flag: '🇬🇭', label: '+233', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', label: '+234', name: 'Nigeria' },
  { code: '+27',  flag: '🇿🇦', label: '+27',  name: 'South Africa' },
  { code: '+225', flag: '🇨🇮', label: '+225', name: 'Ivory Coast' },
  { code: '+254', flag: '🇰🇪', label: '+254', name: 'Kenya' },
  { code: '+44',  flag: '🇬🇧', label: '+44',  name: 'UK' },
  { code: '+49',  flag: '🇩🇪', label: '+49',  name: 'Germany' },
  { code: '+1',   flag: '🇺🇸', label: '+1',   name: 'USA' },
];

// Expected digit counts AFTER the country code prefix
const DIGIT_LENGTHS: Record<string, number[]> = {
  '+233': [9],        // Ghana:        0XX XXX XXXX  → 9
  '+234': [10],       // Nigeria:      0XX XXXX XXXX → 10
  '+27':  [9],        // South Africa: 0XX XXX XXXX  → 9
  '+225': [8, 10],    // Ivory Coast:  old 8 / new 10
  '+254': [9],        // Kenya:        07X XXX XXXX  → 9
  '+44':  [10],       // UK:           07XXX XXXXXX  → 10
  '+49':  [8, 9, 10, 11], // Germany: variable
  '+1':   [10],       // USA:          XXX XXX XXXX  → 10
};

export function normalizePhone(countryCode: string, local: string): string {
  const num = local.trim().replace(/[\s\-().]/g, '');
  if (num.startsWith('00'))  return '+' + num.slice(2);
  if (num.startsWith('+'))   return num;
  if (num.startsWith('0'))   return countryCode + num.slice(1);
  return countryCode + num;
}

export function validatePhone(countryCode: string, local: string): string | null {
  const normalized = normalizePhone(countryCode, local);
  const afterCode  = normalized.slice(countryCode.length).replace(/\D/g, '');
  const expected   = DIGIT_LENGTHS[countryCode];
  if (!expected) return null;
  if (!expected.includes(afterCode.length)) {
    const counts = expected.length === 1
      ? `${expected[0]} digits`
      : `${expected[0]} or ${expected[expected.length - 1]} digits`;
    return `Expected ${counts} after the country code (got ${afterCode.length})`;
  }
  return null;
}
