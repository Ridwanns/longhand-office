import test from 'node:test';
import assert from 'node:assert/strict';
import {macroChart,macroFigure,annualComparison} from '../macro-visuals.js';
import {MAP_COUNTRIES} from '../macro-map-data.js';
const s=(id,values)=>({id,observations:values.map(([period,value])=>({period,value,status:'reported'}))});
test('GDP bars use a zero baseline, retain negative values and omit missing observations',()=>{
 const input=s('annual-IDN-gdp',[['2020',-2],['2021',null],['2022',4]]),copy=structuredClone(input),html=macroChart(input,'bar');
 assert.equal((html.match(/<rect /g)||[]).length,2);assert.match(html,/2020: -2.00% YoY/);assert.match(html,/2022: 4.00% YoY/);assert.ok(!html.includes('2021: 0'));
 // Independent axis: -2..4%, plot top24/bottom248 => zero y173.3333.
 const bars=[...html.matchAll(/<rect[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/g)];
 assert.ok(Math.abs(Number(bars[0][1])-173.3333333333)<1e-8);assert.ok(Math.abs(Number(bars[0][2])-74.6666666667)<1e-8);assert.equal(Number(bars[1][1]),24);assert.deepEqual(input,copy);
});
test('Inflation line never bridges a missing calendar period or null observation',()=>{
 for(const rows of [[['2026-01',2],['2026-03',3]],[['2026-01',2],['2026-02',null],['2026-03',3]]]){const html=macroChart(s('us-cpi',rows));assert.equal((html.match(/class="macro-dot"/g)||[]).length,2);assert.ok(!html.includes('class="macro-line"'));}
 assert.equal((macroChart(s('us-cpi',[['2026-01',2],['2026-02',3]])).match(/class="macro-line"/g)||[]).length,1);
});
test('Annual and quarterly histories retain scope, exact values and separate frequencies',()=>{
 const html=macroFigure(s('annual-IDN-gdp',[['2020',-2.065],['2021',3.7]]),'bar');assert.match(html,/Annual/);assert.match(html,/Reported annual percentage/);assert.match(html,/-2.07/);assert.match(html,/Indonesia · Annual · % YoY/);assert.ok(!html.includes('style='));
});
test('Regional map has real boundaries and missing country values stay uncolored and unavailable',()=>{
 assert.equal(MAP_COUNTRIES.length,176);for(const id of ['IDN','MYS','THA','VNM','PHL'])assert.ok(MAP_COUNTRIES.some(c=>c.id===id&&c.d.startsWith('M')));
 const html=annualComparison({series:[s('annual-IDN-gdp',[['2025',5.1]]),s('annual-MYS-gdp',[['2024',null]])]});assert.match(html,/1 of 6 countries reported/);assert.match(html,/Indonesia 2025: 5.10 percent/);assert.match(html,/no ASEAN aggregate/);assert.match(html,/Singapore: Unavailable/);assert.ok(!html.includes('undefined'));assert.match(html,/No data/);
});
