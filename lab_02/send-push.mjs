
import webpush from 'web-push';
import { readFileSync } from 'node:fs';

const keys = JSON.parse(
    readFileSync('./vapid-keys.json', 'utf8')
);

const subscription = JSON.parse(
    readFileSync('./subscription.json', 'utf8')
);

webpush.setVapidDetails(
    'mailto:di79252@stud.uws.edu.pl',
    keys.publicKey,
    keys.privateKey
);

const payload = JSON.stringify({
    title: 'Powiadomienie Web Push',
    body: 'Powiadomienie wysłane ze skryptu Node.js.',
    icon: './icons/manifest-icon-192.maskable.png',
    url: './'
});

try {
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Powiadomienie wysłane. Status:', result.statusCode);
} catch (error) {
    console.error('Błąd wysyłania Web Push:', error.statusCode, error.message);
    process.exitCode = 1;
}
