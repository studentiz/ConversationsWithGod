// Cache only this application's public assets; conversations remain in IndexedDB.
const PREFIX = 'cwg:' + self.registration.scope + ':';
const CACHE_NAME = PREFIX + '2.1.2';
const ASSETS = ['./','./index.html','./manifest.json','./icons/favicon-32x32.png','./icons/apple-touch-icon.png','./icons/icon-192x192.png','./icons/icon-512x512.png','./icons/maskable-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)));}
  return response;
 }).catch(()=>caches.match('./index.html')));
 else if(ASSETS.some(asset=>new URL(asset,self.registration.scope).href===url.href))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
