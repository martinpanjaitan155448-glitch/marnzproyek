const CACHE='tabunganku-v1.5';
const FILES=['./','index.html','css/style.css','css/auth.css','js/store.js','js/ui.js','js/auth.js','js/charts.js','js/pet.js','js/app.js','legal/privacy-policy.html','legal/terms-of-service.html','foto/profil/default.svg','icons/icon.svg','manifest.webmanifest'];
// Lalu-lintas database/login Google tidak boleh lewat cache (stream Firestore & login)
const API=/(firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com|firebaseapp\.com|apis\.google\.com|accounts\.google\.com|github\.com/;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||API.test(e.request.url))return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{});return r}).catch(()=>caches.match(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l.length?l[0].focus():clients.openWindow('./index.html')))});
