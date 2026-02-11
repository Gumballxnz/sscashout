/* 
 * Service Worker básico para o Sistema Cashout
 * Necessário para evitar erro 404 ao registrar notificações
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Sistema Cashout';
    const options = {
        body: data.body || 'Novo sinal disponível!',
        icon: 'images/icon-192.png',
        badge: 'images/icon-192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
