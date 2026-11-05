-- Every minute, ask the send-reminders Edge Function to send any due habit reminders.
-- The function checks a shared secret. The secret lives in Supabase Vault as 'reminders_cron_secret'
-- (created by hand, never in Git) and as the function secret CRON_SECRET.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-habit-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://tdgufuwotovstrkbllwm.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
