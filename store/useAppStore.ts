import { useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { classifyCapture } from '../features/capture/classifyCapture';
import { rankItems } from '../features/resurfacing/rankItems';
import { generateId } from '../lib/id';
import { cancelReminderNotification, scheduleReminderNotification } from '../lib/notifications/scheduleReminder';
import {
  deleteMemoryRemote,
  hydrateFromSupabase as fetchHydratedData,
  syncCapture,
  syncMemory,
  syncProfile,
  syncProject,
  syncProjectUpdate,
  syncReminder,
  syncTask,
} from '../lib/supabase/sync';
import { SEED_MEMORIES, SEED_PROFILE, SEED_PROJECTS, SEED_REMINDERS, SEED_TASKS } from '../constants/seed';
import type {
  Capture,
  LifeDomain,
  Memory,
  Priority,
  Profile,
  Project,
  ProjectUpdate,
  Reminder,
  ResurfacingCandidate,
  Task,
} from '../types/models';

const FAR_FUTURE_ISO = '9999-12-31T00:00:00.000Z';

interface CaptureResult {
  capture: Capture;
  createdKind: 'reminder' | 'task' | 'idea';
  createdTitle: string;
  reminder?: Reminder;
  notificationScheduled: boolean;
}

interface AppState {
  hasHydrated: boolean;
  onboardingComplete: boolean;
  completeOnboarding: (profile: Partial<Profile>) => void;
  profile: Profile;
  tasks: Task[];
  projects: Project[];
  projectUpdates: ProjectUpdate[];
  reminders: Reminder[];
  captures: Capture[];
  memories: Memory[];
  /** candidateId -> ISO timestamp the nudge should stay hidden until. */
  dismissedNudges: Record<string, string>;

  setHasHydrated: (value: boolean) => void;
  seedIfEmpty: () => void;
  clearAllData: () => void;
  /** Pulls the signed-in user's existing Supabase data (if any) into the store; no-op when unconfigured. */
  hydrateFromSupabase: () => Promise<void>;

  updateProfile: (patch: Partial<Profile>) => void;

  addCapture: (rawText: string) => Promise<CaptureResult>;

  addTask: (input: {
    title: string;
    domain?: LifeDomain;
    projectId?: string | null;
    dueAt?: string | null;
    priority?: Priority;
    notes?: string | null;
  }) => Task;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  completeTask: (taskId: string) => void;
  touchTaskViewed: (taskId: string) => void;

  addProject: (input: { title: string; domain: LifeDomain; description?: string }) => Project;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  addProjectUpdate: (projectId: string, content: string) => void;

  addReminder: (input: { title: string; reminderAt: string; taskId?: string | null }) => Promise<Reminder>;
  cancelReminder: (reminderId: string) => Promise<void>;

  addMemory: (input: {
    type: Memory['type'];
    title: string;
    content: string;
    domain?: LifeDomain | null;
    importance?: Priority;
  }) => Memory;
  updateMemory: (memoryId: string, patch: Partial<Memory>) => void;
  forgetMemory: (memoryId: string) => void;
  touchMemoryViewed: (memoryId: string) => void;

  respondToCandidate: (candidate: ResurfacingCandidate, response: 'done' | 'not_now' | 'snooze' | 'stop') => void;
  getRightNow: (limit?: number) => ResurfacingCandidate[];
}

const now = () => new Date().toISOString();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      onboardingComplete: false,
      completeOnboarding: (profile) =>
        set((s) => ({ onboardingComplete: true, profile: { ...s.profile, ...profile } })),
      profile: SEED_PROFILE,
      tasks: [],
      projects: [],
      projectUpdates: [],
      reminders: [],
      captures: [],
      memories: [],
      dismissedNudges: {},

      setHasHydrated: (value) => set({ hasHydrated: value }),

      seedIfEmpty: () => {
        const { tasks, projects, captures, memories } = get();
        if (tasks.length || projects.length || captures.length || memories.length) return;
        set({
          projects: SEED_PROJECTS,
          tasks: SEED_TASKS,
          reminders: SEED_REMINDERS,
          memories: SEED_MEMORIES,
        });
      },

      clearAllData: () =>
        set({
          tasks: [],
          projects: [],
          projectUpdates: [],
          reminders: [],
          captures: [],
          memories: [],
          dismissedNudges: {},
        }),

      hydrateFromSupabase: async () => {
        const localProfile = get().profile;
        const data = await fetchHydratedData(localProfile.id);
        if (!data) return;

        // The new-user DB trigger creates a bare profile row (name '', timezone 'UTC') before
        // this device ever gets to push its onboarding name/timezone — so only trust remote
        // values that look like they were actually set, otherwise keep what's on this device.
        const remote = data.profile;
        const profile = remote
          ? {
              ...localProfile,
              ...remote,
              name: remote.name || localProfile.name,
              timezone: remote.timezone && remote.timezone !== 'UTC' ? remote.timezone : localProfile.timezone,
            }
          : localProfile;
        set({
          profile,
          tasks: data.tasks,
          projects: data.projects,
          projectUpdates: data.projectUpdates,
          reminders: data.reminders,
          captures: data.captures,
          memories: data.memories,
        });
        // Push this device's name/timezone back up in case the remote profile row was just
        // auto-created (empty name) by the new-user trigger.
        void syncProfile(profile);
      },

      updateProfile: (patch) =>
        set((state) => {
          const profile = { ...state.profile, ...patch };
          void syncProfile(profile);
          return { profile };
        }),

      addCapture: async (rawText) => {
        const state = get();
        const capture: Capture = {
          id: generateId(),
          user_id: state.profile.id,
          raw_text: rawText,
          processed: false,
          resulting_object_type: null,
          resulting_object_id: null,
          created_at: now(),
          updated_at: now(),
        };

        const classification = classifyCapture(rawText, { timezone: state.profile.timezone });

        if (classification.kind === 'reminder') {
          const reminder = await get().addReminder({
            title: classification.title,
            reminderAt: classification.reminderAt.toISOString(),
          });
          const notificationScheduled = !!reminder.notification_id;
          capture.processed = true;
          capture.resulting_object_type = 'reminder';
          capture.resulting_object_id = reminder.id;
          set((s) => ({ captures: [capture, ...s.captures] }));
          await syncCapture(capture);
          return { capture, createdKind: 'reminder', createdTitle: classification.title, reminder, notificationScheduled };
        }

        if (classification.kind === 'idea') {
          const task = get().addTask({ title: classification.title, domain: 'creative' });
          capture.processed = true;
          capture.resulting_object_type = 'task';
          capture.resulting_object_id = task.id;
          set((s) => ({ captures: [capture, ...s.captures] }));
          await syncCapture(capture);
          return { capture, createdKind: 'idea', createdTitle: classification.title, notificationScheduled: false };
        }

        const task = get().addTask({ title: classification.title });
        capture.processed = true;
        capture.resulting_object_type = 'task';
        capture.resulting_object_id = task.id;
        set((s) => ({ captures: [capture, ...s.captures] }));
        await syncCapture(capture);
        return { capture, createdKind: 'task', createdTitle: classification.title, notificationScheduled: false };
      },

      addTask: (input) => {
        const state = get();
        const task: Task = {
          id: generateId(),
          user_id: state.profile.id,
          project_id: input.projectId ?? null,
          title: input.title,
          notes: input.notes ?? null,
          domain: input.domain ?? null,
          status: 'open',
          priority: input.priority ?? 'normal',
          start_at: null,
          due_at: input.dueAt ?? null,
          completed_at: null,
          last_viewed_at: null,
          last_surfaced_at: null,
          snoozed_until: null,
          duration_minutes: null,
          depends_on_task_ids: [],
          created_at: now(),
          updated_at: now(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        void syncTask(task);
        return task;
      },

      updateTask: (taskId, patch) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, ...patch, updated_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncTask(updated);
      },

      completeTask: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, status: 'done', completed_at: now(), updated_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncTask(updated);
      },

      touchTaskViewed: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, last_viewed_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncTask(updated);
      },

      addProject: (input) => {
        const state = get();
        const project: Project = {
          id: generateId(),
          user_id: state.profile.id,
          title: input.title,
          description: input.description ?? null,
          domain: input.domain,
          status: 'active',
          start_at: now(),
          target_at: null,
          next_action: null,
          where_left_off: null,
          last_activity_at: now(),
          created_at: now(),
          updated_at: now(),
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        void syncProject(project);
        return project;
      },

      updateProject: (projectId, patch) => {
        let updated: Project | undefined;
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            updated = { ...p, ...patch, last_activity_at: now(), updated_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncProject(updated);
      },

      addProjectUpdate: (projectId, content) => {
        const state = get();
        const update: ProjectUpdate = {
          id: generateId(),
          project_id: projectId,
          user_id: state.profile.id,
          content,
          created_at: now(),
        };
        let touchedProject: Project | undefined;
        set((s) => ({
          projectUpdates: [update, ...s.projectUpdates],
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            touchedProject = { ...p, last_activity_at: now() };
            return touchedProject;
          }),
        }));
        void syncProjectUpdate(update);
        if (touchedProject) void syncProject(touchedProject);
      },

      addReminder: async (input) => {
        const state = get();
        const notificationId = await scheduleReminderNotification({
          title: input.title,
          at: new Date(input.reminderAt),
        });

        const reminder: Reminder = {
          id: generateId(),
          user_id: state.profile.id,
          task_id: input.taskId ?? null,
          title: input.title,
          reminder_at: input.reminderAt,
          notification_id: notificationId,
          status: 'scheduled',
          created_at: now(),
          updated_at: now(),
        };
        set((s) => ({ reminders: [reminder, ...s.reminders] }));
        await syncReminder(reminder);
        return reminder;
      },

      cancelReminder: async (reminderId) => {
        const reminder = get().reminders.find((r) => r.id === reminderId);
        if (reminder?.notification_id) {
          await cancelReminderNotification(reminder.notification_id);
        }
        let updated: Reminder | undefined;
        set((s) => ({
          reminders: s.reminders.map((r) => {
            if (r.id !== reminderId) return r;
            updated = { ...r, status: 'cancelled', updated_at: now() };
            return updated;
          }),
        }));
        if (updated) await syncReminder(updated);
      },

      addMemory: (input) => {
        const state = get();
        const memory: Memory = {
          id: generateId(),
          user_id: state.profile.id,
          type: input.type,
          title: input.title,
          content: input.content,
          domain: input.domain ?? null,
          importance: input.importance ?? 'normal',
          active: true,
          last_viewed_at: null,
          last_surfaced_at: null,
          created_at: now(),
          updated_at: now(),
        };
        set((s) => ({ memories: [memory, ...s.memories] }));
        void syncMemory(memory);
        return memory;
      },

      updateMemory: (memoryId, patch) => {
        let updated: Memory | undefined;
        set((s) => ({
          memories: s.memories.map((m) => {
            if (m.id !== memoryId) return m;
            updated = { ...m, ...patch, updated_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncMemory(updated);
      },

      forgetMemory: (memoryId) => {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== memoryId) }));
        void deleteMemoryRemote(memoryId);
      },

      touchMemoryViewed: (memoryId) => {
        let updated: Memory | undefined;
        set((s) => ({
          memories: s.memories.map((m) => {
            if (m.id !== memoryId) return m;
            updated = { ...m, last_viewed_at: now() };
            return updated;
          }),
        }));
        if (updated) void syncMemory(updated);
      },

      respondToCandidate: (candidate, response) => {
        const state = get();

        if (response === 'done') {
          if (candidate.kind === 'task') state.completeTask(candidate.refId);
          if (candidate.kind === 'reminder') {
            set((s) => ({
              reminders: s.reminders.map((r) =>
                r.id === candidate.refId ? { ...r, status: 'delivered', updated_at: now() } : r
              ),
            }));
          }
          return;
        }

        if (response === 'not_now') {
          const until = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // later today
          set((s) => ({ dismissedNudges: { ...s.dismissedNudges, [candidate.id]: until } }));
          return;
        }

        if (response === 'snooze') {
          const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow
          set((s) => ({ dismissedNudges: { ...s.dismissedNudges, [candidate.id]: until } }));
          return;
        }

        if (response === 'stop') {
          set((s) => ({ dismissedNudges: { ...s.dismissedNudges, [candidate.id]: FAR_FUTURE_ISO } }));
        }
      },

      getRightNow: (limit = 4) => {
        const state = get();
        const nowDate = new Date();
        const ranked = rankItems({
          tasks: state.tasks,
          reminders: state.reminders,
          projects: state.projects,
          memories: state.memories,
          now: nowDate,
        });

        return ranked
          .filter((c) => {
            const hiddenUntil = state.dismissedNudges[c.id];
            return !hiddenUntil || new Date(hiddenUntil) <= nowDate;
          })
          .slice(0, limit);
      },
    }),
    {
      name: 'mufida:v1:app-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        tasks: state.tasks,
        projects: state.projects,
        projectUpdates: state.projectUpdates,
        reminders: state.reminders,
        captures: state.captures,
        memories: state.memories,
        dismissedNudges: state.dismissedNudges,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Reactive version of `getRightNow`, for render-time use. Selecting `(s) => s.getRightNow(n)`
 * directly would call rankItems() on every store notification and return a brand new array
 * each time, which breaks useSyncExternalStore's snapshot equality check and causes an
 * infinite render loop — so this recomputes only when the underlying slices actually change.
 */
export function useRightNow(limit = 4): ResurfacingCandidate[] {
  const tasks = useAppStore((s) => s.tasks);
  const reminders = useAppStore((s) => s.reminders);
  const projects = useAppStore((s) => s.projects);
  const memories = useAppStore((s) => s.memories);
  const dismissedNudges = useAppStore((s) => s.dismissedNudges);

  return useMemo(() => {
    const nowDate = new Date();
    const ranked = rankItems({ tasks, reminders, projects, memories, now: nowDate });
    return ranked
      .filter((c) => {
        const hiddenUntil = dismissedNudges[c.id];
        return !hiddenUntil || new Date(hiddenUntil) <= nowDate;
      })
      .slice(0, limit);
  }, [tasks, reminders, projects, memories, dismissedNudges, limit]);
}
