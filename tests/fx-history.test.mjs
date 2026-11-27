import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFxHistory,parseEcbReferenceRates,collectFxHistory,fxSourceUrl} from '../scripts/fx-history-data.mjs';
import {mkdtemp,writeFile,readFile,unlink,rmdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateFxHistory,FX_SOURCE_PREFIX} from '../fx-history-contract.js';
const retrievedAt='2026-11-27T08:00:00.000Z',start='2016-11-27';
const HEAD='KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE';
const row=(currency,date,value)=>`EXR.D.${currency}.EUR.SP00.A,D,${currency},EUR,SP00,A,${date},${value}`;
// ECB reference rates of 17, 18 and 26 November 2026 (data-api.ecb.europa.eu, EXR D.IDR/D.USD). The 27 November IDR
// value is TEST-ONLY: it sits on the retrieval day and must be excluded.
const csv=(rows=[row('IDR','2026-11-17','20077.73'),row('IDR','2026-11-18','20020.71'),row('IDR','2026-11-26','20187.03'),row('IDR','2026-11-27','20166.10'),row('USD','2026-11-17','1.0989'),row('USD','2026-11-18','1.0968'),row('USD','2026-11-26','1.0975'),row('USD','2026-11-27','1.0975')])=>[HEAD,...rows].join('\n');
const feed=()=>({format:'longhand-fx-history',version:1,generatedAt:retrievedAt,entries:projectFxHistory(csv(),retrievedAt,start)});
test('USD/IDR is the cross of two ECB reference rates from the same day, and EUR/USD is the reference rate itself',()=>{
 const [usdidr,eurusd]=projectFxHistory(csv(),retrievedAt,start);
 assert.deepEqual(usdidr.observations.map(o=>[o.date,o.value]),[['2026-11-17',18270.75],['2026-11-18',18253.75],['2026-11-26',18393.65]]);
 assert.deepEqual(eurusd.observations.map(o=>[o.date,o.value]),[['2026-11-17',1.0989],['2026-11-18',1.0968],['2026-11-26',1.0975]]);
 assert.equal(usdidr.unit,'IDR per USD');assert.equal(usdidr.provider,'European Central Bank');assert.equal(usdidr.sourceUrl,FX_SOURCE_PREFIX+start);
 assert.equal(validateFxHistory(feed(),Date.parse(retrievedAt)).entries.length,2);
});
test('the cross stays within half a percent of Bank Indonesia JISDOR on the same days',()=>{
 // JISDOR published by Bank Indonesia: 17 Nov 18,264; 18 Nov 18,252; 26 Nov 18,390
 const jisdor={'2026-11-17':18264,'2026-11-18':18252,'2026-11-26':18390},[usdidr]=projectFxHistory(csv(),retrievedAt,start);
 for(const o of usdidr.observations)assert.ok(Math.abs(o.value/jisdor[o.date]-1)<0.005,o.date);
});
test('a day missing one leg has no cross, and nothing is carried forward',()=>{
 const [usdidr,eurusd]=projectFxHistory(csv([row('IDR','2026-11-17','20077.73'),row('USD','2026-11-17','1.0989'),row('USD','2026-11-18','1.0968')]),retrievedAt,start);
 assert.deepEqual(usdidr.observations.map(o=>[o.date,o.value]),[['2026-11-17',18270.75],['2026-11-18',null]]);assert.equal(eurusd.observations.length,2);
});
test('rows with another currency, denominator, frequency, rate type or a duplicate day are rejected',()=>{
 for(const bad of [row('JPY','2026-11-17','170'),'EXR.D.IDR.USD.SP00.A,D,IDR,USD,SP00,A,2026-11-17,1','EXR.M.IDR.EUR.SP00.A,M,IDR,EUR,SP00,A,2026-11-17,1','EXR.D.IDR.EUR.SP00.E,D,IDR,EUR,SP00,E,2026-11-17,1',row('IDR','2026-02-30','1'),row('IDR','2026-11-17','-1')])assert.throws(()=>parseEcbReferenceRates(csv([bad])));
 assert.throws(()=>parseEcbReferenceRates(csv([row('IDR','2026-11-17','1'),row('IDR','2026-11-17','2')])),/Duplicate/);
 assert.throws(()=>parseEcbReferenceRates('KEY,FREQ\nx,D'),/columns changed/);
});
test('the snapshot rejects other providers, units, duplicate pairs, zero rates and future publications',()=>{
 const f=feed();f.entries[0].provider='Yahoo Finance';assert.throws(()=>validateFxHistory(f,Date.parse(retrievedAt)));
 const f1=feed();f1.entries[0].unit='USD per IDR';assert.throws(()=>validateFxHistory(f1,Date.parse(retrievedAt)));
 const f2=feed();f2.entries[1]=f2.entries[0];assert.throws(()=>validateFxHistory(f2,Date.parse(retrievedAt)));
 const f3=feed();f3.entries[0].observations[0].value=0;assert.throws(()=>validateFxHistory(f3,Date.parse(retrievedAt)));
 const f4=feed();f4.entries[0].sourceUrl='https://query1.finance.yahoo.com/v8/finance/chart/IDR%3DX?interval=1d&range=10y';assert.throws(()=>validateFxHistory(f4,Date.parse(retrievedAt)));
 assert.throws(()=>validateFxHistory(feed(),Date.parse('2026-11-25')));
});
test('a failed FX refresh preserves original dates, values and hashes and exposes the failure',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'longhand-TEST-ONLY-fx-'));
 try{
  const old=feed();old.generatedAt=new Date().toISOString();await writeFile(path.join(directory,'fx-history.json'),JSON.stringify(old));
  const next=await collectFxHistory({directory,fetcher:async()=>({ok:false,status:429})});
  for(let i=0;i<2;i++){assert.deepEqual(next.entries[i].observations,old.entries[i].observations);assert.equal(next.entries[i].retrievedAt,old.entries[i].retrievedAt);assert.equal(next.entries[i].sourceHash,old.entries[i].sourceHash);assert.match(next.entries[i].refreshError,/429/);}
  assert.equal(JSON.parse(await readFile(path.join(directory,'fx-history.json'),'utf8')).entries[0].retrievedAt,old.entries[0].retrievedAt);
 }finally{await unlink(path.join(directory,'fx-history.json'));await rmdir(directory);}
});
test('the request asks ECB for ten years of IDR and USD daily reference rates only',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'longhand-TEST-ONLY-fx-'));let asked;
 try{await collectFxHistory({directory,now:()=>retrievedAt,fetcher:async url=>{asked=url;return {ok:true,text:async()=>csv()};}});assert.equal(asked,fxSourceUrl('2016-11-27'));assert.match(asked,/EXR\/D\.IDR\+USD\.EUR\.SP00\.A\?format=csvdata&detail=dataonly&startPeriod=2016-11-27$/);}
 finally{await unlink(path.join(directory,'fx-history.json'));await rmdir(directory);}
});
