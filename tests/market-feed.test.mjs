import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_FEEDS,marketFeedUrl,marketFeedPanel,verifiedFeedStock} from '../market-feed.js';
test('Public feed cannot claim exchange real-time or silently turn cash indices into CFDs',()=>{
 assert.match(MARKET_FEEDS.us.timing,/Delayed/);assert.match(MARKET_FEEDS.idx.timing,/End-of-day/);
 assert.match(MARKET_FEEDS.macro.note,/not substitute index levels/);
 const config=JSON.parse(decodeURIComponent(new URL(marketFeedUrl('macro')).hash.slice(1)));
 assert.equal(config.tabs.length,2);assert.match(config.tabs[1].title,/CFDs/);assert.ok(config.tabs[1].symbols.every(s=>/CFD/.test(s.d)&&s.s.startsWith('FOREXCOM:')));
 assert.ok(!config.tabs.flatMap(t=>t.symbols).some(s=>s.s==='SP:SPX'));
});
test('Gold spot and bond ETF scopes keep their exact instrument, venue and units',()=>{
 const config=c=>JSON.parse(decodeURIComponent(new URL(marketFeedUrl(c)).hash.slice(1)));
 assert.deepEqual(config('commodities').tabs[0].symbols.map(s=>s.s),['OANDA:XAUUSD']);assert.match(MARKET_FEEDS.commodities.note,/USD per troy ounce/);assert.match(MARKET_FEEDS.commodities.note,/not COMEX gold futures/);
 assert.deepEqual(config('bonds').tabs[0].symbols.map(s=>s.s),['NASDAQ:TLT','NASDAQ:IEF','AMEX:LQD']);assert.match(MARKET_FEEDS.bonds.note,/not individual bond execution prices/);
});
test('Provider frame has a fixed public origin and cannot accept a URL, inherited key or injected theme',()=>{
 for(const category of Object.keys(MARKET_FEEDS)){const u=new URL(marketFeedUrl(category,'dark'));assert.equal(u.origin,'https://s.tradingview.com');assert.equal(u.pathname,'/embed-widget/market-overview/');assert.equal(JSON.parse(decodeURIComponent(u.hash.slice(1))).colorTheme,'dark');}
 for(const input of ['constructor','__proto__','https://bad.invalid']){assert.throws(()=>marketFeedUrl(input));assert.equal(marketFeedPanel(input),'');}
 assert.equal(JSON.parse(decodeURIComponent(new URL(marketFeedUrl('us','dark<script>')).hash.slice(1))).colorTheme,'light');
});
test('Watchlist listing mapping requires a verified currency, ticker and venue instead of guessing an exchange',()=>{
 const q={provider:'yahoo',symbol:'BRK-B',exchange:'NYSE',currency:'USD'};assert.equal(verifiedFeedStock('us',q).name,'NYSE:BRK.B');assert.equal(verifiedFeedStock('us',{...q,exchange:'unknown'}),null);assert.equal(verifiedFeedStock('us',{...q,currency:'IDR'}),null);assert.equal(verifiedFeedStock('us',{...q,symbol:'<script>'}),null);
 assert.equal(verifiedFeedStock('idx',{provider:'yahoo',symbol:'BBCA',exchange:'Jakarta',currency:'IDR'}).name,'IDX:BBCA');assert.equal(verifiedFeedStock('idx',{provider:'yahoo',symbol:'AAPL',exchange:'NasdaqGS',currency:'IDR'}),null);
});
