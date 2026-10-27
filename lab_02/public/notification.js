
const permissionInfo = document.querySelector('#permission');
const subscriptionField = document.querySelector('#subscription');
const formStatus = document.querySelector('#form-status');

// Pozostawiamy dotychczasowy klucz publiczny VAPID.
const VAPID_PUBLIC_KEY =
    'BAPenDXtC1I0an5hOS6is0R7rDKLBupHigUc2AEW_0ly0267e6iwVSwvGF5_DLeTmLA-fgPpYGLs9vUwO_4uT1c';

function updatePermissionInfo() {
    if (!('Notification' in window)) {
        permissionInfo.textContent = 'brak obsługi w tej przeglądarce';
        return;
    }

    permissionInfo.textContent = Notification.permission;
}

updatePermissionInfo();

// Rejestracja service workera.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service worker zarejestrowany.'))
        .catch((err) => {
            console.error('Błąd rejestracji service workera:', err);
        });
}

// Prośba o uprawnienie dopiero po kliknięciu użytkownika.
document.querySelector('#enable').addEventListener('click', async () => {
    if (!('Notification' in window)) {
        alert('Ta przeglądarka nie obsługuje powiadomień.');
        return;
    }

    try {
        await Notification.requestPermission();
        updatePermissionInfo();
    } catch (err) {
        alert('Nie udało się uzyskać uprawnienia: ' + err.message);
    }
});

// Proste powiadomienie tworzone przez stronę.
function showLocalNotification() {
    if (!('Notification' in window) ||
        Notification.permission !== 'granted') {
        alert('Najpierw włącz powiadomienia.');
        return;
    }

    try {
        const notification = new Notification('Powiadomienie ze strony', {
            body: 'To powiadomienie utworzył skrypt strony.',
            icon: './android.png'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } catch (err) {
        alert(
            'Ta przeglądarka nie obsługuje powiadomień tworzonych przez stronę. ' +
            'Użyj powiadomienia z service workera. Szczegóły: ' + err.message
        );
    }
}

document.querySelector('#local').addEventListener(
    'click',
    showLocalNotification
);

// Powiadomienie wyświetlane przez service workera.
async function showSwNotification() {
    if (!('Notification' in window) ||
        Notification.permission !== 'granted') {
        alert('Najpierw włącz powiadomienia.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(
            'Powiadomienie z service workera',
            {
                body: 'Kliknij, aby wrócić do aplikacji.',
                icon: './icons/manifest-icon-192.maskable.png',
                data: { url: './' }
            }
        );
    } catch (err) {
        alert('Nie udało się wyświetlić powiadomienia: ' + err.message);
    }
}

document.querySelector('#sw').addEventListener(
    'click',
    showSwNotification
);

// Formularz własnego powiadomienia.
document.querySelector('#notification-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.querySelector('#notification-title')
            .value.trim();

        const body = document.querySelector('#notification-body')
            .value.trim();

        const iconPath = document.querySelector('#notification-icon').value;

        if (!title) {
            formStatus.textContent = 'Wpisz tytuł powiadomienia.';
            document.querySelector('#notification-title').focus();
            return;
        }

        if (!('Notification' in window) ||
            Notification.permission !== 'granted') {
            formStatus.textContent =
                'Najpierw kliknij „Włącz powiadomienia” i udziel zgody.';
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            await registration.showNotification(title, {
                body,
                icon: new URL(iconPath, document.baseURI).href,
                data: { url: './' }
            });

            formStatus.textContent = 'Powiadomienie zostało wyświetlone.';
        } catch (err) {
            formStatus.textContent =
                'Błąd wyświetlania powiadomienia: ' + err.message;
        }
    });

// Konwersja publicznego klucza VAPID na tablicę bajtów.
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    return Uint8Array.from(
        atob(base64),
        (character) => character.charCodeAt(0)
    );
}

// Subskrypcja Web Push.
async function subscribePush() {
    if (!('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)) {
        alert('Ta przeglądarka nie obsługuje wymaganych funkcji Web Push.');
        return;
    }

    try {
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            updatePermissionInfo();

            if (permission !== 'granted') {
                alert('Nie udzielono zgody na powiadomienia.');
                return;
            }
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey:
                    urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        subscriptionField.value =
            JSON.stringify(subscription, null, 2);

        alert('Subskrypcja Web Push jest gotowa.');
    } catch (err) {
        alert('Nie udało się zasubskrybować: ' + err.message);
        console.error(err);
    } finally {
        updatePermissionInfo();
    }
}

document.querySelector('#subscribe').addEventListener(
    'click',
    subscribePush
);

// Anulowanie subskrypcji.
async function unsubscribePush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription =
            await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }

        subscriptionField.value = '';
        alert('Subskrypcja została anulowana.');
    } catch (err) {
        alert('Nie udało się anulować subskrypcji: ' + err.message);
    }
}

document.querySelector('#unsubscribe').addEventListener(
    'click',
    unsubscribePush
);

// Kopiowanie danych subskrypcji.
document.querySelector('#copy').addEventListener('click', async () => {
    if (!subscriptionField.value.trim()) {
        alert('Najpierw utwórz subskrypcję Web Push.');
        return;
    }

    try {
        await navigator.clipboard.writeText(subscriptionField.value);
        alert('Skopiowano subskrypcję do schowka.');
    } catch (err) {
        subscriptionField.select();
        alert('Tekst zaznaczono. Skopiuj go ręcznie przez Ctrl+C.');
    }
});
