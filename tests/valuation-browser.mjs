const key='longhand-office.v1',origin='http://127.0.0.1:4174',out='C:/Users/user/OneDrive/Documents/Longhand Office/validation';
export async function run(original){
 const originalBefore=await original.evaluate(k=>localStorage.getItem(k),key);
 const browser=original.context().browser();
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',hasTouch:true});
 const target=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage(),restore=await target.newPage(),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));restore.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok=true)=>{if(!ok)throw Error('Assertion failed: '+name);checks.push({check:name,passed:true});};
 const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 async function restorePayload(p,payload,name){await p.getByRole('button',{name:'Restore from backup'}).click();await p.getByLabel('Backup file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await p.locator('#restore-summary').filter({hasText:'Validated:'}).waitFor();await p.getByRole('checkbox').check();await p.getByRole('button',{name:'Replace records',exact:true}).click();await p.locator('dialog').waitFor({state:'hidden'});}
 async function assess(date){await page.locator('#valuation-asof').fill(date);await page.locator('#valuation-asof').dispatchEvent('change');}
 async function supplied(symbol,price,currency,date,source){await page.getByRole('button',{name:'Supply price for '+symbol}).click();check('Instrument preselected for '+symbol,await page.getByLabel('Valuation instrument').inputValue()===symbol);await page.getByLabel('User-supplied price per unit').fill(String(price));await page.getByLabel('Price currency',{exact:true}).fill(currency);await page.getByLabel('Valuation price date').fill(date);await page.getByLabel('Source (optional; text or URL)').fill(source);await page.getByRole('button',{name:'Save supplied price',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});}
 try{
  await page.goto(origin+'/#records');await page.locator('main h1').waitFor();
  check('Source test context has no existing records',await page.evaluate(k=>localStorage.getItem(k)===null,key));
  const sample=await page.evaluate(()=>fetch('valuation-example.json').then(r=>r.json()));delete sample.portfolios[0].valuations;
  await restorePayload(page,sample,'TEST-ONLY-legacy-no-prices.json');
  const baseline=JSON.stringify(sample);
  await page.goto(origin+'/#portfolio/valuation-demo-portfolio');await page.locator('#manual-valuation').waitFor();
  await assess('2026-10-12');
  check('No prices yields unavailable total and two missing flags',await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable'&&await page.locator('.price-status.missing').count()===2);
  await supplied('ALPHA',130,'USD','2026-10-12','TEST ONLY — manual observation, not a live quote.');
  check('One missing holding is not treated as zero',await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable'&&(await page.locator('[data-currency=USD]').innerText())==='4,263 USD');
  await page.locator('#manual-valuation').screenshot({path:out+'/valuation-missing.png'});
  await supplied('BETA',45,'USD','2026-10-12','TEST ONLY — manual observation, not a live quote.');
  check('Displayed total matches independent calculation',await page.locator('[data-value=portfolio-value]').innerText()==='5,163 USD');
  check('Largest-position weight includes known cash',await page.locator('[data-value=concentration]').innerText()==='20.143328%');
  const rowA=page.locator('#manual-valuation tbody tr').filter({has:page.getByText('ALPHA',{exact:true})}).first();
  const rowB=page.locator('#manual-valuation tbody tr').filter({has:page.getByText('BETA',{exact:true})}).first();
  check('Market values and unrealized gains/losses displayed',(await rowA.innerText()).includes('1,040 USD')&&(await rowA.innerText()).includes('232 USD')&&(await rowB.innerText()).includes('900 USD')&&(await rowB.innerText()).includes('-105 USD'));
  const after=await state(page),withoutPrices=structuredClone(after);delete withoutPrices.portfolios[0].valuations;
  check('Supplying prices preserves transactions, theses, decisions and links',JSON.stringify(withoutPrices)===baseline);
  check('Price, currency, date and source saved',after.portfolios[0].valuations.length===2&&after.portfolios[0].valuations.every(q=>q.date==='2026-10-12'&&q.currency==='USD'&&q.source.includes('TEST ONLY')));
  await page.reload();await page.locator('#manual-valuation').waitFor();await assess('2026-10-12');
  check('Reload preserves every record and valuation field',JSON.stringify(await state(page))===JSON.stringify(after));
  await page.locator('#manual-valuation').screenshot({path:out+'/valuation-summary-desktop.png'});
  await page.screenshot({path:out+'/valuation-desktop.png',fullPage:true});
  await page.goto(origin+'/#records');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export records ↓'}).click()]);await download.saveAs(out+'/TEST-ONLY-valuation-backup.json');
  await restore.goto(origin+'/#records');await restore.locator('main h1').waitFor();
  check('Restore target starts empty and isolated',await restore.evaluate(k=>localStorage.getItem(k)===null,key));
  await restore.getByRole('button',{name:'Restore from backup'}).click();await restore.getByLabel('Backup file').setInputFiles(out+'/TEST-ONLY-valuation-backup.json');await restore.locator('#restore-summary').filter({hasText:'Validated:'}).waitFor();
  const exported=JSON.parse(await restore.getByLabel('Backup file').evaluate(e=>e.files[0].text()));
  check('Export includes full history and linked records',JSON.stringify(exported)===JSON.stringify(after));
  await restore.getByRole('checkbox').check();await restore.getByRole('button',{name:'Replace records',exact:true}).click();await restore.locator('dialog').waitFor({state:'hidden'});
  check('Isolated restoration equals export field-for-field',JSON.stringify(await state(restore))===JSON.stringify(exported));await restore.reload();
  check('Restored valuation records persist after reload',JSON.stringify(await state(restore))===JSON.stringify(exported));
  await restore.getByRole('button',{name:'Restore from backup'}).click();const broken=structuredClone(exported);broken.portfolios[0].valuations[0].price=-1;
  await restore.getByLabel('Backup file').setInputFiles({name:'invalid-price.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(broken))});await restore.locator('.form-error').filter({hasText:'non-negative'}).waitFor();
  check('Invalid valuation backup rejected without replacing records',await restore.getByRole('button',{name:'Replace records',exact:true}).isDisabled()&&JSON.stringify(await state(restore))===JSON.stringify(exported));await restore.keyboard.press('Escape');
  await page.goto(origin+'/#portfolio/valuation-demo-portfolio');await assess('2026-11-12');
  check('Outdated prices flagged and complete total withheld',await page.locator('.price-status.outdated').count()===2&&await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable');
  await page.locator('#manual-valuation').screenshot({path:out+'/valuation-outdated.png'});
  await assess('2026-10-11');check('Future prices are unavailable before their valuation date',await page.locator('.price-status.future').count()===2&&await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable');await assess('2026-10-12');
  await supplied('BETA',45,'eur','2026-10-12','TEST ONLY — currency separation test, no exchange rate.');
  check('Currency entry normalized and currencies kept separate',(await state(page)).portfolios[0].valuations.at(-1).currency==='EUR'&&await page.locator('[data-currency=USD]').innerText()==='4,263 USD'&&await page.locator('[data-currency=EUR]').innerText()==='900 EUR');
  check('Mixed currencies suppress global total and concentration',await page.locator('[data-value=portfolio-value]').innerText()==='Unavailable'&&await page.locator('[data-value=concentration]').innerText()==='Unavailable');
  check('Cross-currency unrealized profit not invented',(await rowB.innerText()).includes('Currency differs'));
  await page.locator('#manual-valuation').screenshot({path:out+'/valuation-mixed.png'});
  await supplied('BETA',45,'USD','2026-10-12','TEST ONLY — return to comparable currency.');
  await page.getByRole('button',{name:'Supply price for ALPHA'}).click();await page.getByLabel('User-supplied price per unit').fill('-1');await page.getByRole('button',{name:'Save supplied price',exact:true}).click();
  check('Negative supplied price rejected by form',await page.getByLabel('User-supplied price per unit').evaluate(e=>!e.validity.valid));await page.keyboard.press('Escape');
  for(const width of [320,390,768]){await page.setViewportSize({width,height:844});check('Valuation fits '+width+'px',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.setViewportSize({width:390,height:844});await page.locator('#manual-valuation').screenshot({path:out+'/valuation-summary-mobile.png'});await page.screenshot({path:out+'/valuation-mobile.png',fullPage:true});
  const table=page.getByRole('region',{name:'Manual valuation table; scroll horizontally on small screens'});await table.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);check('Valuation table scrolls with keyboard',await table.evaluate(e=>e.scrollLeft>0));
  await page.getByRole('button',{name:'＋ Supply a price'}).tap();check('Price editor opens on touch and fits mobile',await page.locator('dialog').evaluate(e=>e.open&&e.scrollWidth<=e.clientWidth));
  await page.locator('dialog [type=submit]').focus();await page.keyboard.press('Tab');check('Price editor keeps keyboard focus inside',await page.evaluate(()=>document.activeElement.closest('dialog')!==null));await page.getByRole('button',{name:'Cancel',exact:true}).tap();
  check('Cancel does not save an extra price',(await state(page)).portfolios[0].valuations.length===4);
  await page.goto(origin+'/#overview');await page.locator('.architecture').waitFor();check('Reduced motion and architecture retained',await page.locator('.architecture').evaluate(e=>getComputedStyle(e).animationName)==='none');
  const normalTestRecords=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.goto(origin+'/?preview=valuation');await page.locator('#manual-valuation').waitFor();
  check('Working preview uses a separate storage key',await page.evaluate(({key,prior})=>localStorage.getItem(key)===prior&&localStorage.getItem(key+'.valuation-preview')!==null,{key,prior:normalTestRecords}));
  check('No uncaught browser errors',errors.length===0);
  check('Original workspace records unchanged',originalBefore===await original.evaluate(k=>localStorage.getItem(k),key));
  return {date:'2026-10-12',checks,errors,originalRecordsUnchanged:true,preview:origin+'/?preview=valuation',reference:{cash:3223,holdingsValue:1940,total:5163,unrealized:127,largestPercent:1040/5163*100}};
 }finally{await context.close();await target.close();}
}
