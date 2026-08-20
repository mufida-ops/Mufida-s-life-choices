/**
 * Core domain types, mirroring the Supabase schema in supabase/migrations/0001_init.sql.
 * Keeping these in sync means the local-storage repositories (services/) and the future
 * Supabase-backed repositories can implement the exact same interface.
 */

export type LifeDomain =
  | 'work'
  | 'university'
  | 'creative'
  | 'home'
  | 'spiritual'
  | 'physical'
  | 'personal';

export type Priority = 'low' | 'normal' | 'high';

export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived';

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export type ReminderStatus = 'scheduled' | 'delivered' | 'cancelled' | 'snoozed';

export type MemoryType =
  | 'preference'
  | 'project_context'
  | 'routine'
  | 'personal_context'
  | 'creative_preference'
  | 'work_context'
  | 'general';

export type CaptureObjectType = 'task' | 'project' | 'reminder' | 'idea' | 'note' | 'memory';

export interface BaseEntity {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  timezone: string;
  created_at: string;
}

export interface Memory extends BaseEntity {
  type: MemoryType;
  title: string;
  content: string;
  domain: LifeDomain | null;
  importance: Priority;
  active: boolean;
  last_viewed_at: string | null;
  last_surfaced_at: string | null;
}

export interface Project extends BaseEntity {
  title: string;
  description: string | null;
  domain: LifeDomain;
  status: ProjectStatus;
  start_at: string | null;
  target_at: string | null;
  next_action: string | null;
  where_left_off: string | null;
  last_activity_at: string | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Task extends BaseEntity {
  project_id: string | null;
  title: string;
  notes: string | null;
  domain: LifeDomain | null;
  status: TaskStatus;
  priority: Priority;
  start_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  last_viewed_at: string | null;
  last_surfaced_at: string | null;
  snoozed_until: string | null;
  // Lightweight timeline support (spec section 15), only meaningful for project tasks.
  duration_minutes: number | null;
  depends_on_task_ids: string[];
}

export interface Reminder extends BaseEntity {
  task_id: string | null;
  title: string;
  reminder_at: string;
  notification_id: string | null;
  status: ReminderStatus;
}

export interface Capture extends BaseEntity {
  raw_text: string;
  processed: boolean;
  resulting_object_type: CaptureObjectType | null;
  resulting_object_id: string | null;
}

export interface Conversation extends BaseEntity {
  title: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/** A single item ready to be shown in "Right Now" or elsewhere, produced by the resurfacing engine. */
export interface ResurfacingCandidate {
  id: string;
  kind: 'task' | 'reminder' | 'project' | 'memory';
  refId: string;
  title: string;
  domain: LifeDomain | null;
  subtitle: string | null;
  reason: string;
  score: number;
  dueAt: string | null;
}
