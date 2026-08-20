import type { Memory, Profile, Project, Reminder, Task } from '../types/models';

/**
 * Development-only seed data (spec section 26). Removable: the app works from an empty
 * state too — see the empty-state copy in constants/emptyStates.ts.
 */

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

export const SEED_PROFILE: Profile = {
  id: 'local-user',
  name: 'Mufida',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  created_at: daysAgo(60),
};

const DISSERTATION_PROJECT_ID = 'seed-project-dissertation';
const CROCHET_PROJECT_ID = 'seed-project-crochet';

export const SEED_PROJECTS: Project[] = [
  {
    id: DISSERTATION_PROJECT_ID,
    user_id: SEED_PROFILE.id,
    title: 'Doctoral Dissertation',
    description: 'PhD dissertation, submission year.',
    domain: 'university',
    status: 'active',
    start_at: daysAgo(180),
    target_at: daysFromNow(200),
    next_action: 'Draft Chapter 3',
    where_left_off: null,
    last_activity_at: daysAgo(2),
    created_at: daysAgo(180),
    updated_at: daysAgo(2),
  },
  {
    id: CROCHET_PROJECT_ID,
    user_id: SEED_PROFILE.id,
    title: 'Crochet Placemat',
    description: 'Round crochet placemat, beige, blue and gold.',
    domain: 'creative',
    status: 'active',
    start_at: daysAgo(14),
    target_at: null,
    next_action: 'Continue blue section',
    where_left_off: 'Working on the blue window section',
    last_activity_at: daysAgo(3),
    created_at: daysAgo(14),
    updated_at: daysAgo(3),
  },
];

export const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-lit-review',
    user_id: SEED_PROFILE.id,
    project_id: DISSERTATION_PROJECT_ID,
    title: 'Literature review',
    notes: null,
    domain: 'university',
    status: 'done',
    priority: 'normal',
    start_at: daysAgo(120),
    due_at: daysAgo(60),
    completed_at: daysAgo(55),
    last_viewed_at: daysAgo(55),
    last_surfaced_at: null,
    snoozed_until: null,
    duration_minutes: null,
    depends_on_task_ids: [],
    created_at: daysAgo(150),
    updated_at: daysAgo(55),
  },
  {
    id: 'seed-task-chapter-3',
    user_id: SEED_PROFILE.id,
    project_id: DISSERTATION_PROJECT_ID,
    title: 'Chapter 3 draft',
    notes: 'Methodology chapter.',
    domain: 'university',
    status: 'in_progress',
    priority: 'high',
    start_at: daysAgo(10),
    due_at: daysFromNow(2),
    completed_at: null,
    last_viewed_at: daysAgo(1),
    last_surfaced_at: daysAgo(1),
    snoozed_until: null,
    duration_minutes: null,
    depends_on_task_ids: ['seed-task-lit-review'],
    created_at: daysAgo(10),
    updated_at: daysAgo(1),
  },
  {
    id: 'seed-task-participant-recruitment',
    user_id: SEED_PROFILE.id,
    project_id: DISSERTATION_PROJECT_ID,
    title: 'Participant recruitment',
    notes: null,
    domain: 'university',
    status: 'open',
    priority: 'normal',
    start_at: null,
    due_at: daysFromNow(21),
    completed_at: null,
    last_viewed_at: null,
    last_surfaced_at: null,
    snoozed_until: null,
    duration_minutes: null,
    depends_on_task_ids: ['seed-task-chapter-3'],
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
  {
    id: 'seed-task-passport',
    user_id: SEED_PROFILE.id,
    project_id: null,
    title: 'Send passport image to Sam',
    notes: null,
    domain: 'personal',
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
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
  },
];

export const SEED_REMINDERS: Reminder[] = [
  {
    id: 'seed-reminder-chapter-3',
    user_id: SEED_PROFILE.id,
    task_id: 'seed-task-chapter-3',
    title: 'Chapter 3 draft due',
    reminder_at: daysFromNow(2),
    notification_id: null,
    status: 'scheduled',
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
];

export const SEED_MEMORIES: Memory[] = [
  {
    id: 'seed-memory-reminder-style',
    user_id: SEED_PROFILE.id,
    type: 'preference',
    title: 'Reminder style',
    content: 'Prefers reminders in the morning, around 9am.',
    domain: null,
    importance: 'normal',
    active: true,
    last_viewed_at: null,
    last_surfaced_at: null,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
];
