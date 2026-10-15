// Private-profile isolation: every test runs in its own new browser context.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 p.on('pageerror',e=>errors.push(e.message));
 const input=()=>p.locator('#automatic-ticker'),valueInput=()=>p.locator('#auto-value-ticker');
 const open=async()=>{await p.goto(base+'#quant');await p.locator('[data-desk-mode=advanced]').click();};
 const inspectRecords=()=>p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k==='longhand-office.v1'||k.includes('.records.'))));
 const hold=async(kind,fail=false)=>p.evaluate(({kind,fail})=>{
  window.__researchGate={kind,fail,queue:[]};
  if(window.__originalResearchGetAll)return;
  window.__originalResearchGetAll=IDBObjectStore.prototype.getAll;
  IDBObjectStore.prototype.getAll=function(...args){
   const real=window.__originalResearchGetAll.apply(this,args),gate=window.__researchGate;
   if(this.transaction.mode!=='readonly'||!gate||!this.transaction.db.name.includes(gate.kind))return real;
   const proxy={};real.onsuccess=()=>gate.queue.push(()=>{if(gate.fail){proxy.error=Error('TEST ONLY archive read failure');proxy.onerror?.();}else{proxy.result=real.result;proxy.onsuccess?.();}});real.onerror=()=>{proxy.error=real.error;proxy.onerror?.();};return proxy;
  };
 },{kind,fail});
 const pending=async(n=1)=>p.waitForFunction(n=>window.__researchGate.queue.length>=n,n);
 const release=async(index=null)=>{await p.evaluate(index=>{const gate=window.__researchGate;if(index===null){window.__researchGate=null;gate.queue.splice(0).forEach(f=>f());}else gate.queue.splice(index,1)[0]();},index);await p.waitForTimeout(200);};
 const loadValue=async ticker=>{await valueInput().fill(ticker);await p.locator('#auto-value-form').evaluate(f=>f.requestSubmit());await p.waitForFunction(t=>document.querySelector('#auto-value-output')?._study?.fundamental.ticker===t&&document.querySelector('#auto-value-status').textContent.includes('saved automatically'),ticker);return p.locator('#auto-value-output').evaluate(e=>e._study);};
 try{
  await open();const initial=await inspectRecords();await p.locator('[data-quant-jump=valuation]').click();
  const a=await loadValue('AAPL'),n=await loadValue('NVDA');await p.getByText('Saved valuations · this browser',{exact:true}).click();
  await hold('.auto-valuations.');await p.locator('[data-auto-value-open="'+a.id+'"]').click();await pending();await valueInput().fill('MSFT');await release();
  check('Slow saved valuation cannot replace a newer ticker or re-enable old export',await valueInput().inputValue()==='MSFT'&&await p.locator('#auto-value-output').innerText()===''&&await p.locator('[data-auto-value-current]').isDisabled());await valueInput().fill('');
  await p.locator('[data-auto-value-open="'+a.id+'"]').click();await p.waitForFunction(id=>document.querySelector('#auto-value-output')?._study?.id===id&&document.querySelector('#auto-value-output').hasChildNodes(),a.id);
  check('Normal valuation open retains exact source and assumptions',await p.locator('#auto-value-output').evaluate((e,a)=>JSON.stringify(e._study)===JSON.stringify(a),a));
  await p.locator('.auto-value-assumptions summary').click();await p.locator('#auto-value-form [name=requiredReturn]').fill('13');await p.waitForFunction(()=>document.querySelector('#auto-value-output')?._study?.settings.requiredReturn===.13&&document.querySelector('#auto-value-status').textContent.includes('saved automatically'));
  check('Editing a reopened study recalculates the correct issuer',await p.locator('#auto-value-output').evaluate(e=>e._study.fundamental.ticker==='AAPL'&&e._study.settings.requiredReturn===.13));
  await hold('.auto-valuations.');await p.locator('[data-auto-value-open="'+a.id+'"]').click();await pending();await p.locator('[data-auto-value-open="'+n.id+'"]').click();await pending(2);await release(1);
  await p.waitForFunction(id=>document.querySelector('#auto-value-output')?._study?.id===id,n.id);await release();
  check('Out-of-order archive responses retain the most recently selected study',await p.locator('#auto-value-output').evaluate((e,id)=>e._study.id===id,n.id));
  await hold('.auto-valuations.',true);await p.locator('[data-auto-value-open="'+a.id+'"]').click();await pending();await valueInput().fill('MSFT');await release();
  check('Obsolete valuation errors cannot replace the latest ticker status',await valueInput().inputValue()==='MSFT'&&!await p.locator('#auto-value-status').innerText().then(s=>s.includes('TEST ONLY archive read failure')));await valueInput().fill('');
  await hold('.auto-valuations.',true);await p.locator('[data-auto-value-open="'+a.id+'"]').click();await pending();await release();
  check('An active valuation archive error remains visible and recoverable',await p.locator('#auto-value-status').innerText().then(s=>s.includes('TEST ONLY archive read failure'))&&errors.length===0);
  // One completed source-backed run supplies genuine retained ticker/advanced archives.
  await input().fill('AAPL');await p.locator('#ticker-form').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>document.querySelector('#advanced-status')?.textContent.includes('saved on this browser'),null,{timeout:120000});
  const ticker=await p.locator('#ticker-output').evaluate(e=>e._study),advanced=await p.locator('#advanced-output').evaluate(e=>e._study);
  const beforeRuns=await p.evaluate(async()=>await(await import('./office-storage.js')).api('runs')).then(r=>r.length);
  await p.locator('[data-quant-jump=tickers]').click();await hold('.ticker-studies.');await p.locator('[data-ticker-open="'+ticker.id+'"]').click();await pending();await input().fill('MSFT');await release();
  check('Slow saved ticker cannot replace new input or stale research evidence',await input().inputValue()==='MSFT'&&await p.locator('#ticker-output').innerText()===''&&await p.locator('#quant-results').evaluate(e=>e.hidden));await input().fill('');
  await p.locator('[data-ticker-open="'+ticker.id+'"]').click();await p.waitForFunction(id=>document.querySelector('#ticker-output')?._study?.id===id&&document.querySelector('#ticker-output').hasChildNodes(),ticker.id);
  check('Normal ticker open preserves the exact retained source',await p.locator('#ticker-output').evaluate((e,t)=>JSON.stringify(e._study)===JSON.stringify(t),ticker));
  check('Opening retained ticker does not start a new model',await p.evaluate(async()=>await(await import('./office-storage.js')).api('runs')).then(r=>r.length)===beforeRuns);
  await hold('.ticker-studies.',true);await p.locator('[data-ticker-open="'+ticker.id+'"]').click();await pending();await input().fill('MSFT');await release();
  check('Obsolete ticker archive errors cannot replace a later selection status',await input().inputValue()==='MSFT'&&!await p.locator('#ticker-status').innerText().then(s=>s.includes('TEST ONLY archive read failure')));await input().fill('');
  await p.locator('[data-quant-jump=advanced]').click();await hold('.advanced.');await p.locator('[data-advanced-open="'+advanced.id+'"]').click();await pending();await input().fill('MSFT');await release();
  check('Slow saved model cannot unhide old models after the ticker changes',await input().inputValue()==='MSFT'&&await p.locator('#quant-results').evaluate(e=>e.hidden));await input().fill('');
  await p.locator('[data-advanced-open="'+advanced.id+'"]').click();await p.waitForFunction(id=>document.querySelector('#advanced-output')?._study?.id===id&&!document.querySelector('#quant-results').hidden,advanced.id);
  check('Normal saved advanced open preserves original fitted results',await p.locator('#advanced-output').evaluate((e,s)=>JSON.stringify(e._study)===JSON.stringify(s),advanced));
  await hold('.advanced.',true);await p.locator('[data-advanced-open="'+advanced.id+'"]').click();await pending();await input().fill('MSFT');await release();
  check('Obsolete advanced archive errors cannot replace the active research state',await input().inputValue()==='MSFT'&&await p.locator('#quant-results').evaluate(e=>e.hidden)&&!await p.locator('#advanced-archive-status').innerText().then(s=>s.includes('TEST ONLY archive read failure')));await input().fill('');
  // Import writes remain intentional; stale UI completion must not select the import.
  const holdFile=async name=>p.evaluate(name=>{window.__researchFileName=name;window.__releaseResearchFile=null;if(window.__originalResearchFileText)return;window.__originalResearchFileText=File.prototype.text;File.prototype.text=function(){if(this.name!==window.__researchFileName)return window.__originalResearchFileText.call(this);return new Promise((resolve,reject)=>window.__releaseResearchFile=()=>window.__originalResearchFileText.call(this).then(resolve,reject));};},name);
  await p.locator('[data-quant-jump=valuation]').click();const importedValue=structuredClone(a);importedValue.id=await p.evaluate(()=>crypto.randomUUID());importedValue.createdAt=new Date().toISOString();await holdFile('TEST-ONLY-value.json');await p.locator('[data-auto-value-restore]').setInputFiles({name:'TEST-ONLY-value.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'longhand-auto-valuation-backup',version:1,studies:[importedValue]}))});await p.waitForFunction(()=>!!window.__releaseResearchFile);await valueInput().fill('MSFT');await p.evaluate(()=>window.__releaseResearchFile());await p.waitForFunction(async id=>(await(await import('./auto-valuation-ui.js')).savedAutoValuations()).some(s=>s.id===id),importedValue.id);await p.waitForTimeout(100);
  check('Valuation import persists without overriding a later ticker choice',await valueInput().inputValue()==='MSFT'&&await p.locator('#auto-value-output').innerText()==='');await valueInput().fill('');
  await p.locator('[data-quant-jump=tickers]').click();const importedTicker=structuredClone(ticker);importedTicker.id=await p.evaluate(()=>crypto.randomUUID());importedTicker.savedAt=new Date().toISOString();await holdFile('TEST-ONLY-ticker.json');await p.locator('[data-ticker-restore]').setInputFiles({name:'TEST-ONLY-ticker.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'longhand-ticker-backup',version:1,studies:[importedTicker]}))});await p.waitForFunction(()=>!!window.__releaseResearchFile);await input().fill('MSFT');await p.evaluate(()=>window.__releaseResearchFile());await p.waitForFunction(async id=>(await(await import('./ticker-storage.js')).listTickerStudies()).some(s=>s.id===id),importedTicker.id);await p.waitForTimeout(100);
  check('Ticker import persists without replacing a later ticker or model state',await input().inputValue()==='MSFT'&&await p.locator('#ticker-output').innerText()===''&&await p.locator('#quant-results').evaluate(e=>e.hidden));await input().fill('');
  await p.locator('[data-quant-jump=calculator]').click();await p.locator('[data-atlas-example]').click();await p.locator('#atlas-form').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>document.querySelectorAll('[data-manual-open]').length>0);await p.locator('#manual-archive').evaluate(e=>e.parentElement.open=true);
  await hold('continuity');await p.locator('[data-manual-open]').first().click();await pending();await p.locator('#atlas-form [name=asset]').fill('TEST ONLY keep my newer draft');await release();
  check('Slow manual archive cannot replace a newer calculator draft',await p.locator('#atlas-form [name=asset]').inputValue()==='TEST ONLY keep my newer draft');
  await p.locator('[data-manual-open]').first().click();await p.waitForFunction(()=>document.querySelector('#atlas-form [name=asset]').value!=='TEST ONLY keep my newer draft');check('Normal manual archive open still recomputes its saved calculation',await p.locator('#atlas-output').innerText().then(s=>s.length>0));
  await hold('continuity');await p.locator('[data-manual-open]').first().click();await pending();await p.locator('header nav a[href="#portfolios"]').click();await p.locator('#manual-archive').waitFor({state:'detached'});await release();
  check('Leaving Quant during manual archive read causes no callback exception or navigation reversal',errors.length===0&&p.url().endsWith('#portfolios'));
  await open();await p.locator('#manual-archive').evaluate(e=>e.parentElement.open=true);await p.evaluate(()=>{const original=IDBObjectStore.prototype.getAll;IDBObjectStore.prototype.getAll=function(...args){const req=original.apply(this,args);if(this.transaction.mode!=='readonly'||!this.transaction.db.name.includes('continuity'))return req;const fake={};req.onsuccess=()=>{fake.error=new DOMException('TEST ONLY archive read failure','UnknownError');fake.onerror?.();};return fake;};});await p.locator('[data-manual-open]').first().click();await p.waitForFunction(()=>document.querySelector('#manual-archive').textContent.includes('TEST ONLY archive read failure'));
  check('Archive read failure is caught and explained without an unhandled exception',errors.length===0&&await p.locator('#manual-archive').innerText().then(s=>s.includes('could not be opened')));await p.reload();await p.locator('[data-desk-mode=advanced]').click();
  for(const width of[1440,768,390,320]){await p.setViewportSize({width,height:1000});check('Research desk and archives fit '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  check('Ordinary Office records remain unchanged',JSON.stringify(await inspectRecords())===JSON.stringify(initial));check('Reduced motion and error-free interactions remain intact',await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)&&errors.length===0);
  return {checks,errors};
 }catch(error){return {checks,errors,error:String(error),url:p.url(),status:await p.locator('#ticker-status,#auto-value-status,#advanced-status,#manual-archive').allTextContents()};}finally{await c.close();}
}
