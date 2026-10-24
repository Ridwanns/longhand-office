import test from 'node:test';
import assert from 'node:assert/strict';
import {windowChanges,windReading,windReadings,windTone,windSummary,renderWindGauge,rateCushion,swingTape} from '../macro-winds.js';

const day=86400000,start=Date.UTC(2023,0,1);
const series=(n,value)=>Array.from({length:n},(_,i)=>({date:new Date(start+i*day).toISOString().slice(0,10),value:value(i)}));
// Seeded random walk with roughly 1% daily moves. The final point is set equal to the point 30 days earlier, so the latest 30-day change is exactly zero.
const wobble=n=>{let seed=12345,v=100;const rows=series(n,()=>{seed=(seed*1664525+1013904223)%4294967296;return v*=1+(seed/4294967296-.5)*.02;});rows[n-1]={date:rows[n-1].date,value:rows[n-31].value};return rows;};

test('windowChanges compares each point with the last observation on or before 30 days earlier',()=>{
 const rows=series(100,i=>100+i),changes=windowChanges(rows,30,'points');
 assert.equal(changes[0].date,rows[30].date);assert.equal(changes.at(-1).change,30);
 assert.ok(changes.every(c=>c.value-c.priorValue===c.change));
});

test('windowChanges skips points whose prior observation is more than a week from the target date',()=>{
 const rows=[{date:'2024-01-01',value:100},{date:'2024-03-01',value:110}];
 assert.deepEqual(windowChanges(rows,30,'percent'),[]);
});

test('windowChanges ignores non-finite and malformed rows and handles empty input',()=>{
 assert.deepEqual(windowChanges(null),[]);
 assert.deepEqual(windowChanges([{date:'bad',value:1},{date:'2024-01-01',value:NaN}]),[]);
});

test('percent change uses the prior value as base and rejects non-positive bases',()=>{
 const rows=[{date:'2024-01-01',value:100},{date:'2024-01-31',value:110}];
 assert.ok(Math.abs(windowChanges(rows,30,'percent')[0].change-10)<1e-9);
 assert.deepEqual(windowChanges([{date:'2024-01-01',value:0},{date:'2024-01-31',value:5}],30,'percent'),[]);
});

test('tone bands are symmetric and tailwind is the negative direction',()=>{
 assert.equal(windTone(0),'calm');assert.equal(windTone(.49),'calm');assert.equal(windTone(.5),'headwind');assert.equal(windTone(1.5),'strong-headwind');
 assert.equal(windTone(-.5),'tailwind');assert.equal(windTone(-1.5),'strong-tailwind');assert.equal(windTone(NaN),'unavailable');
});

test('a short history gives no estimate rather than a guess',()=>{
 const r=windReading('dollar',series(200,i=>100+i));
 assert.equal(r.available,false);assert.match(r.reason,/Fewer than 250/);
});

test('a flat history gives no estimate',()=>{
 assert.equal(windReading('dollar',series(900,()=>100)).available,false);
});

test('an ordinary latest move reads calm and an outsized one reads as a strong headwind',()=>{
 const rows=wobble(900),calm=windReading('dollar',rows,Date.parse(rows.at(-1).date));
 assert.equal(calm.available,true);assert.equal(calm.tone,'calm');
 const jump=rows.slice(),last=jump.at(-1);jump[jump.length-1]={date:last.date,value:last.value*1.25};
 const hot=windReading('dollar',jump,Date.parse(last.date));
 assert.equal(hot.tone,'strong-headwind');assert.ok(hot.z>1.5);
 const cold=rows.slice();cold[cold.length-1]={date:last.date,value:last.value*.75};
 assert.equal(windReading('dollar',cold,Date.parse(last.date)).tone,'strong-tailwind');
});

test('the usual swing excludes the latest comparison, so one outlier cannot hide itself',()=>{
 const rows=wobble(900),last=rows.at(-1),jump=rows.slice(0,-1).concat({date:last.date,value:last.value*3}),r=windReading('dollar',jump,Date.parse(last.date));
 assert.equal(r.sampleSize,windowChanges(rows.slice(0,-1),30,'percent').filter(c=>c.date>=new Date(Date.parse(last.date)-3*365.25*day).toISOString().slice(0,10)).length);
 assert.ok(r.z>5);
});

test('older observations are flagged',()=>{
 const rows=wobble(900),r=windReading('dollar',rows,Date.parse(rows.at(-1).date)+20*day);
 assert.equal(r.stale,true);
});

test('windReadings reports an unavailable gauge for a missing or errored source and never substitutes another',()=>{
 const rows=wobble(900),feed={series:[{id:'broad-dollar',observations:rows},{id:'us-10y',error:'Source unavailable'}]},out=windReadings(feed,null,Date.parse(rows.at(-1).date));
 assert.deepEqual(out.map(r=>r.available),[true,false,false]);
 assert.equal(out[1].reason,'Source unavailable');assert.equal(out[2].reason,'Source not connected.');
});

test('windReadings reads the rupiah from FX history',()=>{
 const rows=wobble(900),fx={entries:[{id:'FX_IDC:USDIDR',observations:rows}]},out=windReadings({series:[]},fx,Date.parse(rows.at(-1).date));
 assert.equal(out[2].available,true);assert.equal(out[2].key,'rupiah');
});

test('available readings carry about a year of weekly tape readings ending on the latest move',()=>{
 const rows=wobble(900),r=windReading('dollar',rows,Date.parse(rows.at(-1).date));
 assert.equal(r.tape.length,52);assert.equal(r.tape.at(-1).date,r.latest.date);assert.ok(Math.abs(r.tape.at(-1).z-r.z)<1e-9);
 assert.ok(r.tape.every((t,i,a)=>!i||t.date>a[i-1].date));
});

test('swing tape draws one bar per reading, highlights only the latest and clips at three swings',()=>{
 const svg=swingTape([{date:'2026-01-01',z:0},{date:'2026-01-08',z:9},{date:'2026-01-15',z:-9},{date:'2026-01-22',z:1}]);
 assert.equal((svg.match(/class="wind-bar/g)||[]).length,4);assert.equal((svg.match(/is-now/g)||[]).length,1);
 assert.match(svg,/aria-hidden="true"/);assert.ok(!/NaN|Infinity/.test(svg));
 const heights=[...svg.matchAll(/class="wind-bar[^"]*"[^>]*height="([\d.]+)"/g)].map(m=>Number(m[1]));
 assert.equal(heights[1],heights[2]);assert.ok(heights[1]>heights[3]);
});

test('summary headline reflects counts and notes unreadable gauges',()=>{
 const r=(tone,available=true)=>({tone,available,spec:{label:'x',sourceName:'s',measure:'percent'}});
 assert.match(windSummary([r('headwind'),r('strong-headwind'),r('calm')]).headline,/^2 of 3 external winds lean against Indonesia/);
 assert.match(windSummary([r('tailwind'),r('tailwind'),r('calm')]).headline,/favour/);
 assert.match(windSummary([r('calm'),r('calm'),r('headwind')]).headline,/Mostly calm/);
 assert.match(windSummary([r('calm'),r('unavailable',false),r('unavailable',false)]).headline,/2 could not be read/);
 assert.match(windSummary([r('unavailable',false),r('unavailable',false),r('unavailable',false)]).headline,/cannot be read/);
});

test('rate cushion uses each series own latest reported date',()=>{
 const c=rateCushion({series:[{id:'id-policy',observations:[{date:'2026-10-21',value:5.75}]},{id:'us-policy',observations:[{date:'2026-10-20',value:3.88}]}]});
 assert.ok(Math.abs(c.gap-1.87)<1e-9);assert.equal(c.us.date,'2026-10-20');
 assert.equal(rateCushion({series:[{id:'id-policy',error:'x',observations:[]},{id:'us-policy',observations:[]}]}),null);
});

test('rendered gauge escapes text, shows dates and never scores the rate gap',()=>{
 const rows=wobble(900),now=Date.parse(rows.at(-1).date),readings=windReadings({series:[{id:'broad-dollar',observations:rows},{id:'us-10y',observations:rows.map(o=>({...o,value:o.value/20}))}]},null,now);
 const html=renderWindGauge(readings,{gap:1.87,bi:{date:'2026-10-21',value:5.75},us:{date:'2026-10-20',value:3.88}});
 assert.match(html,/EXTERNAL WINDS · INDONESIA/);assert.match(html,/data-wind="dollar"/);assert.match(html,/data-wind="rupiah"/);
 assert.match(html,/Not scored/);assert.match(html,/not a forecast/i);assert.match(html,/aria-label="US dollar, broad:/);assert.match(html,/<time datetime=/);
 assert.ok(!/<script/i.test(html));
 assert.ok(!/\sstyle=/i.test(html),'inline style attributes are blocked by the page content security policy');
 assert.match(html,/class="wind-tape"/);
});
