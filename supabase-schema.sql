create table if not exists public.posture_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary jsonb not null,
  report jsonb not null,
  timeline jsonb not null,
  dominant_issue text,
  duration_ms integer,
  pose_confidence double precision,
  synced_at timestamptz default now()
);

create index if not exists posture_sessions_user_id_idx
  on public.posture_sessions (user_id);

create index if not exists posture_sessions_synced_at_idx
  on public.posture_sessions (synced_at desc);

alter table public.posture_sessions enable row level security;

create policy "Users can read own posture sessions"
  on public.posture_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own posture sessions"
  on public.posture_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posture sessions"
  on public.posture_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own posture sessions"
  on public.posture_sessions
  for delete
  using (auth.uid() = user_id);
