/* Flowmeter service worker: shows habit reminders sent by the server and opens the app when tapped.
   It does not cache anything, so the app always loads fresh from the network. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Flowmeter', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Flowmeter';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    tag: data.tag || 'flowmeter',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) {
        await w.focus();
        try { await w.navigate(url); } catch { /* some browsers block navigate; focusing is enough */ }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
