// Fresh isolated context and a synthetic sentinel; never use the owner's records.
export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},colorScheme:'dark',reducedMotion:'reduce',hasTouch:true}),p=await c.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
 const ready=()=>p.locator('#macro-context[data-ready=true]').waitFor();
 try{
  await p.goto('http://127.0.0.1:4175/office/#market/macro/us/rates');await ready();
  const data=await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroExtended]);});
  await p.evaluate(()=>localStorage.setItem('TEST-ONLY-rates-sentinel','TEST ONLY no personal records'));
  check('Primary Rates has one visible chart and folded source details',await p.locator('.rates-workbench [data-macro-chart]:visible').count()===1&&!await p.locator('.rates-support').isVisible());
  await p.locator('.macro-evidence-menu>summary').click();await p.locator('[data-macro-open-rate-details]').click();check('Keyboard opens original source identities and alternatives',await p.locator('.release-provenance a').isVisible()&&await p.locator('.extended-history').count()>0);await p.keyboard.press('Escape');
  await p.locator('.macro-extra-context>summary').click();const desk=p.locator('[data-chart-category=fx]');await desk.locator('[data-macro-chart]').waitFor();
  const source=await p.evaluate(async()=>{const r=await fetch('./data/fx-history.json');return r.json();});
  for(const id of ['FX_IDC:USDIDR','FX:EURUSD']){
   await desk.locator('[data-chart-instrument]').selectOption(id);await desk.locator('[data-chart-range]').selectOption('ALL');await desk.locator('[data-chart-frequency]').selectOption('daily');
   const entry=source.entries.find(e=>e.id===id);await p.waitForFunction(({id,count})=>{const d=document.querySelector('[data-chart-category=fx]');return d._fxHistory?.[0].id===id&&JSON.parse(d.querySelector('[data-macro-chart]').dataset.macroPoints).length===count;},{id,count:entry.observations.length});
   check(id+' retains every exact provider date/value',await desk.locator('[data-macro-chart]').getAttribute('data-macro-points').then(s=>JSON.stringify(JSON.parse(s).map(r=>r.slice(0,2)))===JSON.stringify(entry.observations.map(o=>[o.date,o.value]))));
   check(id+' labels source direction explicitly',await desk.locator('[data-macro-chart]').getAttribute('data-macro-unit')===entry.unit);
   for(const range of ['1Y','5Y','10Y','ALL']){await desk.locator('[data-chart-range]').selectOption(range);for(const frequency of ['daily','weekly','monthly']){await desk.locator('[data-chart-frequency]').selectOption(frequency);check(id+' '+range+' '+frequency+' never fabricates an observation',await desk.locator('[data-macro-chart]').getAttribute('data-macro-points').then(s=>JSON.parse(s).every(([date,value])=>entry.observations.some(o=>o.date===date&&o.value===value))));}}
   const surface=desk.locator('[data-macro-surface]');await surface.focus();await surface.press('Home');check(id+' keyboard selects first source index',await desk.locator('[data-macro-inspect]').inputValue()==='0');await surface.press('End');check(id+' keyboard selects last source index',await desk.locator('[data-macro-inspect]').evaluate(e=>e.value===e.max));
  }
  for(const theme of ['light','dark']){
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme-toggle').click();
   for(const width of [1440,1024,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(220);check(theme+' expanded FX/curve fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(theme+' FX labels stay 10–16 pixels at '+width,await desk.locator('svg text').evaluateAll(ns=>ns.length>0&&ns.every(e=>{const size=parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a;return size>=10&&size<=16;})));}
  }
  await p.locator('[data-rates-pane=currency]').focus();await p.keyboard.press('End');await p.locator('[data-rates-panel=treasury] .treasury-curve svg').waitFor();
  check('Keyboard switches to the actual Treasury curve without stacking the FX workspace',await desk.isVisible()===false&&await p.locator('[data-rates-pane=treasury]').getAttribute('aria-selected')==='true');
  for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(200);check('Treasury labels stay readable at '+width,await p.locator('.treasury-curve svg text').evaluateAll(ns=>ns.every(e=>{const size=parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a;return size>=10&&size<=16;})));check('Treasury fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.locator('[data-rates-pane=treasury]').focus();await p.keyboard.press('Home');check('Home restores the existing currency workspace',await desk.isVisible());
  await p.locator('[data-context-view=calendar]').click();
  check('Calendar uses compact source-dated rows',await p.locator('.macro-calendar .context-release-list li').count()<=6&&await p.locator('.calendar-method').count()===1);
  const events=await p.evaluate(()=>document.querySelector('#macro-content')._macroContext.calendar.events);
  check('Calendar rows retain official dates and titles',await p.locator('.context-release-list li').evaluateAll((ns,events)=>ns.every(e=>events.some(v=>v.date===e.querySelector('time').dateTime&&v.title===e.querySelector('span').textContent)),events));
  check('Calendar dates have readable month names',await p.locator('.context-release-list time').allTextContents().then(ns=>ns.every(t=>/^\d{1,2} [A-Za-z]{3}$/.test(t))));
  await p.locator('[data-context-body] details').first().locator('summary').click();check('Complete release table remains accessible',await p.locator('table:visible').count()>=1);
  check('Existing macro source arrays remain unchanged',await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroExtended]);})===data);
  await p.reload();await ready();check('Synthetic storage survives refresh',await p.evaluate(()=>localStorage.getItem('TEST-ONLY-rates-sentinel'))==='TEST ONLY no personal records');
  check('No uncaught browser exceptions',errors.length===0);return{checks,errors};
 }finally{await c.close();}
}
