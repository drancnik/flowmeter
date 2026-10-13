create table public.blocks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  planned_min numeric not null,
  worked_min numeric not null check (worked_min > 0),
  extended_min numeric not null default 0,
  ended_early boolean not null default false,
  tag_id text,
  note text not null default '',
  rating smallint check (rating between 1 and 5),
  break_planned_min numeric,
  break_actual_min numeric,
  break_overrun_min numeric,
  deleted boolean not null default false,
  updated_at bigint not null
);
create index blocks_user_started on public.blocks (user_id, started_at);
alter table public.blocks enable row level security;
create policy "Users manage their own blocks" on public.blocks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  settings jsonb not null default '{}',
  reflections jsonb not null default '{}',
  updated_at bigint not null default 0
);
alter table public.user_settings enable row level security;
create policy "Users manage their own settings" on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
