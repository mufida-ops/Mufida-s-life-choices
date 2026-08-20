/**
 * The structured AI action/tool system (spec section 12).
 *
 * Every action the assistant can take is declared here as a discriminated union AND as an
 * Anthropic tool-use JSON schema. The same `AppAction` shape is produced by two paths today:
 *   - the local heuristic classifier (features/capture/classifyCapture.ts) for Phase 1, and
 *   - later, the Claude tool-use response from the `ai-chat` Supabase Edge Function (Phase 3).
 *
 * Both paths are dispatched through `describeAction`, and the actual mutation always happens
 * in store/useAppStore.ts — this file never touches state directly, so an action is only ever
 * "confirmed" after the corresponding store call (and, for reminders, the OS notification call)
 * has actually succeeded. No fake success states.
 */

import type { LifeDomain, Priority } from '../../types/models';

export type AppAction =
  | { action: 'create_task'; title: string; domain?: LifeDomain; projectId?: string; dueAt?: string; priority?: Priority }
  | { action: 'update_task'; taskId: string; patch: Record<string, unknown> }
  | { action: 'complete_task'; taskId: string }
  | { action: 'create_project'; title: string; domain: LifeDomain; description?: string }
  | { action: 'update_project'; projectId: string; patch: Record<string, unknown> }
  | { action: 'create_capture'; rawText: string }
  | { action: 'save_memory'; type: string; title: string; content: string; domain?: LifeDomain; importance?: Priority }
  | { action: 'update_memory'; memoryId: string; patch: Record<string, unknown> }
  | { action: 'delete_memory'; memoryId: string }
  | { action: 'create_reminder'; title: string; reminderAt: string; taskId?: string }
  | { action: 'snooze_item'; candidateId: string; untilIso: string }
  | { action: 'retrieve_projects'; domain?: LifeDomain; status?: string }
  | { action: 'retrieve_tasks'; domain?: LifeDomain; status?: string }
  | { action: 'retrieve_memories'; domain?: LifeDomain }
  | { action: 'retrieve_recent_captures'; limit?: number };

const DOMAIN_ENUM = ['work', 'university', 'creative', 'home', 'spiritual', 'physical', 'personal'];

/** Anthropic-compatible tool definitions for the Phase 3 `ai-chat` edge function. */
export const AI_TOOLS = [
  {
    name: 'create_task',
    description: 'Create a new to-do item, optionally attached to a project.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        domain: { type: 'string', enum: DOMAIN_ENUM },
        projectId: { type: 'string' },
        dueAt: { type: 'string', description: 'ISO 8601 timestamp' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update fields on an existing task.',
    input_schema: {
      type: 'object',
      properties: { taskId: { type: 'string' }, patch: { type: 'object' } },
      required: ['taskId', 'patch'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done.',
    input_schema: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] },
  },
  {
    name: 'create_project',
    description: 'Create a new project.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        domain: { type: 'string', enum: DOMAIN_ENUM },
        description: { type: 'string' },
      },
      required: ['title', 'domain'],
    },
  },
  {
    name: 'update_project',
    description: 'Update fields on a project, e.g. next_action or where_left_off.',
    input_schema: {
      type: 'object',
      properties: { projectId: { type: 'string' }, patch: { type: 'object' } },
      required: ['projectId', 'patch'],
    },
  },
  {
    name: 'create_capture',
    description: 'Save a raw, unclassified thought exactly as given — used only when nothing more specific applies.',
    input_schema: { type: 'object', properties: { rawText: { type: 'string' } }, required: ['rawText'] },
  },
  {
    name: 'save_memory',
    description: 'Save a long-term memory (preference, routine, or context) visible in the Me > Memory section.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        domain: { type: 'string', enum: DOMAIN_ENUM },
        importance: { type: 'string', enum: ['low', 'normal', 'high'] },
      },
      required: ['type', 'title', 'content'],
    },
  },
  {
    name: 'update_memory',
    description: 'Edit an existing memory.',
    input_schema: {
      type: 'object',
      properties: { memoryId: { type: 'string' }, patch: { type: 'object' } },
      required: ['memoryId', 'patch'],
    },
  },
  {
    name: 'delete_memory',
    description: 'Forget a memory permanently.',
    input_schema: { type: 'object', properties: { memoryId: { type: 'string' } }, required: ['memoryId'] },
  },
  {
    name: 'create_reminder',
    description: 'Schedule a reminder with a real device notification.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        reminderAt: { type: 'string', description: 'Resolved ISO 8601 timestamp' },
        taskId: { type: 'string' },
      },
      required: ['title', 'reminderAt'],
    },
  },
  {
    name: 'snooze_item',
    description: 'Snooze a resurfaced item until a later time.',
    input_schema: {
      type: 'object',
      properties: { candidateId: { type: 'string' }, untilIso: { type: 'string' } },
      required: ['candidateId', 'untilIso'],
    },
  },
  {
    name: 'retrieve_projects',
    description: 'Look up the user’s projects, optionally filtered by domain or status.',
    input_schema: {
      type: 'object',
      properties: { domain: { type: 'string', enum: DOMAIN_ENUM }, status: { type: 'string' } },
    },
  },
  {
    name: 'retrieve_tasks',
    description: 'Look up the user’s tasks, optionally filtered by domain or status.',
    input_schema: {
      type: 'object',
      properties: { domain: { type: 'string', enum: DOMAIN_ENUM }, status: { type: 'string' } },
    },
  },
  {
    name: 'retrieve_memories',
    description: 'Look up saved long-term memories, optionally filtered by domain.',
    input_schema: { type: 'object', properties: { domain: { type: 'string', enum: DOMAIN_ENUM } } },
  },
  {
    name: 'retrieve_recent_captures',
    description: 'Look up recent raw captures, most recent first.',
    input_schema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
] as const;
