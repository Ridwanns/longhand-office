import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireHistory,acquirePublishedHistory,configFor,hash} from '../scripts/quant-data.mjs';
const config=configFor({ticker:'AAPL',market:'US',cutoff:'2026-10-12',horizon:5});
const publishedFixture=(market='IDX',ticker='BBCA')=>{
 const retrievedAt='2026-10-13T10:00:00.000Z',raw={metadata:{ticker,market,provider:'yahoo',currency:market==='IDX'?'IDR':'USD',instrumentType:'EQUITY',listing:market==='IDX'?'JKT':'NMS',timezone:market==='IDX'?'Asia/Jakarta':'America/New_York',retrievedAt,sourceHash:'a'.repeat(64)},rows:Array.from({length:370},(_,i)=>({date:new Date(Date.parse('2025-01-01')+i*86400000).toISOString().slice(0,10),rawClose:100+i,adjustedClose:50+i,volume:100,complete:true}))},manifest={format:'longhand-public-market-data',version:1,publishedAt:retrievedAt,histories:[{ticker,market,file:'history/'+market+'-'+ticker+'.json',retrievedAt}]};return {raw,manifest};
};
test('explicit published history uses one retained Yahoo file, preserves acquisition vintage and does not query Flowless',async()=>{
 const {raw,manifest}=publishedFixture(),files=[],d=await acquirePublishedHistory({...config,market:'IDX',ticker:'BBCA',historySource:'published-yahoo'},async name=>{files.push(name);return JSON.stringify(name==='manifest.json'?manifest:raw);});assert.deepEqual(files,['manifest.json','history/IDX-BBCA.json']);assert.equal(d.observations.length,370);assert.equal(d.observations[0].price,50);assert.equal(d.metadata.provider,'yahoo');assert.equal(d.metadata.retrievedAt,raw.metadata.retrievedAt);assert.equal(d.metadata.publishedFileHash,hash(raw));assert.match(d.metadata.priceDefinition,/splits and dividends/);assert.match(d.metadata.acquisitionPolicy,/No Flowless\/MSN mixing/);
});
test('published history rejects issuer, currency, vintage, completion schema and unsafe source selection',async()=>{
 for(const edit of [r=>r.metadata.ticker='ADRO',r=>r.metadata.currency='USD',r=>r.metadata.provider='flowless',r=>r.metadata.retrievedAt='2026-10-14T00:00:00.000Z',r=>delete r.rows[0].complete,r=>r.metadata.listing='NMS']){const {raw,manifest}=publishedFixture();edit(raw);await assert.rejects(acquirePublishedHistory({...config,market:'IDX',ticker:'BBCA',historySource:'published-yahoo'},async name=>JSON.stringify(name==='manifest.json'?manifest:raw)),/mismatch/);}
 assert.throws(()=>configFor({...config,historySource:'https://foreign.example'}));assert.equal(configFor(config).historySource,undefined);assert.deepEqual(configFor({...config,historySource:''}),configFor(config));assert.equal(configFor({...config,historySource:'published-yahoo'}).historySource,'published-yahoo');
 await assert.rejects(acquirePublishedHistory({...config,historySource:'published-yahoo'},async()=>{throw Error('TEST ONLY missing');}),/No other provider|no other provider/);
});
test('published data never fills missing sessions or lowers the model minimum',async()=>{
 const {raw,manifest}=publishedFixture();raw.rows=raw.rows.slice(-289);const d=await acquirePublishedHistory({...config,market:'IDX',ticker:'BBCA',historySource:'published-yahoo'},async name=>JSON.stringify(name==='manifest.json'?manifest:raw));assert.equal(d.observations.length,289);const {analyze}=await import('../quant-math.js');assert.throws(()=>analyze(d,config),/350 required/);
 const {raw:us,manifest:usManifest}=publishedFixture('US','AAPL');const u=await acquirePublishedHistory({...config,historySource:'published-yahoo'},async name=>JSON.stringify(name==='manifest.json'?usManifest:us));assert.equal(u.metadata.currency,'USD');assert.equal(u.metadata.ticker,'AAPL');
});
test('provider failures, missing raw/adjusted prices and unsupported listings are rejected',async()=>{
 const original=globalThis.fetch,requests=[];
 try{
  globalThis.fetch=async(url,options)=>{requests.push({url,options});return new Response('{}',{status:429});};await assert.rejects(()=>acquireHistory(config),/429/);
  assert.equal(requests.length,1);assert.ok(requests[0].url.startsWith('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?'));assert.equal(requests[0].options.redirect,'error');assert.equal(requests[0].options.body,undefined);
  globalThis.fetch=async()=>new Response(JSON.stringify({chart:{result:[{meta:{symbol:'AAPL',instrumentType:'INDEX',currency:'USD',exchangeName:'NMS'}}]}}));await assert.rejects(()=>acquireHistory(config),/equities/);
  globalThis.fetch=async()=>new Response(JSON.stringify({chart:{result:[{meta:{symbol:'MSFT',instrumentType:'EQUITY',currency:'USD',exchangeName:'NMS'}}]}}));await assert.rejects(()=>acquireHistory(config),/match/);
  const raw={chart:{result:[{meta:{symbol:'AAPL',instrumentType:'EQUITY',currency:'USD',exchangeName:'NMS',exchangeTimezoneName:'America/New_York'},timestamp:[Date.parse('2026-01-01T21:00:00Z')/1000],indicators:{quote:[{close:[100]}]}}]}};
  globalThis.fetch=async()=>new Response(JSON.stringify(raw));await assert.rejects(()=>acquireHistory(config),/Latest completed/);const d=await acquireHistory({...config,basis:'raw'});assert.equal(d.observations[0].price,100);assert.equal(d.metadata.basis,'raw');
 }finally{globalThis.fetch=original;}
});
test('incomplete current-day candle is excluded even if it has a valid close',async()=>{
 const original=globalThis.fetch;
 try{const now=Date.now(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),stamp=Date.parse(today+'T12:00:00-04:00')/1000;
 const raw={chart:{result:[{meta:{symbol:'AAPL',instrumentType:'EQUITY',currency:'USD',exchangeName:'NMS',exchangeTimezoneName:'America/New_York',currentTradingPeriod:{regular:{end:now/1000+86400}}},timestamp:[stamp-86400,stamp],indicators:{quote:[{close:[100,101]}],adjclose:[{adjclose:[100,101]}]}}]}};
 globalThis.fetch=async()=>new Response(JSON.stringify(raw));const d=await acquireHistory({...config,cutoff:today});assert.equal(d.observations.length,1);assert.ok(d.metadata.omissions.some(o=>o.reason==='Incomplete daily session'));
 }finally{globalThis.fetch=original;}
});
test('IDX requests fixed local service only, verifies ticker and uses documented adjusted-close field',async()=>{const original=globalThis.fetch;try{let urlSeen;globalThis.fetch=async url=>{urlSeen=url;return new Response(JSON.stringify({ticker:'BBCA',series:[{trade_date:'2026-01-01',close:100,adj_close:50,volume:100}]}));};const d=await acquireHistory({...config,ticker:'BBCA',market:'IDX'});assert.equal(urlSeen,'http://127.0.0.1:8000/api/ticker/BBCA');assert.equal(d.observations[0].price,50);assert.match(d.metadata.priceDefinition,/dividends excluded/);assert.equal(d.metadata.currency,'IDR');await assert.rejects(()=>acquireHistory({...config,ticker:'BBRI',market:'IDX'}),/different ticker/);}finally{globalThis.fetch=original;}});
