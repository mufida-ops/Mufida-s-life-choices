# Mufida's Life Choices — Personal AI Life Assistant

A personal AI operating system built around one problem: **I forget things.** The loop is
**Capture → Understand → Store → Resurface → Act.** See the full build spec for product intent
and tone — this file covers the technical architecture and current build status.

## 1. Technical architecture

- **React Native + Expo (SDK 57) + TypeScript + Expo Router** — file-based navigation, matches
  the four-tab structure (Home · Ask · My Things · Me) directly onto `app/(tabs)/`.
- **State & local persistence:** Zustand (`store/useAppStore.ts`) with its `persist` middleware
  backed by `@react-native-async-storage/async-storage`. This is the "temporary mock/local
  persistence" layer spec section 34 asks for while Supabase credentials aren't configured yet
  — the store's action functions (`addTask`, `addReminder`, `respondToCandidate`, …) are the
  seam: Phase 2 swaps their AsyncStorage-backed bodies for Supabase queries without touching any
  screen.
- **Backend (Phase 2, not yet connected):** Supabase — Postgres + Auth + Row Level Security.
  Schema lives in `supabase/migrations/0001_init.sql`, client in `lib/supabase/client.ts` (a
  `SupabaseClient | null`, `null` until `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` are set — see
  `.env.example`).
- **AI (Phase 3, not yet connected):** Supabase Edge Function (`supabase/functions/ai-chat`,
  Deno) is the only place an Anthropic API key would ever be read. The mobile client never holds
  it. Tool/action schema is defined once in `lib/ai/actions.ts` and mirrored into the edge
  function when it's actually built out.
- Everything currently runs from local/AsyncStorage state — no network backend required to use
  the app today.

## 2. Folder structure

```
app/                  expo-router screens (file-based routing)
  (tabs)/              Home · Ask · My Things · Me
  onboarding/           local sign-up UI, seam for Supabase Auth
  project/[id].tsx      project detail (timeline, tasks, notes)
components/
  ui/                  design-system primitives (AppText, Card, Button, Screen, DomainTag)
  home/, capture/, project/   feature-scoped composition
features/
  dates/               deterministic natural-language date parsing (chrono-node)
  resurfacing/         deterministic Right Now ranking
  capture/             local capture classifier (Phase 1 stand-in for AI classification)
  assistant/           local Ask-screen responder (Phase 1 stand-in for the ai-chat function)
lib/
  ai/actions.ts        the structured action/tool system, shared by both stand-ins and Phase 3
  auth/localAuth.ts     Supabase Auth seam
  notifications/       expo-notifications wrapper
  voice/                expo-speech-recognition hook
  supabase/client.ts    null until configured
store/useAppStore.ts    zustand store — the local persistence layer + derived selectors
constants/              design tokens, seed data, domain/empty-state copy
types/models.ts         shared domain types, mirrors the SQL schema
supabase/
  migrations/           SQL schema + RLS
  functions/ai-chat/    Phase 3 edge function scaffold
```

## 3. Database schema

See `supabase/migrations/0001_init.sql` for the authoritative version (spec section 21):
`profiles`, `memories`, `projects`, `project_updates`, `tasks`, `reminders`, `captures`,
`conversations`, `messages`. Every user-owned table has RLS enabled with an
`auth.uid() = user_id` policy. `types/models.ts` mirrors these shapes for the app layer.

## 4. AI action/tool architecture

`lib/ai/actions.ts` defines the 15 actions from spec section 12
(`create_task`, `update_task`, `complete_task`, `create_project`, `update_project`,
`create_capture`, `save_memory`, `update_memory`, `delete_memory`, `create_reminder`,
`snooze_item`, `retrieve_projects`, `retrieve_tasks`, `retrieve_memories`,
`retrieve_recent_captures`) as both a TypeScript discriminated union (`AppAction`) and an
Anthropic-compatible tool-use JSON schema (`AI_TOOLS`). Nothing mutates state by pretending —
every action ultimately calls a `store/useAppStore.ts` function, and reminders additionally
require the OS notification call to actually succeed before the app confirms.

Phase 1 has no live model call yet, so two small deterministic stand-ins produce the same shape
of result the AI will produce later:
- `features/capture/classifyCapture.ts` — turns a raw capture into a reminder/idea/task.
- `features/assistant/respondLocally.ts` — answers "what am I forgetting?" and project mentions
  on the Ask screen using real data (never canned text).

Phase 3 replaces both with a call to `supabase/functions/ai-chat`, which sends `AI_TOOLS` to
Claude and executes whatever it returns through the same store functions.

## 5. Voice implementation

Package: **`expo-speech-recognition`** (jamsch) — wraps `SFSpeechRecognizer` (iOS) and the
platform `SpeechRecognizer` (Android) behind one API, with an Expo config plugin.

- Config: `app.json`'s `"expo-speech-recognition"` plugin entry sets
  `NSMicrophoneUsageDescription` + `NSSpeechRecognitionUsageDescription` on iOS and
  `RECORD_AUDIO` on Android.
- **Requires a custom Expo development build.** The native module is not present in Expo Go.
- `lib/voice/useVoiceCapture.ts` exposes `isAvailable` (false on web/Expo Go — the mic button
  hides/disables itself gracefully), `isListening`, live `transcript`, and `start`/`stop`.
  Voice and typed input feed into the exact same `CaptureInput` submit handler, per spec.

## 6. Notification / reminder architecture

- `features/dates/parseNaturalDate.ts` wraps **chrono-node** for deterministic, testable,
  timezone-aware date parsing — not the LLM. `formatParsedDate` renders "Friday, 21 August at
  9:00 AM" so the user always sees what the system understood.
- `lib/notifications/scheduleReminder.ts` wraps **expo-notifications** to schedule a real local
  device notification. `scheduleReminderNotification` returns the OS notification id, or `null`
  if permission was denied or the platform can't support it (web — see below) — the reminder
  confirmation copy reflects whichever actually happened, never a fake success.
- The reminder is also stored in `reminders` (`store/useAppStore.ts` / eventually Supabase),
  with `notification_id` linking the two.
- **Web note:** expo-notifications doesn't support scheduled local notifications on web (only
  push, which needs a separate service-worker setup out of scope for this MVP), so
  `ensureNotificationPermission` short-circuits to `false` there rather than hanging on an
  unresolvable permission prompt — the reminder record is still saved.

## 7. Resurfacing algorithm (V1)

`features/resurfacing/rankItems.ts` — pure, deterministic, unit-tested
(`rankItems.test.ts`), per spec section 8's priority order:

1. Overdue tasks/reminders
2. Due within 7 days
3. Explicitly marked important (`priority: "high"`)
4. Saved memories never revisited (and old enough to be worth a nudge)
5. Active projects idle 10+ days
6. At most **one** neglected-domain nudge (never more), suppressed if that domain was touched
   in the last 7 days

`store/useAppStore.ts`'s `useRightNow(limit)` hook layers a `dismissedNudges` map on top (Done /
Not now / Remind me later / Stop showing this — spec section 8) without touching the ranking
logic itself, so ranking stays pure application logic; the LLM (Phase 3) may only *explain* why
something surfaced.

## 8. Required accounts, keys, permissions

- **Supabase** (Phase 2): project URL, anon key (client), service role key (edge functions only).
- **AI** (Phase 3): one Anthropic API key, stored only as an Edge Function secret.
- **Device permissions:** microphone + speech recognition (voice capture), notifications
  (reminders) — both requested at first use, not on launch.
- **EAS / Expo account** to build the custom development build (see below).

## 9. Technical risks / platform limitations

- **Expo Go can't run this app** — voice and notifications are native modules. A development
  build is required from the start (see Setup below).
- **iOS local notification limit:** ~64 pending notifications system-wide; fine for personal
  reminders, worth knowing if usage grows.
- **Web is a secondary target:** notifications don't schedule (see above), and voice capture
  hides itself (`isAvailable: false`) since there's no speech-recognition native module on web.
  Everything else — capture, tasks, projects, resurfacing, Ask, Me — works identically.
- **RN Web + zustand pitfall (fixed, documented in code):** selecting a *computed* value (e.g.
  `s.tasks.filter(...)`) directly inside a `useAppStore` selector returns a new array every call
  and breaks `useSyncExternalStore`'s snapshot equality, causing an infinite render loop. Always
  select the raw slice and derive with `useMemo` in the component (see `useRightNow` and
  `app/project/[id].tsx` for the pattern).
- **RLS correctness** will need real integration testing once Supabase is connected — Phase 1's
  local store has no equivalent of cross-user isolation to get wrong yet, but Phase 2 should add
  a test that a second user genuinely cannot read/write the first user's rows.
- **AI cost/latency and edge function cold starts** are a Phase 3 concern once real Claude calls
  are wired up; the local stand-ins in `features/capture` and `features/assistant` keep Phase 1
  fully usable without them.

## Setup

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test             # jest — date parsing, capture classification, resurfacing ranking
npm run web          # runs today, no native build needed
```

**Development build (required for voice + notifications on device):**

```bash
npx expo install expo-dev-client
npx eas build --profile development --platform ios      # or --platform android
```

This produces an installable dev client with the native modules `expo-speech-recognition` and
`expo-notifications` compiled in — install it on a real device/simulator, then run
`npx expo start --dev-client` to connect. Plain `expo start` + Expo Go will load the app but the
mic button will disable itself and reminders will save without a device notification.

## What's built (Phase 1) vs. deferred

**Working today, backed by local AsyncStorage persistence:**
local onboarding/"auth", Home (greeting, capture input, Right Now), typed + voice capture into
one pipeline, deterministic capture classification (task/idea/reminder), natural-language
reminders with real local notifications (native) or a saved-without-notification fallback (web),
Ask screen (local responder + structured Right Now / project cards), My Things (Projects / To Do
/ Saved / Captured), project detail with a simple sequence timeline and "where I left off" notes,
Me (profile, life domains, visible/editable/deletable Memory section), the full resurfacing
engine, seed data for the dissertation + crochet projects.

**Deferred to Phase 2/3 per the build order:** Supabase-backed persistence and real
email/password auth, the live `ai-chat` Claude integration replacing the two local stand-ins,
push/scheduled sync of captures, and everything in the spec's "Deferred Features" list (shop
tab, integrations, etc.) — none of that has been started, on purpose.
