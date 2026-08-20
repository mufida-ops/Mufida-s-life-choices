import type { Memory, Project, Reminder, Task } from '../../types/models';
import { rankItems } from './rankItems';

const NOW = new Date('2026-08-20T09:00:00.000Z');
const iso = (d: Date) => d.toISOString();
const daysFromNow = (days: number) => iso(new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000));

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    user_id: 'u1',
    project_id: null,
    title: 'Untitled task',
    notes: null,
    domain: 'work',
    status: 'open',
    priority: 'normal',
    start_at: null,
    due_at: null,
    completed_at: null,
    last_viewed_at: null,
    last_surfaced_at: null,
    snoozed_until: null,
    duration_minutes: null,
    depends_on_task_ids: [],
    created_at: daysFromNow(-30),
    updated_at: daysFromNow(0),
    ...overrides,
  };
}

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'reminder-1',
    user_id: 'u1',
    task_id: null,
    title: 'Untitled reminder',
    reminder_at: daysFromNow(1),
    notification_id: null,
    status: 'scheduled',
    created_at: daysFromNow(-1),
    updated_at: daysFromNow(-1),
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    user_id: 'u1',
    title: 'Untitled project',
    description: null,
    domain: 'creative',
    status: 'active',
    start_at: null,
    target_at: null,
    next_action: null,
    where_left_off: null,
    last_activity_at: daysFromNow(-30),
    created_at: daysFromNow(-30),
    updated_at: daysFromNow(-30),
    ...overrides,
  };
}

function memory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'memory-1',
    user_id: 'u1',
    type: 'general',
    title: 'Untitled memory',
    content: '',
    domain: null,
    importance: 'normal',
    active: true,
    last_viewed_at: null,
    last_surfaced_at: null,
    created_at: daysFromNow(-10),
    updated_at: daysFromNow(-10),
    ...overrides,
  };
}

describe('rankItems', () => {
  it('ranks overdue items above items merely due soon', () => {
    const result = rankItems({
      tasks: [
        task({ id: 't-soon', title: 'Due soon task', due_at: daysFromNow(2) }),
        task({ id: 't-overdue', title: 'Overdue task', due_at: daysFromNow(-1) }),
      ],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
    });

    expect(result[0].refId).toBe('t-overdue');
    expect(result[0].reason).toBe('Overdue');
    expect(result[1].refId).toBe('t-soon');
  });

  it('excludes completed, cancelled and snoozed tasks', () => {
    const result = rankItems({
      tasks: [
        task({ id: 'done', status: 'done', due_at: daysFromNow(-1) }),
        task({ id: 'cancelled', status: 'cancelled', due_at: daysFromNow(-1) }),
        task({ id: 'snoozed', due_at: daysFromNow(-1), snoozed_until: daysFromNow(5) }),
      ],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
    });

    expect(result).toHaveLength(0);
  });

  it('surfaces tasks marked important even without a due date', () => {
    const result = rankItems({
      tasks: [task({ id: 'important', priority: 'high', due_at: null })],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
    });

    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('Marked important');
  });

  it('surfaces memories that have never been revisited, but not brand-new ones', () => {
    const result = rankItems({
      tasks: [],
      reminders: [],
      projects: [],
      memories: [
        memory({ id: 'old-unread', created_at: daysFromNow(-5), last_viewed_at: null }),
        memory({ id: 'brand-new', created_at: daysFromNow(0), last_viewed_at: null }),
        memory({ id: 'already-viewed', created_at: daysFromNow(-5), last_viewed_at: daysFromNow(-1) }),
      ],
      now: NOW,
    });

    expect(result.map((r) => r.refId)).toEqual(['old-unread']);
  });

  it('surfaces active projects idle for 10+ days, not recently active ones', () => {
    const result = rankItems({
      tasks: [],
      reminders: [],
      projects: [
        project({ id: 'idle', last_activity_at: daysFromNow(-11) }),
        project({ id: 'recent', last_activity_at: daysFromNow(-1) }),
        project({ id: 'paused', status: 'paused', last_activity_at: daysFromNow(-30) }),
      ],
      memories: [],
      now: NOW,
    });

    expect(result.map((r) => r.refId)).toEqual(['idle']);
  });

  it('never surfaces more than one neglected-domain item', () => {
    const result = rankItems({
      tasks: [
        task({ id: 't-work', domain: 'work', updated_at: daysFromNow(-20) }),
        task({ id: 't-home', domain: 'home', updated_at: daysFromNow(-15) }),
      ],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
      maxNeglectedDomainItems: 1,
    });

    const neglectedDomainItems = result.filter((r) => r.reason.startsWith('Nothing added here'));
    expect(neglectedDomainItems).toHaveLength(1);
    // The most-neglected domain (work, 20 days) wins over home (15 days).
    expect(neglectedDomainItems[0].domain).toBe('work');
  });

  it('does not surface a domain touched within the last 7 days', () => {
    const result = rankItems({
      tasks: [task({ id: 't-active', domain: 'work', updated_at: daysFromNow(-1) })],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
    });

    expect(result.filter((r) => r.reason.startsWith('Nothing added here'))).toHaveLength(0);
  });

  it('deduplicates a candidate that would otherwise match multiple tiers', () => {
    const result = rankItems({
      tasks: [task({ id: 'overdue-important', priority: 'high', due_at: daysFromNow(-2) })],
      reminders: [],
      projects: [],
      memories: [],
      now: NOW,
    });

    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('Overdue');
  });
});
