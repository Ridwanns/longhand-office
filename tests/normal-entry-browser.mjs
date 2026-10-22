export async function run(original,base='http://127.0.0.1:4175/office/'){
 const browser=original.context().browser(),context=await browser.newContext({viewport:{width:1440,height:950}}),p=await context.newPage(),checks=[],errors=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#overview');await p.locator('#main').waitFor();await p.waitForFunction(()=>!document.documentElement.dataset.secureGated);
  check('Default entry opens directly without password or backup gate',await p.locator('#secure-gate').count()===0&&await p.locator('#secure-session-notice').count()===0&&await p.getByRole('button',{name:'Change password',exact:true}).count()===0);
  await p.evaluate(()=>localStorage.setItem('longhand-office.TEST-ONLY-normal-persistence','TEST ONLY retained browser preference'));
  await p.reload();await p.waitForFunction(()=>!document.documentElement.dataset.secureGated);
  check('Ordinary browser storage survives reload without password',await p.evaluate(()=>localStorage.getItem('longhand-office.TEST-ONLY-normal-persistence')==='TEST ONLY retained browser preference'));
  await p.goto(base+'#portfolios');await p.getByRole('button',{name:'＋ Create paper portfolio',exact:true}).click();await p.locator('#record-form [name=name]').fill('TEST ONLY ordinary portfolio');await p.locator('#record-form [name=currency]').selectOption('USD');await p.locator('#record-form [name=openingCash]').fill('1000');await p.locator('#record-form [type=submit]').click();await p.locator('#editor').waitFor({state:'hidden'});await p.reload();await p.waitForFunction(()=>!document.documentElement.dataset.secureGated);
  check('Actual portfolio saves and restores through normal browser storage without a password',await p.locator('#main').innerText().then(t=>t.includes('TEST ONLY ordinary portfolio')));
  for(const width of [1440,390,320]){await p.setViewportSize({width,height:950});check('Default page fits '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.evaluate(()=>{sessionStorage.setItem('office.open-private-vault','1');});await p.reload();await p.locator('#secure-vault-form').waitFor();
  const password='TEST ONLY existing vault password';await p.locator('#secure-password').fill(password);await p.locator('#secure-password-confirm').fill(password);await p.locator('#secure-tabs-closed').check();await p.locator('#secure-vault-form [type=submit]').click();await p.locator('#secure-download-recovery').waitFor();
  let downloaded=p.waitForEvent('download');await p.locator('#secure-download-recovery').click();await downloaded;await p.locator('#secure-recovery-saved').check();await p.locator('#secure-cleanup').click();await p.locator('#secure-gate').waitFor({state:'detached'});
  await p.evaluate(async()=>{const V=await import('./secure-workspace.js?office='+document.querySelector('meta[name=office-macro-assets]').content);localStorage.setItem('longhand-office.TEST-ONLY-encrypted','TEST ONLY vault secret');await V.secureFlush();});
  const before=await p.evaluate(async()=>{const V=await import('./secure-workspace.js?office='+document.querySelector('meta[name=office-macro-assets]').content);return V.encryptedExport();});
  await p.reload();await p.waitForFunction(()=>!document.documentElement.dataset.secureGated);check('Existing encrypted vault does not block normal entry',await p.getByRole('button',{name:'Open saved vault',exact:true}).isVisible());
  check('Normal mode cannot read encrypted private preferences',await p.evaluate(()=>localStorage.getItem('longhand-office.TEST-ONLY-encrypted')===null));
  const after=await p.evaluate(async()=>{const db=await new Promise((a,b)=>{const r=indexedDB.open('longhand-office.secure-vault.'+new URL('.',location.href).pathname);r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error);});try{return await new Promise((a,b)=>{const r=db.transaction('workspace','readonly').objectStore('workspace').get('active');r.onsuccess=()=>a(r.result.envelope);r.onerror=()=>b(r.error);});}finally{db.close();}});
  check('Normal entry preserves the encrypted envelope byte for byte',JSON.stringify(before)===JSON.stringify(after));
  await p.getByRole('button',{name:'Open saved vault',exact:true}).click();await p.locator('#secure-password').fill(password);await p.locator('#secure-vault-form [type=submit]').click();await p.locator('#secure-gate').waitFor({state:'detached'});check('Existing encrypted records remain accessible through optional unlock',await p.evaluate(()=>localStorage.getItem('longhand-office.TEST-ONLY-encrypted')==='TEST ONLY vault secret'));
  check('No unexpected browser errors',errors.length===0);return {checks,errors};
 }finally{await context.close();}
}

