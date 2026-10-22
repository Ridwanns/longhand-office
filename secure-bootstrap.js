import {vaultInfo,legacyInfo,startVault,startGuest,restoreVault,secureFlush,encryptedExport,finalizeMigration,secureLock,changeVaultPassword} from './secure-workspace.js';

// Pages entry point. Private application modules are imported only after a choice.
const IDLE_MS=10*60*1000,HIDDEN_MS=60*1000;
let booted=false,locking=false,lastActivity=Date.now(),hiddenAt=document.hidden?Date.now():null;
let gate,sessionBar,lockLayer,statusTimer,idleTimer;
let migrationBackupDownloaded=false;
const root=document.documentElement;
root.dataset.secureGated='true';

function text(el,message){if(el)el.textContent=message;}
function gateStatus(message,error=false){const target=gate?.querySelector('#secure-gate-status');text(target,message);if(target)target.setAttribute('role',error?'alert':'status');}
function busy(form,value){form.setAttribute('aria-busy',String(value));for(const el of form.querySelectorAll('button,input'))el.disabled=value;}
function entryBusy(value){
 gate?.setAttribute('aria-busy',String(value));
 for(const form of gate?.querySelectorAll('#secure-vault-form,#secure-restore-form')||[])busy(form,value);
 const guest=gate?.querySelector('#secure-guest');if(guest)guest.disabled=value;
}
function clearPasswords(){for(const el of document.querySelectorAll('#secure-gate input[type="password"]'))el.value='';}
function shell(content){
 if(!gate){gate=document.createElement('section');gate.id='secure-gate';gate.setAttribute('aria-labelledby','secure-gate-title');document.body.prepend(gate);}
 gate.innerHTML=`<div class="secure-gate-card"><a class="secure-brand" href="#overview" aria-label="Longhand Office">L<span>LONGHAND OFFICE</span></a>${content}<p id="secure-gate-status" class="secure-status" role="status" aria-live="polite"></p><p class="secure-limits">Encryption protects stored records while locked. While unlocked, this website and any compromised code running in it can read them. Keep your device and browser secure.</p></div>`;
 gate.querySelector('input,button')?.focus({preventScroll:true});
}
function downloadEnvelope(envelope){
 if(!envelope||typeof envelope!=='object'||Array.isArray(envelope))throw Error('Invalid encrypted export.');
 const blob=new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`longhand-encrypted-vault-${new Date().toISOString().slice(0,10)}.json`;link.hidden=true;document.body.append(link);
 try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
async function exportRecovery(){
 if(booted){const {flushDrafts}=await import('./drafts.js');await flushDrafts();}
 await secureFlush();downloadEnvelope(await encryptedExport());
}

async function recoveryGate(){
 root.dataset.secureGated='true';migrationBackupDownloaded=false;
 shell(`<p class="secure-eyebrow">Finish protecting existing records</p><h1 id="secure-gate-title">Save your encrypted backup.</h1><p>Your records have been encrypted and checked. The original unencrypted copies still remain in this browser until you complete the steps below.</p><ol class="secure-steps"><li>Download the encrypted full vault.</li><li>Confirm that the file is saved and all other Longhand Office tabs are closed.</li><li>Remove the old unencrypted copies.</li></ol><button type="button" id="secure-download-recovery" class="secure-primary">Download encrypted full vault</button><label class="secure-check"><input type="checkbox" id="secure-recovery-saved" disabled><span>I saved the backup file and closed all other Longhand Office tabs.</span></label><button type="button" id="secure-cleanup" class="secure-primary" disabled>Remove old unencrypted copies</button><p class="secure-small">Keep the file and password separately. There is no password reset or recovery key. Browser storage and downloaded files are local to this device.</p>`);
 const saved=gate.querySelector('#secure-recovery-saved'),cleanup=gate.querySelector('#secure-cleanup'),download=gate.querySelector('#secure-download-recovery');
 download.addEventListener('click',async()=>{
  download.disabled=true;gateStatus('Preparing encrypted backup…');
  try{await exportRecovery();migrationBackupDownloaded=true;saved.disabled=false;gateStatus('Download requested. Check that the encrypted file is saved before continuing.');}
  catch{migrationBackupDownloaded=false;saved.checked=false;saved.disabled=true;cleanup.disabled=true;gateStatus('The encrypted backup could not be downloaded. The original copies have not been removed. Retry the download.',true);}
  finally{download.disabled=false;}
 });
 saved.addEventListener('change',()=>{cleanup.disabled=!(migrationBackupDownloaded&&saved.checked);});
 cleanup.addEventListener('click',async()=>{
  if(!migrationBackupDownloaded||!saved.checked)return;
  cleanup.disabled=true;download.disabled=true;saved.disabled=true;gateStatus('Checking encrypted storage and removing old copies…');
  try{
   const result=await finalizeMigration({confirm:true});
   const info=await vaultInfo();
   if(result?.error||info.migrationPending)throw Error('Cleanup incomplete.');
   await openWorkspace();
  }catch{gateStatus('Cleanup is incomplete. Close other Longhand Office tabs, then download a fresh encrypted backup and retry. Your encrypted vault is retained; remaining unencrypted copies are not yet fully removed.',true);migrationBackupDownloaded=false;saved.checked=false;saved.disabled=true;download.disabled=false;}
 });
}

async function showGate(){
 root.dataset.secureGated='true';
 if(window.top!==window.self){shell('<h1 id="secure-gate-title">Open Longhand Office directly.</h1><p>The private workspace cannot open inside another website. Open the official Longhand Office address in a separate browser tab.</p>');return;}
 let info;
 try{info=await vaultInfo();}catch{
  shell('<h1 id="secure-gate-title">Storage is unavailable.</h1><p>This browser could not check the encrypted workspace. Reload after checking browser storage permissions.</p><button type="button" id="secure-reload">Reload</button>');
  gate.querySelector('#secure-reload').addEventListener('click',()=>location.reload());return;
 }
 const exists=info.exists;
 shell(`<p class="secure-eyebrow">Private workspace · this browser</p><h1 id="secure-gate-title">${exists?'Unlock your local vault.':'Protect your workspace.'}</h1><p>${exists?'Enter your password to open encrypted records on this device.':'Create a password to encrypt records saved in this browser, or use a temporary public session.'}</p><form id="secure-vault-form" novalidate><label for="secure-password">${exists?'Vault password':'New vault password'}</label><input id="secure-password" name="vault-password" type="password" autocomplete="${exists?'current-password':'new-password'}" minlength="12" required spellcheck="false" autocapitalize="off" aria-describedby="secure-password-help"><p id="secure-password-help" class="secure-small">${exists?'Your password stays in this browser session.':'Use at least 12 characters. Your password is never sent or saved.'} There is no password reset.</p>${exists?'':`<label for="secure-password-confirm">Confirm password</label><input id="secure-password-confirm" name="vault-password-confirm" type="password" autocomplete="new-password" minlength="12" required spellcheck="false" autocapitalize="off"><label class="secure-check"><input type="checkbox" id="secure-tabs-closed"><span>I closed other Longhand Office tabs before protecting any existing records.</span></label>`}<button type="submit" class="secure-primary">${exists?'Unlock vault':'Create encrypted vault'}</button></form><div class="secure-divider"><span>Public research</span></div><button type="button" id="secure-guest">Continue in a temporary session</button><p class="secure-small">A temporary session starts empty, does not open existing private records, and discards its work when this page is closed or reloaded.</p>`);
 if(!exists){
  const restore=document.createElement('section');restore.className='secure-restore';restore.setAttribute('aria-labelledby','secure-restore-title');
  restore.innerHTML='<h2 id="secure-restore-title">Have an encrypted vault backup?</h2><p class="secure-small">Restore the full device-vault file on an empty destination. Existing encrypted vaults are never replaced.</p><form id="secure-restore-form" novalidate><label for="secure-restore-file">Encrypted device-vault backup</label><input type="file" id="secure-restore-file" accept="application/json,.json" required><label for="secure-restore-password">Backup password</label><input type="password" id="secure-restore-password" name="backup-password" autocomplete="current-password" minlength="12" required spellcheck="false" autocapitalize="off"><button type="submit">Restore encrypted vault</button></form>';
  gate.querySelector('.secure-limits').before(restore);
 }
 const form=gate.querySelector('#secure-vault-form');
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(gate.getAttribute('aria-busy')==='true')return;
  let password=gate.querySelector('#secure-password').value;
  const confirmation=gate.querySelector('#secure-password-confirm')?.value;
  if(password.length<12){clearPasswords();password='';gateStatus('Enter a password with at least 12 characters.',true);gate.querySelector('#secure-password').focus();return;}
  if(!exists&&password!==confirmation){clearPasswords();password='';gateStatus('The passwords did not match. Enter them again.',true);gate.querySelector('#secure-password').focus();return;}
  if(!exists&&!gate.querySelector('#secure-tabs-closed').checked){clearPasswords();password='';gateStatus('Close other Longhand Office tabs and confirm before creating the encrypted workspace.',true);return;}
  clearPasswords();entryBusy(true);gateStatus(exists?'Unlocking locally…':'Checking local records and creating encrypted storage…');
  try{
   const legacy=exists?null:await legacyInfo();
   const unlocked=await startVault(password,{create:!exists,migrate:!!legacy?.hasData});password='';
   if(unlocked.migrationPending)await recoveryGate();else await openWorkspace();
  }catch{password='';gateStatus(exists?'The vault could not be unlocked. Check your password and browser storage, then retry.':'The encrypted vault could not be created. Existing records have not been intentionally removed. Retry after checking browser storage.',true);entryBusy(false);}
 });
 gate.querySelector('#secure-guest').addEventListener('click',async e=>{
  if(gate.getAttribute('aria-busy')==='true')return;entryBusy(true);clearPasswords();gateStatus('Starting an empty temporary session…');
  try{await startGuest();await openWorkspace();}catch{gateStatus('The temporary session could not start. Reload and retry.',true);entryBusy(false);}
 });
 gate.querySelector('#secure-restore-form')?.addEventListener('submit',async e=>{
  e.preventDefault();if(gate.getAttribute('aria-busy')==='true')return;
  const file=gate.querySelector('#secure-restore-file').files?.[0];let password=gate.querySelector('#secure-restore-password').value;
  clearPasswords();
  if(!file||password.length<12){password='';gateStatus('Choose an encrypted device-vault file and enter its password of at least 12 characters.',true);return;}
  if(file.size>128*1024*1024){password='';gateStatus('This backup exceeds the supported file size. No data has been replaced.',true);return;}
  entryBusy(true);gateStatus('Checking the backup and password locally…');
  try{
   const envelope=JSON.parse(await file.text());const info=await restoreVault(envelope,password);password='';
   if(info.migrationPending)await recoveryGate();else await openWorkspace();
  }catch{password='';gateStatus('The encrypted backup could not be restored. Check the file, password and that this destination is empty. Existing data has not been intentionally replaced.',true);entryBusy(false);}
 });
}

function setSessionStatus(info){
 const label=sessionBar?.querySelector('.secure-session-state');
 if(info.mode==='guest')text(label,'Temporary session');
 else if(info.error)text(label,'Save needs attention');
 else if(info.dirty)text(label,'Encrypting changes…');
 else text(label,'Local vault · unlocked');
 if(sessionBar)sessionBar.dataset.storageState=info.error?'error':info.dirty?'saving':'ready';
}
function freezeWorkspace(){
 locking=true;root.dataset.secureLocking='true';
 for(const el of document.body.children)if(el!==lockLayer&&!['SCRIPT','STYLE','LINK'].includes(el.tagName))el.inert=true;
}
function unfreezeWorkspace(){
 locking=false;delete root.dataset.secureLocking;
 for(const el of document.body.children)if(el!==gate)el.inert=false;
 lockLayer?.close();lastActivity=Date.now();hiddenAt=document.hidden?Date.now():null;
}
async function lockWorkspace(){
 if(locking&&lockLayer?.dataset.busy==='true')return;
 if(!lockLayer){
  lockLayer=document.createElement('dialog');lockLayer.id='secure-lock-layer';lockLayer.setAttribute('aria-labelledby','secure-lock-title');
  lockLayer.innerHTML='<h2 id="secure-lock-title">Locking your vault</h2><p id="secure-lock-status" role="status" aria-live="polite"></p><div class="secure-lock-actions" hidden><button type="button" id="secure-lock-retry" class="secure-primary">Retry lock</button><button type="button" id="secure-lock-continue">Continue editing</button></div>';
  document.body.append(lockLayer);lockLayer.addEventListener('cancel',e=>e.preventDefault());
  lockLayer.querySelector('#secure-lock-retry').addEventListener('click',lockWorkspace);
  lockLayer.querySelector('#secure-lock-continue').addEventListener('click',unfreezeWorkspace);
 }
 freezeWorkspace();lockLayer.inert=false;lockLayer.dataset.busy='true';lockLayer.querySelector('.secure-lock-actions').hidden=true;text(lockLayer.querySelector('#secure-lock-status'),'Saving pending work before clearing this unlocked session…');
 if(!lockLayer.open)lockLayer.showModal();
 try{
  const {flushDrafts}=await import('./drafts.js');await flushDrafts();
  await secureFlush();await secureLock();
  clearInterval(statusTimer);clearInterval(idleTimer);location.reload();
 }catch{
  lockLayer.dataset.busy='false';text(lockLayer.querySelector('#secure-lock-title'),'Vault is still unlocked');
  text(lockLayer.querySelector('#secure-lock-status'),'Pending work could not be safely saved, so locking was stopped. Retry, or continue editing and export the affected work before leaving.');
  lockLayer.querySelector('.secure-lock-actions').hidden=false;lockLayer.querySelector('#secure-lock-retry').focus();
 }
}

function showPasswordChange(){
 if(document.querySelector('#secure-password-dialog'))return;
 const dialog=document.createElement('dialog');dialog.id='secure-password-dialog';dialog.setAttribute('aria-labelledby','secure-password-title');
 dialog.innerHTML='<h2 id="secure-password-title">Change vault password</h2><p>Save a backup first. After changing your password, download a new backup. Older backup files still require their original password.</p><button type="button" id="secure-password-backup">Download current encrypted backup</button><form id="secure-password-form"><label for="secure-password-current">Current password</label><input type="password" id="secure-password-current" autocomplete="current-password" required><label for="secure-password-new">New password · at least 12 characters</label><input type="password" id="secure-password-new" autocomplete="new-password" required><label for="secure-password-confirm">Confirm new password</label><input type="password" id="secure-password-confirm" autocomplete="new-password" required><button type="submit" class="secure-primary" disabled>Change password</button></form><p id="secure-password-status" role="status" aria-live="polite"></p><button type="button" id="secure-password-close">Cancel</button>';
 document.body.append(dialog);const form=dialog.querySelector('form'),backup=dialog.querySelector('#secure-password-backup'),close=dialog.querySelector('#secure-password-close'),status=dialog.querySelector('#secure-password-status');let busy=false,changed=false,backedUp=false;
 const clear=()=>{form.reset();};
 const dismiss=()=>{if(!busy){clear();dialog.close();dialog.remove();}};
 dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});close.addEventListener('click',dismiss);
 const controls=disabled=>{for(const el of dialog.querySelectorAll('button,input'))el.disabled=disabled;form.querySelector('button').disabled=disabled||!backedUp;};
 backup.addEventListener('click',async()=>{busy=true;controls(true);try{await exportRecovery();backedUp=true;text(status,changed?'New encrypted backup download requested. Use your new password to restore it.':'Backup download requested. Save the file before continuing.');}catch{text(status,'Backup download failed. Retry before closing this session.');}finally{busy=false;controls(false);}});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||changed||!backedUp)return;
  let current=dialog.querySelector('#secure-password-current').value,next=dialog.querySelector('#secure-password-new').value;
  if(next!==dialog.querySelector('#secure-password-confirm').value){text(status,'The new passwords do not match.');clear();return;}
  busy=true;controls(true);text(status,'Verifying and encrypting locally…');
  try{
   const {flushDrafts}=await import('./drafts.js');await flushDrafts();
   await changeVaultPassword(current,next);changed=true;clear();form.hidden=true;backup.textContent='Download new encrypted backup';close.textContent='Done';
   text(status,'Password changed and stored data verified. Download a new encrypted backup now.');
   try{await exportRecovery();text(status,'Password changed and verified. New backup download requested; save the file. Older backups still use the old password.');}catch{text(status,'Password changed. Download the new encrypted backup before closing this session.');}
  }catch(error){
   clear();
   if(error.passwordChanged){changed=true;form.hidden=true;backup.textContent='Download new encrypted backup';close.textContent='Done';text(status,'Password changed, but final storage verification needs attention. Keep this session open and download a new encrypted backup before locking.');}
   else text(status,'Could not change the password. Check your current password and choose a different new password of at least 12 characters. Your previous password is unchanged.');
  }
  finally{current='';next='';busy=false;controls(false);}
 });
 dialog.showModal();backup.focus();
}

async function mountSessionControls(){
 const info=await vaultInfo();
 if(info.mode==='inactive'){
  // Normal browser storage is the default. Never overwrite an existing encrypted vault.
  if(info.exists){
   const button=document.createElement('button');button.type='button';button.textContent='Open saved vault';
   button.addEventListener('click',()=>{sessionStorage.setItem('office.open-private-vault','1');location.reload();});
   sessionBar=document.createElement('div');sessionBar.id='secure-session-controls';sessionBar.append(button);
   (document.querySelector('.office-topbar')||document.body).append(sessionBar);
  }
  return;
 }
 sessionBar=document.createElement('div');sessionBar.id='secure-session-controls';sessionBar.setAttribute('aria-label','Workspace privacy');
 sessionBar.innerHTML='<span class="secure-session-state" role="status" aria-live="polite"></span>';
 if(info.mode==='guest'){
  const button=document.createElement('button');button.type='button';button.textContent='Set up vault';button.addEventListener('click',()=>{if(window.confirm('Leave this temporary session? Unsaved temporary work will be discarded.'))location.reload();});sessionBar.append(button);
 }else{
  const backup=document.createElement('button');backup.type='button';backup.textContent='Encrypted backup';backup.addEventListener('click',async()=>{backup.disabled=true;try{await exportRecovery();text(sessionBar.querySelector('.secure-session-state'),'Encrypted download requested');}catch{text(sessionBar.querySelector('.secure-session-state'),'Backup failed · retry');}finally{backup.disabled=false;}});
  const password=document.createElement('button');password.type='button';password.textContent='Change password';password.addEventListener('click',showPasswordChange);
  const lock=document.createElement('button');lock.type='button';lock.textContent='Lock';lock.addEventListener('click',lockWorkspace);sessionBar.append(backup,password,lock);
 }
 const header=document.querySelector('.office-topbar');(header||document.body).append(sessionBar);setSessionStatus(info);
 const notice=document.createElement('p');notice.id='secure-session-notice';
 notice.textContent=info.mode==='guest'?'Temporary session: records and analysis stay in this page only, even where a tool says “saved”. Export anything you want to keep before closing or reloading.':'Local vault is unlocked. Stored records are encrypted on this device. Auto-lock: 10 minutes idle or 1 minute in the background.';
 (header||sessionBar).after(notice);
 if(info.mode!=='guest'){
  statusTimer=setInterval(async()=>{try{setSessionStatus(await vaultInfo());}catch{}},3000);
  idleTimer=setInterval(()=>{if(!locking&&(Date.now()-lastActivity>=IDLE_MS||(hiddenAt!==null&&Date.now()-hiddenAt>=HIDDEN_MS)))void lockWorkspace();},1000);
 }
}

async function openWorkspace(){
 if(booted)return;booted=true;
 try{
  await import('./app.js');
  await import('./browser-controls.js');
  await mountSessionControls();
  delete root.dataset.secureGated;gate?.remove();gate=null;lastActivity=Date.now();hiddenAt=document.hidden?Date.now():null;
 }catch{
  booted=false;shell('<h1 id="secure-gate-title">Workspace could not open.</h1><p>Your local vault has not been intentionally removed. Reload to retry opening this session.</p><button type="button" id="secure-reload">Reload</button>');gate.querySelector('#secure-reload').addEventListener('click',()=>location.reload());
 }
}

for(const type of ['pointerdown','pointermove','keydown','touchstart','wheel'])document.addEventListener(type,e=>{if(e.isTrusted&&!locking)lastActivity=Date.now();},{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)hiddenAt=Date.now();
 else{const elapsed=hiddenAt===null?0:Date.now()-hiddenAt;hiddenAt=null;if(booted&&!locking&&elapsed>=HIDDEN_MS)void vaultInfo().then(info=>{if(info.mode==='vault')return lockWorkspace();});}
});
window.addEventListener('office:secure-storage-error',()=>{if(sessionBar){sessionBar.dataset.storageState='error';text(sessionBar.querySelector('.secure-session-state'),'Save failed · keep this tab open');}});
window.addEventListener('office:secure-storage-change',()=>{if(sessionBar)void vaultInfo().then(setSessionStatus).catch(()=>{});});
async function startOffice(){
 if(window.top!==window.self){await showGate();return;}
 let openPrivate=false;
 try{openPrivate=sessionStorage.getItem('office.open-private-vault')==='1';sessionStorage.removeItem('office.open-private-vault');}catch{}
 if(openPrivate)await showGate();else await openWorkspace();
}
void startOffice();
