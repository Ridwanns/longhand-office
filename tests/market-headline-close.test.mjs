import test from 'node:test';
import assert from 'node:assert/strict';
import {projectMarketSnapshot} from '../scripts/market-adapter.mjs';
import {validatePublicQuote} from '../public-quote-contract.js';

const at=s=>Date.parse(s)/1000;
const chart=(meta,bars)=>({chart:{error:null,result:[{meta:{currency:'USD',instrumentType:'FUTURE',exchangeName:'NYB',exchangeTimezoneName:'America/New_York',...meta},timestamp:bars.map(b=>at(b[0])),indicators:{quote:[{close:bars.map(b=>b[1])}]}}]}});
const bars=[['2026-11-03T05:00:00Z',135.45],['2026-11-04T05:00:00Z',131.5],['2026-11-05T05:00:00Z',128.45],['2026-11-06T05:00:00Z',133.05]];

test('a days-old provider snapshot yields to the later completed daily bar, keeping the raw snapshot for audit',()=>{
 const retrieved='2026-11-07T06:17:40Z',q=projectMarketSnapshot(chart({symbol:'OJ=F',currency:'USX',regularMarketPrice:130.55,regularMarketTime:at('2026-11-02T15:31:57Z')},bars),'commodities','OJ=F',retrieved);
 assert.equal(q.price,133.05);assert.equal(q.marketDate,'2026-11-06');assert.equal(q.date,'2026-11-06');assert.equal(q.priceKind,'daily-bar-close');
 assert.deepEqual(q.sourceSnapshot,{price:130.55,timestamp:'2026-11-02T15:31:57.000Z'});
 assert.equal(q.change.referenceDate,'2026-11-05');assert.ok(Math.abs(q.change.value-(133.05-128.45))<1e-9);
 assert.equal(validatePublicQuote(q,'commodities','OJ=F',retrieved),q);
});

test('an intraday snapshot on a finished session headlines that session\'s daily close',()=>{
 const retrieved='2026-11-07T06:17:40Z',q=projectMarketSnapshot(chart({symbol:'CC=F',regularMarketPrice:5239,regularMarketTime:at('2026-11-06T18:29:56Z')},[['2026-11-05T05:00:00Z',5181],['2026-11-06T05:00:00Z',5119]]),'commodities','CC=F',retrieved);
 assert.equal(q.price,5119);assert.equal(q.marketDate,'2026-11-06');assert.equal(q.sourceSnapshot.price,5239);
 assert.equal(validatePublicQuote(q,'commodities','CC=F',retrieved),q);
});

test('during an open session the live snapshot stays the headline price',()=>{
 const retrieved='2026-11-06T16:00:00Z',q=projectMarketSnapshot(chart({symbol:'CC=F',regularMarketPrice:5200,regularMarketTime:at('2026-11-06T15:59:00Z')},[['2026-11-05T05:00:00Z',5181],['2026-11-06T05:00:00Z',5190]]),'commodities','CC=F',retrieved);
 assert.equal(q.price,5200);assert.equal(q.priceKind,'source-snapshot');assert.equal(q.sourceSnapshot,undefined);assert.equal(q.date,undefined);
 assert.equal(validatePublicQuote(q,'commodities','CC=F',retrieved),q);
});

test('a series with no daily bars keeps its dated snapshot rather than inventing a close',()=>{
 const retrieved='2026-11-07T06:17:40Z',q=projectMarketSnapshot(chart({symbol:'MTF=F',instrumentType:'ALTSYMBOL',exchangeName:'NYM',regularMarketPrice:104.75,regularMarketTime:at('2025-02-06T09:12:41Z')},[]),'commodities','MTF=F',retrieved);
 assert.equal(q.price,104.75);assert.equal(q.marketDate,'2025-02-06');assert.equal(q.priceKind,'source-snapshot');
});

test('price refreshes let a completed close replace a same-day intraday snapshot but never a later date',async()=>{
 const {olderObservation}=await import('../native-prices.js');
 const snap={marketDate:'2026-11-06',priceKind:'source-snapshot',timestamp:'2026-11-06T18:59:16Z'},bar={marketDate:'2026-11-06',priceKind:'daily-bar-close',timestamp:'2026-11-06T05:00:00Z'};
 assert.equal(olderObservation(bar,snap),false);assert.equal(olderObservation(snap,bar),true);
 assert.equal(olderObservation({...bar,marketDate:'2026-11-05'},snap),true);
 assert.equal(olderObservation({...snap,marketDate:'2026-11-09',timestamp:'2026-11-09T15:00:00Z'},bar),false);
 assert.equal(olderObservation({timestamp:'2026-11-06T10:00:00Z'},{timestamp:'2026-11-06T11:00:00Z'}),true);
});
