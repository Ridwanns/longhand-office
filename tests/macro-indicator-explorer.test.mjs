import test from 'node:test';
import assert from 'node:assert/strict';
import {macroIndicatorEntries} from '../macro-context-ui.js';
import {CONTEXT_SERIES} from '../macro-context-contract.js';
const entry=(id,observations,error)=>({id,observations,retrievedAt:'2026-10-18T00:00:00Z',...(error?{error}:{})});
const inspect=(series,country='IDN')=>macroIndicatorEntries({feed:{series},releases:null,legacy:null,extended:null,country});
test('Economic explorer preserves annual external units, source periods and original numeric values',()=>{
 const series=[entry('wdi-IDN-reserves',[{date:'2024-12-31',value:123.456}]),entry('wdi-IDN-currentAccount',[{date:'2024-12-31',value:-1.25}]),entry('wdi-IDN-unemployment',[{date:'2024-12-31',value:4.2}])],before=JSON.stringify(series),items=inspect(series);
 assert.equal(items.find(i=>i.id==='wdi-IDN-reserves').unit,'USD bn');assert.equal(items[0].frequency,'A');assert.equal(items.find(i=>i.id==='wdi-IDN-reserves').latest.value,123.456);assert.equal(items.find(i=>i.id==='wdi-IDN-currentAccount').unit,'% of GDP');assert.equal(items.find(i=>i.id==='wdi-IDN-unemployment').group,'Labour and activity');assert.equal(JSON.stringify(series),before);
});
test('Missing readings remain unavailable, while a genuine zero remains a numeric observation',()=>{
 const items=inspect([entry('wdi-IDN-fdi',[],'TEST ONLY source failure'),entry('wdi-IDN-currentAccount',[{date:'2025-12-31',value:0}])]);assert.equal(items.find(i=>i.id==='wdi-IDN-fdi').latest,null);assert.equal(items.find(i=>i.id==='wdi-IDN-currentAccount').latest.value,0);assert.ok(items.find(i=>i.id==='wdi-IDN-fdi').flags.includes('TEST ONLY source failure'));
});
test('US activity stays separate from annual context and cannot leak into an Indonesia scope',()=>{
 const series=[entry('us-unemployment',[{date:'2026-08-01',value:4.1}]),entry('us-retail',[{date:'2026-08-01',value:700}]),entry('fed-assets',[{date:'2026-10-14',value:6000}])],us=inspect(series,'USA'),id=inspect(series,'IDN');assert.equal(us.find(i=>i.id==='us-unemployment').frequency,'M');assert.equal(us.find(i=>i.id==='us-retail').unit,CONTEXT_SERIES['us-retail'].unit);assert.equal(us.find(i=>i.id==='fed-assets').group,'US liquidity');assert.ok(!id.some(i=>i.id.startsWith('us-')||i.id==='fed-assets'));
});
test('A later missing annual year does not create a new value or renew the observation date',()=>{
 const item=inspect([entry('wdi-IDN-gdp',[{date:'2024-12-31',value:5},{date:'2025-12-31',value:null}])])[0];assert.equal(item.latest.date,'2024-12-31');assert.equal(item.latest.value,5);assert.equal(item.frequency,'A');assert.ok(item.flags.includes('Later supplied period not reported'));
});
