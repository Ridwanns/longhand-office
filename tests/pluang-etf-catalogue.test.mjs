import test from 'node:test';
import assert from 'node:assert/strict';
import {PLUANG_ETF_CATALOGUE,seedPluangCatalogue,pluangCatalogueCoverage} from '../scripts/pluang-etf-catalogue.mjs';
import {filterMarketInstruments,instrumentAvailability} from '../pages/market-coverage.js';

test('Pluang discovery retains products without ETF in their names and records search limits',()=>{
 const c=PLUANG_ETF_CATALOGUE;
 assert.equal(new Set(c.records.map(r=>r.ticker)).size,c.records.length);
 for(const ticker of ['VT','SOXX','GLD','IBIT','SOXL','SMH','XLF','USIG','AIPO'])assert.ok(c.records.some(r=>r.ticker===ticker),ticker);
 assert.ok(c.queries.some(q=>q.possiblyTruncated));assert.match(c.completeness,/cannot be certified/);
 assert.ok(c.records.every(r=>r.queries.length&&r.market==='US'&&/^[A-Z]{1,6}$/.test(r.ticker)));
 assert.ok(!c.records.some(r=>['ACI','SCHW','IVZ','ACP','FNGU','USOI'].includes(r.ticker)));
});
test('Seeding is idempotent, retains unavailable listings and preserves existing quote metadata',()=>{
 const instruments=[{ticker:'VT',market:'US',name:'Verified Yahoo name',priceAvailable:true,instrumentType:'ETF',marketCap:123},{ticker:'AAPL',market:'US',name:'Apple',instrumentType:'EQUITY'}];
 seedPluangCatalogue(instruments);seedPluangCatalogue(instruments);
 assert.equal(instruments.filter(i=>i.pluangListed).length,PLUANG_ETF_CATALOGUE.records.length);
 assert.equal(instruments[0].name,'Verified Yahoo name');assert.equal(instruments[0].marketCap,123);
 const missing=instruments.find(i=>i.ticker==='AIPO');Object.assign(missing,{priceAvailable:false,historyPublished:false,modelCutoff:null});
 assert.equal(missing.instrumentType,null);assert.equal('price' in missing,false);
 const coverage=pluangCatalogueCoverage(instruments);assert.equal(coverage.priced,1);assert.ok(coverage.unavailable.includes('AIPO'));
});
test('ETF and Pluang catalogue filters preserve identity, exact ticker priority and honest availability',()=>{
 const items=[{ticker:'VTI',name:'Vanguard',instrumentType:'ETF',pluangListed:true,priceAvailable:true},{ticker:'VT',name:'Vanguard Total World',instrumentType:'ETF',pluangListed:true,priceAvailable:true,historyPublished:true,modelCutoff:'2026-10-15'},{ticker:'AIPO',name:'Defiance',pluangName:'Defiance AI fund',instrumentType:null,pluangListed:true,priceAvailable:false},{ticker:'ACI',name:'Albertsons',instrumentType:'EQUITY'}],before=JSON.stringify(items);
 assert.deepEqual(filterMarketInstruments(items,{kind:'etf'}).map(i=>i.ticker),['VTI','VT']);
 assert.equal(filterMarketInstruments(items,{query:'VT'})[0].ticker,'VT');
 assert.equal(filterMarketInstruments(items,{kind:'pluang'}).length,3);
 assert.equal(filterMarketInstruments(items,{kind:'pluang',query:'AI fund'})[0].ticker,'AIPO');
 assert.equal(instrumentAvailability(items[2]),'Price unavailable from source');
 assert.equal(JSON.stringify(items),before);
});
