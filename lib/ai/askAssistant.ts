import { isSupabaseConfigured, supabase } from '../supabase/client';
import type { AppAction } from './actions';

export interface AskAssistantResult {
  conversationId: string;
  text: string;
  actions: { action: AppAction['action']; input: Record<string, unknown> }[];
}

/** Null when Supabase/the ai-chat function isn't reachable — callers fall back to respondLocally. */
export async function askAssistant(message: string, conversationId: string | null): Promise<AskAssistantResult | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase!.functions.invoke('ai-chat', {
      body: { message, conversationId },
    });
    if (error) throw error;
    return data as AskAssistantResult;
  } catch {
    return null;
  }
}
