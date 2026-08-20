import type { LifeDomain, Memory, Project, Reminder, ResurfacingCandidate, Task } from '../../types/models';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESURFACE_WINDOW_DAYS = 7;
const NEGLECTED_PROJECT_DAYS = 10;
const NEGLECTED_DOMAIN_DAYS = 7;
const NEVER_REVISITED_MIN_AGE_DAYS = 2;

export interface RankItemsInput {
  tasks: Task[];
  reminders: Reminder[];
  projects: Project[];
  memories: Memory[];
  now?: Date;
  /** How many neglected-domain items may appear (spec: never more than one). */
  maxNeglectedDomainItems?: number;
}

/**
 * Deterministic ranking for "Right Now" / resurfacing (spec section 8). The LLM never decides
 * what appears here — it may only explain *why* something appeared, using `reason`.
 *
 * Priority order:
 *   1. Overdue tasks or reminders
 *   2. Items due within the next 7 days
 *   3. Items explicitly marked important (priority = "high")
 *   4. Saved items (memories) that have never been revisited
 *   5. Active projects with no activity for a configurable period
 *   6. One neglected life-domain item, at most
 */
export function rankItems(input: RankItemsInput): ResurfacingCandidate[] {
  const now = input.now ?? new Date();
  const maxNeglectedDomainItems = input.maxNeglectedDomainItems ?? 1;
  const candidates: ResurfacingCandidate[] = [];

  const isSnoozed = (snoozedUntil: string | null) => !!snoozedUntil && new Date(snoozedUntil) > now;

  // Tier 1 & 2: overdue / due-soon tasks.
  for (const task of input.tasks) {
    if (task.status === 'done' || task.status === 'cancelled') continue;
    if (isSnoozed(task.snoozed_until)) continue;
    if (!task.due_at) continue;

    const due = new Date(task.due_at);
    const overdue = due.getTime() < now.getTime();
    const dueSoon = !overdue && due.getTime() - now.getTime() <= RESURFACE_WINDOW_DAYS * DAY_MS;

    if (overdue) {
      candidates.push(makeCandidate('task', task.id, task.title, task.domain, overdue0(due, now), 'Overdue', 1000, task.due_at));
    } else if (dueSoon) {
      candidates.push(
        makeCandidate('task', task.id, task.title, task.domain, `Due ${relativeDay(due, now)}`, 'Due soon', 800, task.due_at)
      );
    } else if (task.priority === 'high') {
      candidates.push(
        makeCandidate('task', task.id, task.title, task.domain, null, 'Marked important', 600, task.due_at)
      );
    }
  }

  // High-priority tasks with no due date still count as "explicitly marked important".
  for (const task of input.tasks) {
    if (task.status === 'done' || task.status === 'cancelled') continue;
    if (isSnoozed(task.snoozed_until)) continue;
    if (task.due_at) continue; // already handled above
    if (task.priority === 'high') {
      candidates.push(makeCandidate('task', task.id, task.title, task.domain, null, 'Marked important', 600, null));
    }
  }

  // Tier 1 & 2: overdue / due-soon reminders.
  for (const reminder of input.reminders) {
    if (reminder.status !== 'scheduled') continue;
    const due = new Date(reminder.reminder_at);
    const overdue = due.getTime() < now.getTime();
    const dueSoon = !overdue && due.getTime() - now.getTime() <= RESURFACE_WINDOW_DAYS * DAY_MS;

    if (overdue) {
      candidates.push(
        makeCandidate('reminder', reminder.id, reminder.title, null, overdue0(due, now), 'Overdue', 950, reminder.reminder_at)
      );
    } else if (dueSoon) {
      candidates.push(
        makeCandidate(
          'reminder',
          reminder.id,
          reminder.title,
          null,
          `Due ${relativeDay(due, now)}`,
          'Due soon',
          750,
          reminder.reminder_at
        )
      );
    }
  }

  // Tier 4: memories never revisited (last_viewed_at is null), old enough to be worth a nudge.
  for (const memory of input.memories) {
    if (!memory.active) continue;
    if (memory.last_viewed_at) continue;
    const createdAgeDays = (now.getTime() - new Date(memory.created_at).getTime()) / DAY_MS;
    if (createdAgeDays < NEVER_REVISITED_MIN_AGE_DAYS) continue;

    const score = memory.importance === 'high' ? 500 : 400;
    candidates.push(makeCandidate('memory', memory.id, memory.title, memory.domain, null, 'Saved, never revisited', score, null));
  }

  // Tier 5: active projects with no recent activity.
  const neglectedProjects: ResurfacingCandidate[] = [];
  for (const project of input.projects) {
    if (project.status !== 'active') continue;
    const lastActivity = project.last_activity_at ? new Date(project.last_activity_at) : new Date(project.created_at);
    const idleDays = (now.getTime() - lastActivity.getTime()) / DAY_MS;
    if (idleDays < NEGLECTED_PROJECT_DAYS) continue;

    neglectedProjects.push(
      makeCandidate(
        'project',
        project.id,
        project.title,
        project.domain,
        project.where_left_off,
        `No activity for ${Math.floor(idleDays)} days`,
        300,
        null
      )
    );
  }
  candidates.push(...neglectedProjects);

  // Tier 6: at most one neglected-domain nudge, and never repeat one already surfaced today.
  const neglectedDomain = pickNeglectedDomainCandidate(input, now, maxNeglectedDomainItems);
  candidates.push(...neglectedDomain);

  // Stable sort: score desc, then earliest due date, then creation-agnostic id for determinism.
  return candidates
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : compareDue(a.dueAt, b.dueAt)))
    .filter(dedupeByRefId());
}

function dedupeByRefId() {
  const seen = new Set<string>();
  return (candidate: ResurfacingCandidate) => {
    const key = `${candidate.kind}:${candidate.refId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}

function compareDue(a: string | null, b: string | null): number {
  if (a && b) return new Date(a).getTime() - new Date(b).getTime();
  if (a) return -1;
  if (b) return 1;
  return 0;
}

function pickNeglectedDomainCandidate(
  input: RankItemsInput,
  now: Date,
  maxItems: number
): ResurfacingCandidate[] {
  if (maxItems <= 0) return [];

  const lastTouchedByDomain = new Map<LifeDomain, number>();
  const touch = (domain: LifeDomain | null, at: string) => {
    if (!domain) return;
    const t = new Date(at).getTime();
    const existing = lastTouchedByDomain.get(domain);
    if (!existing || t > existing) lastTouchedByDomain.set(domain, t);
  };

  for (const task of input.tasks) touch(task.domain, task.updated_at);
  for (const project of input.projects) touch(project.domain, project.last_activity_at ?? project.updated_at);
  for (const memory of input.memories) touch(memory.domain, memory.updated_at);

  const stale = Array.from(lastTouchedByDomain.entries())
    .map(([domain, lastTouched]) => ({ domain, idleDays: (now.getTime() - lastTouched) / DAY_MS }))
    .filter((entry) => entry.idleDays >= NEGLECTED_DOMAIN_DAYS)
    .sort((a, b) => b.idleDays - a.idleDays);

  return stale.slice(0, maxItems).map((entry) =>
    makeCandidate(
      'memory',
      `neglected-domain:${entry.domain}`,
      neglectedDomainTitle(entry.domain),
      entry.domain,
      null,
      `Nothing added here in ${Math.floor(entry.idleDays)} days`,
      100,
      null
    )
  );
}

function neglectedDomainTitle(domain: LifeDomain): string {
  const label = domain.charAt(0).toUpperCase() + domain.slice(1);
  return label;
}

function makeCandidate(
  kind: ResurfacingCandidate['kind'],
  refId: string,
  title: string,
  domain: LifeDomain | null,
  subtitle: string | null,
  reason: string,
  score: number,
  dueAt: string | null
): ResurfacingCandidate {
  return { id: `${kind}:${refId}`, kind, refId, title, domain, subtitle, reason, score, dueAt };
}

function overdue0(due: Date, now: Date): string {
  const days = Math.floor((now.getTime() - due.getTime()) / DAY_MS);
  if (days <= 0) return 'Overdue';
  if (days === 1) return 'Overdue by 1 day';
  return `Overdue by ${days} days`;
}

function relativeDay(due: Date, now: Date): string {
  const days = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
