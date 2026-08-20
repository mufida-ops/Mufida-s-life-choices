import { classifyCapture } from './classifyCapture';

const REFERENCE = new Date('2026-08-19T10:00:00.000Z'); // Wednesday
const TZ = 'UTC';

describe('classifyCapture', () => {
  it('classifies a plain statement as a task', () => {
    const result = classifyCapture('I need to send that document to Sara.', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });
    expect(result.kind).toBe('task');
    expect(result.title).toBe('I need to send that document to Sara.');
  });

  it('classifies "remind me" with a date into a reminder', () => {
    const result = classifyCapture('Remind me Friday to finish chapter three.', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });
    expect(result.kind).toBe('reminder');
    if (result.kind === 'reminder') {
      expect(result.title).toBe('Finish chapter three');
      expect(result.reminderAt.getUTCDay()).toBe(5);
      expect(result.timeIsCertain).toBe(false);
    }
  });

  it('classifies "in two hours remind me" with a certain time', () => {
    const result = classifyCapture('In two hours remind me to send the document', {
      referenceDate: REFERENCE,
      timezone: TZ,
    });
    expect(result.kind).toBe('reminder');
    if (result.kind === 'reminder') {
      expect(result.timeIsCertain).toBe(true);
      expect(result.title).toBe('Send the document');
    }
  });

  it('falls back to a task when "remind me" has no parseable date', () => {
    const result = classifyCapture('Remind me about the thing', { referenceDate: REFERENCE, timezone: TZ });
    expect(result.kind).toBe('task');
  });

  it('classifies an idea phrase as an idea', () => {
    const result = classifyCapture('I had an idea for the website.', { referenceDate: REFERENCE, timezone: TZ });
    expect(result.kind).toBe('idea');
  });
});
