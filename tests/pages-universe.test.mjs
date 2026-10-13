import test from 'node:test';
import assert from 'node:assert/strict';
import {STOCK_UNIVERSE} from '../pages/stock-universe.js';
import {recentLiquidity} from '../scripts/pages-liquidity.mjs';
import {configFor} from '../scripts/quant-data.mjs';

test('published stock coverage is unique, normalized and includes ADRO and major US/IDX names',()=>{
 for(const [market,tickers] of Object.entries(STOCK_UNIVERSE)){
  assert.equal(new Set(tickers).size,tickers.length);
  for(const ticker of tickers)assert.equal(configFor({market,ticker,cutoff:'2026-10-09',basis:'adjusted',horizon:5,seed:42}).ticker,ticker);
 }
 for(const ticker of ['ADRO','AADI','BBCA','BBRI','BMRI','TLKM','ASII','ANTM'])assert.ok(STOCK_UNIVERSE.IDX.includes(ticker));
 for(const ticker of ['AAPL','MSFT','NVDA','TSLA','JPM','BRK-B','SPY'])assert.ok(STOCK_UNIVERSE.US.includes(ticker));
});
test('liquidity estimate independently averages price times volume, exposes missing observations and excludes incomplete sessions',()=>{
 const rows=[{date:'2026-10-05',rawClose:100,volume:10,complete:true},{date:'2026-10-06',rawClose:200,volume:20,complete:true},{date:'2026-10-07',rawClose:null,volume:30,complete:true},{date:'2026-10-08',rawClose:300,volume:0,complete:true},{date:'2026-10-09',rawClose:999,volume:999,complete:false}];
 const estimate=recentLiquidity(rows);
 assert.equal(estimate.averageTradedValue,5000/3);assert.equal(estimate.averageVolume,10);
 assert.equal(estimate.observations,3);assert.equal(estimate.windowSessions,4);assert.equal(estimate.endDate,'2026-10-08');
 assert.match(estimate.method,/Not exchange-reported/);
 assert.equal(recentLiquidity([{rawClose:null,volume:10,complete:true}]),null);
});
test('liquidity window uses only the latest twenty completed source sessions',()=>{
 const rows=Array.from({length:25},(_,i)=>({date:String(i),rawClose:10,volume:i,complete:true}));
 const estimate=recentLiquidity(rows);assert.equal(estimate.startDate,'5');assert.equal(estimate.observations,20);assert.equal(estimate.averageTradedValue,145);
});
