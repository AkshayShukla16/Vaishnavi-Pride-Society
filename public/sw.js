/**
 * Vaishnavi Pride PWA Service Worker (sw.js)
 * Enables background web push notifications and offline caching.
 * Receives background push notifications even when the browser tab/window is closed.
 */

const CACHE_NAME = 'vaishnavi-pride-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for Push events (even when browser tab is closed)
self.addEventListener('push', (event) => {
  let title = 'Vaishnavi Pride Alert 🔔';
  let body = 'A new issue or announcement has been broadcasted.';
  let icon = '/pwa-icon.png';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
    } catch {
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon,
    badge: icon,
    vibrate: [200, 100, 200],
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'View App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
