// Public data and a sentinel in an isolated browser; no owner records.
export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},colorScheme:'dark',reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,v)=>{if(!v)throw Error(name);checks.push(name);},ready=()=>p.locator('#macro-context[data-ready=true]').waitFor();
 try{
  await p.goto('http://127.0.0.1:4175/office/#market/macro/us/overview');await ready();
  await p.evaluate(()=>localStorage.setItem('TEST-ONLY-clean-surface','TEST ONLY keep records'));
  const sourceBefore=await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroFeed,e._macroContext,e._macroReleases,e._macroExtended]);});
  check('No inline source stacks remain in Overview',await p.locator('.monitor-provenance,.atlas-provenance').count()===0);
  check('Legacy tools and duplicate history are absent from page flow',await p.locator('.macro-monitor-tools:visible,.macro-detailed-context:visible,.macro-legacy-history:visible').count()===0);
  check('Overview has no exposed tables or legacy trend renderer',await p.locator('table:visible,.macro-trend').count()===0);
  await p.locator('.macro-evidence-menu>summary').click();await p.locator('[data-macro-open-archive]').click();
  check('Reference archive is a real secondary dialog',await p.locator('#macro-reference-dialog').evaluate(e=>e.open)&&await p.getByRole('dialog',{name:'Reference archive',exact:true}).isVisible());
  await p.locator('.macro-detailed-context>summary').click();await p.locator('.macro-monitor-tools>summary').click();
  check('Original note and refresh controls remain accessible',await p.locator('#macro-thesis-note').isVisible()&&await p.locator('#macro-refresh').isVisible());
  await p.keyboard.press('Escape');check('Escape restores focus to More',await p.locator('.macro-evidence-menu>summary').evaluate(e=>e===document.activeElement));
  await p.locator('[data-macro-destination=economy]').click();await ready();await p.locator('.macro-evidence-menu>summary').click();await p.locator('[data-macro-open-archive]').click();await p.locator('.macro-legacy-history>summary').click();
  check('Archived GDP replaces the oversized legacy trend with the native renderer',await p.locator('.macro-history .macro-trend').count()===0&&await p.locator('.macro-history [data-macro-chart]').count()===2);
  const original=await p.evaluate(()=>JSON.parse(document.querySelector('#macro-content')._macroFeed).series.find(s=>s.id==='us-gdp').observations.slice(-16).map(o=>o.value));
  check('Archived GDP retains the original source values',await p.locator('.macro-history [data-macro-chart]').first().getAttribute('data-macro-points').then(v=>JSON.stringify(JSON.parse(v).map(p=>p[1]))===JSON.stringify(original)));
  check('Archived exact tables are collapsed',await p.locator('.archive-exact').evaluateAll(ns=>ns.every(e=>!e.open)));await p.locator('.archive-exact>summary').first().click();check('Original release/status table remains available',await p.locator('.archive-exact table').first().isVisible());await p.keyboard.press('Escape');
  await p.goto('http://127.0.0.1:4175/office/#market/macro/us/markets');await ready();const desk=p.locator('.market-chart-desk');await desk.locator('[data-macro-chart]').waitFor();
  check('Cross market renders one instrument history, not two',await desk.count()===1);
  check('Index history has one title and no repeated hero price',await desk.locator('.native-chart-heading,.native-last-close').count()===0&&await desk.locator('[data-macro-chart] figcaption').count()===1);
  check('Index source paragraphs are outside page flow',!await desk.locator('.market-chart-notes').isVisible());
  await desk.locator('[data-chart-range]').selectOption('ALL');
  const supplied=await desk.evaluate(e=>e._nativeHistory.values.map(o=>[o.date,o.close]));
  check('Native index chart retains every displayed source observation',await desk.locator('[data-macro-chart]').getAttribute('data-macro-points').then(v=>JSON.stringify(JSON.parse(v).map(o=>o.slice(0,2)))===JSON.stringify(supplied)));
  await p.locator('[data-inspect="^IXIC"]').click();await p.waitForFunction(()=>document.querySelector('[data-chart-instrument]')?.value==='NASDAQ:IXIC');check('Watchlist selection updates the single chart',await desk.locator('[data-chart-instrument]').inputValue()==='NASDAQ:IXIC');
  await desk.locator('[data-chart-info]').click();check('Source and optional external chart remain secondary',await desk.locator('.market-chart-info').evaluate(e=>e.open)&&await desk.locator('[data-chart-external]').isVisible());await p.keyboard.press('Escape');
  for(const theme of ['dark','light']){
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme-toggle').click();
   for(const width of [1440,1024,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(200);check(theme+' index fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check(theme+' index labels stay readable at '+width,await desk.locator('svg text').evaluateAll(ns=>ns.every(e=>{const n=parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a;return n>=10&&n<=16;})));}
  }
  await p.goto('http://127.0.0.1:4175/office/#market/macro/us/overview');await ready();
  check('Original Macro data arrays are unchanged',await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroFeed,e._macroContext,e._macroReleases,e._macroExtended]);})===sourceBefore);
  await p.reload();await ready();check('Reload keeps sources and archives out of the main page',await p.locator('.monitor-provenance,.macro-monitor-tools:visible').count()===0);
  check('Synthetic storage bytes are unchanged',await p.evaluate(()=>localStorage.getItem('TEST-ONLY-clean-surface'))==='TEST ONLY keep records');check('No page errors',errors.length===0);
  return{checks,errors};
 }finally{await c.close();}
}
