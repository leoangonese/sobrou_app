const CACHE = 'sobrou-demo-v1';
const FILES = ['./','./index.html','./app.html','./styles.css','./app.js','./manifest.webmanifest','./assets/logo.png','./assets/icon.png','./assets/pwa-192.png','./assets/pwa-512.png','./assets/hero.jpg','./assets/bowl.jpg','./assets/burger.jpg','./assets/bread.jpg','./assets/sweets.jpg','./assets/store.jpg','./assets/package.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sobrou-demo-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));});
