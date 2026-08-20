-- Initial schema (spec section 21). Every user-owned table enforces Row Level Security:
-- users may only read and modify their own rows, matched via auth.uid() = user_id.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create type life_domain as enum (
  'work', 'university', 'creative', 'home', 'spiritual', 'physical', 'personal'
);
create type priority_level as enum ('low', 'normal', 'high');
create type project_status as enum ('active', 'paused', 'done', 'archived');
create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type reminder_status as enum ('scheduled', 'delivered', 'cancelled', 'snoozed');
create type memory_type as enum (
  'preference', 'project_context', 'routine', 'personal_context',
  'creative_preference', 'work_context', 'general'
);
create type capture_object_type as enum ('task', 'project', 'reminder', 'idea', 'note', 'memory');

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type memory_type not null,
  title text not null,
  content text not null,
  domain life_domain,
  importance priority_level not null default 'normal',
  active boolean not null default true,
  last_viewed_at timestamptz,
  last_surfaced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  domain life_domain not null,
  status project_status not null default 'active',
  start_at timestamptz,
  target_at timestamptz,
  next_action text,
  where_left_off text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  title text not null,
  notes text,
  domain life_domain,
  status task_status not null default 'open',
  priority priority_level not null default 'normal',
  start_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  last_viewed_at timestamptz,
  last_surfaced_at timestamptz,
  snoozed_until timestamptz,
  duration_minutes integer,
  depends_on_task_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references tasks (id) on delete set null,
  title text not null,
  reminder_at timestamptz not null,
  notification_id text,
  status reminder_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  raw_text text not null,
  processed boolean not null default false,
  resulting_object_type capture_object_type,
  resulting_object_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: every table above is user-owned data.
alter table profiles enable row level security;
alter table memories enable row level security;
alter table projects enable row level security;
alter table project_updates enable row level security;
alter table tasks enable row level security;
alter table reminders enable row level security;
alter table captures enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "profiles: owner read/write" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "memories: owner read/write" on memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "projects: owner read/write" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "project_updates: owner read/write" on project_updates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks: owner read/write" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders: owner read/write" on reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "captures: owner read/write" on captures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "conversations: owner read/write" on conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages: owner read/write" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep updated_at current on write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_memories_updated_at before update on memories
  for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks
  for each row execute function set_updated_at();
create trigger trg_reminders_updated_at before update on reminders
  for each row execute function set_updated_at();
create trigger trg_conversations_updated_at before update on conversations
  for each row execute function set_updated_at();

-- A new auth.users row gets a matching profile automatically.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, timezone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), 'UTC');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
