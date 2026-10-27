
import webpush from 'web-push';
import { writeFileSync } from 'node:fs';

const vapidKeys = webpush.generateVAPIDKeys();

writeFileSync(
    'vapid-keys.json',
    JSON.stringify(vapidKeys, null, 2),
    { mode: 0o600 }
);

console.log('Wygenerowano klucze VAPID w pliku vapid-keys.json');
console.log('Klucz publiczny do aplikacji:');
console.log(vapidKeys.publicKey);
console.log('Klucz prywatny pozostaje lokalnie. Nie publikuj go.');
