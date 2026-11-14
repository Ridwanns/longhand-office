import test from 'node:test';import assert from 'node:assert/strict';
import {scheduleRow,sparkGeometry,deskFacts,featureChart,closes,longDate,monthYear} from '../overview-desk.js';
// TEST ONLY synthetic closes: 300 sessions rising to a high on day 120, falling to a low on day 290, then recovering.
const day=i=>new Date(Date.UTC(2025,0,1)+i*86400000).toISOString().slice(0,10);
const series=(n,f)=>Array.from({length:n},(_,i)=>({date:day(i),close:f(i)}));
const path=series(300,i=>i<=120?100+i:i<=290?220-(i-120):50+(i-290)*2);

test('A schedule row uses completed closes: window change, sparkline window and a 252-session range',()=>{
 const r=scheduleRow(path,63);
 assert.equal(r.last.close,68);assert.equal(r.previous.close,66);
 assert.equal(r.spark.length,64);assert.equal(r.windowStart.date,path[300-64].date);
 assert.ok(Math.abs(r.windowChange-(68/path[236].close-1)*100)<1e-12);
 assert.equal(r.rangeSessions,252);assert.equal(r.low.close,50);assert.equal(r.high.close,220);
 assert.ok(Math.abs(r.position-(68-50)/(220-50))<1e-12);assert.equal(r.windowComplete,true);
});
test('Short histories say so instead of inventing a full window; unusable input yields no row',()=>{
 const r=scheduleRow(path.slice(0,10),63);assert.equal(r.windowComplete,false);assert.equal(r.spark.length,10);assert.equal(r.rangeSessions,10);
 assert.equal(scheduleRow([{date:'2026-01-02',close:5}],21),null);
 assert.equal(scheduleRow(path,0),null);
 // Non-finite, zero or negative closes and malformed dates are dropped, never filled.
 assert.deepEqual(closes([{date:'2026-01-02',close:NaN},{date:'2026-01-03',close:0},{date:'bad',close:3},{date:'2026-01-05',close:4}]),[{date:'2026-01-05',close:4}]);
});
test('A flat window places the range marker in the middle and draws a level sparkline',()=>{
 const flat=series(30,()=>10),r=scheduleRow(flat,21),g=sparkGeometry(r.spark,120,32);
 assert.equal(r.position,.5);assert.equal(r.windowChange,0);assert.ok(g.d.startsWith('M0.0 '));assert.equal(g.end.x,120);
});
test('The opening facts are computed from the published IHSG history and state its span',()=>{
 const f=deskFacts(path,series(10,i=>200-i),series(10,i=>100+i));
 assert.equal(f.last.close,68);assert.ok(Math.abs(f.move-(68/66-1)*100)<1e-12);
 assert.equal(f.high.close,220);assert.equal(f.high.date,day(120));assert.equal(f.low.close,50);assert.equal(f.sessionsSinceLow,9);
 assert.ok(Math.abs(f.belowHigh-(1-68/220)*100)<1e-12);assert.equal(f.first.date,day(0));
 assert.ok(Math.abs(f.spx.value-(1-191/200)*100)<1e-12);assert.equal(f.gold.value,0);
 assert.equal(deskFacts([],[],[]),null);
});
test('The featured chart marks the window high and low, the drawdown and the change from its first close',()=>{
 const all=featureChart(path,0,900),year=featureChart(path,252,900);
 assert.equal(all.points.length,300);assert.equal(all.high.close,220);assert.equal(all.low.close,50);
 assert.ok(Math.abs(all.change-(68/100-1)*100)<1e-12);assert.ok(Math.abs(all.fromHigh-(68/220-1)*100)<1e-12);
 assert.equal(year.points.length,253);assert.equal(year.first.date,path[47].date);
 assert.match(all.svg,/HIGH 220\.00 · 1 May 2025/);assert.match(all.svg,/LOW 50\.00 · 18 Oct 2025/);assert.match(all.svg,/desk-drawdown/);
 // No style attributes: the Pages CSP (style-src 'self') would block them.
 assert.doesNotMatch(all.svg,/style=/);
 assert.equal(featureChart(path.slice(0,1),0,900),null);
});
test('Dates are written the Longhand way',()=>{assert.equal(longDate('2026-09-03'),'3 Sept 2026');assert.equal(monthYear('2025-05-02'),'May 2025');});
