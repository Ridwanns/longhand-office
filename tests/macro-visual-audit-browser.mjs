// Run only in a fresh context: public observations and explicitly synthetic storage.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const context=await original.context().browser().newContext({viewport:{width:1440,height:1000},colorScheme:'dark',reducedMotion:'reduce',hasTouch:true});
 const page=await context.newPage(),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.locator('#macro-context[data-ready=true]').waitFor();
 const check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
 try{
  await page.goto(base+'#market/macro/us/economy');await ready();
  const key='TEST-ONLY-macro-visual-preservation',seed=JSON.stringify({testOnly:true,transactions:[{symbol:'TEST',quantity:3,price:11,fee:1}]});
  await page.evaluate(({key,seed})=>localStorage.setItem(key,seed),{key,seed});
  const before=await page.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroFeed,e._macroContext,e._macroReleases,e._macroExtended]);});
  check('Sources are absent from the working page',await page.locator('.monitor-provenance').count()===0&&await page.locator('.monitor-readings a').count()===0);
  check('Evidence is secondary while its original route remains available',!await page.locator('[data-macro-destination=sources]').isVisible()&&await page.locator('[data-macro-destination=sources]').getAttribute('href').then(v=>v.endsWith('/us/sources')));
  await page.locator('.macro-evidence-menu>summary').focus();await page.keyboard.press('Enter');await page.locator('[data-macro-destination=sources]').focus();await page.keyboard.press('Enter');await ready();
  check('Keyboard opens exact source identities',await page.locator('.context-source').count()>0);
  await page.goBack();await ready();
  const economies=await page.locator('#macro-country option').evaluateAll(ns=>ns.map(e=>e.value));
  for(const id of economies){
   await page.locator('#macro-country').selectOption(id);
   check(id+' renders a compact country focus without an exposed source ledger',await page.locator('.focus-group .pulse-card').count()<=6&&await page.locator('.focus-disclosure').innerText().then(t=>t.includes('not verified provider ratings'))&&await page.locator('.context-source:visible').count()===0);
   check(id+' has finite, dated chart observations where connected',await page.locator('.monitor-history [data-macro-chart]').evaluateAll(ns=>ns.every(e=>JSON.parse(e.dataset.macroPoints).every(([date,value])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&(value===null||Number.isFinite(value))))));
  }
  await page.locator('#macro-country').selectOption('USA');
  await page.locator('.monitor-source-histories>summary').click();
  const chart=page.locator('[data-monitor-history=inflation]'),surface=chart.locator('[data-macro-surface]');
  const rows=await chart.locator('[data-macro-chart]').getAttribute('data-macro-points').then(JSON.parse);
  await surface.focus();await surface.press('Home');
  check('Keyboard inspects the actual first observation in a persistent readout',await chart.locator('[data-macro-inspect]').inputValue()==='0'&&await chart.locator('[data-macro-reading]').innerText().then(t=>t.includes(new Intl.NumberFormat('en-GB',{maximumFractionDigits:2,minimumFractionDigits:1}).format(rows[0][1]))));
  check('Compact charts show inspection above the plot without an obscuring popup',!await chart.locator('[data-macro-tooltip]').isVisible());
  await surface.press('End');await chart.locator('[data-macro-latest]').click();
  check('Latest returns to the exact last source index',await chart.locator('[data-macro-inspect]').inputValue()===String(rows.length-1));
  const latestPoint=await chart.locator('[data-macro-point]').evaluate(e=>{const p=new DOMPoint(Number(e.getAttribute('cx')),Number(e.getAttribute('cy'))).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};});
  await surface.focus();await surface.press('Home');await page.touchscreen.tap(latestPoint.x,latestPoint.y);
  check('Touching the plotted endpoint selects the actual latest observation',await chart.locator('[data-macro-inspect]').inputValue()===String(rows.length-1));
  check('Source arrays remain unchanged after all economy and chart interactions',await page.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroFeed,e._macroContext,e._macroReleases,e._macroExtended]);})===before);
  await page.goto(base+'#market/macro/global/overview/FRA');await ready();await page.locator('#macro-atlas[data-context-ready=true]').waitFor();
  check('France locator sits on mainland France rather than its offshore bounding-box centre',await page.locator('.atlas-selection-core').evaluate(e=>Math.abs(Number(e.getAttribute('cx'))-507.09)<.01&&Math.abs(Number(e.getAttribute('cy'))-120.289)<.01));
  check('Map has crisp outlines without blur or glow',await page.locator('.atlas-country.atlas-selected').evaluate(e=>getComputedStyle(e).filter==='none'));
  await page.locator('[data-atlas-zoom=focus]').click();
  check('Focus zoom centres the selected mainland locator',await page.locator('[data-atlas-geography]').getAttribute('transform').then(t=>t.includes('scale(2.5)')&&!t.includes('NaN')));
  await page.locator('[data-atlas-zoom=reset]').click();
  for(const metric of ['gdp','cpi','policy','yield']){
   await page.locator('[data-atlas-indicator='+metric+']').click();
   check(metric+' map selection keeps its source reading and country',await page.locator('[data-atlas-indicator='+metric+']').getAttribute('aria-pressed')==='true'&&await page.locator('#atlas-country').inputValue()==='FRA');
  }
  await page.locator('[data-atlas-indicator=gdp]').click();
  await page.locator('[data-atlas-expand]').click();await page.keyboard.press('Escape');
  check('Expanded map closes with Escape and restores focus',await page.locator('.atlas-theater').count()===0&&await page.locator('[data-atlas-expand]').evaluate(e=>document.activeElement===e));
  await page.locator('.macro-evidence-menu>summary').focus();await page.keyboard.press('Enter');await page.locator('[data-macro-destination=sources]').click();await ready();
  check('Original source deep link works through secondary navigation',page.url().endsWith('/global/sources/FRA')&&await page.locator('.context-source').count()>0);
  await page.goBack();await ready();check('Back preserves the country and overview route',page.url().endsWith('/global/overview/FRA')&&await page.locator('#macro-country').inputValue()==='FRA');
  await page.goForward();await ready();await page.reload();await ready();
  check('Forward and refresh preserve the source route',page.url().endsWith('/global/sources/FRA'));
  for(const theme of ['light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
   for(const view of ['overview','economy','rates','markets','sources']){
    await page.goto(base+'#market/macro/us/'+view);await ready();
    for(const width of [1440,768,390,320]){
     await page.setViewportSize({width,height:1000});await page.waitForTimeout(180);
     check(theme+' '+view+' fits '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     check(theme+' '+view+' has no oversized native chart labels at '+width,await page.locator('[data-macro-chart]:visible svg text').evaluateAll(ns=>ns.every(e=>{const size=parseFloat(getComputedStyle(e).fontSize)*Math.abs(e.getScreenCTM().a);return size>=10&&size<=16;})));
    }
   }
  }
  check('Reduced motion has no running animations',await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&document.getAnimations().every(e=>e.playState!=='running')));
  check('Synthetic storage bytes survive all routes and reloads',await page.evaluate(key=>localStorage.getItem(key),key)===seed);
  check('No uncaught browser exceptions',errors.length===0);
  return {checks,errors};
 }finally{await context.close();}
}
