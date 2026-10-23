import test from 'node:test';
import assert from 'node:assert/strict';
import {overviewPortfolioSummary,overviewReviewQueue,buildAlignedMarketComparison,overviewYieldCurve} from '../overview-data.js';
import {recordDestination} from '../workflow-continuity.js';

const asOf='2026-10-23',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} differs from ${b}`);
const transaction=(id,symbol,quantity,price,date='2026-10-01')=>({id,date,side:'Buy',symbol,quantity,price,fee:0,note:'SYNTHETIC TEST ONLY'});
const portfolio=(id='p',currency='USD',mode='real')=>({id,name:'SYNTHETIC TEST ONLY '+id,currency,mode,openingCash:1000,transactions:[transaction(id+'-buy','TEST',5,100)],valuations:[{id:id+'-price',date:'2026-10-22',symbol:'TEST',price:110,currency,source:'SYNTHETIC TEST ONLY'}]});
const summary=p=>overviewPortfolioSummary({portfolios:p},asOf);

test('Overview yield curve selects one source date and converts the 10Y minus 2Y difference to basis points',()=>{
 const source={sourceUrl:'https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics',retrievedAt:'2026-10-22T23:00:00Z',observations:[{date:'2026-10-21',rates:{'2 Yr':3.6,'5 Yr':3.9,'10 Yr':4.1,'20 Yr':4.6,'30 Yr':4.7}},{date:'2026-10-22',rates:{'2 Yr':3.7,'5 Yr':null,'10 Yr':4.35,'20 Yr':4.8,'30 Yr':4.9}}]},before=structuredClone(source),c=overviewYieldCurve(source);
 assert.equal(c.date,'2026-10-22');assert.equal(c.spreadBp,65);assert.equal(c.points[1].value,null);assert.equal(c.points[3].value,4.8);assert.deepEqual(source,before);
 source.observations[1].rates['2 Yr']=null;assert.equal(overviewYieldCurve(source).spreadBp,null);assert.equal(overviewYieldCurve(source).date,'2026-10-22');
 assert.equal(overviewYieldCurve({observations:[]}),null);
});

test('Overview default selects actual records, keeps Paper/legacy separate, and never combines USD with IDR',()=>{
 const real=portfolio(),idr=portfolio('idr','IDR'),paper=portfolio('paper','USD','paper'),legacy=portfolio('legacy');delete legacy.mode;
 const data={portfolios:[real,idr,paper,legacy]},r=overviewPortfolioSummary(data,asOf);
 assert.equal(r.portfolioCount,2);assert.equal(r.groups.length,2);assert.deepEqual(r.groups.map(g=>[g.currency,g.nav]),[['IDR',1050],['USD',1050]]);assert.equal(Object.hasOwn(r,'nav'),false);
 assert.equal(overviewPortfolioSummary(data,asOf,'paper').portfolioCount,2);
});
test('NAV, cash, remaining recorded cost, unrealized P&L and concentration reconcile to actual holdings',()=>{
 const r=summary([portfolio()]),g=r.groups[0];assert.equal(g.nav,1050);assert.equal(g.cash,500);assert.equal(g.recordedCost,500);assert.equal(g.unrealizedPnl,50);near(g.largestPosition.weight,550/1050);assert.equal(g.largestPosition.symbol,'TEST');assert.equal(g.positions[0].priceDates[0],'2026-10-22');assert.equal(g.completeCount,1);
});
test('A missing or future-only price withholds complete currency-group totals, cost, P&L and weights',()=>{
 for(const p of [Object.assign(portfolio(),{valuations:[]}),Object.assign(portfolio(),{valuations:[{...portfolio().valuations[0],date:'2026-10-24'}]})]){
  const r=summary([p,portfolio('good')]),g=r.groups[0];assert.equal(r.completeCount,1);assert.equal(r.incompleteCount,1);assert.equal(r.missingPriceCount,1);assert.equal(g.nav,null);assert.equal(g.recordedCost,null);assert.equal(g.unrealizedPnl,null);assert.equal(g.largestPosition,null);assert.deepEqual(g.positions,[]);
 }
});
test('Price age follows the existing 30-calendar-day policy and remains explicit',()=>{
 const p=portfolio();p.valuations[0].date='2026-09-23';assert.equal(summary([p]).groups[0].nav,1050);p.valuations[0].date='2026-09-22';const r=summary([p]);assert.equal(r.maxAgeDays,30);assert.equal(r.stalePriceCount,1);assert.equal(r.groups[0].nav,null);
});
test('Unknown cash and foreign quote currencies withhold NAV rather than inventing zero or FX',()=>{
 const unknown=portfolio();delete unknown.openingCash;let r=summary([unknown]);assert.equal(r.unknownCashCount,1);assert.equal(r.groups[0].cash,null);assert.equal(r.groups[0].nav,null);
 const foreign=portfolio();foreign.valuations[0].currency='IDR';r=summary([foreign]);assert.equal(r.currencyMismatchCount,1);assert.equal(r.groups[0].nav,null);assert.equal(r.groups[0].unrealizedPnl,null);
});
test('Actual zero, cash-only account, and no account are distinct; none invent a largest holding',()=>{
 const p={...portfolio(),openingCash:0,transactions:[],valuations:[]};let r=summary([p]);assert.equal(r.groups[0].nav,0);assert.equal(r.groups[0].largestPosition,null);p.openingCash=100;r=summary([p]);assert.equal(r.groups[0].nav,100);assert.equal(r.groups[0].largestPosition,null);r=summary([]);assert.equal(r.portfolioCount,0);assert.deepEqual(r.groups,[]);
});
test('Same-currency accounts combine exact symbols and decimal amounts without treating aliases as identical',()=>{
 const a=portfolio(),b=portfolio('second');b.transactions[0].symbol='TEST.JK';b.valuations[0].symbol='TEST.JK';const r=summary([a,b]);assert.equal(r.groups[0].positions.length,2);assert.equal(r.groups[0].nav,2100);b.transactions[0].symbol='TEST';b.valuations[0].symbol='TEST';assert.equal(summary([a,b]).groups[0].positions[0].quantity,10);
 const small=[.1,.2].map((cash,i)=>({id:'cash'+i,currency:'USD',mode:'real',name:'TEST ONLY',openingCash:cash,transactions:[]}));assert.equal(summary(small).groups[0].nav,.3);
});
test('Assessment excludes later trades and prices, and invalid historical balances become a visible unavailable account',()=>{
 const p=portfolio();p.transactions.push(transaction('future','OTHER',1,100,'2026-10-24'));assert.equal(summary([p]).groups[0].nav,1050);p.openingCash=1;const r=summary([p]);assert.equal(r.invalidCount,1);assert.equal(r.groups[0].nav,null);assert.match(r.portfolios[0].reason,/Insufficient/);
});
test('Review queue includes active records, sorts overdue before upcoming, and links directly to the correct retained review',()=>{
 const data={theses:[{id:'t /1',title:'TEST thesis',status:'Researching',reviewDate:'2026-10-20'},{id:'archived',status:'Archived',reviewDate:'2026-10-01'}],decisions:[{id:'open',title:'TEST decision',status:'Open',reviewDate:asOf},{id:'next',status:'Open',reviewDate:'2026-10-25'},{id:'done',status:'Reviewed',reviewDate:'2026-10-01'}]},r=overviewReviewQueue(data,asOf);
 assert.deepEqual(r.map(x=>x.id),['t /1','open','next']);assert.deepEqual(r.map(x=>x.due),[true,true,false]);assert.equal(r[0].overdueDays,3);assert.deepEqual(recordDestination(r[0].href.slice(1)),{kind:'theses',id:'t /1',reviews:true});
});
const series=()=>[{key:'a',label:'TEST A',observations:[{date:'2026-10-19',close:100},{date:'2026-10-20',close:120},{date:'2026-10-21',close:110},{date:'2026-10-22',close:130}]},{key:'b',label:'TEST B',observations:[{date:'2026-10-19',close:2000},{date:'2026-10-21',close:1800},{date:'2026-10-22',close:2200}]}];
test('Cross-asset base100 uses only exact common dates and keeps raw units alongside derived price return',()=>{
 const r=buildAlignedMarketComparison(series());assert.equal(r.available,true);assert.deepEqual(r.dates,['2026-10-19','2026-10-21','2026-10-22']);assert.deepEqual(r.series[0].points.map(p=>p.value),[100,110.00000000000001,130]);assert.equal(r.series[1].points[0].close,2000);near(r.series[0].priceReturn,.3);near(r.series[1].priceReturn,.1);assert.equal(r.series[0].omittedDates,1);assert.equal(r.returnKind,'price-return');
});
test('Comparison range recomputes one shared base and never forward-fills holidays or absent sessions',()=>{
 const r=buildAlignedMarketComparison(series(),{start:'2026-10-20',end:'2026-10-22'});assert.deepEqual(r.dates,['2026-10-21','2026-10-22']);assert.equal(r.series[0].points[0].value,100);near(r.series[0].priceReturn,130/110-1);assert.equal(buildAlignedMarketComparison(series(),{start:'2026-10-22'}).available,false);
});
test('Missing, duplicate, invalid, nonpositive or overflowed price scales cannot make a plausible-looking comparison',()=>{
 for(const edit of [s=>s[0].observations[0].close=null,s=>s[0].observations[0].close=0,s=>s[0].observations[0].close=Infinity,s=>s[0].observations.push(s[0].observations[0]),s=>s[0].observations[0].date='2026-02-31',s=>s[1].key='a',s=>{s[0].observations[0].close=1e-300;s[0].observations.at(-1).close=1e300;}]){const s=series();edit(s);assert.equal(buildAlignedMarketComparison(s).available,false);}
 assert.equal(buildAlignedMarketComparison(series(),{start:'2026-10-23',end:'2026-10-20'}).available,false);
});
test('Pure overview calculations never mutate original records, source prices or input order',()=>{
 const data={portfolios:[portfolio()],theses:[{id:'t',status:'Draft',reviewDate:asOf}],decisions:[]},s=series();s[0].observations.reverse();const before=JSON.stringify({data,s});overviewPortfolioSummary(data,asOf);overviewReviewQueue(data,asOf);assert.equal(buildAlignedMarketComparison(s).available,true);assert.equal(JSON.stringify({data,s}),before);
});
