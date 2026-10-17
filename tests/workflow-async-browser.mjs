// Delay real archive responses in a fresh context to exercise navigation races.
export async function run(original,base='http://127.0.0.1:4174/'){
 const c=await original.context().browser().newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 try{
  await p.addInitScript(()=>{
   for(const method of ['getAll','get']){const native=IDBObjectStore.prototype[method];IDBObjectStore.prototype[method]=function(...args){const r=native.apply(this,args),ticker=method==='getAll'&&this.transaction.db.name.includes('.ticker-studies.')&&window.TEST_ONLY_PAUSE_TICKER,core=method==='get'&&this.name==='jobs'&&args[0]===window.TEST_ONLY_CORE_ID;if(ticker||core){Object.defineProperty(r,'onsuccess',{configurable:true,set(handler){r.addEventListener('success',event=>{const key=ticker?'TEST_ONLY_TICKER_RELEASE':'TEST_ONLY_CORE_RELEASE';(window[key]??=[]).push(()=>handler.call(r,event));},{once:true});}});}return r;};}
  });
  await p.route('https://s.tradingview.com/**',r=>r.fulfill({contentType:'text/html',body:'<p>TEST ONLY chart</p>'}));
  await p.goto(base+'#quant');await p.locator('#automatic-ticker').fill('NVDA');await p.locator('#ticker-form').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>document.querySelector('#quant-run')?._run?.status==='completed'&&document.querySelector('[data-summary-body]')?._brief?.instrument.ticker==='NVDA'&&document.querySelector('#advanced-status')?.textContent.includes('saved on this browser'),null,{timeout:120000});
  const run=await p.locator('#quant-run').evaluate(e=>JSON.parse(JSON.stringify(e._run)));
  await p.goto(base+'#library');await p.evaluate(()=>window.TEST_ONLY_PAUSE_TICKER=true);await p.goto(base+'#quant');await p.waitForFunction(()=>window.TEST_ONLY_TICKER_RELEASE?.length>0);await p.locator('#automatic-ticker').fill('MSFT');await p.evaluate(()=>{window.TEST_ONLY_PAUSE_TICKER=false;for(const release of window.TEST_ONLY_TICKER_RELEASE)release();});await p.locator('#ticker-archive [data-ticker-open]').first().waitFor({state:'attached'});
  await p.locator('#automatic-tickers option').first().waitFor({state:'attached'});check('Guarded archive recovery still loads the instrument suggestion directory',await p.locator('#automatic-tickers option').count()>0);
  check('Delayed archive recovery cannot append its old ticker to focused input',await p.locator('#automatic-ticker').inputValue()==='MSFT');check('Delayed old source study cannot replace a newly entered instrument',await p.locator('#ticker-output').evaluate(e=>!e.hasChildNodes()));await p.locator('#automatic-ticker').fill('');
  await p.locator('a[data-lab-view=saved]').click();await p.locator('#research-saved-kind').selectOption('core');const button=p.locator('[data-lab-use-kind=core][data-lab-use-id="'+run.id+'"]');await button.waitFor();
  let release,held=false;
  if(base.includes('4174')){const gate=new Promise(resolve=>release=resolve);await p.route('**/api/local/run/'+run.id,async route=>{const response=await route.fetch();held=true;await gate;await route.fulfill({response});});}
  else await p.evaluate(id=>window.TEST_ONLY_CORE_ID=id,run.id);
  await button.click();if(base.includes('4174')){for(let i=0;i<100&&!held;i++)await p.waitForTimeout(20);check('Core evidence response was deliberately held',held);}else{await p.waitForFunction(()=>window.TEST_ONLY_CORE_RELEASE?.length>0);check('Core evidence response was deliberately held',true);}
  await p.locator('#research-saved-query').fill('TEST ONLY newer navigation intent');
  if(base.includes('4174')){release();await p.unroute('**/api/local/run/'+run.id);}else await p.evaluate(()=>{window.TEST_ONLY_CORE_ID=null;for(const fn of window.TEST_ONLY_CORE_RELEASE)fn();});
  await p.waitForTimeout(250);check('Late evidence response does not open an editor after newer user input',await p.locator('#editor').isHidden());check('Newer saved-research input remains intact',await p.locator('#research-saved-query').inputValue()==='TEST ONLY newer navigation intent');check('No browser JavaScript errors',errors.length===0);return {checks,errors};
 }catch(e){throw Error(e.message+'; last passed: '+checks.at(-1)?.name);}finally{await c.close();}
}
