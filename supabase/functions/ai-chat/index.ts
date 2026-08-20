// Supabase Edge Function (Deno runtime) — Phase 3 scaffold, not wired up yet.
//
// This is the only place the Anthropic API key is ever read (via `Deno.env.get`, set through
// `supabase secrets set ANTHROPIC_API_KEY=...`). The mobile client never sees it — it calls
// this function over HTTPS with the user's Supabase auth JWT, and this function makes the
// actual model call server-side.
//
// Responsibilities:
//   1. Verify the caller's JWT (Supabase client library does this automatically when the
//      function is invoked with `Authorization: Bearer <access_token>`).
//   2. Load *just enough* context: the current conversation's recent messages (not the full
//      history — see spec section 20) plus, only if the model asks via a `retrieve_*` tool
//      call, the relevant memories/projects/tasks/captures for this user.
//   3. Call the Anthropic Messages API with the tool definitions from lib/ai/actions.ts
//      (kept in sync manually for now; a generated-schema step could remove that duplication
//      once this function is actually built out).
//   4. For every tool_use block Claude returns, execute the corresponding Supabase write
//      (RLS-scoped to auth.uid(), same as the app's own client-side calls) and only report the
//      action as successful once that write actually commits — never a synthesized success.
//   5. Return the assistant's text plus the list of executed actions, so the client can render
//      both prose and structured components (spec section 11).

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck -- this file targets the Deno edge runtime, not the app's TS project.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { conversationId, message } = await req.json();

  // TODO(Phase 3): load recent messages for conversationId, call Anthropic with AI_TOOLS
  // (ported from lib/ai/actions.ts), execute any tool_use blocks against Supabase, persist
  // the new user + assistant messages, and return { text, actions }.
  return new Response(
    JSON.stringify({
      text: "The AI chat backend isn't wired up yet — this is the Phase 3 scaffold.",
      actions: [],
      received: { conversationId, message },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
