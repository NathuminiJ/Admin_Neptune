/** Small formatting helpers shared across the dashboard UI. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function formatWeight(kg: number | null | undefined): string {
  return kg == null ? '—' : `${kg.toFixed(1)} kg`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function colourHex(value: string): string {
  const map: Record<string, string> = {
    WHITE: '#ffffff',
    GREEN: '#2c8a52',
    BLUE: '#2563ab',
    RED: '#c1352b',
    BLACK: '#1c1c1c',
    SILVER: '#b6bdb9',
    YELLOW: '#d9a512',
  };
  return map[value] ?? '#e8efe9';
}

/**
 * Sri Lankan NIC (National Identity Card) validation.
 *
 * Supports both old and new formats:
 *
 * OLD FORMAT (pre-2016): 9 digits + V or X
 *   - First 2 digits: Birth year (last 2 digits)
 *   - Next 3 digits: Day of year (001-366)
 *   - Next 4 digits: Sequence number
 *   - Last character: V (male) or X (female)
 *
 * NEW FORMAT (2016+): 12 digits
 *   - First 4 digits: Birth year (YYYY)
 *   - Next 3 digits: Day of year (001-366)
 *   - Next 4 digits: Sequence number
 *   - Last digit: Check digit
 */
export interface NicValidationResult {
  valid: boolean;
  format: 'OLD' | 'NEW' | null;
  gender?: 'MALE' | 'FEMALE';
  birthYear?: number;
  error?: string;
}

export function validateSriLankanNic(nic: string): NicValidationResult {
  const trimmed = nic.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, format: null, error: 'NIC is required' };
  }

  // New format: 12 digits
  const newFormatRegex = /^\d{12}$/;
  // Old format: 9 digits + V or X
  const oldFormatRegex = /^\d{9}[VX]$/;

  if (newFormatRegex.test(trimmed)) {
    return validateNewFormat(trimmed);
  }

  if (oldFormatRegex.test(trimmed)) {
    return validateOldFormat(trimmed);
  }

  return {
    valid: false,
    format: null,
    error: 'Invalid NIC format. Use 9 digits + V/X (old) or 12 digits (new)',
  };
}

function validateNewFormat(nic: string): NicValidationResult {
  const year = parseInt(nic.substring(0, 4), 10);
  const dayOfYear = parseInt(nic.substring(4, 7), 10);

  // Validate birth year (reasonable range)
  const currentYear = new Date().getFullYear();
  if (year < 1920 || year > currentYear) {
    return {
      valid: false,
      format: 'NEW',
      error: `Birth year must be between 1920 and ${currentYear}`,
    };
  }

  // Validate day of year
  if (dayOfYear < 1 || dayOfYear > 366) {
    return {
      valid: false,
      format: 'NEW',
      error: 'Day of year must be between 001 and 366',
    };
  }

  // Check if day is valid for the specific year (leap year handling)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const maxDay = isLeapYear ? 366 : 365;
  if (dayOfYear > maxDay) {
    return {
      valid: false,
      format: 'NEW',
      error: `Day ${dayOfYear} is invalid for year ${year}`,
    };
  }

  return {
    valid: true,
    format: 'NEW',
    birthYear: year,
  };
}

function validateOldFormat(nic: string): NicValidationResult {
  const lastChar = nic.charAt(9); // V or X
  const yearDigits = parseInt(nic.substring(0, 2), 10);
  const dayOfYear = parseInt(nic.substring(2, 5), 10);

  // Determine birth year (assume 1900s for < 50, 2000s for >= 50)
  const birthYear = yearDigits < 50 ? 1900 + yearDigits : 2000 + yearDigits;

  // Validate birth year
  const currentYear = new Date().getFullYear();
  if (birthYear < 1920 || birthYear > currentYear) {
    return {
      valid: false,
      format: 'OLD',
      error: `Birth year must be between 1920 and ${currentYear}`,
    };
  }

  // Validate day of year
  if (dayOfYear < 1 || dayOfYear > 366) {
    return {
      valid: false,
      format: 'OLD',
      error: 'Day of year must be between 001 and 366',
    };
  }

  // Check if day is valid for the specific year (leap year handling)
  const isLeapYear = (birthYear % 4 === 0 && birthYear % 100 !== 0) || birthYear % 400 === 0;
  const maxDay = isLeapYear ? 366 : 365;
  if (dayOfYear > maxDay) {
    return {
      valid: false,
      format: 'OLD',
      error: `Day ${dayOfYear} is invalid for year ${birthYear}`,
    };
  }

  // V = male, X = female
  const gender = lastChar === 'V' ? 'MALE' : 'FEMALE';

  return {
    valid: true,
    format: 'OLD',
    gender,
    birthYear,
  };
}

/**
 * Get a user-friendly hint text for NIC validation based on format
 */
export function getNicHint(format?: 'OLD' | 'NEW' | null): string {
  if (format === 'OLD') {
    return 'Old format: 9 digits + V (male) or X (female)';
  }
  if (format === 'NEW') {
    return 'New format: 12 digits (YYYYDDD + serial)';
  }
  return 'e.g. 911234567V or 199112345678';
}