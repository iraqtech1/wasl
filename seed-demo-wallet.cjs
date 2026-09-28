'use strict';
// Adds labelled sample entries only to the two built-in demo accounts.
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const db=new DatabaseSync(path.join(process.env.WASEL_DATA_DIR||path.join(__dirname,'data'),'wasel.sqlite'));
const samples={
 'MER-DEMO':[[100000,'رصيد افتتاحي تجريبي'],[75000,'إضافة رصيد تجريبية'],[-8500,'خصم تجريبي أول'],[-4000,'خصم تجريبي ثانٍ']],
 'COU-DEMO':[[80000,'رصيد افتتاحي تجريبي'],[30000,'إضافة رصيد تجريبية'],[-6000,'خصم تجريبي أول'],[-2500,'خصم تجريبي ثانٍ']]
};
try{
 db.exec('BEGIN IMMEDIATE');
 for(const [owner,entries] of Object.entries(samples)){
  const user=db.prepare('SELECT profile FROM users WHERE id=?').get(owner);
  if(!user||JSON.parse(user.profile).demo!==true)continue;
  entries.forEach(([amount,reason],i)=>{
   const id=`WALLET-SAMPLE-20260927-${owner}-${i}`;
   const body={id,amount,reason,demo:true,at:new Date(Date.now()-(entries.length-i)*3600000).toISOString()};
   db.prepare('INSERT OR IGNORE INTO records(id,kind,owner,order_id,body) VALUES(?,?,?,?,?)').run(id,'wallet',owner,'',JSON.stringify(body));
  });
  const records=db.prepare("SELECT body FROM records WHERE kind='wallet' AND owner=?").all(owner).map(r=>JSON.parse(r.body));
  const credits=records.reduce((n,r)=>n+Math.max(0,r.amount),0),debits=records.reduce((n,r)=>n+Math.max(0,-r.amount),0);
  console.log(JSON.stringify({owner,credits,debits,balance:credits-debits,samples:records.filter(r=>r.demo).length}));
 }
 db.exec('COMMIT');
}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
