import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireHistory,configFor} from '../scripts/quant-data.mjs';
const config=configFor({ticker:'AAPL',market:'US',cutoff:'2026-10-12',horizon:5});
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
