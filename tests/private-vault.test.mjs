import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {openVaultDatabase,provisionVault,createPrivateVaultServer} from '../scripts/private-vault-server.mjs';
import {encryptBackup,decryptBackup} from '../encrypted-backup.js';
import {privateVaultClient,vaultEndpoint} from '../private-vault-client.js';
test('Vault service: ciphertext-only storage, authorization, revision conflicts, immutable history and recovery',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'longhand-vault-test-')),filename=path.join(dir,'vault.sqlite'),db=openVaultDatabase(filename),a=provisionVault(db),b=provisionVault(db),server=createPrivateVaultServer({db,origins:['https://fixture.example'],maxCheckpoints:2});server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port,endpoint=origin+'/v1/vaults/'+a.id,password='TEST ONLY unique passphrase 2026',bundle={format:'longhand-complete-backup',version:1,privateNote:'TEST ONLY confidential portfolio never sent in plaintext'},envelope=await encryptBackup(bundle,password),requestId=crypto.randomUUID(),body=JSON.stringify({requestId,envelope});
 const put=(revision,content=body,token=a.token,Origin='https://fixture.example')=>fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,'If-Match':'"'+revision+'"',Origin},body:content});
 try{
  assert.equal((await fetch(endpoint)).status,401);assert.equal((await put(0,body,b.token)).status,401);assert.equal((await put(0,body,a.token,'https://untrusted.example')).status,403);
  assert.equal((await put(0,JSON.stringify({requestId,envelope:bundle}))).status,400);
  let response=await put(0);assert.equal(response.status,201);assert.equal((await response.json()).revision,1);
  response=await put(0);assert.equal(response.status,200);assert.equal((await response.json()).replayed,true);
  const other=JSON.stringify({requestId:crypto.randomUUID(),envelope});assert.equal((await put(0,other)).status,409);
  const client=privateVaultClient({origin,id:a.id,token:a.token}),latest=await client.latest();assert.equal(latest.revision,1);assert.deepEqual(await decryptBackup(latest.envelope,password),bundle);await assert.rejects(decryptBackup(latest.envelope,'TEST ONLY incorrect password'));
  assert.equal((await put(1,other)).status,201);assert.equal((await put(2,JSON.stringify({requestId:crypto.randomUUID(),envelope}))).status,507);
  assert.equal((await client.history()).length,2);assert.equal((await client.latest(1)).revision,1);assert.equal((await fetch(endpoint+'/checkpoints/999',{headers:{Authorization:'Bearer '+a.token}})).status,404);
  const changed=structuredClone(envelope);changed.iv=btoa('123456789012');assert.equal((await put(0,JSON.stringify({requestId,envelope:changed}))).status,409);
  const row=db.prepare('SELECT envelope FROM checkpoints WHERE vault_id=? LIMIT 1').get(a.id);assert.equal(row.envelope.includes(bundle.privateNote),false);assert.equal(db.prepare('SELECT token_hash FROM vaults WHERE id=?').get(a.id).token_hash.includes(a.token),false);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();await rm(dir,{recursive:true,force:true});}
});
test('Vault client restricts origins, URL secrets, redirects and revision preconditions',async()=>{
 const id=crypto.randomUUID();for(const url of ['http://public.example','https://x.example/path','https://token@x.example','https://x.example/?token=secret','https://x.example/#secret'])assert.throws(()=>vaultEndpoint(url,id));assert.equal(vaultEndpoint('https://x.example',id),'https://x.example/v1/vaults/'+id);
 let options;const c=privateVaultClient({origin:'https://x.example',id,token:'a'.repeat(43),fetcher:async(_,o)=>{options=o;return new Response(JSON.stringify({revision:0,envelope:null}),{status:200});}});await c.latest();assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
});
