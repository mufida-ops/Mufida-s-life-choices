// Supabase Edge Function (Deno runtime) — Phase 3: the real ai-chat backend.
//
// This is the only place the Anthropic API key is ever read (via `Deno.env.get`, set through
// `supabase secrets set ANTHROPIC_API_KEY=...` or the Supabase dashboard's Edge Function
// secrets UI). The mobile client never sees it — it calls this function over HTTPS with the
// user's Supabase auth JWT, and this function makes the actual model call server-side.
//
// Write actions (create_task, create_reminder, save_memory, ...) are intentionally NOT
// executed here. The client's zustand store (store/useAppStore.ts) already does the correct
// thing for every one of these — local-first update, Supabase sync, and for reminders, the
// real device notification (spec section 9: a reminder must not merely exist as a database
// row). Re-implementing that server-side would either duplicate rows or reimplement device
// notification scheduling, which an Edge Function cannot do at all. So this function only:
//   1. Answers using retrieve_* tools, executed for real (read-only, RLS-scoped to auth.uid()).
//   2. For write tools, records the proposed action and tells Claude it will be applied by the
//      app, then returns the full list of proposed actions to the client for `AskScreen` to run
//      through the store — the same path the local capture pipeline already uses. An action is
//      only ever "confirmed" in the UI after that store call actually succeeds.

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck -- this file targets the Deno edge runtime, not the app's TS project.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MODEL = 'claude-haiku-4-5';
const MAX_TOOL_ITERATIONS = 4;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN_ENUM = ['work', 'university', 'creative', 'home', 'spiritual', 'physical', 'personal'];

// Kept in sync manually with lib/ai/actions.ts (see that file for why — this function can't
// import across the supabase/functions boundary the CLI bundles independently).
const WRITE_TOOLS = [
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
] as const;

const READ_TOOLS = [
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

const ALL_TOOLS = [...WRITE_TOOLS, ...READ_TOOLS];
const WRITE_TOOL_NAMES = new Set(WRITE_TOOLS.map((t) => t.name));

function systemPrompt(profile: { name: string; timezone: string }): string {
  const nowIso = new Date().toISOString();
  return [
    `You are the AI assistant inside ${profile.name}'s personal life assistant app.`,
    'Your job: help capture, organise, and resurface tasks, projects, reminders and memories —',
    'never generic chit-chat. Be warm, brief, and calm; avoid guilt, streak, or productivity-score language.',
    `Current time (UTC): ${nowIso}. User timezone: ${profile.timezone}.`,
    'When the user implies a date ("Friday", "in three days"), resolve it to a real ISO timestamp',
    'yourself before calling create_reminder or setting dueAt — never pass an unresolved phrase.',
    'Use retrieve_* tools to look up real data before answering questions about existing projects,',
    'tasks, memories, or captures — never invent or guess their contents.',
    'Use a create_/update_/complete_/save_/delete_/snooze_ tool whenever the user is asking you to',
    'actually do something, not just talk about it. The app executes and confirms these — you will',
    'get a brief acknowledgement back, not the created record, so do not describe details you were',
    'not given (e.g. a generated id).',
    'Keep replies to 1-3 sentences unless the user is asking for a list.',
  ].join(' ');
}

async function callAnthropic(messages: any[], system: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages,
      tools: ALL_TOOLS,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function executeReadTool(supabase: any, userId: string, name: string, input: any) {
  switch (name) {
    case 'retrieve_projects': {
      let q = supabase.from('projects').select('*').eq('user_id', userId).order('last_activity_at', { ascending: false });
      if (input?.domain) q = q.eq('domain', input.domain);
      if (input?.status) q = q.eq('status', input.status);
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return data;
    }
    case 'retrieve_tasks': {
      let q = supabase.from('tasks').select('*').eq('user_id', userId).order('due_at', { ascending: true });
      if (input?.domain) q = q.eq('domain', input.domain);
      if (input?.status) q = q.eq('status', input.status);
      const { data, error } = await q.limit(30);
      if (error) throw error;
      return data;
    }
    case 'retrieve_memories': {
      let q = supabase.from('memories').select('*').eq('user_id', userId).eq('active', true).order('created_at', { ascending: false });
      if (input?.domain) q = q.eq('domain', input.domain);
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return data;
    }
    case 'retrieve_recent_captures': {
      const { data, error } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(input?.limit ?? 10);
      if (error) throw error;
      return data;
    }
    default:
      throw new Error(`Unknown read tool: ${name}`);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { conversationId: incomingConversationId, message } = await req.json();
    if (!message || typeof message !== 'string') {
      throw new Error('Missing "message" string in request body.');
    }

    const { data: profile } = await supabase.from('profiles').select('name, timezone').eq('id', user.id).maybeSingle();
    const profileInfo = { name: profile?.name || 'there', timezone: profile?.timezone || 'UTC' };

    let conversationId = incomingConversationId as string | null;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      if (error) throw error;
      conversationId = conv.id;
    }

    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(16);

    const messages: any[] = (history ?? [])
      .reverse()
      .map((m: any) => ({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: message });

    const proposedActions: { action: string; input: any }[] = [];
    let finalText = '';

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await callAnthropic(messages, systemPrompt(profileInfo));
      const toolUseBlocks = response.content.filter((b: any) => b.type === 'tool_use');
      const textBlocks = response.content.filter((b: any) => b.type === 'text');
      finalText = textBlocks.map((b: any) => b.text).join('\n').trim();

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) break;

      messages.push({ role: 'assistant', content: response.content });

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block: any) => {
          if (WRITE_TOOL_NAMES.has(block.name)) {
            proposedActions.push({ action: block.name, input: block.input });
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ status: 'queued', note: 'The app will apply this and confirm to the user.' }),
            };
          }
          try {
            const result = await executeReadTool(supabase, user.id, block.name, block.input);
            return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result ?? []) };
          } catch (err) {
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              is_error: true,
              content: err instanceof Error ? err.message : 'Lookup failed.',
            };
          }
        })
      );

      messages.push({ role: 'user', content: toolResults });
    }

    if (!finalText) {
      finalText = proposedActions.length > 0 ? 'Done.' : "I didn't quite catch that — could you rephrase?";
    }

    await supabase.from('messages').insert([
      { conversation_id: conversationId, user_id: user.id, role: 'user', content: message },
      { conversation_id: conversationId, user_id: user.id, role: 'assistant', content: finalText },
    ]);
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return new Response(JSON.stringify({ conversationId, text: finalText, actions: proposedActions }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
