'use strict';
const CACHE='wasel-platform-pwa-v4';
const FILES=['/courier-registration.css?v=1','/courier-registration.js?v=1','/','/index.html','/app.js?v=wallet-motion-20260927-2','/app.css?v=wallet-motion-20260927-2','/platform.css?v=wallet-motion-20260927-2','/styles.css?v=wallet-motion-20260927-2','/assets/wasel-brand.jpeg','/assets/fonts.css?v=cairo-1','/assets/cairo-variable.ttf','/assets/icon-192.png','/assets/icon-512.png','/assets/icon-maskable-192.png','/assets/icon-maskable-512.png','/assets/apple-touch-icon.png','/assets/favicon-48.png','/assets/favicon-32.png','/assets/font-1-3.ttf','/merchant/manifest.webmanifest','/courier/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('wasel-platform-')||k.startsWith('wasel-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Always request current files online; cached files only support offline use.
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(url.origin!==self.location.origin||e.request.method!=='GET'||url.pathname.startsWith('/api/'))return;
 const navigation=e.request.mode==='navigate';
 if(navigation&&!['/','/index.html','/merchant/','/courier/','/merchant','/courier'].includes(url.pathname)){
  e.respondWith(Promise.resolve(new Response('Not found',{status:404})));return;
 }
 e.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(e.request,{cache:'no-store'});
   if(response.ok)await cache.put(e.request,response.clone()).catch(()=>{});
   return response;
  }catch{
   return (await cache.match(e.request))||(navigation?await cache.match('/index.html'):null)||new Response('Offline',{status:503});
  }
 })());
});
