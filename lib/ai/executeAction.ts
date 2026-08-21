import { useAppStore } from '../../store/useAppStore';
import type { AppAction } from './actions';

type ProposedAction = { action: AppAction['action']; input: Record<string, unknown> };

/**
 * Runs one action the ai-chat edge function proposed, through the same store methods the rest
 * of the app uses — so it gets the same local-first update, Supabase sync, and (for reminders)
 * real device notification as any other capture, with no separate code path to drift.
 */
export async function executeProposedAction(action: ProposedAction): Promise<void> {
  const store = useAppStore.getState();
  const input = action.input;

  switch (action.action) {
    case 'create_task':
      store.addTask({
        title: input.title as string,
        domain: input.domain as any,
        projectId: input.projectId as string | undefined,
        dueAt: input.dueAt as string | undefined,
        priority: input.priority as any,
      });
      return;
    case 'update_task':
      store.updateTask(input.taskId as string, input.patch as any);
      return;
    case 'complete_task':
      store.completeTask(input.taskId as string);
      return;
    case 'create_project':
      store.addProject({
        title: input.title as string,
        domain: input.domain as any,
        description: input.description as string | undefined,
      });
      return;
    case 'update_project':
      store.updateProject(input.projectId as string, input.patch as any);
      return;
    case 'create_capture':
      await store.addCapture(input.rawText as string);
      return;
    case 'save_memory':
      store.addMemory({
        type: input.type as any,
        title: input.title as string,
        content: input.content as string,
        domain: input.domain as any,
        importance: input.importance as any,
      });
      return;
    case 'update_memory':
      store.updateMemory(input.memoryId as string, input.patch as any);
      return;
    case 'delete_memory':
      store.forgetMemory(input.memoryId as string);
      return;
    case 'create_reminder':
      await store.addReminder({
        title: input.title as string,
        reminderAt: input.reminderAt as string,
        taskId: input.taskId as string | undefined,
      });
      return;
    case 'snooze_item':
      // The store's respondToCandidate needs a full ResurfacingCandidate, not just an id, and
      // the AI only ever sees the id — snoozing from chat isn't wired up yet. Snoozing from the
      // Right Now list itself (components/home/RightNowItem.tsx) is unaffected.
      return;
    default:
      return;
  }
}
