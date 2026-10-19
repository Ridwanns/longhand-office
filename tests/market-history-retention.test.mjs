import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {MARKET_CATEGORIES} from '../market-catalogue.js';
import {HISTORY_INSTRUMENTS,validateMarketHistories} from '../market-history-contract.js';
import {collectMarketHistories} from '../scripts/market-history-data.mjs';
const fixture=()=>({format:'longhand-market-histories',version:1,publishedAt:'2026-10-19T18:00:00Z',entries:HISTORY_INSTRUMENTS.map(({category,symbol})=>{
 const spec=MARKET_CATEGORIES[category].instruments.find(i=>i.symbol===symbol);
 return {category,symbol,quote:{provider:'yahoo',symbol,currency:spec.currency,instrumentType:spec.type,unit:spec.unit,price:100,timestamp:'2026-10-19T12:00:00Z',retrievedAt:'2026-10-19T18:00:00Z',marketDate:'2026-10-19',realtimeVerified:false,delayMinutes:null,history:[{date:'2026-10-14',close:97},{date:'2026-10-15',close:98}],change:{referenceDate:'2026-10-15',referenceClose:98,value:2,percent:(100/98-1)*100}}};
})});
test('Rate limits retry boundedly and retain every exact prior quote with its acquisition date',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'longhand-history-')),prior=validateMarketHistories(fixture());let calls=0,waits=0;
 try{await writeFile(path.join(directory,'market-history.json'),JSON.stringify(prior));const result=await collectMarketHistories({directory,attempts:2,wait:async()=>{waits++;},fetcher:async()=>{calls++;return {ok:false,status:429};},requireComplete:true});
 assert.equal(calls,HISTORY_INSTRUMENTS.length*2);assert.equal(waits,HISTORY_INSTRUMENTS.length);
 for(const entry of result.entries){const original=prior.entries.find(e=>e.symbol===entry.symbol);assert.deepEqual(entry.quote,original.quote);assert.match(entry.refreshError,/limit/);assert.ok(Date.parse(entry.refreshAttemptAt)<=Date.parse(result.publishedAt));}
 assert.deepEqual(JSON.parse(await readFile(path.join(directory,'market-history.json'),'utf8')),result);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('A required complete publication cannot replace the prior file with unavailable histories',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'longhand-history-')),original='TEST ONLY invalid prior file';
 try{await writeFile(path.join(directory,'market-history.json'),original);await assert.rejects(collectMarketHistories({directory,attempts:1,fetcher:async()=>({ok:false,status:429}),requireComplete:true}),/Publication withheld/);assert.equal(await readFile(path.join(directory,'market-history.json'),'utf8'),original);}
 finally{await rm(directory,{recursive:true,force:true});}
});
test('Retained history requires a valid bounded refresh error and attempt timestamp',()=>{
 for(const mutate of [e=>e.refreshError=500,e=>e.refreshError='x'.repeat(241),e=>e.refreshAttemptAt='unknown',e=>e.refreshAttemptAt='2027-01-01T00:00:00Z']){const f=fixture(),entry=f.entries[0];entry.refreshError='TEST ONLY failure';entry.refreshAttemptAt=f.publishedAt;mutate(entry);assert.throws(()=>validateMarketHistories(f));}
});
