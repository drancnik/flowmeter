// Sends due habit reminders as web push notifications.
// Called every minute by pg_cron (see migration 20261105121653_habit_reminders_schedule.sql).
// Secrets (set with `supabase secrets set`, never in Git): CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

type Due = { habit_id: string; user_id: string; name: string; local_day: string };
type Device = { id: number; endpoint: string; p256dh: string; auth: string };

const env = (k: string) => Deno.env.get(k) ?? "";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

webpush.setVapidDetails(env("VAPID_SUBJECT") || "https://flowmeter-delta.vercel.app", env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));

Deno.serve(async (req) => {
  const secret = env("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "unauthorized" }, 401);

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const { data, error } = await db.rpc("due_habit_reminders");
  if (error) return json({ error: error.message }, 500);
  const due = (data ?? []) as Due[];

  let sent = 0, removed = 0, failed = 0;
  for (const r of due) {
    // Claim the reminder first, so two overlapping runs never send it twice.
    const claim = await db.from("reminder_sends").insert({ habit_id: r.habit_id, day: r.local_day, user_id: r.user_id });
    if (claim.error) continue;

    const { data: devices } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", r.user_id);
    const payload = JSON.stringify({
      title: r.name,
      body: "Not done yet today. Tap to open your habits.",
      tag: "habit-" + r.habit_id,
      url: "/?tab=habits",
    });
    for (const d of (devices ?? []) as Device[]) {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, payload, { TTL: 3600, urgency: "high" });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          // The device unsubscribed or the app was removed: forget it.
          await db.from("push_subscriptions").delete().eq("id", d.id);
          removed++;
        } else {
          failed++;
          console.error("push failed", code);
        }
      }
    }
  }
  return json({ due: due.length, sent, removed, failed });
});
