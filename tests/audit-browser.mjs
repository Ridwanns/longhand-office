export async function run(original){
 const browser=original.context().browser(),context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}}),page=await context.newPage(),checks=[],errors=[];
 const check=(name,ok)=>{if(!ok)throw Error('Audit failed: '+name);checks.push({name,passed:true});};
 const root='http://127.0.0.1:4174';
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(root+'/#quant');await page.locator('#quant-form').waitFor();
  await page.locator('a.skip').focus();await page.keyboard.press('Enter');check('Skip link focuses the workspace without losing the active page',page.url().endsWith('#quant')&&await page.evaluate(()=>document.activeElement.id==='main')&&await page.locator('#quant-form').count()===1);
  await page.locator('[name=ticker]').fill('BAD!');check('Invalid ticker rejected before opening a tab',!await page.locator('[name=ticker]').evaluate(e=>e.checkValidity()));
  await page.locator('[name=ticker]').fill('BRK.B');check('US share-class ticker accepted',await page.locator('[name=ticker]').evaluate(e=>e.checkValidity()));
  await page.locator('[name=market]').selectOption('IDX');await page.locator('[name=ticker]').fill('BBCA.JK');check('IDX suffix accepted after market switch',await page.locator('[name=ticker]').evaluate(e=>e.checkValidity()));
  await page.locator('[name=ticker]').fill('MSFTX');check('Wrong IDX ticker length rejected',!await page.locator('[name=ticker]').evaluate(e=>e.checkValidity()));
  await page.locator('[name=market]').selectOption('US');
  let statuses=0,posts=0;await page.route('**/api/local/status',async route=>{const res=await route.fetch(),value=await res.json();if(statuses++===0)value.token='TEST-expired-token';await route.fulfill({json:value});});page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/cancel'))posts++;});
  const message=await page.evaluate(async()=>{const {api}=await import('/office-storage.js');try{await api('cancel',{id:'invalid'});}catch(e){return e.message;}});
  check('Old browser token refreshes once after server-session change',statuses===2&&posts===2&&message==='Invalid run ID.');await page.unroute('**/api/local/status');
  await page.route('**/api/local/runs',async route=>{if(route.request().method()==='POST')await route.fulfill({status:429,json:{error:'TEST ONLY queue-full rejection'}});else await route.continue();});
  await page.locator('[name=ticker]').fill('AAPL');let popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Run models ↗',exact:true}).click();const result=await popup;result.on('pageerror',e=>errors.push(e.message));await result.waitForLoadState();await result.getByRole('heading',{name:'Analysis request was not accepted.'}).waitFor();
  check('Rejected request shows actual error in the result tab',(await result.locator('.quant-warning').innerText()).includes('queue-full rejection'));await result.reload();await result.getByRole('heading',{name:'Analysis request was not accepted.'}).waitFor();check('Rejected request remains understandable after reload',await result.locator('[data-retry-submission]').isVisible());await page.unroute('**/api/local/runs');
  popup=result.waitForEvent('popup');await result.getByRole('button',{name:'Retry in a new tab ↗'}).click();const retried=await popup;retried.on('pageerror',e=>errors.push(e.message));await retried.waitForLoadState();await retried.waitForFunction(()=>['completed','failed'].includes(document.querySelector('#quant-run')?._run?.status),null,{timeout:60000});
  check('Retry opens a distinct persistent run and reaches a terminal state',retried.url()!==result.url()&&await retried.locator('#quant-run').evaluate(el=>!!el._run));
  // Fresh TEST ONLY workspace; no edits to the existing walkthrough or production.
  const workspace=await page.evaluate(async()=>{const {api}=await import('/office-storage.js'),id=crypto.randomUUID();const data={version:1,portfolios:[{id:'TEST-audit-p',name:'TEST ONLY — concurrent save audit',mode:'paper',currency:'USD',openingCash:1000,transactions:[]}],theses:[],decisions:[]};return api('workspace',{id,revision:0,data});});
  await page.goto(root+'/?test-workspace='+workspace.id+'#portfolio/TEST-audit-p');await page.getByRole('button',{name:'Edit portfolio'}).click();await page.locator('[name=name]').fill('TEST ONLY — stale pending edit');
  await page.route('**/api/local/workspace',async route=>{if(route.request().method()==='POST')await new Promise(r=>setTimeout(r,500));await route.continue();});
  await page.getByRole('button',{name:'Save record',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#record-form')?.getAttribute('aria-busy')==='true');
  const other=await context.newPage();await other.goto(root);await other.locator('h1').waitFor();
  await other.evaluate(async id=>{const {api}=await import('/office-storage.js');const saved=await api('workspace?id='+id);saved.data.portfolios[0].name='TEST ONLY — newer peer change';const result=await api('workspace',{id,revision:saved.revision,data:saved.data});const channel=new BroadcastChannel('longhand-office.v1.changes');channel.postMessage({id,revision:result.revision});setTimeout(()=>channel.close(),100);},workspace.id);
  await page.locator('.form-error').filter({hasText:'changed'}).waitFor();check('Peer update does not tear down a committing editor',await page.locator('#editor').evaluate(d=>d.open));check('Stale pending save reports a clear error without an exception',errors.length===0);
  await page.keyboard.press('Escape');await page.unroute('**/api/local/workspace');await other.close();
  await page.goto(root+'/#records');await page.getByRole('button',{name:'Restore from backup'}).click();
  await page.route('**/api/local/validate-backup',async route=>{await new Promise(r=>setTimeout(r,400));await route.continue();});
  await page.getByLabel('Backup file').setInputFiles({name:'TEST-only-old-backup.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"portfolios":[],"theses":[],"decisions":[]}')});await page.keyboard.press('Escape');await page.waitForTimeout(600);check('Closing restore during file validation does not generate a stale callback error',errors.length===0);await page.unroute('**/api/local/validate-backup');
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});for(const room of ['overview','portfolios','theses','decisions','library','records','market/bonds','quant']){await page.goto(root+'/#'+room);await page.locator('h1').waitFor();check('No page overflow: '+room+' at '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
  await page.goto(root+'/#portfolios');await page.locator('[data-action=portfolio]').first().click();await page.locator('#editor .close').focus();await page.keyboard.press('Shift+Tab');check('Shift+Tab stays in the modal',await page.evaluate(()=>document.querySelector('#editor').contains(document.activeElement)));await page.keyboard.press('Escape');check('Escape closes an idle modal',await page.locator('#editor').evaluate(d=>!d.open));
  check('Reduced-motion preference is honored',await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(document.querySelector('#main')).animationName==='none'));
  check('No browser JavaScript exceptions in audited workflows',errors.length===0);
  return {checks,errors,retriedRunId:await retried.locator('#quant-run').evaluate(el=>el._run.id)};
 }finally{await context.close();}
}
