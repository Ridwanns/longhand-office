import test from 'node:test';
import assert from 'node:assert/strict';
import {macroPeriodRows,macroScale,macroSegments,macroTimeTicks,nativeMacroChart} from '../macro-chart.js';
import {contextWindow} from '../macro-context-math.js';
import {CONTEXT_WDI_URL} from '../macro-context-contract.js';
const row=(date,value)=>({date,value});
test('Macro axes use rounded, evenly spaced ticks and always contain every actual value',()=>{
 for(const values of [[-2.89,6.49],[2.1,2.2],[0,0],[-.021,.017],[10000,18000]]){
  const scale=macroScale(values,{zero:true});assert.ok(scale.lo<=Math.min(...values));assert.ok(scale.hi>=Math.max(...values));assert.ok(scale.ticks.includes(0));assert.ok(scale.ticks.length<=7);
  scale.ticks.slice(1).forEach((v,i)=>assert.ok(Math.abs(v-scale.ticks[i]-scale.step)<1e-9));
 }
});
test('Actual calendar gaps and null observations break lines before display sampling',()=>{
 const annual=[row('2000-12-31',1),row('2001-12-31',2),row('2003-12-31',3),row('2004-12-31',null),row('2005-12-31',4)];assert.deepEqual(macroSegments(annual,'A').map(s=>s.length),[2,1,1]);
 assert.equal(macroSegments([row('2026-01-02',1),row('2026-01-05',2)],'D').length,1);
 assert.equal(macroSegments([row('2026-01-02',1),row('2026-01-12',2)],'D').length,2);
 assert.equal(macroSegments([row('2026-01-01',1),row('2026-03-01',2)],'M').length,2);
});
test('Zero and missing annual values remain distinct and every exact source observation is retained',()=>{
 const rows=[row('1961-12-31',0),row('1962-12-31',null),row('1963-12-31',-2)],before=JSON.stringify(rows),html=nativeMacroChart(rows,{bars:true,frequency:'A',width:320,unit:'% YoY'});
 assert.equal((html.match(/<rect /g)||[]).length,2);assert.match(html,/Not reported/);assert.match(html,/1961 to 1963/);assert.match(html,/2 reported observations/);assert.equal(JSON.stringify(rows),before);
});
test('One observation has a finite chart and one time label, without duplicating history',()=>{
 assert.equal(macroTimeTicks('2026-01-01','2026-01-01').length,1);const html=nativeMacroChart([row('2026-01-01',2.5)],{title:'TEST ONLY',frequency:'M'});assert.doesNotMatch(html,/NaN|Infinity/);assert.match(html,/Jan 2026/);
});
test('Chart interpolation uses real dates and has keyboard and touch inspection without fabricated observations',()=>{
 const html=nativeMacroChart([row('2000-12-31',1),row('2001-12-31',2),row('2010-12-31',3)],{frequency:'A',width:760});assert.equal((html.match(/class="context-history-line"/g)||[]).length,2);assert.match(html,/type="range"/);assert.match(html,/aria-valuetext/);assert.match(html,/Calendar spacing/);
});
test('Annual pre-2000 collection is bounded and 10/20-year views leave records untouched',()=>{
 assert.match(CONTEXT_WDI_URL,/date=1960:/);assert.match(CONTEXT_WDI_URL,/per_page=20000/);const rows=Array.from({length:66},(_,i)=>row((1960+i)+'-12-31',i)),before=JSON.stringify(rows);assert.equal(contextWindow(rows,'10y').length,11);assert.equal(contextWindow(rows,'20y').length,21);assert.equal(contextWindow(rows,'all').length,66);assert.equal(JSON.stringify(rows),before);
});
test('Untrusted source text cannot inject chart markup or inspector attributes',()=>{
 const html=nativeMacroChart([row('2025-12-31',3)],{title:'<script>TEST</script>',unit:'" onmouseover="TEST',frequency:'A'});assert.doesNotMatch(html,/<script>|unit="" onmouseover/);assert.match(html,/&lt;script&gt;/);
});
test('Exact observations preserve source precision while headline chart labels remain readable',()=>{
 const value=1.2345678901234567,html=nativeMacroChart([row('2025-12-31',value)],{title:'TEST ONLY precision',frequency:'A'});assert.ok(html.includes('<td>'+String(value)+'</td>'));assert.match(html,/2025 · 1\.23/);
});

test('Legacy quarterly/monthly periods become display coordinates without mutating the published source',()=>{
 const input=[{period:'2026-Q1',value:5.61,status:'reported'},{period:'2026-Q2',value:5.29,status:'reported'}],before=JSON.stringify(input),rows=macroPeriodRows(input,'Q');assert.equal(rows[0].date,'2026-01-01');assert.equal(rows[1].period,'2026-Q2');assert.equal(JSON.stringify(input),before);const html=nativeMacroChart(rows,{frequency:'Q'});assert.match(html,/Q1 2026 to Q2 2026/);assert.doesNotMatch(html,/>Jan 26</);assert.equal(macroPeriodRows([{period:'2026-09',value:null}],'M')[0].value,null);assert.throws(()=>macroPeriodRows([{period:'2026-Q9',value:1}],'Q'));
});
test('Short monthly charts label real supplied months once rather than repeating synthetic month ticks',()=>{
 const html=nativeMacroChart(macroPeriodRows([{period:'2026-08',value:3.19},{period:'2026-09',value:3.28}],'M'),{frequency:'M'});assert.equal((html.match(/>Aug 2026<\/text>/g)||[]).length,1);assert.equal((html.match(/>Sept 2026<\/text>/g)||[]).length,1);
});

test('Macro percentage charts retain a zero reference instead of exaggerating a tiny two-release change',()=>{
 const html=nativeMacroChart(macroPeriodRows([{period:'2026-08',value:3.19},{period:'2026-09',value:3.28}],'M'),{frequency:'M',unit:'% YoY'});assert.match(html,/>0%<\/text>/);assert.doesNotMatch(html,/>3\.175%<\/text>/);
});
test('Long-horizon time axes never repeat an endpoint year as an interior label',()=>{
 const ticks=macroTimeTicks('2016-10-16','2026-10-16',10);assert.equal(new Set(ticks.map(t=>t.label)).size,ticks.length);assert.equal(ticks[0].label,'2016');assert.equal(ticks.at(-1).label,'2026');
});
