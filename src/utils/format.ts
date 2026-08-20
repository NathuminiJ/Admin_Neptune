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
 * Supports exactly two formats:
 *
 * OLD FORMAT (pre-2016): 9 digits + V or X (lowercase accepted)
 * NEW FORMAT (2016+):     exactly 12 digits
 *
 * Equivalent rule: ^(?:\d{9}[VvXx]|\d{12})$
 */
export interface NicValidationResult {
  valid: boolean;
  format: 'OLD' | 'NEW' | null;
  gender?: 'MALE' | 'FEMALE';
  birthYear?: number;
  error?: string;
}

const NIC_MATCH_REGEX = /^\d{9}[VvXx]$|^\d{12}$/;

export const NIC_INVALID_MESSAGE =
  'Enter a valid NIC: 12 digits, or 9 digits followed by V or X.';

export function validateSriLankanNic(nic: string): NicValidationResult {
  const trimmed = nic.trim();

  if (!trimmed) {
    return { valid: false, format: null, error: 'NIC is required' };
  }

  if (NIC_MATCH_REGEX.test(trimmed)) {
    return {
      valid: true,
      format: /^\d{9}[VvXx]$/.test(trimmed) ? 'OLD' : 'NEW',
    };
  }

  return { valid: false, format: null, error: NIC_INVALID_MESSAGE };
}

/**
 * Normalize a NIC before sending it to the backend:
 * - trim leading/trailing whitespace
 * - uppercase the old-format V/X suffix (lowercase v/x accepted on input)
 * - never removes characters inside the NIC
 */
export function normalizeNic(nic: string): string {
  const trimmed = nic.trim();
  return trimmed.replace(/[vx](?=$)/i, (c) => c.toUpperCase());
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