import {validate} from './model.js';
let statusPromise;
export async function localStatus(){
 return statusPromise??=fetch('/api/local/status',{signal:AbortSignal.timeout(10000),cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Local backend unavailable.');return r.json();}).catch(e=>{statusPromise=null;throw e;});
}
export async function api(route,body){
 // Capture the payload before awaiting a token. Only a pre-write token rejection
 // is retried; timeouts/network errors never replay a potentially committed save.
 const payload=body===undefined?undefined:JSON.stringify(body);
 for(let attempt=0;attempt<2;attempt++){
  const options={signal:AbortSignal.timeout(30000),cache:'no-store'};
  if(payload!==undefined)Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json','X-Office-Token':(await localStatus()).token},body:payload});
  const r=await fetch('/api/local/'+route,options);
  let v;try{v=await r.json();}catch{throw Error('Local server returned an unreadable response ('+r.status+'). Retry after checking the server.');}
  if(payload!==undefined&&r.status===403&&v.code==='LOCAL_TOKEN_EXPIRED'&&attempt===0){statusPromise=null;continue;}
  if(!r.ok)throw Error(v.error||'Local request failed.');
  return v;
 }
}
export class OfficeStorage{
 constructor(key){this.key=key;this.markerKey=key+'.vault';this.marker=null;this.revision=0;this.lastData=null;this.channel=new BroadcastChannel(key+'.changes');}
 accept(saved,id){
  if(!saved||saved.id!==id||!Number.isSafeInteger(saved.revision)||saved.revision<1)throw Error('Invalid local workspace response.');
  const records=validate(saved.data);
  if(saved.revision<this.revision){if(this.lastData)return structuredClone(this.lastData);throw Error('Stale local workspace response. Reload before editing.');}
  this.revision=saved.revision;this.lastData=structuredClone(records);return records;
 }
 async load(){
  const raw=localStorage.getItem(this.markerKey);if(!raw&&!this.marker)return null;
  try{
   this.marker=this.marker||JSON.parse(raw);const id=this.marker.id,saved=await api('workspace?id='+encodeURIComponent(id));
   if(!saved)throw Error('Connected vault missing. Browser recovery copy remains intact.');
   if(this.marker.id!==id)throw Error('Workspace connection changed while loading.');
   return this.accept(saved,id);
  }catch(e){throw Error('Vault load failed: '+e.message);}
 }
 async save(data,reason='save',analyses=[]){
  if(!this.marker)throw Error('No connected vault.');const id=this.marker.id;
  const saved=await api('workspace',{id,revision:this.revision,data,reason,analyses});
  if(this.marker.id!==id)throw Error('Workspace connection changed while saving.');
  const records=this.accept(saved,id);this.channel.postMessage({id,revision:this.revision});return records;
 }
 async migrate(data,raw){
  if(this.marker)throw Error('Already connected to a vault.');validate(data);
  const id=crypto.randomUUID(),recovery=this.key+'.before-vault.'+Date.now();
  localStorage.setItem(recovery,raw??JSON.stringify(data));const exported=await api('backup',{data});
  if(localStorage.getItem(this.key)!==raw)throw Error('Browser records changed during migration. Recovery copy retained; migration stopped.');
  const saved=await api('workspace',{id,revision:0,data,reason:'explicit-browser-migration',analyses:exported.analyses});
  const marker={id,recovery};localStorage.setItem(this.markerKey,JSON.stringify(marker));this.marker=marker;this.accept(saved,id);this.channel.postMessage({id,revision:this.revision});return exported;
 }
 async backup(data){return api('backup',{data});}
 async inspectBackup(value){return api('validate-backup',value);}
}
