// Service worker : permet d'installer le jeu et d'y jouer hors connexion quand il est servi par un site web (http/https).
// Stratégie « réseau d'abord » : on prend toujours la dernière version, et la copie en cache sert seulement sans connexion.
const CACHE='rugby-manager';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r.ok){const c=r.clone();caches.open(CACHE).then(k=>k.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request)));
});
