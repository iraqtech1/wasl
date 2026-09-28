'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const d=require('./domain.cjs');const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const rate=new Map();
function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4000000)d.fail('حجم الصور أو الطلب كبير',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{d.fail('بيانات غير صالحة');}}
function token(req){return /(?:^|;\s*)wasel_session=([^;]+)/.exec(req.headers.cookie||'')?.[1];}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
 try{
 const url=new URL(req.url,'http://localhost');const route=url.pathname;
 if(route.startsWith('/api/')){
  const proxiedHttps=process.env.TRUST_LOCAL_PROXY==='1'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&req.headers['x-forwarded-proto']==='https';
  if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`${proxiedHttps?'https':'http'}://${req.headers.host}`)d.fail('مصدر الطلب غير مسموح',403);
  if(req.method==='POST'&&!String(req.headers['content-type']).startsWith('application/json'))d.fail('يلزم JSON',415);
  const p=req.method==='POST'?await body(req):{};
  if(route==='/api/login'&&req.method==='POST'){
   const k=req.socket.remoteAddress;const a=rate.get(k)||{count:0,until:Date.now()+60000};if(a.until<Date.now()){a.count=0;a.until=Date.now()+60000;}if(++a.count>30)d.fail('محاولات كثيرة؛ انتظر دقيقة',429);rate.set(k,a);
   const result=d.login(p);res.setHeader('Set-Cookie',`wasel_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);return json(res,{user:result.user});
  }
  if(route==='/api/register'&&req.method==='POST')return json(res,{user:d.register(p)});
  const u=d.session(token(req));if(!u)d.fail('يلزم تسجيل الدخول',401);
  if(route==='/api/logout'){d.db.prepare('DELETE FROM sessions WHERE token=?').run(token(req));res.setHeader('Set-Cookie','wasel_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,{ok:true});}
  if(route==='/api/state'&&req.method==='GET')return json(res,d.view(u));
  if(route==='/api/orders'&&req.method==='POST')return json(res,d.create(u,p));
  const m=route.match(/^\/api\/orders\/([^/]+)\/action$/);if(m&&req.method==='POST')return json(res,d.action(u,m[1],p.action,p));
  if(route==='/api/profile'&&req.method==='POST')return json(res,d.update(u,p));
  d.fail('المسار غير موجود',404);
 }
 if(!['GET','HEAD'].includes(req.method))d.fail('الطريقة غير متاحة',405);
 const role=/^\/(merchant|courier)\//.exec(route)?.[1];
 if(/^\/(merchant|courier)\/manifest\.webmanifest$/.test(route)||route==='/manifest.webmanifest'){const r=role||'merchant',names={merchant:'التاجر',courier:'المندوب'};res.writeHead(200,{'Content-Type':'application/manifest+json','Cache-Control':'no-cache'});return res.end(JSON.stringify({id:`/${r}/`,name:`واصل — ${names[r]}`,short_name:`واصل ${names[r]}`,description:'منصة واصل للتوصيل: إنشاء الطلبات، الحجز، الاستلام، التوصيل، الإرجاع، التسوية والمحفظة.',lang:'ar',dir:'rtl',categories:['business','productivity','navigation'],start_url:`/${r}/`,scope:'/',display:'standalone',display_override:['standalone','minimal-ui'],orientation:'portrait',theme_color:'#00567a',background_color:'#f8f9ff',icons:[{src:'/assets/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/assets/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/assets/icon-maskable-192.png',sizes:'192x192',type:'image/png',purpose:'maskable'},{src:'/assets/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]}));}
 if(route==='/'||/^\/(merchant|courier)\/?$/.test(route)||route==='/index.html'){let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').replace('<base href="./">','<base href="/">').replace('href="manifest.webmanifest"',`href="/${role||'merchant'}/manifest.webmanifest"`);res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-cache'});return res.end(html);}
 const allowed=['/courier-registration.js','/courier-registration.css','/app.js','/app.css','/platform.css','/styles.css','/sw.js'];if(!allowed.includes(route)&&!/^\/assets\/[a-zA-Z0-9._-]+$/.test(route))d.fail('غير موجود',404);
 const file=path.join(__dirname,route);if(!fs.existsSync(file))d.fail('غير موجود',404);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
 }catch(e){json(res,{error:e.status?e.message:'تعذر إكمال العملية؛ أعد المحاولة.'},e.status||500);if(!e.status)console.error(e);}
});
const host=process.env.HOST||'127.0.0.1';
server.listen(port,host,()=>console.log(`Wasel platform http://${host}:${port} (local demo)`));
