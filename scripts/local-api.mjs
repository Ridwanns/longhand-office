import {randomBytes} from 'node:crypto';
import {LocalStore} from './local-store.mjs';
import {JobQueue} from './quant-jobs.mjs';
import {validate} from '../model.js';
import path from 'node:path';
export function createLocalAPI(port){
 const dir=path.join(process.env.LOCALAPPDATA||process.cwd(),'LonghandOffice',port===4174?'test-data':'data');
 const store=new LocalStore(path.join(dir,'office.sqlite')),jobs=new JobQueue(store),token=randomBytes(32).toString('hex');
 async function body(req){let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>50000000)throw Error('Request exceeds 50 MB.');parts.push(chunk);}return JSON.parse(Buffer.concat(parts).toString('utf8'));}
 const reply=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 return {store,jobs,async handle(req,res,url){
  if(!url.pathname.startsWith('/api/local/'))return false;
  const origins=new Set(['http://127.0.0.1:'+port,'http://localhost:'+port]);
  if(req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&!origins.has(req.headers.origin)){reply(res,{error:'Local same-origin access required.'},403);return true;}
  if(!['GET','POST'].includes(req.method)){reply(res,{error:'Method not supported.'},405);return true;}
  if(req.method==='POST'&&!origins.has(req.headers.origin)){reply(res,{error:'Local same-origin access required.',code:'LOCAL_ORIGIN_REQUIRED'},403);return true;}
  if(req.method==='POST'&&req.headers['x-office-token']!==token){reply(res,{error:'Local server session changed. Refresh the request token.',code:'LOCAL_TOKEN_EXPIRED'},403);return true;}
  try{
   const route=url.pathname.slice('/api/local/'.length);
   if(route==='status'&&req.method==='GET')reply(res,{token,database:store.filename,isolated:port===4174,limits:{workers:2,queue:16,timeoutSeconds:120}});
   else if(route==='workspace'&&req.method==='GET')reply(res,store.read(url.searchParams.get('id')));
   else if(route==='workspace'&&req.method==='POST'){const x=await body(req);reply(res,store.write(x.id,x.revision,x.data,x.reason||'save',x.analyses||[]));}
   else if(route==='backup'&&req.method==='POST'){const x=await body(req);reply(res,store.export(validate(x.data)));}
   else if(route==='validate-backup'&&req.method==='POST'){const x=await body(req);if(!x||typeof x!=='object'||(x.format!==undefined||x.formatVersion!==undefined)&&(x.format!=='longhand-office-backup'||x.formatVersion!==2))throw Error('Incompatible backup format.');const records=validate(x.format==='longhand-office-backup'?x.records:x),runs=x.format==='longhand-office-backup'?x.analyses:[];store.validateRuns(runs);store.checkReferences(records,runs);reply(res,{records,analyses:runs});}
   else if(route==='backups'&&req.method==='GET')reply(res,store.backups(url.searchParams.get('id')));
   else if(route==='recovery'&&req.method==='GET')reply(res,store.backup(url.searchParams.get('id'),Number(url.searchParams.get('backup'))));
   else if(route==='runs'&&req.method==='GET')reply(res,store.listJobSummaries());
   else if(route==='runs'&&req.method==='POST')reply(res,jobs.submit(await body(req)),202);
   else if(route.startsWith('run/')&&req.method==='GET'){const j=store.job(route.slice(4));if(!j)reply(res,{error:'Run not found. The submitting tab may still be sending this request.'},404);else reply(res,j);}
   else if(route==='cancel'&&req.method==='POST')reply(res,jobs.cancel((await body(req)).id));
   else reply(res,{error:'Unknown local API route.'},404);
  }catch(e){reply(res,{error:e.message},e.status||400);}
  return true;
 },close(){jobs.close();store.close();}};
}
