import test from 'node:test';import assert from 'node:assert/strict';
import {validateOverviewFeed,OVERVIEW_MARKETS,overviewSession} from '../overview-contract.js';
import {overviewYieldCurve} from '../overview-data.js';
const now=Date.parse('2026-10-23T02:00:00Z');
const feed=()=>({format:'longhand-overview',version:1,assembledAt:'2026-10-22T22:00:00Z',marketPublishedAt:'2026-10-22T21:00:00Z',markets:OVERVIEW_MARKETS.map(({category,symbol})=>({category,symbol,error:'TEST ONLY unavailable source'})),macro:['IDN','USA'].map(country=>({country,readings:['gdp','inflation','policy','yield'].map(key=>({key,items:[]}))})),context:[]});
const quote=()=>({provider:'yahoo',symbol:'^GSPC',currency:'USD',instrumentType:'INDEX',unit:'index points',price:150,timestamp:'2026-10-22T20:00:00Z',retrievedAt:'2026-10-22T21:00:00Z',marketDate:'2026-10-22',realtimeVerified:false,delayMinutes:null,history:[{date:'2026-10-21',close:100},{date:'2026-10-22',close:150}],change:{referenceDate:'2026-10-21',referenceClose:100,value:50,percent:50}});

test('Overview Treasury curve requires actual tenor identities, original source and a reconciled basis-point spread',()=>{
 const f=feed();f.yieldCurve=overviewYieldCurve({sourceUrl:'https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics',retrievedAt:'2026-10-22T23:00:00Z',observations:[{date:'2026-10-22',rates:{'2 Yr':3.7,'5 Yr':null,'10 Yr':4.35,'20 Yr':4.8,'30 Yr':4.9}}]});
 assert.equal(validateOverviewFeed(f,now),f);
 for(const mutate of [c=>c.spreadBp=0.65,c=>c.points[1].value=undefined,c=>c.points[2].tenor='20 Yr',c=>c.sourceUrl='https://example.com/',c=>c.date='2026-02-30',c=>c.date='2026-10-24']){const copy=structuredClone(f);mutate(copy.yieldCurve);assert.throws(()=>validateOverviewFeed(copy,now));}
 const copy=structuredClone(f);copy.yieldCurve.points[0].value=null;copy.yieldCurve.spreadBp=null;assert.equal(validateOverviewFeed(copy,now),copy);
});
test('Unavailable overview data remains explicit and cannot turn into placeholder prices or a regime',()=>{const f=feed();assert.equal(validateOverviewFeed(f,now),f);assert.equal(f.markets.filter(m=>m.quote).length,0);assert.ok(f.macro.every(c=>c.readings.every(r=>r.items.length===0)));});
test('Overview snapshot preserves original quote, currency, daily change and source dates',()=>{const f=feed();f.markets[1]={category:'macro',symbol:'^GSPC',quote:quote()};const before=structuredClone(f);validateOverviewFeed(f,now);assert.deepEqual(f,before);});
test('Misidentified instruments, fabricated history gaps, invalid dates and unsupported currency reject',()=>{for(const mutate of [f=>f.markets[0].symbol='FAKE',f=>f.markets[1].quote.currency='IDR',f=>f.markets[1].quote.history[0].date='2026-02-30',f=>f.markets[1].quote.history[0].close=0,f=>f.markets[1].quote.history[0].date='2026-10-22',f=>f.marketPublishedAt='2027-01-01',f=>f.macro[0].country='USA']){const f=feed();f.markets[1]={category:'macro',symbol:'^GSPC',quote:quote()};mutate(f);assert.throws(()=>validateOverviewFeed(f,now));}});
test('Economic source identity and source dates reject invented macro series and unsafe URLs',()=>{for(const mutate of [s=>s.id='invented',s=>s.spec.sourceUrl='javascript:alert(1)',s=>s.retrievedAt='2027-01-01',s=>s.observations.push({date:'2027-01-01',value:10})]){const f=feed(),s={id:'id-gdp',retrievedAt:'2026-10-22T20:00:00Z',spec:{frequency:'Q',sourceUrl:'https://www.bps.go.id/'},observations:[{date:'2026-04-01',value:5.29}]};mutate(s);f.macro[0].readings[0].items.push(s);assert.throws(()=>validateOverviewFeed(f,now));}});
test('An overview price observed while its session was trading is intraday, and its bar is not plotted as a close',()=>{
 const bars=[{date:'2026-11-11',close:7619.38},{date:'2026-11-12',close:7592.4},{date:'2026-11-13',close:7557.3}];
 const spx={exchangeTimezoneName:'America/New_York',marketDate:'2026-11-13',timestamp:'2026-11-13T19:59:14.000Z',history:bars};
 // 14:59 New York time: the 13 Nov session is still trading.
 let s=overviewSession({...spx,retrievedAt:'2026-11-13T19:59:15.762Z'});
 assert.equal(s.intraday,true);assert.deepEqual(s.history.map(r=>r.date),['2026-11-11','2026-11-12']);
 // 17:30 New York time: the 13 Nov bar is a completed close.
 s=overviewSession({...spx,retrievedAt:'2026-11-13T22:30:00Z'});
 assert.equal(s.intraday,false);assert.equal(s.history.length,3);
 // Saturday morning: Friday's bar is complete although the local clock is before 17:00.
 s=overviewSession({...spx,retrievedAt:'2026-11-14T15:00:00Z'});
 assert.equal(s.intraday,false);assert.equal(s.history.length,3);
 // IHSG at 16:00 WIB, retrieved 02:59 WIB the next day: a close, judged on the Jakarta clock.
 s=overviewSession({exchangeTimezoneName:'Asia/Jakarta',marketDate:'2026-11-13',timestamp:'2026-11-13T09:00:05.000Z',retrievedAt:'2026-11-13T19:59:15.831Z',history:bars.slice(0,2)});
 assert.equal(s.intraday,false);assert.equal(s.history.length,2);
 // IHSG retrieved 10:00 WIB: today's bar is still trading.
 s=overviewSession({exchangeTimezoneName:'Asia/Jakarta',marketDate:'2026-11-13',timestamp:'2026-11-13T03:00:00Z',retrievedAt:'2026-11-13T03:00:30Z',history:bars});
 assert.equal(s.intraday,true);assert.equal(s.history.at(-1).date,'2026-11-12');
 // Gold futures: the 16:59 print fetched at 17:30 is the session's last trade; from 18:00 the next session trades.
 const gold={instrumentType:'FUTURE',exchangeTimezoneName:'America/New_York',marketDate:'2026-11-12',history:bars.slice(0,2)};
 s=overviewSession({...gold,timestamp:'2026-11-12T21:59:00Z',retrievedAt:'2026-11-12T22:30:00Z'});
 assert.equal(s.intraday,false);assert.equal(s.history.length,2);
 s=overviewSession({...gold,timestamp:'2026-11-13T01:00:00Z',retrievedAt:'2026-11-13T01:00:20Z'});
 assert.equal(s.intraday,true);assert.equal(s.history.length,2);
 // An index observed after 18:00 is not a futures session and stays a close.
 assert.equal(overviewSession({...spx,timestamp:'2026-11-13T23:30:00Z',retrievedAt:'2026-11-13T23:31:00Z'}).intraday,false);
 // An unreadable retrieval time withholds the judgement instead of guessing.
 assert.equal(overviewSession({...spx,retrievedAt:'not a time'}).intraday,null);
});
