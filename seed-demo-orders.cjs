const demoDocuments=require('./demo-documents.cjs');
'use strict';
const d=require('./domain.cjs');
const password='WaselDemo2026!';
const plans={draft:[],published:['publish'],delivered:['publish','reserve','arrive','pickup','transit','customer_arrive','deliver'],returned:['publish','reserve','arrive','pickup','transit','fail','return','return_start','return_arrive','receive_return','settle_return'],cancelled:['publish','cancel'],reserved:['publish','reserve'],approaching:['publish','reserve','depart'],arrived:['publish','reserve','arrive'],waiting:['publish','reserve','arrive','wait'],received:['publish','reserve','arrive','pickup'],transit:['publish','reserve','arrive','pickup','transit'],at_customer:['publish','reserve','arrive','pickup','transit','customer_arrive'],failed:['publish','reserve','arrive','pickup','transit','fail'],retry:['publish','reserve','arrive','pickup','transit','fail','retry'],return_pending:['publish','reserve','arrive','pickup','transit','fail','return'],returning:['publish','reserve','arrive','pickup','transit','fail','return','return_start'],partial_pending:['publish','reserve','arrive','pickup','transit','customer_arrive','partial_propose','partial_approve','partial_confirm']};
const locations=['المنصور','زيونة','الجادرية','بغداد الجديدة','الحارثية','الكرادة'];
const merchant=d.user('MER-DEMO');if(!merchant?.demo)throw Error('Only demo accounts may be populated');
const configRow=d.db.prepare('SELECT body FROM config WHERE id=1').get();
const save=o=>d.db.prepare('UPDATE orders SET merchant=?,courier=?,status=?,body=? WHERE id=?').run(o.merchant,o.courier,o.status,JSON.stringify(o),o.id);
const accounts=[];
try{
 d.db.prepare('INSERT INTO config VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify({...d.config(),partialEnabled:true}));
 let i=0;
 for(const [state,steps] of Object.entries(plans)){
  i++;const oid='ORD-SAMPLE-'+state.toUpperCase();
  if(d.db.prepare('SELECT id FROM orders WHERE id=?').get(oid)){console.log('EXISTS '+oid);continue;}
  let courier=d.user('COU-DEMO');
  if(steps.includes('reserve')&&!['delivered','returned','reserved'].includes(state)){
   const phone='0779900'+String(i).padStart(4,'0');
   courier=d.users().find(u=>u.phone===phone&&u.role==='courier');
   if(!courier){courier=d.register({role:'courier',documents:demoDocuments(),confirmPassword:password,name:'مندوب فحص — '+d.statuses[state],phone,password,vehicle:'sedan',plate:'تجريبي '+i,province:'بغداد',area:'الكرادة',address:'موقع فحص افتراضي',location:merchant.location});const row=d.db.prepare('SELECT profile FROM users WHERE id=?').get(courier.id);d.db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify({...JSON.parse(row.profile),demo:true}),courier.id);}
   d.update(courier,{action:'readiness',available:true,budget:500000,radius:20,location:merchant.location});
   accounts.push({state:d.statuses[state],phone,id:courier.id});
  }
  const o=d.create(merchant,{amount:20000+i*2500,count:3,weight:2,length:25,width:20,height:15,nature:i%3===0?'fragile':'normal',vehicle:'sedan',fee:5000,returnFee:3000,feePayer:'customer',recipient:{name:'مستلم تجريبي '+i,phone:'0778800'+String(i).padStart(4,'0'),area:locations[i%locations.length],address:'عنوان تجريبي — بناية '+i,landmark:'نقطة فحص افتراضية',location:{lat:33.30+i*.001,lng:44.43+i*.001}},notes:'طلب تجريبي لفحص حالة: '+d.statuses[state]+' — لا يمثل شحنة حقيقية.'});
  d.db.prepare('UPDATE orders SET id=? WHERE id=?').run(oid,o.id);d.db.prepare('UPDATE records SET order_id=? WHERE order_id=?').run(oid,o.id);o.id=oid;o.demo=true;save(o);
  for(const action of steps){
   const current=d.order(oid);let p={};
   if(action==='pickup')p={code:current.handoverCode,inspected:true,paid:true};
   if(action==='deliver')p={confirmed:true,proof:'إثبات تسليم تجريبي لفحص دورة الطلب'};
   if(action==='fail')p={reason:'تعذر تواصل تجريبي مع المستلم'};
   if(action==='retry')p={when:new Date(Date.now()+86400000).toISOString()};
   if(action==='receive_return')p={inspected:true};
   if(action==='settle_return')p={confirmed:true,fees:8000};
   if(action==='partial_propose')p={count:1,amount:Math.floor(current.amount/2)};
   if(action==='partial_confirm')p={confirmed:true};
   const actor=['publish','cancel','receive_return','partial_approve'].includes(action)?merchant:courier;
   d.action(actor,oid,action,p);
   if(action==='reserve'){const booked=d.order(oid);booked.deadline=new Date(Date.now()+7*86400000).toISOString();booked.originalMinutes=7*24*60;save(booked);}
  }
  if(steps.includes('reserve')){d.action(merchant,oid,'chat',{text:'محادثة تجريبية مرتبطة بهذا الطلب، للتأكد من عرض التفاصيل.'});d.action(courier,oid,'chat',{text:'تم الاطلاع — هذا طلب فحص فقط.'});}
  if(['delivered','returned'].includes(state)){d.action(merchant,oid,'rate',{stars:5,text:'تقييم تجريبي بعد إكمال التسوية'});}
  if(d.order(oid).status!==state)throw Error('Unexpected state: '+oid);
  for(const r of d.db.prepare('SELECT id,body FROM records WHERE order_id=?').all(oid)){const body=JSON.parse(r.body);body.demo=true;if(body.reason)body.reason+=' (تجريبي)';d.db.prepare('UPDATE records SET body=? WHERE id=?').run(JSON.stringify(body),r.id);}
  console.log('CREATED '+oid+' '+state);
 }
 console.log(JSON.stringify({coverage:Object.keys(d.statuses).map(status=>({status,count:d.orders().filter(o=>o.status===status).length})),additionalCouriers:accounts,password},null,2));
}finally{if(configRow)d.db.prepare('UPDATE config SET body=? WHERE id=1').run(configRow.body);else d.db.prepare('DELETE FROM config WHERE id=1').run();d.db.close();}
