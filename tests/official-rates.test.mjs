import test from 'node:test';
import assert from 'node:assert/strict';
import {projectTreasuryCsv,treasuryCsvUrl,retainOfficialRates} from '../scripts/official-rates-data.mjs';
import {TREASURY_TENORS,TREASURY_SOURCE,validateOfficialRates,treasurySpread} from '../official-rates-contract.js';
const header=['Date',...TREASURY_TENORS].map(s=>'"'+s+'"').join(',');
const csv=(date='10/13/2026',rates=TREASURY_TENORS.map(()=> '4.00'))=>header+'\n'+[date,...rates].join(',');
const received='2026-10-14T02:00:00Z';
test('Official Treasury percentages retain source values; missing yields remain null',()=>{const rates=TREASURY_TENORS.map(()=> '4.00');rates[0]='';rates[TREASURY_TENORS.indexOf('2 Mo')]='N/A';rates[TREASURY_TENORS.indexOf('2 Yr')]='4.79';rates[TREASURY_TENORS.indexOf('10 Yr')]='5.21';const d=projectTreasuryCsv(csv(undefined,rates),received);assert.equal(d.observations[0].rates['1 Mo'],null);assert.equal(d.observations[0].rates['2 Mo'],null);assert.equal(d.observations[0].rates['10 Yr'],5.21);assert.equal(treasurySpread(d.observations[0]),42);assert.equal(d.retrievedAt,received);assert.match(d.sourceHash,/^[a-f0-9]{64}$/);});
test('Spread uses basis points, preserves inversion and withholds missing tenors',()=>{assert.equal(treasurySpread({rates:{'10 Yr':4.2,'2 Yr':4.8}}),-60);assert.equal(treasurySpread({rates:{'10 Yr':0,'2 Yr':0}}),0);assert.equal(treasurySpread({rates:{'10 Yr':null,'2 Yr':4}}),null);});
test('CSV order normalized but duplicate, impossible and future dates rejected',()=>{const d=projectTreasuryCsv(csv('10/13/2026')+'\n'+['10/09/2026',...TREASURY_TENORS.map(()=> '3.00')].join(','),received);assert.deepEqual(d.observations.map(r=>r.date),['2026-10-09','2026-10-13']);for(const date of ['02/30/2026','10/15/2026','00/13/2026'])assert.throws(()=>projectTreasuryCsv(csv(date),received));assert.throws(()=>projectTreasuryCsv(csv()+'\n'+csv().split('\n')[1],received));});
test('Changed columns, invalid numbers, truncated rows and HTML errors rejected',()=>{for(const s of ['<html>denied</html>',csv().replace('"10 Yr"','"unexpected"'),csv().replace(',4.00',',NaN'),csv().replace(',4.00',',4abc'),csv().slice(0,-5)])assert.throws(()=>projectTreasuryCsv(s,received));});
test('Units and official provider identities cannot be replaced',()=>{const d=projectTreasuryCsv(csv(),received);for(const change of [{unit:'USD'},{provider:'yahoo'},{sourceUrl:'https://example.com'},{sourceHash:''}])assert.throws(()=>validateOfficialRates({...d,...change}));});
test('Unavailable releases contain no substitute observations',()=>{const d={format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt:received,error:'HTTP 503',observations:[]};assert.equal(validateOfficialRates(d).observations.length,0);assert.throws(()=>validateOfficialRates({...d,observations:projectTreasuryCsv(csv(),received).observations}));});
test('Bounded input and rates reject oversized or implausible records',()=>{assert.throws(()=>projectTreasuryCsv('x'.repeat(200001),received));const rates=TREASURY_TENORS.map(()=> '4.00');rates[0]='999';assert.throws(()=>projectTreasuryCsv(csv(undefined,rates),received));assert.throws(()=>projectTreasuryCsv(csv(), 'not a date'));});
test('Treasury URL uses fixed source and validated year',()=>{assert.ok(treasuryCsvUrl(2026).startsWith('https://home.treasury.gov/'));for(const n of ['2026',2026.5,2101,1989])assert.throws(()=>treasuryCsvUrl(n));});
const snapshot=(rows,extra={})=>validateOfficialRates({format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt:received,sourceHash:'a'.repeat(64),observations:rows.map(([date,v])=>({date,rates:Object.fromEntries(TREASURY_TENORS.map(t=>[t,v]))})),acquisitions:[...new Set(rows.map(([d])=>Number(d.slice(0,4))))].map(year=>({year,retrievedAt:'2026-10-01T00:00:00Z'})),historyErrors:[],requestedStart:'2024-01-01',...extra});
const previous=snapshot([['2024-05-01',4],['2025-05-01',4.5],['2026-05-01',5]]);
test('A failed Treasury year keeps the previous observations with their original acquisition',()=>{
 const current=snapshot([['2024-05-01',4.1],['2026-05-01',5.1]],{historyErrors:[{year:2025,error:'Treasury HTTP 503'}]});
 const d=retainOfficialRates(current,previous);
 assert.deepEqual(d.observations.map(o=>[o.date,o.rates['10 Yr']]),[['2024-05-01',4.1],['2025-05-01',4.5],['2026-05-01',5.1]]);
 assert.deepEqual(d.retainedYears,[2025]);assert.deepEqual(d.acquisitions.find(a=>a.year===2025),{year:2025,retrievedAt:'2026-10-01T00:00:00Z',retained:true});
 assert.equal(d.historyErrors.length,1);assert.match(d.sourceHash,/^[a-f0-9]{64}$/);
});
test('A complete Treasury outage keeps the whole previous history instead of erasing it',()=>{
 const outage=validateOfficialRates({format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt:received,observations:[],acquisitions:[],historyErrors:[2024,2025,2026].map(year=>({year,error:'fetch failed'})),requestedStart:'2024-01-01',error:'Treasury history is unavailable.'});
 const d=retainOfficialRates(outage,previous);
 assert.equal(d.error,undefined);assert.equal(d.observations.length,3);assert.deepEqual(d.retainedYears,[2024,2025,2026]);
});
test('Treasury retention changes nothing without failures or a usable previous snapshot',()=>{
 const current=snapshot([['2026-05-01',5.1]]);
 assert.equal(retainOfficialRates(current,previous),current);
 const failed=snapshot([['2026-05-01',5.1]],{historyErrors:[{year:2025,error:'x'}]});
 assert.equal(retainOfficialRates(failed,null),failed);
 assert.equal(retainOfficialRates(failed,{...previous,observations:[],error:'Treasury history is unavailable.'}),failed);
 // years before the requested window are not brought back
 const late=snapshot([['2026-05-01',5.1]],{historyErrors:[{year:2025,error:'x'}],requestedStart:'2025-06-01'});
 assert.equal(retainOfficialRates(late,previous),late);
});
test('The rates notice separates retained years from years left empty',async()=>{
 globalThis.document??={addEventListener(){}};const {treasuryFailureNotice}=await import('../official-rates.js');
 const text=treasuryFailureNotice({historyErrors:[{year:2024,error:'x'},{year:2025,error:'y'}],retainedYears:[2025]});
 assert.match(text,/Download failed for 2025; those years show the previous validated snapshot/);assert.match(text,/Source acquisition failed for 2024\. Those years are not filled\./);
 assert.equal(treasuryFailureNotice({historyErrors:[]}),'');
});
