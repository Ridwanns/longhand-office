import {validateEncryptedBackup,BACKUP_FILE_LIMIT} from './encrypted-backup.js';
export function vaultEndpoint(value,id){
 const u=new URL(value),local=['127.0.0.1','localhost','[::1]'].includes(u.hostname);
 if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||u.protocol!=='https:'&&!(u.protocol==='http:'&&local))throw Error('Use an HTTPS service origin (or HTTP localhost for local testing), without a path, credentials, query or fragment.');
 if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id))throw Error('Use the private service vault ID.');return u.origin+'/v1/vaults/'+id;
}
export function privateVaultClient({origin,id,token,fetcher=fetch}){
 const endpoint=vaultEndpoint(origin,id);if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Use the private vault access token.');
 async function request(method,path='',body,revision){
  const headers={Authorization:'Bearer '+token};if(body){headers['Content-Type']='application/json';headers['If-Match']='"'+revision+'"';}
  const response=await fetcher(endpoint+path,{method,headers,body:body?JSON.stringify(body):undefined,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(60000)});
  if(Number(response.headers.get('Content-Length'))>BACKUP_FILE_LIMIT)throw Error('Vault response exceeds supported size.');
  if(!response.body)throw Error('Vault response body is missing.');const reader=response.body.getReader(),chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>BACKUP_FILE_LIMIT){await reader.cancel();throw Error('Vault response exceeds supported size.');}chunks.push(value);}const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}let result;try{result=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('Unreadable private vault response.');}
  if(!response.ok)throw Error(result.error||'Private vault request failed.');return result;
 }
 return {async latest(revision){const r=await request('GET',revision===undefined?'':'/checkpoints/'+revision);if(!Number.isSafeInteger(r.revision)||r.revision<0||r.revision===0&&r.envelope!==null)throw Error('Invalid vault revision.');if(r.envelope)validateEncryptedBackup(r.envelope);return r;},async history(){const r=await request('GET','/checkpoints');if(!Array.isArray(r.checkpoints)||r.checkpoints.length>1000)throw Error('Invalid checkpoint history.');return r.checkpoints;},async push(envelope,revision,requestId=crypto.randomUUID()){validateEncryptedBackup(envelope);if(!Number.isSafeInteger(revision)||revision<0)throw Error('Inspect the vault revision before saving.');return request('PUT','',{envelope,requestId},revision);}};
}
