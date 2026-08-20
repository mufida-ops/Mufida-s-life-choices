import * as chrono from 'chrono-node';

export interface ParsedDate {
  /** Resolved absolute instant. */
  date: Date;
  /** The substring chrono matched, e.g. "Friday" or "in three days". */
  matchedText: string;
  /** False when chrono had to guess the time of day (e.g. "Friday" with no time given). */
  timeIsCertain: boolean;
  /** Text with the matched date phrase removed, trimmed — useful as the reminder/task title. */
  remainingText: string;
}

export interface ParseNaturalDateOptions {
  /** "Now", in the user's timezone. Defaults to the current instant. */
  referenceDate?: Date;
  /** IANA timezone name, e.g. "Asia/Dubai". Falls back to the device's local timezone. */
  timezone?: string;
}

/**
 * Deterministically resolves the first date/time expression found in free text.
 * This intentionally does not use the LLM — natural-date parsing must be reliable
 * and testable (spec section 10), with the AI layer only deciding *what* to do.
 */
export function parseNaturalDate(text: string, options: ParseNaturalDateOptions = {}): ParsedDate | null {
  const referenceDate = options.referenceDate ?? new Date();
  const results = chrono.parse(
    text,
    { instant: referenceDate, timezone: options.timezone },
    { forwardDate: true }
  );

  const result = results[0];
  if (!result) return null;

  const remainingText = (text.slice(0, result.index) + text.slice(result.index + result.text.length))
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  return {
    date: result.date(),
    matchedText: result.text,
    timeIsCertain: result.start.isCertain('hour'),
    remainingText,
  };
}

/** "Friday, 21 August at 9:00 AM" — used to show the user what the system understood. */
export function formatParsedDate(date: Date, timezone?: string): string {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'long' }).format(date);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  return `${weekday}, ${day} ${month} at ${timePart}`;
}
