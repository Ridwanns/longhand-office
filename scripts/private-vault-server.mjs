import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateEncryptedBackup,BACKUP_FILE_LIMIT} from '../encrypted-backup.js';
const hash=v=>createHash('sha256').update(v).digest('hex');
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(s);
export function openVaultDatabase(filename){
 const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS vaults(id TEXT PRIMARY KEY,token_hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS checkpoints(vault_id TEXT NOT NULL REFERENCES vaults(id),revision INTEGER NOT NULL,request_id TEXT NOT NULL,content_hash TEXT NOT NULL,created_at TEXT NOT NULL,envelope TEXT NOT NULL,PRIMARY KEY(vault_id,revision),UNIQUE(vault_id,request_id));');return db;
}
export function provisionVault(db){const id=randomUUID(),token=randomBytes(32).toString('base64url');db.prepare('INSERT INTO vaults VALUES (?,?)').run(id,hash(token));return {id,token};}
export function createPrivateVaultServer({db,origins,maxBytes=BACKUP_FILE_LIMIT,maxStoredBytes=1000000000,maxCheckpoints=1000}){
 const allowed=new Set(origins);if(!allowed.size||[...allowed].some(o=>{try{const u=new URL(o);return u.origin!==o||!['http:','https:'].includes(u.protocol);}catch{return true;}}))throw Error('Explicit frontend origins are required.');
 const failures=new Map();
 return http.createServer(async(req,res)=>{
  const origin=req.headers.origin;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  if(origin&&!allowed.has(origin))return send(403,{error:'Frontend origin is not allowed.'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Expose-Headers','ETag');}
  let url;try{url=new URL(req.url,'http://vault.invalid');}catch{return send(400,{error:'Invalid path.'});}
  const match=url.pathname.match(/^\/v1\/vaults\/([a-f0-9-]{36})(?:\/checkpoints(?:\/(\d+))?)?$/);if(!match||!uuid(match[1])||url.search)return send(404,{error:'Unknown endpoint.'});
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, PUT, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, If-Match');return send(204,null);}
  const ip=req.socket.remoteAddress,bucket=failures.get(ip);if(bucket&&Date.now()-bucket.since<60000&&bucket.count>=20)return send(429,{error:'Too many authentication failures. Retry after one minute.'});
  const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1],vault=db.prepare('SELECT token_hash FROM vaults WHERE id=?').get(match[1]);
  if(!token||!vault||!timingSafeEqual(Buffer.from(hash(token),'hex'),Buffer.from(vault.token_hash,'hex'))){if(failures.size>10000)failures.clear();failures.set(ip,{since:bucket&&Date.now()-bucket.since<60000?bucket.since:Date.now(),count:bucket&&Date.now()-bucket.since<60000?bucket.count+1:1});return send(401,{error:'Invalid vault credentials.'});}
  const id=match[1];
  try{
   if(req.method==='GET'){
    if(url.pathname.endsWith('/checkpoints'))return send(200,{checkpoints:db.prepare('SELECT revision,created_at AS createdAt,content_hash AS contentHash FROM checkpoints WHERE vault_id=? ORDER BY revision DESC').all(id)});
    const row=match[2]?db.prepare('SELECT * FROM checkpoints WHERE vault_id=? AND revision=?').get(id,Number(match[2])):db.prepare('SELECT * FROM checkpoints WHERE vault_id=? ORDER BY revision DESC LIMIT 1').get(id);
    if(match[2]&&!row)return send(404,{error:'Checkpoint unavailable.'});res.setHeader('ETag','"'+(row?.revision||0)+'"');return send(200,row?{revision:row.revision,createdAt:row.created_at,contentHash:row.content_hash,envelope:JSON.parse(row.envelope)}:{revision:0,envelope:null});
   }
   if(req.method!=='PUT'||url.pathname!==`/v1/vaults/${id}`){res.setHeader('Allow','GET, PUT, OPTIONS');return send(405,{error:'Unsupported method.'});}
   if(req.headers['content-type']!=='application/json')return send(415,{error:'JSON required.'});
   const expected=req.headers['if-match']?.match(/^"(0|[1-9]\d*)"$/)?.[1];if(expected===undefined||!Number.isSafeInteger(Number(expected)))return send(428,{error:'Expected revision required in If-Match.'});
   if(Number(req.headers['content-length'])>maxBytes)return send(413,{error:'Checkpoint exceeds size limit.'});
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>maxBytes){send(413,{error:'Checkpoint exceeds size limit.'});req.resume();return;}chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(Object.keys(body).sort().join(',')!=='envelope,requestId'||!uuid(body.requestId))throw Error();validateEncryptedBackup(body.envelope);}catch{return send(400,{error:'A valid encrypted checkpoint and unique request ID are required. Plain records are never accepted.'});}
   const envelope=JSON.stringify(body.envelope),digest=hash(envelope);
   db.exec('BEGIN IMMEDIATE');let result;
   try{
    const prior=db.prepare('SELECT revision,content_hash FROM checkpoints WHERE vault_id=? AND request_id=?').get(id,body.requestId);
    if(prior){result=prior.content_hash===digest?{status:200,value:{revision:prior.revision,contentHash:digest,replayed:true}}:{status:409,value:{error:'Request ID already belongs to a different checkpoint.'}};}
    else{
     const info=db.prepare('SELECT COALESCE(MAX(revision),0) AS revision,COUNT(*) AS count,COALESCE(SUM(length(envelope)),0) AS bytes FROM checkpoints WHERE vault_id=?').get(id);
     if(info.revision!==Number(expected))result={status:409,value:{error:'Vault changed on another device. Inspect the latest checkpoint before saving.',revision:info.revision}};
     else if(info.count>=maxCheckpoints||info.bytes+envelope.length>maxStoredBytes)result={status:507,value:{error:'Vault capacity reached. No history was removed.'}};
     else{const revision=info.revision+1;db.prepare('INSERT INTO checkpoints VALUES (?,?,?,?,?,?)').run(id,revision,body.requestId,digest,new Date().toISOString(),envelope);result={status:201,value:{revision,contentHash:digest,replayed:false}};}
    }
    db.exec('COMMIT');
   }catch(e){db.exec('ROLLBACK');throw e;}
   return send(result.status,result.value);
  }catch{return send(500,{error:'Vault operation failed; inspect service health before retrying the same request ID.'});}
 }).on('clientError',(_,socket)=>socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const filename=process.env.LONGHAND_VAULT_DB;if(!filename)throw Error('Set LONGHAND_VAULT_DB to a private database path outside the public site.');const db=openVaultDatabase(filename);
 if(process.argv.includes('--init-vault')){process.stdout.write(JSON.stringify(provisionVault(db))+'\n');db.close();}
 else{const origins=(process.env.LONGHAND_VAULT_ORIGINS||'http://127.0.0.1:4175').split(','),server=createPrivateVaultServer({db,origins});server.requestTimeout=30000;server.headersTimeout=15000;server.listen(Number(process.env.LONGHAND_VAULT_PORT||4176),'127.0.0.1',()=>console.log('Private encrypted checkpoint service listening on loopback. HTTPS/private hosting is required for other devices.'));}
}
