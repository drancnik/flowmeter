-- Daily habits and their per-day values.
-- kind 'check' = done or not, 'count' = reach a number target, 'focus' = completed from timer blocks (no logs needed).
-- days is a weekday bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64.

create table public.habits (
  id text primary key check (char_length(id) between 1 and 64),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('check', 'count', 'focus')),
  target numeric not null default 1 check (target > 0 and target <= 100000),
  unit text not null default '' check (char_length(unit) <= 20),
  days smallint not null default 127 check (days between 1 and 127),
  focus_tag text check (focus_tag is null or char_length(focus_tag) <= 64),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  updated_at bigint not null
);
create index habits_user on public.habits (user_id);
alter table public.habits enable row level security;
create policy "Users manage their own habits" on public.habits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.habit_logs (
  id text primary key check (char_length(id) between 1 and 80),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id text not null references public.habits (id) on delete cascade,
  day date not null,
  value numeric not null default 0 check (value >= 0 and value <= 100000),
  updated_at bigint not null,
  unique (habit_id, day)
);
create index habit_logs_user_day on public.habit_logs (user_id, day);
alter table public.habit_logs enable row level security;
-- A log may only point at a habit the same user owns.
create policy "Users manage their own habit logs" on public.habit_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid()))
  );

-- Same rule as blocks: an older copy from another device never overwrites a newer one.
create trigger habits_keep_newest
  before update on public.habits
  for each row execute function public.blocks_keep_newest();
create trigger habit_logs_keep_newest
  before update on public.habit_logs
  for each row execute function public.blocks_keep_newest();
