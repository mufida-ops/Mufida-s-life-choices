import { isSupabaseConfigured, supabase } from './client';
import type { Capture, Memory, Profile, Project, ProjectUpdate, Reminder, Task } from '../../types/models';

/**
 * Write-through sync to Supabase: the zustand store (store/useAppStore.ts) stays the
 * instant, offline-first source of UI truth, and every mutation also calls one of these
 * to persist the same row remotely. Failures are logged, not thrown — a dropped network
 * write shouldn't roll back state the user already saw succeed locally. No-ops entirely
 * when Supabase isn't configured (spec section 34: local persistence until credentials exist).
 */

function warn(table: string, error: { message: string }) {
  if (__DEV__) console.warn(`[supabase sync] ${table} write failed: ${error.message}`);
}

export async function syncProfile(profile: Profile) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!
    .from('profiles')
    .upsert({ id: profile.id, name: profile.name, timezone: profile.timezone });
  if (error) warn('profiles', error);
}

export async function syncTask(task: Task) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('tasks').upsert(task);
  if (error) warn('tasks', error);
}

export async function syncProject(project: Project) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('projects').upsert(project);
  if (error) warn('projects', error);
}

export async function syncProjectUpdate(update: ProjectUpdate) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('project_updates').upsert(update);
  if (error) warn('project_updates', error);
}

export async function syncReminder(reminder: Reminder) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('reminders').upsert(reminder);
  if (error) warn('reminders', error);
}

export async function syncCapture(capture: Capture) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('captures').upsert(capture);
  if (error) warn('captures', error);
}

export async function syncMemory(memory: Memory) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('memories').upsert(memory);
  if (error) warn('memories', error);
}

export async function deleteMemoryRemote(memoryId: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase!.from('memories').delete().eq('id', memoryId);
  if (error) warn('memories (delete)', error);
}

export interface HydratedData {
  profile: Profile | null;
  tasks: Task[];
  projects: Project[];
  projectUpdates: ProjectUpdate[];
  reminders: Reminder[];
  captures: Capture[];
  memories: Memory[];
}

/** Pulls everything the signed-in user already has in Supabase, for merging into the store on sign-in. */
export async function hydrateFromSupabase(userId: string): Promise<HydratedData | null> {
  if (!isSupabaseConfigured) return null;
  const client = supabase!;

  const [profileRes, tasksRes, projectsRes, updatesRes, remindersRes, capturesRes, memoriesRes] =
    await Promise.all([
      client.from('profiles').select('*').eq('id', userId).maybeSingle(),
      client.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('project_updates').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('reminders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('captures').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      client.from('memories').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

  return {
    profile: (profileRes.data as Profile | null) ?? null,
    tasks: (tasksRes.data as Task[] | null) ?? [],
    projects: (projectsRes.data as Project[] | null) ?? [],
    projectUpdates: (updatesRes.data as ProjectUpdate[] | null) ?? [],
    reminders: (remindersRes.data as Reminder[] | null) ?? [],
    captures: (capturesRes.data as Capture[] | null) ?? [],
    memories: (memoriesRes.data as Memory[] | null) ?? [],
  };
}
