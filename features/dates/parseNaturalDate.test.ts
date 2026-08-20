import { formatParsedDate, parseNaturalDate } from './parseNaturalDate';

// Wednesday 19 August 2026, 10:00 in the reference timezone.
const REFERENCE = new Date('2026-08-19T10:00:00.000Z');
const TZ = 'UTC';

describe('parseNaturalDate', () => {
  it('resolves a weekday name to the next occurrence, defaulting the time', () => {
    const result = parseNaturalDate('Remind me Friday to finish chapter three.', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });

    expect(result).not.toBeNull();
    expect(result!.date.getUTCDay()).toBe(5); // Friday
    expect(result!.date.getUTCDate()).toBe(21);
    expect(result!.timeIsCertain).toBe(false);
    expect(result!.remainingText).toBe('Remind me to finish chapter three');
  });

  it('resolves relative day offsets', () => {
    const result = parseNaturalDate('remind me in three days to call her', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });

    expect(result).not.toBeNull();
    expect(result!.date.getUTCDate()).toBe(22);
  });

  it('resolves relative hour offsets with a certain time', () => {
    const result = parseNaturalDate('in two hours remind me to send the document', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });

    expect(result).not.toBeNull();
    expect(result!.date.getTime() - REFERENCE.getTime()).toBe(2 * 60 * 60 * 1000);
    expect(result!.timeIsCertain).toBe(true);
  });

  it('resolves "next week" relative to the reference date', () => {
    const result = parseNaturalDate('next week remind me about the book', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });

    expect(result).not.toBeNull();
    expect(result!.date.getTime()).toBeGreaterThan(REFERENCE.getTime());
  });

  it('returns null when there is no date in the text', () => {
    expect(parseNaturalDate('I need to buy toothpaste.', { referenceDate: REFERENCE, timezone: TZ })).toBeNull();
  });

  it('formats a resolved date for display', () => {
    const friday = new Date('2026-08-21T09:00:00.000Z');
    expect(formatParsedDate(friday, TZ)).toBe('Friday, 21 August at 9:00 AM');
  });
});
