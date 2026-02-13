/* 
 * Service Worker — Sistema Cashout
 * Push notifications + notification click handling
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'Sistema Cashout', body: event.data?.text() || 'Novo sinal!' };
    }

    const title = data.title || 'Sistema Cashout';
    const options = {
        body: data.body || 'Novo sinal disponível!',
        icon: data.icon || '/images/icon-192.png',
        badge: data.badge || '/favicon.ico',
        tag: data.tag || 'cashout-notification',
        renotify: data.renotify !== false,
        requireInteraction: data.requireInteraction || false,
        data: data.data || { url: '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    // Track click
    try {
        fetch('/api/notification/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: event.notification.tag, ts: new Date().toISOString() })
        }).catch(() => { });
    } catch (e) { }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
