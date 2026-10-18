// Public observations only; no owner browser storage is accessed.
export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  await p.goto('http://127.0.0.1:4175/office/#market/macro/id/overview');await p.locator('#macro-context[data-ready=true]').waitFor({state:'attached'});
  check('Map is first and open',await p.locator('#macro-world-map').evaluate(e=>e.open&&e.parentElement.firstElementChild===e));
  for(const selector of ['.macro-map-history','.macro-monitor-tools'])check(selector+' is folded by default',await p.locator(selector).evaluate(e=>!e.open));
  await p.locator('.macro-map-history>summary').click();check('Historical map charts remain accessible',await p.locator('[data-atlas-history] svg').first().isVisible());await p.locator('.macro-map-history>summary').click();
  check('Primary monitor is visible without opening a briefing panel',await p.locator('.macro-direct-monitor').isVisible());await p.locator('.macro-research-tools>summary').click();await p.locator('[data-context-view=briefing]').click();check('Original briefing charts remain accessible',await p.locator('.briefing-charts svg').first().isVisible());
  check('Interpretation is folded',await p.locator('.macro-observation-notes').evaluate(e=>!e.open));await p.locator('.macro-observation-notes>summary').click();check('Interpretation remains accessible',await p.locator('.briefing-release-notes').isVisible());
  await p.locator('[data-macro-destination=economy]').click();await p.locator('#macro-context[data-ready=true]').waitFor();await p.locator('#macro-country').selectOption('BRA');
  check('Country selection retains the Economy route',p.url().endsWith('/global/economy/BRA'));
  await p.locator('.macro-monitor-tools>summary').click();check('Legacy note and refresh controls remain accessible',await p.locator('#macro-refresh').isVisible()&&await p.locator('#macro-thesis-note').count()===1);
  for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(180);check('No horizontal overflow at '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('Section navigation stays available at '+width,await p.locator('.macro-section-nav').evaluate(e=>getComputedStyle(e).position==='sticky'));}
  check('No browser errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
