/**
 * A small, locally-bundled set of daily reflections — Quran verses and short quotes —
 * rotated deterministically by day of year (see lib/reflections/getDailyReflection.ts).
 * No network call, no API key, no cost: matches spec section 17's "calm noticing" tone
 * rather than becoming another dashboard widget.
 *
 * Quran verses use the Sahih International translation. Review wording against a trusted
 * mushaf/translation before relying on this in production — it hasn't been checked against
 * a live source from this environment.
 */

export type DailyReflection = {
  type: 'quran' | 'quote';
  text: string;
  reference?: string;
};

export const DAILY_REFLECTIONS: DailyReflection[] = [
  { type: 'quran', text: 'For indeed, with hardship [will be] ease.', reference: 'Quran 94:5' },
  { type: 'quote', text: 'Small, steady steps are still progress.' },
  { type: 'quran', text: 'Allah does not charge a soul except with that within its capacity.', reference: 'Quran 2:286' },
  { type: 'quote', text: 'Rest is part of the work, not a break from it.' },
  { type: 'quran', text: 'And whoever relies upon Allah — then He is sufficient for him.', reference: 'Quran 65:3' },
  { type: 'quote', text: "You don't have to finish everything today — just begin." },
  { type: 'quran', text: 'Seek help through patience and prayer. Indeed, Allah is with the patient.', reference: 'Quran 2:153' },
  { type: 'quote', text: 'What you tend to grows. Tend to yourself too.' },
  { type: 'quran', text: 'Unquestionably, by the remembrance of Allah hearts are assured.', reference: 'Quran 13:28' },
  { type: 'quote', text: 'A quiet day is not a wasted one.' },
  { type: 'quran', text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.', reference: 'Quran 39:53' },
  { type: 'quote', text: "Progress is rarely a straight line — and that's alright." },
  { type: 'quran', text: 'So do not weaken and do not grieve, and you will be superior if you are true believers.', reference: 'Quran 3:139' },
  { type: 'quote', text: 'You are allowed to move at your own pace.' },
  { type: 'quran', text: 'My Lord, expand for me my breast and ease for me my task.', reference: 'Quran 20:25–26' },
  { type: 'quote', text: 'Notice one good thing before the day ends.' },
];
