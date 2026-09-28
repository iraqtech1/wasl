'use strict';
// GitHub Pages preview: cache only this project's public interface.
const BASE=new URL('./',self.location.href);
const CACHE='wasel-pages-'+BASE.pathname+'-v1';
const FILES=['./','index.html','manifest.webmanifest','app.js?v=wallet-motion-20260927-2','app.css?v=wallet-motion-20260927-2','styles.css?v=wallet-motion-20260927-2','platform.css?v=wallet-motion-20260927-2','courier-registration.js?v=1','courier-registration.css?v=1','assets/fonts.css?v=cairo-1','assets/cairo-variable.ttf','assets/font-1-3.ttf','assets/wasel-brand.jpeg','assets/icon-192.png','assets/icon-512.png','assets/apple-touch-icon.png'].map(file=>new URL(file,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('wasel-pages-'+BASE.pathname+'-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.pathname.startsWith(BASE.pathname+'api/'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request,{cache:'no-store'});
   if(response.ok)await cache.put(event.request,response.clone()).catch(()=>{});
   return response;
  }catch{
   const cached=await cache.match(event.request);
   if(cached)return cached;
   if(event.request.mode==='navigate'&&[BASE.pathname,BASE.pathname+'index.html'].includes(url.pathname))return (await cache.match(new URL('index.html',BASE).href))||new Response('Offline',{status:503});
   return new Response('Offline',{status:503});
  }
 })());
});
