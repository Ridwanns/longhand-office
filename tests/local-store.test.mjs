import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {LocalStore} from '../scripts/local-store.mjs';
import {JobQueue} from '../scripts/quant-jobs.mjs';
import {hash,configFor} from '../scripts/quant-data.mjs';
import {analyze} from '../quant-math.js';
import {empty} from '../model.js';
import {fixture} from './quant-fixture.mjs';
const conf=ticker=>configFor({ticker,market:'US',cutoff:'2026-10-12',horizon:5});
const completed=()=>{const config=conf('AAPL'),dataset=fixture('AAPL'),results=analyze(dataset,config);return {id:randomUUID(),fingerprint:hash(config),config,status:'completed',created:new Date().toISOString(),dataset,results,resultHash:hash(results),configHash:hash(config),version:1};};
function record(run){const d=empty();d.theses.push({id:'TEST-thesis',title:'TEST ONLY linked research',symbol:'AAPL',status:'Researching',assumptions:'TEST',evidence:'TEST',risks:'TEST',reviewDate:'2026-10-12',reports:[],analysisRefs:[{runId:run.id,ticker:'AAPL',market:'US',cutoff:run.config.cutoff,modelVersion:run.results.modelVersion,resultHash:run.resultHash}]});return d;}
test('SQLite records survive reopen; migration backup exists before first revision',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'longhand-test-')),file=path.join(dir,'office.sqlite'),id=randomUUID();let s=new LocalStore(file);const d=empty();s.write(id,0,d,'migration');assert.equal(s.backups(id)[0].revision,0);s.close();s=new LocalStore(file);assert.deepEqual(s.read(id).data,d);assert.equal(s.read(id).revision,1);s.close();const resolved=path.resolve(dir);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));rmSync(resolved,{recursive:true});
});
test('CAS rejects stale edits and restores without changing records or creating partial backups',()=>{const s=new LocalStore(':memory:'),id=randomUUID();s.write(id,0,empty());const current=s.read(id);assert.throws(()=>s.write(id,0,empty(),'restore'),/changed/);assert.deepEqual(s.read(id),current);assert.equal(s.backups(id).length,1);s.close();});
test('atomic import restores linked runs and dataset/results without broken references',()=>{const run=completed(),d=record(run),source=new LocalStore(':memory:'),target=new LocalStore(':memory:');source.putJob(run);const backup=source.export(d);target.write(randomUUID(),0,backup.records,'restore',backup.analyses);assert.equal(target.job(run.id).resultHash,run.resultHash);assert.deepEqual(target.export(d).records,d);source.close();target.close();});
test('missing/mismatched run links and altered dataset/result hashes reject without partial writes',()=>{const run=completed(),d=record(run),s=new LocalStore(':memory:'),id=randomUUID();assert.throws(()=>s.write(id,0,d),/Missing/);assert.equal(s.read(id),null);const bad=structuredClone(run);bad.dataset.observations[0].price=0;assert.throws(()=>s.write(id,0,d,'restore',[bad]),/hashes/);assert.equal(s.job(run.id),null);assert.equal(s.read(id),null);s.close();});
test('run ID conflicts reject; newer analysis does not change original research reference',()=>{const a=completed(),b=completed(),s=new LocalStore(':memory:');s.putJob(a);s.putJob(b);const d=record(a);assert.equal(s.export(d).analyses[0].id,a.id);const changed=structuredClone(a);changed.results.historical.annualizedVolatility++;changed.resultHash=hash(changed.results);assert.throws(()=>s.validateRuns([changed]),/conflicts/);s.close();});
test('incompatible and malformed analysis backups reject even with recomputed hashes',()=>{const s=new LocalStore(':memory:');for(const mutate of [r=>r.results.modelVersion='future-model',r=>delete r.results.simulation,r=>r.dataset.metadata.ticker='MSFT',r=>r.dataset.observations[1].date=r.dataset.observations[0].date]){const r=completed();mutate(r);r.resultHash=hash(r.results);r.dataset.dataHash=hash(r.dataset.observations);assert.throws(()=>s.validateRuns([r]),/incomplete|incompatible/);}s.close();});
const wait=async(s,id)=>{const start=Date.now();while(Date.now()-start<10000){const j=s.job(id);if(['completed','failed','cancelled'].includes(j.status))return j;await new Promise(r=>setTimeout(r,20));}throw Error('Test job timed out.');};
test('worker job completes, is recoverable, cache matches ticker/config and force creates fresh version',async()=>{
 const s=new LocalStore(':memory:'),q=new JobQueue(s,{fixture:c=>fixture(c.ticker)}),id=randomUUID();q.submit({id,...conf('AAPL')});const a=await wait(s,id);assert.equal(a.status,'completed');assert.ok(a.events.some(e=>e.stage==='Chronological model evaluation'));assert.equal(s.job(id).resultHash,a.resultHash);
 const cached=q.submit({id:randomUUID(),...conf('AAPL')});assert.equal(cached.cachedFrom,id);const other=q.submit({id:randomUUID(),...conf('MSFT')});assert.equal(other.cachedFrom,null);assert.equal((await wait(s,other.id)).dataset.metadata.ticker,'MSFT');
 const fresh=q.submit({id:randomUUID(),...conf('AAPL'),force:true});assert.equal(fresh.cachedFrom,null);assert.ok(fresh.version>cached.version);assert.equal((await wait(s,fresh.id)).status,'completed');q.close();s.close();
});
test('cancel queued and running jobs, reject invalid ticker, bound pending queue and timeout workers',async()=>{
 const s=new LocalStore(':memory:'),q=new JobQueue(s,{concurrency:0,fixture:c=>fixture(c.ticker)});const ids=[];for(let i=0;i<16;i++){ids.push(randomUUID());q.submit({id:ids.at(-1),...conf('AAPL'),force:true});}assert.throws(()=>q.submit({id:randomUUID(),...conf('AAPL')}),/full/);assert.equal(q.cancel(ids[0]).status,'cancelled');assert.throws(()=>q.submit({id:randomUUID(),...conf('https://bad')}),/Invalid/);q.close();s.close();
 const s2=new LocalStore(':memory:'),q2=new JobQueue(s2,{timeout:1,fixture:c=>fixture(c.ticker,1200)}),id=randomUUID();q2.submit({id,...conf('AAPL')});assert.equal((await wait(s2,id)).status,'failed');q2.close();s2.close();
 const s3=new LocalStore(':memory:'),q3=new JobQueue(s3,{fixture:c=>fixture(c.ticker)}),id3=randomUUID();q3.submit({id:id3,...conf('AAPL')});assert.equal(q3.cancel(id3).status,'cancelled');q3.close();s3.close();
});
test('interrupted persisted job is recovered by a new queue and immutable ID keeps original config',async()=>{const s=new LocalStore(':memory:'),q=new JobQueue(s,{concurrency:0,fixture:c=>fixture(c.ticker)}),id=randomUUID();q.submit({id,...conf('AAPL')});q.close();const recovered=new JobQueue(s,{fixture:c=>fixture(c.ticker)});const result=await wait(s,id);assert.equal(result.status,'completed');assert.ok(result.events.some(e=>e.stage==='Recovered after local server restart'));assert.throws(()=>recovered.submit({id,...conf('MSFT')}),/different/);recovered.close();s.close();});
test('running job is recovered after physical SQLite close and reopen',async()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'longhand-jobs-test-')),file=path.join(dir,'office.sqlite');let s=new LocalStore(file);const q=new JobQueue(s,{fixture:c=>fixture(c.ticker)}),id=randomUUID();q.submit({id,...conf('AAPL')});assert.equal(s.job(id).status,'running');q.close();s.close();s=new LocalStore(file);const next=new JobQueue(s,{fixture:c=>fixture(c.ticker)});assert.equal((await wait(s,id)).status,'completed');next.close();s.close();const resolved=path.resolve(dir);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));rmSync(resolved,{recursive:true});
});
