import test from 'node:test';
import assert from 'node:assert/strict';
import {empty} from '../model.js';
let counter=0;
const fresh=()=>import('../office-storage.js?audit='+counter++);
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('a delayed old read cannot regress a newer workspace revision or data',async()=>{
 const original=globalThis.fetch;let finishOld;
 const {OfficeStorage}=await fresh(),s=new OfficeStorage('TEST-audit');s.marker={id:'TEST-workspace'};
 globalThis.localStorage={getItem:()=>null};
 let reads=0;globalThis.fetch=async()=>++reads===1?new Promise(resolve=>{finishOld=resolve;}):json({id:'TEST-workspace',revision:3,data:{...empty(),testVersion:'NEW'}});
 try{const old=s.load();const newer=await s.load();assert.equal(newer.testVersion,'NEW');finishOld(json({id:'TEST-workspace',revision:2,data:{...empty(),testVersion:'OLD'}}));assert.equal((await old).testVersion,'NEW');assert.equal(s.revision,3);}finally{globalThis.fetch=original;s.channel.close();}
});
test('expired token is refreshed once; forbidden origins and network failures never replay writes',async()=>{
 const original=globalThis.fetch;
 try{const {api}=await fresh();let status=0,writes=0;globalThis.fetch=async url=>url.endsWith('/status')?json({token:'token-'+ ++status}):++writes===1?json({code:'LOCAL_TOKEN_EXPIRED',error:'expired'},403):json({ok:true});assert.deepEqual(await api('cancel',{id:'TEST'}),{ok:true});assert.equal(status,2);assert.equal(writes,2);
 const other=await fresh();writes=0;globalThis.fetch=async url=>url.endsWith('/status')?json({token:'valid'}):(writes++,json({code:'LOCAL_ORIGIN_REQUIRED',error:'forbidden'},403));await assert.rejects(()=>other.api('cancel',{id:'TEST'}),/forbidden/);assert.equal(writes,1);
 const failed=await fresh();writes=0;globalThis.fetch=async url=>{if(url.endsWith('/status'))return json({token:'valid'});writes++;throw Error('network lost after request');};await assert.rejects(()=>failed.api('workspace',{id:'TEST'}),/network lost/);assert.equal(writes,1);
 }finally{globalThis.fetch=original;}
});
test('request payload is captured before token acquisition and malformed responses fail clearly',async()=>{
 const original=globalThis.fetch;let finishToken,payloadSeen;
 try{const {api}=await fresh();globalThis.fetch=async(url,options)=>{if(url.endsWith('/status'))return new Promise(r=>{finishToken=r;});payloadSeen=JSON.parse(options.body);return json({ok:true});};const body={value:'original'},pending=api('workspace',body);body.value='changed later';finishToken(json({token:'valid'}));await pending;assert.equal(payloadSeen.value,'original');
 const bad=await fresh();globalThis.fetch=async()=>new Response('<html>failure</html>',{status:502});await assert.rejects(()=>bad.api('runs'),/unreadable response \(502\)/);
 }finally{globalThis.fetch=original;}
});
