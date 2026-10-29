/**
 * Convertify - Service Worker pro ochranu před výpadky a offline provoz.
 * Umožňuje používat aplikaci a převádět soubory, i když je Lenovo server vypnutý.
 */

const CACHE_NAME = 'convertify-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './libs/fonts/outfit.css',
    './libs/fonts/outfit-latin.woff2',
    './libs/fonts/outfit-latinext.woff2',
    './libs/pdf.min.js',
    './libs/pdf.worker.min.js',
    './libs/jspdf.umd.min.js',
    './libs/jszip.min.js',
    './libs/xlsx.full.min.js',
    './libs/mammoth.browser.min.js'
];

// Instalace a uložení všech souborů do mezipaměti
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Aktivace a vyčištění starých verzí mezipaměti
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Strategie Network-First s okamžitým přepnutím na Cache při nedostupnosti serveru
self.addEventListener('fetch', (event) => {
    // Ignorujeme požadavky na health check
    if (event.request.url.includes('/health')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Pokud server odpověděl, aktualizujeme mezipaměť na pozadí
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Server je vypnutý nebo nedostupný -> servírujeme přímo z mezipaměti prohlížeče
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
