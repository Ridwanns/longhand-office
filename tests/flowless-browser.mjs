const key='longhand-office.v1',previewKey=key+'.flowless-preview',origin='http://127.0.0.1:4174',out='C:/Users/user/OneDrive/Documents/Longhand Office/validation';
export async function run(original){
 const originalBefore=await original.evaluate(k=>localStorage.getItem(k),key);
 const browser=original.context().browser(),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',hasTouch:true}),target=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage(),restore=await target.newPage(),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));restore.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error('Assertion failed: '+name);checks.push({check:name,passed:true});};
 const state=(p,k=previewKey)=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),k);
 const saved=()=>page.getByRole('button',{name:'Save Flowless closing price',exact:true});
 async function open(){await page.getByRole('button',{name:'Fetch IDX close',exact:true}).click();}
 async function read(){await page.getByRole('button',{name:'Read Flowless price',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#read-flowless').disabled);}
 try{
  await page.goto(origin+'/?preview=flowless#portfolio/flowless-demo-portfolio');await page.locator('#manual-valuation').waitFor();
  const baseline=await state(page);check('Test preview is labelled and ordinary key remains empty',baseline.portfolios[0].name.includes('TEST ONLY')&&await page.evaluate(k=>localStorage.getItem(k)===null,key));
  check('No imported price is invented in the preview',!(baseline.portfolios[0].valuations||[]).length&&await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable');
  await open();check('Save disabled until source is read',await saved().isDisabled());await page.getByLabel('Closing price on or before').fill('2026-10-12');await read();
  const observation=await page.locator('#flowless-observation').innerText();check('Actual local read shows closing price and source date',observation.includes('5,950 IDR')&&observation.includes('12 Oct 2026')&&observation.includes('Not a live quote'));
  await page.locator('dialog').screenshot({path:out+'/flowless-source-dialog.png'});
  await saved().click();await page.locator('dialog').waitFor({state:'hidden'});
  const after=await state(page),q=after.portfolios[0].valuations[0];
  check('Source provenance retained',q.origin==='flowless'&&q.price===5950&&q.date==='2026-10-12'&&q.currency==='IDR'&&q.priceKind==='daily-close'&&q.sourceSymbol==='BBCA'&&!Number.isNaN(Date.parse(q.retrievedAt)));
  const unpriced=structuredClone(after);delete unpriced.portfolios[0].valuations;const baselineUnpriced=structuredClone(baseline);delete baselineUnpriced.portfolios[0].valuations;
  check('Transactions and linked records unchanged',JSON.stringify(unpriced)===JSON.stringify(baselineUnpriced));
  check('Total matches independent arithmetic',await page.locator('[data-value=portfolio-value]').innerText()==='1,039,500 IDR');
  const row=await page.locator('#manual-valuation tbody tr').first().innerText();check('Market value, remaining cost and unrealized P/L match independent arithmetic',row.includes('595,000 IDR')&&row.includes('555,500 IDR')&&row.includes('39,500 IDR'));
  check('Position weight uses value including recorded cash',Math.abs(parseFloat(await page.locator('[data-value=concentration]').innerText())-595000/1039500*100)<0.000001);
  await page.reload();await page.locator('#manual-valuation').waitFor();check('Imported price and all records persist on reload',JSON.stringify(await state(page))===JSON.stringify(after));
  await open();await page.getByLabel('Closing price on or before').fill('2026-10-11');await read();const historical=await page.locator('#flowless-observation').innerText();
  check('Historical request uses preceding session without look-ahead',historical.includes('6,050 IDR')&&historical.includes('9 Oct 2026'));
  await page.getByLabel('Closing price on or before').fill('2026-10-10');await page.getByLabel('Closing price on or before').dispatchEvent('change');check('Date change invalidates earlier fetched candidate',await saved().isDisabled());await page.keyboard.press('Escape');
  check('Cancel does not append a price',JSON.stringify(await state(page))===JSON.stringify(after));
  await page.route('**/api/market/flowless/price?**',route=>route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'TEST ONLY — simulated source outage'})}));
  await open();await read();check('Source failure is visible and cannot be saved',await saved().isDisabled()&&(await page.locator('#flowless-observation').innerText()).includes('simulated source outage'));await page.keyboard.press('Escape');await page.unroute('**/api/market/flowless/price?**');
  check('Source failure preserves saved records',JSON.stringify(await state(page))===JSON.stringify(after));
  await page.goto(origin+'/?preview=flowless#records');await page.getByRole('button',{name:'Export records ↓',exact:true}).waitFor();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export records ↓',exact:true}).click()]);await download.saveAs(out+'/TEST-ONLY-flowless-backup.json');
  await restore.goto(origin+'/#records');await restore.locator('main h1').waitFor();check('Restoration target is a fresh isolated environment',await restore.evaluate(k=>localStorage.getItem(k)===null,key));
  await restore.getByRole('button',{name:'Restore from backup'}).click();await restore.getByLabel('Backup file').setInputFiles(out+'/TEST-ONLY-flowless-backup.json');await restore.locator('#restore-summary').filter({hasText:'Validated:'}).waitFor();
  const exported=JSON.parse(await restore.getByLabel('Backup file').evaluate(e=>e.files[0].text()));check('Export contains all records and source metadata',JSON.stringify(exported)===JSON.stringify(after));
  await restore.getByRole('checkbox').check();await restore.getByRole('button',{name:'Replace records',exact:true}).click();await restore.locator('dialog').waitFor({state:'hidden'});await restore.reload();await restore.locator('main h1').waitFor();check('Isolated restore persists field-for-field',JSON.stringify(await state(restore,key))===JSON.stringify(after));
  await page.goto(origin+'/?preview=flowless#portfolio/flowless-demo-portfolio');await page.locator('#manual-valuation').waitFor();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});check('No page overflow at '+width+'px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.locator('#manual-valuation').screenshot({path:out+'/flowless-valuation-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('#manual-valuation').screenshot({path:out+'/flowless-valuation-mobile.png'});
  const table=page.getByRole('region',{name:'Manual valuation table; scroll horizontally on small screens'});await table.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);check('Table accessible by keyboard on mobile',await table.evaluate(e=>e.scrollLeft>0));
  await page.getByRole('button',{name:'Fetch IDX close',exact:true}).tap();check('Source dialog opens by touch and fits mobile',await page.locator('dialog').evaluate(e=>e.open&&e.scrollWidth<=e.clientWidth));
  await page.locator('dialog [type=button]').last().focus();await page.keyboard.press('Tab');check('Keyboard focus stays inside editor',await page.evaluate(()=>!!document.activeElement.closest('dialog')));await page.getByRole('button',{name:'Cancel',exact:true}).tap();
  await page.goto(origin+'/?preview=flowless#overview');await page.locator('.architecture').waitFor();check('Reduced motion respected in retained architecture',await page.locator('.architecture').evaluate(e=>getComputedStyle(e).animationName)==='none');
  check('No uncaught errors',errors.length===0);check('Ordinary workspace records unchanged',originalBefore===await original.evaluate(k=>localStorage.getItem(k),key));
  return {date:'2026-10-12',checks,errors,originalRecordsUnchanged:true,source:{symbol:'BBCA',date:q.date,price:q.price,kind:q.priceKind},reference:{cash:444500,remainingCost:555500,marketValue:595000,unrealized:39500,total:1039500},preview:origin+'/?preview=flowless#portfolio/flowless-demo-portfolio'};
 }finally{await context.close();await target.close();}
}
