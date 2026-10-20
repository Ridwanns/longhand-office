import {exportMarketArchive,validateMarketArchive,restoreMarketArchive} from './market-data-storage.js';
import {preferenceKey} from './workspace-scope.js';
import {readPreferences,restorePreferences,validatePreferences} from './workspace-preferences.js';
import {api} from './office-storage.js';
import {validate} from './model.js';
import {validateAnalysis} from './analysis-contract.js';
import {listTickerStudies,restoreTickerBackup} from './ticker-storage.js';
import {validateTickerStudy} from './ticker-study.js';
import {savedAutoValuations,restoreAutoValuations} from './auto-valuation-ui.js';
import {validateAutoValuationStudy} from './auto-valuation-math.js';
import {listAdvancedStudies,validateAdvancedStudy,insertAdvancedStudies,advancedHash} from './advanced-storage.js';
import {continuityList,insertContinuity} from './continuity-store.js';
import {flushDrafts,validateDraft} from './drafts.js';
import {restoreAtlasCalculation} from './atlas-ui.js';
import {restoreResearchStudy} from './research-ui.js';
import {validatePrediction,createPrediction,predictionOutcome} from './prediction-math.js';
import {restoredScope} from './workspace-scope.js';
import {encryptBackup,decryptBackup,validateEncryptedBackup,checkBackupPassword,ENCRYPTED_BACKUP_FORMAT,BACKUP_FILE_LIMIT} from './encrypted-backup.js';
const stores=['analyses','tickers','valuations','advanced','drafts','manual','predictions'];
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
let adapter;
const stageDb=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('longhand-office.complete-staging.'+new URL('.',location.href).pathname,1);r.onupgradeneeded=()=>r.result.createObjectStore('bundles',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function staged(id,value){const db=await stageDb();try{const tx=db.transaction('bundles',value?'readwrite':'readonly'),done=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Backup staging aborted.'));}),store=tx.objectStore('bundles'),result=await req(value?store.put(value):store.get(id));await done;return value||result;}finally{db.close();}}
export function completeBackupPanel(){return `<section class="complete-backup"><p class="eyebrow">RECORDS / ALL RESEARCH ARCHIVES</p><h2>Workspace backup & recovery.</h2><p>One file includes Office records, every completed core run, advanced models, valuations, ticker studies, calculator drafts, saved manual studies, registered predictions, theme, watchlists, retained Data Sources datasets and their saved source studies. Incomplete model requests are retained as audit notes; they never restart on restore.</p><div class="toolbar"><button class="primary" type="button" data-complete-export>Download workspace backup ↓</button><label class="atlas-restore">Inspect complete backup<input type="file" data-complete-inspect accept=".json,application/json"></label></div><details class="encrypted-options"><summary>Protect your backup with a password</summary><p>Encrypt the downloaded file on this device. Use a long, unique passphrase and keep it separately; there is no password reset.</p><div class="backup-password-fields"><label>Password<input type="password" data-backup-password autocomplete="new-password" minlength="12" aria-describedby="backup-encryption-note"></label><label>Confirm password<input type="password" data-backup-confirm autocomplete="new-password" minlength="12"></label></div><button class="secondary" type="button" data-complete-encrypt>Download encrypted backup ↓</button><p class="quiet-note" id="backup-encryption-note">At least 12 characters. Only this file is encrypted. Active browser/SQLite records and earlier plain exports remain unencrypted. Your password is not stored or uploaded.</p></details><div class="backup-unlock" data-backup-unlock hidden><label>Backup password<input type="password" data-backup-unlock-password autocomplete="off" aria-describedby="backup-unlock-note"></label><button class="secondary" type="button" data-complete-unlock>Unlock & inspect</button><p class="quiet-note" id="backup-unlock-note">Unlocking does not restore or change records. A restored workspace uses ordinary unencrypted device storage.</p></div><p data-complete-status role="status">Restore creates a separate workspace. Your active workspace is preserved.</p><div data-complete-preview></div><button class="secondary" type="button" data-complete-restore disabled>Restore to a new workspace</button><p class="quiet-note">Private file · no upload. Maximum 100 MB before encryption / 200 completed core runs. Public feeds and frozen Atlas reference files are reloaded from their sources; private assumptions and retained model datasets are included. Keep older individual exports too.</p></section>`;}
export function recoveryWorkspaceNotice(){const scope=restoredScope();if(!scope)return '';const url=new URL(location.href),previous=url.searchParams.get('return-workspace');url.searchParams.delete('restored-workspace');url.searchParams.delete('return-workspace');if(previous&&/^[0-9a-f-]{36}$/i.test(previous))url.searchParams.set('restored-workspace',previous);url.hash='records';return `<aside class="test-banner" role="note">RESTORED WORKSPACE · Separate records and research archives on this device. <a href="${url.pathname+url.search+url.hash}">Return to the original workspace ↗</a></aside>`;}
export async function validateCompleteBundle(b,{recompute=false,onProgress=()=>{}}={}){
 if(b?.format!=='longhand-complete-backup'||b.version!==1||!Number.isFinite(Date.parse(b.exportedAt))||new TextEncoder().encode(JSON.stringify(b)).length>100000000)throw Error('Use a supported complete backup up to 100 MB.');validate(b.records);if(b.marketSources)await validateMarketArchive(b.marketSources,{verifyStudy:(study,dataset)=>import('./market-data-research.js').then(m=>m.validateMarketStudy(study,dataset,{recompute}))});if(b.preferences)validatePreferences(b.preferences);
 for(const key of stores){if(!Array.isArray(b[key])||new Set(b[key].map(x=>x.id)).size!==b[key].length)throw Error('Invalid or duplicate '+key+' records.');}
 if(!Array.isArray(b.incompleteRuns)||b.incompleteRuns.length>2000||new Set([...b.analyses,...b.incompleteRuns].map(r=>r.id)).size!==b.analyses.length+b.incompleteRuns.length)throw Error('Invalid or conflicting incomplete request archive.');const {configFor,validId}=await import('./quant-contract.js');for(const r of b.incompleteRuns){if(!validId(r.id)||!['queued','running','failed','cancelled'].includes(r.status)||!Number.isFinite(Date.parse(r.created)))throw Error('Invalid archived request.');configFor(r.config);}
 const limits={analyses:200,tickers:200,valuations:1000,advanced:100,drafts:2,manual:300,predictions:500};for(const key of stores)if(b[key].length>limits[key])throw Error(key+' exceeds the supported restore limit.');
 for(const r of b.analyses){const values=[r.config,r.results,r.dataset?.observations];const {configFor}=await import('./quant-contract.js');values.push(configFor(r.config));const hashes=new Map(await Promise.all(values.map(async v=>[JSON.stringify(v),await advancedHash(v)])));validateAnalysis(r,v=>hashes.get(JSON.stringify(v)));}
 for(const s of b.tickers){validateTickerStudy(s);if(s.runId){const r=[...b.analyses,...b.incompleteRuns].find(r=>r.id===s.runId);if(!r||r.config.market!==s.instrument.market||r.config.ticker!==s.instrument.ticker)throw Error('Ticker study references a missing or mismatched core run.');}}
 b.valuations.forEach(validateAutoValuationStudy);b.drafts.forEach(validateDraft);
 for(const record of [...b.records.theses,...b.records.decisions]){const c=record.researchContext;if(!c)continue;const ts=b.tickers.find(s=>s.id===c.tickerStudyId),v=b.valuations.find(v=>v.id===c.valuationStudyId);if(ts&&(ts.instrument.market!==c.market||ts.instrument.ticker!==c.ticker||ts.instrument.currency!==c.currency||(ts.quote?.price??null)!==c.sourcePrice||(ts.quote?.marketDate||ts.quote?.date||null)!==c.priceDate))throw Error('Retained research context does not match its ticker source.');if(v&&(v.fundamental.market!==c.market||v.fundamental.ticker!==c.ticker||v.fundamental.currency!==c.currency))throw Error('Retained research context does not match its valuation source.');}
 for(const m of b.manual){if(!['atlas','research'].includes(m.kind)||!m.id||!Number.isFinite(Date.parse(m.createdAt)))throw Error('Invalid manual study record.');(m.kind==='atlas'?restoreAtlasCalculation:restoreResearchStudy)(m.artifact);}
 for(let n=0;n<b.advanced.length;n++){const s=b.advanced[n],core=b.analyses.find(r=>r.id===s.sourceRunId);if(!core||core.config.ticker!==s.source.ticker||core.config.market!==s.source.market||core.config.basis!==s.source.basis||s.source.rows.some(row=>!core.dataset.observations.some(o=>o.date===row.date&&o.price===row.price)))throw Error('Advanced study core reference is missing or mismatched.');onProgress('Checking advanced study '+(n+1)+' / '+b.advanced.length);await validateAdvancedStudy(s,recompute?recomputeAdvanced:undefined);}
 for(const p of b.predictions){validatePrediction(p);const core=b.analyses.find(r=>r.id===p.coreRunId);if(!core||core.resultHash!==p.coreResultHash)throw Error('Prediction core reference is missing or mismatched.');const expected=createPrediction(core,p.horizon,p.registeredAt,p.id);for(const k of Object.keys(expected))if(!['status','outcome'].includes(k)&&!(k==='coreModelVersion'&&p[k]===undefined)&&JSON.stringify(expected[k])!==JSON.stringify(p[k]))throw Error('Registered forecast differs from its original core model.');if(p.status==='settled'){const priceKey=p.basis==='adjusted'?'adjustedClose':'rawClose',history={metadata:{ticker:p.ticker,market:p.market,currency:p.currency,retrievedAt:p.outcome.sourceRetrievedAt},rows:[{date:p.cutoff,[priceKey]:p.basePrice,complete:true},...p.outcome.rows.map(r=>({date:r.date,[priceKey]:r.price,complete:true}))]},actual=predictionOutcome(p,history,p.outcome.checkedAt);if(JSON.stringify(actual)!==JSON.stringify(p.outcome))throw Error('Settled prediction arithmetic does not reconcile.');}}
 // Existing Office contract also verifies every linked analysis against its records.
 await api('validate-backup',{format:'longhand-office-backup',formatVersion:2,records:b.records,analyses:b.analyses});return b;
}
function recomputeAdvanced(source,settings){return new Promise((resolve,reject)=>{const worker=new Worker(new URL('./advanced-worker.js',import.meta.url),{type:'module'}),timer=setTimeout(()=>finish(Error('Restoration model verification timed out.')),90000);function finish(error,result){clearTimeout(timer);worker.terminate();error?reject(error):resolve(result);}worker.onmessage=({data})=>{if(data.error)finish(Error(data.error));if(data.result)finish(null,data.result);};worker.onerror=e=>finish(Error(e.message));worker.postMessage({source,settings});});}
async function preservedRequests(archive){const {configFor,validId}=await import('./quant-contract.js'),rows=[...archive.incompleteRuns],known=new Set([...archive.analyses,...rows].map(r=>r.id));for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i),prefix='longhand-office.quant-request.';if(!key?.startsWith(prefix))continue;const id=key.slice(prefix.length);if(!validId(id)||known.has(id))continue;const raw=JSON.parse(localStorage.getItem(key));if(!['sending','failed'].includes(raw?.state))throw Error('Stored model request is invalid. Export recovery files before completing this backup.');rows.push({id,config:configFor(raw.config),status:raw.state==='failed'?'failed':'queued',created:raw.createdAt,error:raw.error||'Request submission was incomplete at backup time.'});known.add(id);}return rows;}
export async function exportCompleteBackup(){await flushDrafts();const first=JSON.stringify(adapter.records()),office=await adapter.exportRecords(),archive=await api('full-archive');const [tickers,valuations,advanced,drafts,manual,predictions]=await Promise.all([listTickerStudies(),savedAutoValuations(),listAdvancedStudies(),continuityList('drafts'),continuityList('manual'),continuityList('predictions')]);if(JSON.stringify(adapter.records())!==first)throw Error('Records changed during backup. Retry to capture one consistent workspace.');const b={format:'longhand-complete-backup',version:1,exportedAt:new Date().toISOString(),records:office.records,analyses:archive.analyses,tickers,valuations,advanced,drafts,manual,predictions,incompleteRuns:await preservedRequests(archive),preferences:readPreferences(),marketSources:await exportMarketArchive(),policy:'Private device backup. Restore into a new workspace; never silently overwrite another workspace. Imported provider attribution and device timestamps are unverified.'};await validateCompleteBundle(b);if(JSON.stringify(adapter.records())!==first)throw Error('Records changed during backup. Retry.');return b;}
export async function restoreStagedBundle(storage,key){const id=restoredScope();if(!id||localStorage.getItem(key+'.vault'))return;const entry=await staged(id);if(!entry)throw Error('Restoration bundle is missing on this browser. Return to your original workspace.');
 if(entry.completedAt&&!entry.bundle){const saved=await api('workspace?id='+encodeURIComponent(id));if(!saved)throw Error('Restored workspace is missing. Use your exported backup.');localStorage.setItem(key+'.vault',JSON.stringify({id}));storage.marker={id};storage.accept(saved,id);return;}
 const b=await validateCompleteBundle(entry.bundle,{recompute:true});
 // Every archive below is in the fresh URL-scoped namespace. Failures never touch the original.
 if(b.marketSources)await restoreMarketArchive(b.marketSources);if(b.tickers.length)await restoreTickerBackup({format:'longhand-ticker-backup',version:1,studies:b.tickers});if(b.valuations.length)await restoreAutoValuations({format:'longhand-auto-valuation-backup',version:1,studies:b.valuations});if(b.advanced.length)await insertAdvancedStudies(b.advanced);await insertContinuity(b,id);
 await api('restore-requests',{requests:b.incompleteRuns});
 let saved=await api('workspace?id='+encodeURIComponent(id));if(saved&&JSON.stringify(saved.data)!==JSON.stringify(b.records))throw Error('Staged workspace records changed. Original workspace remains intact.');if(!saved)saved=await api('workspace',{id,revision:0,data:b.records,reason:'isolated-complete-restore',analyses:b.analyses});
 if(b.preferences)restorePreferences(b.preferences);localStorage.setItem(key+'.vault',JSON.stringify({id}));try{localStorage.setItem(key,JSON.stringify(b.records));}catch{}storage.marker={id};storage.accept(saved,id);await staged(id,{id,createdAt:entry.createdAt,completedAt:new Date().toISOString(),bundle:null});
}
export function installCompleteBackup(value){
 adapter=value;let pending=null,encrypted=null,selection=0,busy=null;
 const panel=()=>document.querySelector('.complete-backup');
 const clearSecrets=el=>el?.querySelectorAll('input[type=password]').forEach(input=>input.value='');
 const preview=(bundle,el)=>{pending=bundle;el.querySelector('[data-complete-preview]').textContent=bundle.records.portfolios.length+' portfolios · '+bundle.records.theses.length+' theses · '+bundle.records.decisions.length+' decisions · '+stores.map(k=>bundle[k].length+' '+k).join(' · ');el.querySelector('[data-complete-restore]').disabled=false;el.querySelector('[data-complete-status]').textContent='Inspection passed. Restore independently recomputes advanced studies and creates a separate workspace.';};
 function download(bundle,isEncrypted){const url=URL.createObjectURL(new Blob([JSON.stringify(bundle)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='longhand-office-complete-'+new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date())+(isEncrypted?'.encrypted':'')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 window.addEventListener('hashchange',()=>{selection++;pending=null;encrypted=null;clearSecrets(panel());});
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-complete-export],[data-complete-encrypt],[data-complete-unlock],[data-complete-restore]');
  if(!b||b.disabled||busy===selection)return;
  const el=b.closest('.complete-backup'),status=el.querySelector('[data-complete-status]'),ticket=selection,controls=[...el.querySelectorAll('button,input[type=file]')],disabled=controls.map(c=>c.disabled);
  busy=ticket;controls.forEach(c=>c.disabled=true);
  try{
   if(b.hasAttribute('data-complete-export')||b.hasAttribute('data-complete-encrypt')){
    const secure=b.hasAttribute('data-complete-encrypt'),password=el.querySelector('[data-backup-password]').value;
    if(secure){checkBackupPassword(password);if(password!==el.querySelector('[data-backup-confirm]').value)throw Error('Passwords do not match.');}
    status.textContent='Collecting and validating every archive…';
    const bundle=await exportCompleteBackup();
    if(ticket!==selection||!el.isConnected)return;
    if(secure)status.textContent='Encrypting the backup on this device…';
    const output=secure?await encryptBackup(bundle,password):bundle;
    if(ticket!==selection||!el.isConnected)return;
    download(output,secure);
    try{localStorage.setItem(preferenceKey('longhand-office.backup-generated'),bundle.exportedAt);}catch{}
    status.textContent=secure?'Encrypted backup exported. Keep the password separately; active device records remain unencrypted.':'Complete backup exported. '+bundle.analyses.length+' core runs and research sections and retained source datasets verified.';
   }else if(b.hasAttribute('data-complete-unlock')&&encrypted){
    status.textContent='Unlocking and validating on this device…';
    const bundle=await decryptBackup(encrypted,el.querySelector('[data-backup-unlock-password]').value);
    await validateCompleteBundle(bundle);
    if(ticket!==selection||!el.isConnected)return;
    preview(bundle,el);encrypted=null;el.querySelector('[data-backup-unlock]').hidden=true;
   }else if(b.hasAttribute('data-complete-restore')&&pending){
    const bundle=pending;status.textContent='Recomputing models and validating every section before staging…';
    await validateCompleteBundle(bundle,{recompute:true,onProgress:text=>{if(el.isConnected&&ticket===selection)status.textContent=text;}});
    if(ticket!==selection||!el.isConnected)return;
    const id=crypto.randomUUID();await staged(id,{id,bundle,createdAt:new Date().toISOString()});
    if(ticket!==selection||!el.isConnected)return;
    const url=new URL(location.href),old=restoredScope();if(old)url.searchParams.set('return-workspace',old);url.searchParams.set('restored-workspace',id);url.hash='records';location.assign(url.href);
   }
  }catch(err){if(el.isConnected&&ticket===selection)status.textContent='Complete backup operation stopped: '+err.message+' Original records remain intact.';}
  finally{if(busy===ticket)busy=null;clearSecrets(el);if(el.isConnected){controls.forEach((c,i)=>c.disabled=disabled[i]);el.querySelector('[data-complete-restore]').disabled=!pending;}}
 });
 document.addEventListener('change',async e=>{
  if(!e.target.hasAttribute('data-complete-inspect'))return;
  const ticket=++selection,el=e.target.closest('.complete-backup'),status=el.querySelector('[data-complete-status]');
  pending=null;encrypted=null;clearSecrets(el);el.querySelector('[data-complete-restore]').disabled=true;el.querySelector('[data-complete-preview]').textContent='';el.querySelector('[data-backup-unlock]').hidden=true;
  try{
   const file=e.target.files[0];if(!file){status.textContent='Select a complete backup. Your active workspace is preserved.';return;}
   if(file.size>BACKUP_FILE_LIMIT)throw Error('Backup file exceeds the supported size.');
   status.textContent='Inspecting the backup without changing records…';
   const parsed=JSON.parse(await file.text());
   if(ticket!==selection||!el.isConnected)return;
   if(parsed?.format===ENCRYPTED_BACKUP_FORMAT){
    validateEncryptedBackup(parsed);encrypted=parsed;el.querySelector('[data-backup-unlock]').hidden=false;
    status.textContent='Encrypted backup detected. Enter its password to unlock and inspect; nothing has been restored.';
    el.querySelector('[data-backup-unlock-password]').focus();
   }else{
    if(file.size>100000000)throw Error('Plain complete backup exceeds 100 MB.');
    const bundle=await validateCompleteBundle(parsed);if(ticket===selection&&el.isConnected)preview(bundle,el);
   }
  }catch(err){if(ticket===selection&&el.isConnected)status.textContent='Backup rejected: '+err.message;}
 });
}

export async function stageCompleteRestore(bundle){await validateCompleteBundle(bundle,{recompute:true});const id=crypto.randomUUID();await staged(id,{id,bundle,createdAt:new Date().toISOString()});const url=new URL(location.href),old=restoredScope();if(old)url.searchParams.set('return-workspace',old);url.searchParams.set('restored-workspace',id);url.hash='records';return url.href;}
