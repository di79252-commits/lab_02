
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Kliknięcie powiadomienia: aktywuj aplikację albo otwórz ją.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil((async () => {
        const targetUrl = new URL(
            event.notification.data?.url || './',
            self.registration.scope
        ).href;

        const windows = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        for (const client of windows) {
            if (new URL(client.url).origin === self.location.origin) {
                await client.focus();

                if (client.url !== targetUrl && 'navigate' in client) {
                    await client.navigate(targetUrl);
                }

                return;
            }
        }

        await self.clients.openWindow(targetUrl);
    })());
});

// Odbieranie wiadomości Web Push.
self.addEventListener('push', (event) => {
    let message = {
        title: 'Web Push',
        body: event.data ? event.data.text() : '',
        icon: './android.png',
        url: './'
    };

    if (event.data) {
        try {
            message = {
                ...message,
                ...event.data.json()
            };
        } catch (err) {
            // Jeśli wiadomość nie jest JSON-em, użyj jej jako tekstu.
            message.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(
            message.title || 'Web Push',
            {
                body: message.body || '',
                icon: message.icon || './android.png',
                data: {
                    url: message.url || './'
                }
            }
        )
    );
});
