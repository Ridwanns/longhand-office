export async function run(original,base='http://127.0.0.1:4175/office/'){
 const browser=original.context().browser(),contexts=[],checks=[],errors=[],password='TEST ONLY original password 2026',next='TEST ONLY replacement password 2026',secret='TEST ONLY synthetic recovery '+crypto.randomUUID();
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 async function fresh(){const ctx=await browser.newContext();contexts.push(ctx);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await ctx.route(base+'rekey-test.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated synthetic vault</title>'}));await p.goto(base+'rekey-test.html');await load(p);return p;}
 async function load(p){await p.evaluate(async()=>{window.V=await import('./secure-workspace.js');window.C=await import('./secure-workspace-crypto.js');});}
 try{
  const p=await fresh();await p.evaluate(async({password,secret})=>{await V.startVault(password,{create:true});localStorage.setItem('longhand-office.TEST-ONLY-rekey',secret);await V.secureFlush();},{password,secret});
  const before=await p.evaluate(()=>V.encryptedExport());
  for(const [name,old,newPass]of [['Wrong current password leaves vault unchanged',password+' wrong',next],['Weak replacement leaves vault unchanged',password,'short'],['Same password is rejected',password,password]]){
   check(name,await p.evaluate(async({old,newPass,before})=>{try{await V.changeVaultPassword(old,newPass);return false;}catch{return JSON.stringify(await V.encryptedExport())===JSON.stringify(before);}},{old,newPass,before}));
  }
  check('Interrupted rekey preserves the old durable envelope and usable session',await p.evaluate(async({password,next,before,secret})=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){const req=put.apply(this,a);if(this.name==='workspace'){const tx=this.transaction;queueMicrotask(()=>tx.abort());}return req;};let rejected=false;try{await V.changeVaultPassword(password,next);}catch{rejected=true;}finally{IDBObjectStore.prototype.put=put;}return rejected&&JSON.stringify(await V.encryptedExport())===JSON.stringify(before)&&localStorage.getItem('longhand-office.TEST-ONLY-rekey')===secret;},{password,next,before,secret}));
  await p.evaluate(async({password,next})=>V.changeVaultPassword(password,next),{password,next});const after=await p.evaluate(()=>V.encryptedExport());
  check('Rekey uses fresh salt, IV and ciphertext while preserving vault identity',before.salt!==after.salt&&before.iv!==after.iv&&before.ciphertext!==after.ciphertext&&before.vaultId===after.vaultId&&after.revision===before.revision+1);
  await p.evaluate(()=>V.secureLock());await p.reload();await load(p);
  check('Old password cannot unlock the changed vault',await p.evaluate(async password=>{try{await V.startVault(password);return false;}catch{return !(await V.vaultInfo()).unlocked;}},password));
  await p.evaluate(next=>V.startVault(next),next);check('New password restores exact private records after reload',await p.evaluate(secret=>localStorage.getItem('longhand-office.TEST-ONLY-rekey')===secret,secret));
  for(const [label,envelope,pass]of [['Original backup',before,password],['New backup',after,next]]){
   const q=await fresh();await q.evaluate(async({envelope,pass})=>V.restoreVault(envelope,pass),{envelope,pass});check(label+' restores exact records in an independent empty browser',await q.evaluate(secret=>localStorage.getItem('longhand-office.TEST-ONLY-rekey')===secret,secret));
  }
  const f=await fresh();await f.evaluate(password=>V.startVault(password,{create:true}),password);
  check('Readback failure after commit explicitly reports that the password changed',await f.evaluate(async({password,next})=>{
   const get=IDBObjectStore.prototype.get,put=IDBObjectStore.prototype.put;let failRead=false;
   IDBObjectStore.prototype.put=function(...a){const r=put.apply(this,a);if(this.name==='workspace')r.addEventListener('success',()=>{failRead=true;});return r;};
   IDBObjectStore.prototype.get=function(...a){if(failRead&&this.name==='workspace')throw Error('TEST ONLY readback interrupted');return get.apply(this,a);};
   try{await V.changeVaultPassword(password,next);return false;}catch(e){return e.passwordChanged===true;}finally{IDBObjectStore.prototype.get=get;IDBObjectStore.prototype.put=put;}
  },{password,next}));
  await f.evaluate(async()=>{localStorage.setItem('longhand-office.TEST-ONLY-after-readback','preserved');await V.secureFlush();await V.secureLock();});await f.reload();await load(f);await f.evaluate(next=>V.startVault(next),next);
  check('Post-commit readback failure retains the correct key for subsequent encrypted saves',await f.evaluate(()=>localStorage.getItem('longhand-office.TEST-ONLY-after-readback')==='preserved'));
  const g=await fresh();await g.evaluate(()=>V.startGuest());check('Temporary sessions cannot change vault passwords',await g.evaluate(async({password,next})=>{try{await V.changeVaultPassword(password,next);return false;}catch{return true;}},{password,next}));
  const ctx=await browser.newContext({acceptDownloads:true});contexts.push(ctx);const u=await ctx.newPage();u.on('pageerror',e=>errors.push(e.message));await u.goto(base+'#overview');await u.locator('#secure-password').fill(password);await u.locator('#secure-password-confirm').fill(password);await u.locator('#secure-tabs-closed').check();await u.locator('#secure-vault-form [type=submit]').click();await u.locator('#secure-gate').waitFor({state:'detached',timeout:30000});
  await u.getByRole('button',{name:'Change password',exact:true}).click();check('Password form requires a backup download first',await u.locator('#secure-password-form [type=submit]').isDisabled());
  let download=u.waitForEvent('download');await u.locator('#secure-password-backup').click();await download;
  for(const width of [1440,390,320]){await u.setViewportSize({width,height:850});check('Password dialog fits '+width+'px',await u.locator('#secure-password-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth&&d.getBoundingClientRect().right<=innerWidth));}
  await u.locator('#secure-password-current').fill(password);await u.locator('#secure-password-new').fill(next);await u.locator('#secure-password-confirm').fill(next);download=u.waitForEvent('download');await u.locator('#secure-password-form [type=submit]').click();await download;await u.locator('#secure-password-status').filter({hasText:'Password changed and verified'}).waitFor();
  check('Successful change clears password fields and offers a new backup',await u.locator('#secure-password-current').inputValue()===''&&await u.locator('#secure-password-form').isHidden());
  await u.locator('#secure-password-close').click();await u.getByRole('button',{name:'Lock',exact:true}).click();await u.locator('#secure-gate').waitFor({timeout:30000});await u.locator('#secure-password').fill(next);await u.locator('#secure-vault-form [type=submit]').click();await u.locator('#secure-gate').waitFor({state:'detached',timeout:30000});check('New password unlocks through the actual website gate',await u.locator('#secure-session-controls').isVisible());
  check('No unexpected browser errors',errors.length===0);return {checks,errors};
 }finally{await Promise.all(contexts.map(c=>c.close()));}
}


