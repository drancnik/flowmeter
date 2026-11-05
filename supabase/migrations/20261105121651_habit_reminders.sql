-- Habit reminders: an optional time per habit, the devices that receive push notifications,
-- and a record of sent reminders so each habit is reminded at most once per day.

alter table public.habits
  add column remind_at time;

-- One row per device (browser or installed app) that turned reminders on.
create table public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  tz text not null default 'UTC' check (char_length(tz) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
create policy "Users manage their own devices" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Written only by the reminder sender (service role). RLS on with no policies: users can't read or write it.
create table public.reminder_sends (
  habit_id text not null references public.habits (id) on delete cascade,
  day date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (habit_id, day)
);
alter table public.reminder_sends enable row level security;

-- Reminders that are due right now: reminder time reached (within a 15 minute catch-up window)
-- in the user's local time zone, habit scheduled today, not done yet, and not already sent today.
-- The time zone comes from the user's most recently updated device.
create or replace function public.due_habit_reminders(at_time timestamptz default now())
returns table (habit_id text, user_id uuid, name text, local_day date)
language sql
stable
security definer
set search_path = ''
as $$
  with dev as (
    select distinct on (s.user_id) s.user_id, s.tz
    from public.push_subscriptions s
    order by s.user_id, s.updated_at desc
  ),
  cand as (
    select h.id, h.user_id, h.name, h.kind, h.target, h.days, h.focus_tag, h.remind_at, h.created_at, dev.tz,
           (at_time at time zone dev.tz) as local_ts
    from public.habits h
    join dev on dev.user_id = h.user_id
    where not h.deleted and h.remind_at is not null
  )
  select c.id, c.user_id, c.name, c.local_ts::date
  from cand c
  where
    -- reminder time reached, at most 15 minutes ago (no wrap past midnight)
    (extract(hour from c.local_ts) * 60 + extract(minute from c.local_ts))
      between (extract(hour from c.remind_at) * 60 + extract(minute from c.remind_at))
          and (extract(hour from c.remind_at) * 60 + extract(minute from c.remind_at) + 14)
    -- scheduled on this weekday (Mon=1 ... Sun=64) and not before the habit existed
    and (c.days & (1 << (extract(isodow from c.local_ts)::int - 1))) <> 0
    and c.local_ts::date >= (c.created_at at time zone c.tz)::date
    -- not done yet today
    and coalesce(
          case when c.kind = 'focus' then (
            select sum(b.worked_min) from public.blocks b
            where b.user_id = c.user_id and not b.deleted
              and (b.started_at at time zone c.tz)::date = c.local_ts::date
              and (c.focus_tag is null or b.tag_id = c.focus_tag)
          ) else (
            select l.value from public.habit_logs l
            where l.habit_id = c.id and l.day = c.local_ts::date
          ) end, 0) < case when c.kind = 'check' then 1 else c.target end
    -- not already reminded today
    and not exists (
      select 1 from public.reminder_sends r where r.habit_id = c.id and r.day = c.local_ts::date
    );
$$;

-- Only the server (service role) may run it: it reads every user's habits.
revoke execute on function public.due_habit_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.due_habit_reminders(timestamptz) to service_role;
