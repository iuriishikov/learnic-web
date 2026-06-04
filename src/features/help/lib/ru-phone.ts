// Russian phone number masking. The dialing prefix (`+7`) is shown as a fixed,
// non-editable addon, so the input area holds only the 10 national digits,
// formatted as `(XXX) XXX-XX-XX` as the user types.

export const RU_DIAL_PREFIX = '+7';
export const RU_PHONE_PLACEHOLDER = '(900) 000-00-00';
export const RU_PHONE_NATIONAL_LENGTH = 10;

/**
 * Reduce arbitrary input to at most 10 national digits, dropping a pasted
 * country code (a leading `7` or `8` on an over-long string — e.g. someone
 * pastes `8 900 …` or `+7 900 …`).
 */
export function toRuNationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (
    digits.length > RU_PHONE_NATIONAL_LENGTH &&
    (digits[0] === '7' || digits[0] === '8')
  ) {
    digits = digits.slice(1);
  }
  return digits.slice(0, RU_PHONE_NATIONAL_LENGTH);
}

/**
 * Format input as `(XXX) XXX-XX-XX`, progressively (partial input allowed).
 *
 * A separator is only emitted once the digit that follows it exists — we never
 * append a *trailing* `)`, space or `-`. Otherwise Backspace would delete that
 * trailing separator and the next reformat would immediately re-add it, making
 * the preceding digits impossible to erase.
 */
export function formatRuPhone(raw: string): string {
  const d = toRuNationalDigits(raw);
  if (!d) return '';

  let out = `(${d.slice(0, 3)}`;
  if (d.length > 3) out += `) ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

/** True once all 10 national digits are present. */
export function isCompleteRuPhone(value: string): boolean {
  return value.replace(/\D/g, '').length === RU_PHONE_NATIONAL_LENGTH;
}
