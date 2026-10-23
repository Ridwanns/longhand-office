import test from 'node:test';
import assert from 'node:assert/strict';
import {retainMacroSeries} from '../scripts/retain-macro-data.mjs';
import {MACRO_SERIES,validateMacroFeed} from '../macro-contract.js';
import {CONTEXT_SERIES,BLS_CALENDAR_URL,validateMacroContext} from '../macro-context-contract.js';
import {RELEASE_SERIES,validateMacroReleases} from '../macro-releases-contract.js';
import {EXTENDED_SERIES,validateMacroExtended} from '../macro-extended-contract.js';
const oldAt='2026-10-20T12:00:00Z',nowAt='2026-10-21T12:00:00Z',hash='a'.repeat(64);
function fixture(kind,registry,id,validate){
 const series=Object.entries(registry).map(([key,s])=>({id:key,sourceUrl:s.sourceUrl||s.url,retrievedAt:oldAt,...(kind==='macro'?{acquisition:s.acquisition}:{unit:s.unit,frequency:s.frequency}),observations:[],error:'SYNTHETIC TEST ONLY: not collected'}));
 const target=series.find(s=>s.id===id);delete target.error;Object.assign(target,{sourceHash:hash,observations:[kind==='macro'?{period:'2026-Q2',value:2,status:'derived',releasedAt:null,sourceUrl:registry[id].url}:{date:kind==='macro-context'?'2026-10-19':kind==='macro-releases'?'2026-04-01':'2026-09-01',value:2,status:'reported'}]});
 const old={format:'longhand-'+kind,version:1,generatedAt:oldAt,series,...(kind==='macro-context'?{calendar:{sourceUrl:BLS_CALENDAR_URL,retrievedAt:oldAt,error:'SYNTHETIC TEST ONLY',events:[]}}:{})};validate(old);
 const current=structuredClone(old);current.generatedAt=nowAt;const failure=current.series.find(s=>s.id===id);delete failure.sourceHash;failure.retrievedAt=nowAt;failure.observations=[];failure.error='SYNTHETIC TEST ONLY: source maintenance';validate(current);
 return {old,current,id,validate};
}
const cases=[['macro',MACRO_SERIES,'us-gdp',validateMacroFeed],['macro-context',CONTEXT_SERIES,'us-policy',validateMacroContext],['macro-releases',RELEASE_SERIES,'imf-IND-gdp',validateMacroReleases],['macro-extended',EXTENDED_SERIES,'oecd-GBR-yield',validateMacroExtended]];
for(const args of cases)test(args[0]+' source outage retains original dated values, hashes and definitions',()=>{
 const {old,current,id,validate}=fixture(...args),before=JSON.stringify(old),out=retainMacroSeries(current,old,validate),s=out.series.find(s=>s.id===id),original=old.series.find(s=>s.id===id);
 const {refreshError,refreshAttemptAt,retainedFromGeneratedAt,...facts}=s;assert.deepEqual(facts,original);assert.equal(refreshAttemptAt,nowAt);assert.equal(retainedFromGeneratedAt,oldAt);assert.match(refreshError,/maintenance/);assert.equal(JSON.stringify(old),before);
 for(const change of [s=>delete s.refreshAttemptAt,s=>s.refreshError='',s=>s.refreshAttemptAt='2026-10-19T00:00:00Z',s=>s.refreshAttemptAt='2026-10-22T00:00:00Z',s=>s.retainedFromGeneratedAt='2026-10-19T00:00:00Z']){const bad=structuredClone(out);change(bad.series.find(s=>s.id===id));assert.throws(()=>validate(bad));}
});
test('Repeated source failures do not renew original retrieval or replace a successful new series',()=>{
 const {old,current,id,validate}=fixture(...cases[3]);const retained=retainMacroSeries(current,old,validate),second=structuredClone(current);second.generatedAt='2026-10-21T13:00:00Z';second.series.find(s=>s.id===id).retrievedAt=second.generatedAt;
 const twice=retainMacroSeries(second,retained,validate).series.find(s=>s.id===id);assert.equal(twice.retrievedAt,oldAt);assert.equal(twice.sourceHash,hash);assert.equal(twice.refreshAttemptAt,second.generatedAt);
 const success=structuredClone(current),s=success.series.find(s=>s.id===id);delete s.error;s.sourceHash='b'.repeat(64);s.observations=structuredClone(old.series.find(s=>s.id===id).observations);s.observations[0].value=3;assert.deepEqual(retainMacroSeries(success,old,validate),success);
});
test('Missing, unavailable, malformed or newer baseline cannot invent a macro replacement',()=>{
 const {old,current,id,validate}=fixture(...cases[3]);assert.equal(retainMacroSeries(current,null,validate),current);assert.deepEqual(retainMacroSeries(current,current,validate),current);
 const bad=structuredClone(old);bad.series.find(s=>s.id===id).unit='USD';assert.throws(()=>retainMacroSeries(current,bad,validate));const newer=structuredClone(old);newer.generatedAt='2026-10-21T14:00:00Z';assert.throws(()=>retainMacroSeries(current,newer,validate));
});

test('A fully valid fresh acquisition never reads or inherits an obsolete unused review baseline',()=>{
 const {current,validate}=fixture(...cases[3]);
 for(const s of current.series){delete s.error;s.sourceHash=hash;s.observations=[{date:'2026-01-01',value:2,status:'reported'}];}
 validate(current);const old=structuredClone(current);old.series.find(s=>s.id==='review-NZL-inflation').sourceUrl='https://www.stats.govt.nz/TEST-ONLY-obsolete-review';assert.throws(()=>validate(old));
 const before=structuredClone(current);assert.equal(retainMacroSeries(current,old,validate),current);assert.deepEqual(current,before);
 const bad=structuredClone(current);bad.series[0].unit='TEST ONLY wrong units';assert.throws(()=>retainMacroSeries(bad,old,validate));
});
