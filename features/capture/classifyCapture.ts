import { parseNaturalDate } from '../dates/parseNaturalDate';

export type CaptureClassification =
  | { kind: 'reminder'; title: string; reminderAt: Date; timeIsCertain: boolean }
  | { kind: 'idea'; title: string }
  | { kind: 'task'; title: string };

const REMINDER_TRIGGER = /\b(remind me|reminder|don'?t let me forget)\b/i;
const IDEA_TRIGGER = /\b(idea for|i had an idea|what if)\b/i;

/**
 * Deterministic, local classification of a raw capture (spec section 5: "accept messy
 * thoughts first, organise second"). This is a stand-in for the Phase 3 AI classification —
 * same shape of output, so swapping it for a Claude tool-use call later is a drop-in change
 * (see lib/ai/actions.ts). It never blocks capture: classification only decides how the item
 * is filed after it has already been saved.
 */
export function classifyCapture(
  rawText: string,
  options: { referenceDate?: Date; timezone?: string } = {}
): CaptureClassification {
  const text = rawText.trim();

  if (REMINDER_TRIGGER.test(text)) {
    const parsed = parseNaturalDate(text, options);
    if (parsed) {
      const title = stripReminderPhrasing(parsed.remainingText || text);
      return { kind: 'reminder', title, reminderAt: parsed.date, timeIsCertain: parsed.timeIsCertain };
    }
  }

  if (IDEA_TRIGGER.test(text)) {
    return { kind: 'idea', title: text };
  }

  return { kind: 'task', title: text };
}

function stripReminderPhrasing(text: string): string {
  return text
    .replace(/^(remind me|reminder|don'?t let me forget)\s*(to|that|about)?\s*/i, '')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
