import { DAILY_REFLECTIONS, type DailyReflection } from '../../constants/dailyReflections';

/** Same reflection all day, a new one the next day — deterministic, no storage needed. */
export function getDailyReflection(date: Date = new Date()): DailyReflection {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];
}
