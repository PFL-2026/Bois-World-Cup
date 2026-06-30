/* World Cup 2026 — service worker: offline app shell + notification display */
const CACHE="wc2026-v10";
const SHELL=["./","index.html","manifest.json","favicon.ico","icon-192.png","icon-512.png","apple-touch-icon.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const href=e.request.url;
  // Always go to network for live data feeds — never cache these
  if(/openfootball|thesportsdb|githubusercontent|jsdelivr|api\./.test(href))return;
  // Network-first for the page itself so updates show; fall back to cache offline
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request).then(r=>{caches.open(CACHE).then(c=>c.put("index.html",r.clone())).catch(()=>{});return r;}).catch(()=>caches.match("index.html")));
    return;
  }
  // Cache-first for static assets (icons, etc.)
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return resp;}).catch(()=>r)));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window"}).then(cl=>{
    for(const c of cl){if("focus"in c)return c.focus();}
    if(self.clients.openWindow)return self.clients.openWindow("./");
  }));
});
