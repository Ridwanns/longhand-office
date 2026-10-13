import {Worker} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import {configFor,hash,validId} from './quant-data.mjs';
import {validateAnalysis} from './analysis-backup.mjs';
const codeHash=hash(['../quant-math.js','./quant-data.mjs','./quant-worker.mjs'].map(p=>readFileSync(new URL(p,import.meta.url),'utf8')));
export class JobQueue{
 constructor(store,{concurrency=2,timeout=120000,fixture=null}={}){this.store=store;this.concurrency=concurrency;this.timeout=timeout;this.fixture=fixture;this.active=new Map();this.pending=[];for(const j of store.allPending()){j.status='queued';this.event(j,'Recovered after local server restart');store.putJob(j);this.pending.push(j.id);}this.pump();}
 event(j,stage){j.stage=stage;j.updated=new Date().toISOString();(j.events??=[]).push({stage,at:j.updated});}
 submit(input){
  if(!validId(input.id))throw Error('Invalid analysis run ID.');const config=configFor(input),fingerprint=hash({config,codeHash});
  const existing=this.store.job(input.id);if(existing){if(hash(existing.config)!==hash(config))throw Error('Run ID belongs to a different request.');return existing;}
  let cached=!input.force&&this.store.cached(fingerprint);
  if(cached){try{validateAnalysis(cached);if(cached.configHash!==hash(config)||cached.codeHash!==codeHash)cached=null;}catch{cached=null;}}
  if(!cached&&this.pending.length+this.active.size>=16){const e=Error('Local queue is full (16 jobs). Retry after a run completes.');e.status=429;throw e;}
  const now=new Date().toISOString();
  const j={id:input.id,config,fingerprint,codeHash,version:this.store.nextVersion(config),created:now,updated:now,status:cached?'completed':'queued',stage:cached?'Cached immutable result':'Queued',events:[],cachedFrom:cached?.id||null};
  if(cached)Object.assign(j,{dataset:cached.dataset,results:cached.results,resultHash:cached.resultHash,configHash:cached.configHash,completedAt:cached.completedAt,runtime:cached.runtime||'Unrecorded in earlier run'});
  this.event(j,j.stage);this.store.putJob(j);if(!cached){this.pending.push(j.id);this.pump();}return j;
 }
 pump(){while(this.active.size<this.concurrency&&this.pending.length){const id=this.pending.shift(),j=this.store.job(id);if(j.status!=='queued')continue;j.status='running';this.event(j,'Starting local worker');this.store.putJob(j);const worker=new Worker(new URL('./quant-worker.mjs',import.meta.url),{workerData:{config:j.config,fixture:this.fixture?.(j.config)||null}}),timer=setTimeout(()=>this.finish(id,{error:'Run exceeded the 120-second execution limit.'}),this.timeout);this.active.set(id,{worker,timer});worker.on('message',m=>{if(!this.active.has(id))return;if(m.completed||m.error)this.finish(id,m);else{const fresh=this.store.job(id);this.event(fresh,m.stage);if(m.observations)fresh.observations=m.observations;if(m.dataset)fresh.dataset=m.dataset;this.store.putJob(fresh);}});worker.on('error',e=>this.finish(id,{error:e.message}));worker.on('exit',()=>{if(this.active.has(id))this.finish(id,{error:'Worker exited without a completed result.'});});}}
 finish(id,m){const active=this.active.get(id);if(!active)return;clearTimeout(active.timer);this.active.delete(id);active.worker.terminate();const j=this.store.job(id);if(m.completed){j.status='completed';Object.assign(j,m.completed);j.completedAt=new Date().toISOString();this.event(j,'Completed and saved');}else{j.status='failed';j.error=m.error;this.event(j,'Failed');}this.store.putJob(j);this.pump();}
 cancel(id){const j=this.store.job(id);if(!j)throw Error('Run not found.');if(!['running','queued'].includes(j.status))throw Error('Only queued/running jobs can be cancelled.');const a=this.active.get(id);if(a){clearTimeout(a.timer);this.active.delete(id);a.worker.terminate();}this.pending=this.pending.filter(x=>x!==id);j.status='cancelled';this.event(j,'Cancelled by user');this.store.putJob(j);this.pump();return j;}
 close(){for(const {worker,timer} of this.active.values()){clearTimeout(timer);worker.terminate();}this.active.clear();}
}

