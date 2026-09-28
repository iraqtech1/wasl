'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('Pages worker precaches real files within its scope and serves offline shell',async()=>{
 const handlers={},entries=new Map();let urls=[];
 const cache={addAll:async list=>{urls=list;for(const url of list){const file=new URL(url).pathname.replace('/wasl/','')||'index.html';assert.ok(fs.existsSync(file),file);entries.set(url,new Response(file));}},match:async key=>entries.get(key.url||key)};
 vm.runInNewContext(fs.readFileSync('pages-sw.js','utf8'),{URL,Response,fetch:async()=>{throw Error('offline');},caches:{open:async()=>cache},self:{location:{href:'https://example.test/wasl/pages-sw.js'},skipWaiting:async()=>{},addEventListener:(name,fn)=>handlers[name]=fn}});
 let installed;handlers.install({waitUntil:p=>installed=p});await installed;
 assert.ok(urls.every(url=>url.startsWith('https://example.test/wasl/')));
 let result;handlers.fetch({request:{url:'https://example.test/wasl/?from=install',method:'GET',mode:'navigate'},respondWith:p=>result=p});
 assert.equal(await (await result).text(),'index.html');
 result=undefined;handlers.fetch({request:{url:'https://example.test/other/',method:'GET'},respondWith:p=>result=p});assert.equal(result,undefined);
});
function worker(fetch){
 const handlers={},entries=new Map();
 const cache={match:async key=>entries.get(key.url||key),put:async(key,value)=>entries.set(key.url||key,value)};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{URL,Response,fetch,caches:{open:async()=>cache},self:{location:{origin:'https://wasel.test'},addEventListener:(name,fn)=>handlers[name]=fn}});
 return {entries,request:(path,mode='cors',method='GET')=>{let result;handlers.fetch({request:{url:'https://wasel.test'+path,mode,method},respondWith:value=>result=value});return result;}};
}
test('refresh retrieves updated assets and saves the new offline copy',async()=>{
 const w=worker(async(req,options)=>{assert.equal(options.cache,'no-store');return new Response('new');});
 w.entries.set('https://wasel.test/app.js',new Response('old'));
 assert.equal(await (await w.request('/app.js')).text(),'new');
 assert.equal(await w.entries.get('https://wasel.test/app.js').text(),'new');
});
test('offline assets and navigation use cached copies',async()=>{
 const w=worker(async()=>{throw Error('offline');});
 w.entries.set('https://wasel.test/app.js',new Response('saved'));
 w.entries.set('/index.html',new Response('shell'));
 assert.equal(await (await w.request('/app.js')).text(),'saved');
 assert.equal(await (await w.request('/courier/','navigate')).text(),'shell');
 assert.equal((await w.request('/missing.png')).status,503);
});
test('API requests bypass cache and server errors stay visible',async()=>{
 const w=worker(async()=>new Response('failure',{status:500}));
 assert.equal(w.request('/api/state'),undefined);
 assert.equal(w.request('/api/login','cors','POST'),undefined);
 assert.equal((await w.request('/app.js')).status,500);
 assert.equal((await w.request('/unknown','navigate')).status,404);
});
