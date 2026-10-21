export async function run(original,base='http://127.0.0.1:4175/office/'){
 const browser=original.context().browser(),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await context.newPage(),checks=[],errors=[];
 p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 try{
  for(const market of ['us','idx']){
   await p.goto(base+'#market/'+market);await p.locator('#market-detail .detail-price').waitFor();await p.locator('.market-chart-desk[data-source=snapshot]').waitFor();
   const before=await p.locator('#market-detail').evaluate(e=>[e.querySelector('.detail-price').textContent,e.querySelector('.detail-change').textContent,e.querySelector('.data-state-detail').textContent]);
   check(market+' has one in-page data control and no duplicate provenance disclosure',await p.locator('[data-chart-info]:visible').count()===1&&await p.locator('#market-detail .market-quote-details').count()===0&&await p.locator('.market-chart-info .market-quote-details').count()===1);
   check(market+' primary price retains its date without full provenance prose',before[0].length>0&&before[2].length>0&&!await p.locator('#market-detail').innerText().then(t=>t.includes('Real-time is unverified')));
   check(market+' no duplicate publication banner or public local-source detour',await p.locator('.browser-notice,.msn-local-note').count()===0&&!await p.locator('.market-chart-availability').innerText().then(t=>t.includes('Source closes, not total return')));
   const url=p.url();await p.locator('[data-chart-info]').focus();await p.keyboard.press('Enter');
   check(market+' details open on the same page without a new tab',await p.locator('.market-chart-info').evaluate(e=>e.open)&&p.url()===url&&context.pages().length===1);
   await p.locator('.market-quote-details>summary').click();
   check(market+' exact quote timing and quality remain inspectable',await p.locator('.market-quote-details .market-provenance dd').count()===2&&await p.locator('[data-chart-acquisition]').textContent().then(t=>t.includes('Acquired')));
   await p.keyboard.press('Escape');
   check(market+' Escape restores focus and source values are unchanged',await p.locator('[data-chart-info]').evaluate(e=>document.activeElement===e)&&JSON.stringify(before)===JSON.stringify(await p.locator('#market-detail').evaluate(e=>[e.querySelector('.detail-price').textContent,e.querySelector('.detail-change').textContent,e.querySelector('.data-state-detail').textContent])));
   for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(160);check(market+' fits '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  }
  await p.setViewportSize({width:1440,height:1000});await p.goto(base+'#market/macro/id/economy');await p.locator('.macro-scorecard').waitFor();
  const source=()=>p.locator('#macro-content').evaluate(e=>JSON.stringify([e._macroContext,e._macroReleases,e._macroExtended,e._macroFeed,e._macroIndicators]));const before=await source();
  check('Macro has one data control and no per-card source buttons or navigation arrows',await p.locator('.reading-details-button:visible').count()===1&&await p.locator('.pulse-card .pulse-detail,.pulse-card .pulse-source-name').count()===0&&await p.locator('.focus-group [data-scorecard-indicator]').allTextContents().then(t=>t.every(x=>!x.includes('↗'))));
  check('Macro keeps dates, six focus readings and concise earlier-quarter status',await p.locator('.focus-group .pulse-card:visible').count()===6&&await p.locator('.quarterly-regime').innerText().then(t=>!t.includes('An older common quarter is shown'))&&!await p.locator('.context-vintage').isVisible());
  const url=p.url();await p.locator('.reading-details-button').focus();await p.keyboard.press('Enter');
  check('Long macro explanation is available in place rather than deleted',await p.locator('.reading-details-dialog').innerText().then(t=>t.includes('Latest connected releases')&&t.includes('not verified provider ratings'))&&p.url()===url);
  await p.locator('[data-reading-indicator=inflation]>summary').click();
  check('Each relocated indicator detail preserves its identity and source',await p.locator('[data-reading-indicator=inflation]').innerText().then(t=>t.includes('Consumer price inflation')&&t.includes('BPS')));
  await p.keyboard.press('Escape');check('Opening evidence never mutates acquired macro snapshots',await source()===before);
  await p.locator('[data-scorecard-search]').fill('core consumer');check('Indicator search still works after source details move',await p.locator('.pulse-card:visible').count()===1);await p.locator('[data-scorecard-search]').fill('');
  for(const width of [390,320,1440]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(180);check('Macro remains contained at '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.goto(base+'#quant/view/valuation');await p.locator('#auto-value-ticker').fill('AAPL');await p.locator('#auto-value-form').evaluate(e=>e.requestSubmit());await p.waitForFunction(()=>document.querySelector('#auto-value-status')?.textContent.includes('saved automatically'),null,{timeout:60000});
  const study=await p.locator('#auto-value-output').evaluate(e=>JSON.stringify(e._study));
  check('Valuation main results keep assumptions and price date without source prose',await p.locator('.valuation-reading-summary').innerText().then(t=>t.includes('Assumption-based')&&t.includes('price'))&&await p.locator('#auto-value-output>.reading-details-button').count()===1&&!await p.locator('#auto-value-output').innerText().then(t=>t.includes('Retained calculation')));
  await p.locator('#auto-value-output>.reading-details-button').click();
  check('Valuation retains original dates, formula explanation and export inputs inside the page',await p.locator('#auto-value-output .reading-details-dialog').innerText().then(t=>t.includes('Retained calculation')&&t.includes('not an independently estimated fair price')&&t.includes('Source values & calculation inputs')));
  await p.keyboard.press('Escape');check('Disclosure does not change saved valuation or recompute assumptions',study===await p.locator('#auto-value-output').evaluate(e=>JSON.stringify(e._study)));
  await p.locator('#auto-value-form [name=requiredReturn]').evaluate(e=>{e.closest('details').open=true;});await p.locator('#auto-value-form [name=requiredReturn]').fill('13');await p.waitForFunction(()=>document.querySelector('#auto-value-output')?._study?.settings.requiredReturn===.13);
  check('Recalculation replaces the details panel without duplicates',await p.locator('#auto-value-output>.reading-details-button').count()===1&&await p.locator('#auto-value-output>.reading-details-dialog').count()===1);
  await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/reading-cleanup-valuation.png',fullPage:false});
  await p.goto(base+'#data-sources');await p.locator('.data-coverage-desk').waitFor();check('Full source directory remains available within the app',await p.locator('.data-coverage-desk').isVisible()&&context.pages().length===1);
  check('No browser errors',errors.length===0);return {checks,errors};
 }finally{await context.close();}
}
