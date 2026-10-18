export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1100},colorScheme:'dark',reducedMotion:'reduce'}),p=await c.newPage(),errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));const check=(n,v)=>{if(!v)throw Error(n);checks.push(n);};
 try{
 await p.goto('http://127.0.0.1:4175/office/#market/macro/us/economy');await p.locator('#macro-context[data-ready=true]').waitFor();
 const before=await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroReleases,e._macroExtended,e._macroFeed]);});
 check('Monitor opens automatically without a disclosure',await p.locator('.macro-direct-monitor').isVisible()&&await p.locator('.macro-direct-monitor').evaluate(e=>!e.closest('details:not([open])')));
 check('Four primary readings are immediately visible',await p.locator('[data-monitor-metric]:visible').count()===4);
 check('GDP, inflation and quad all display immediately',await p.locator('[data-monitor-history] [data-macro-chart]:visible').count()===2&&await p.locator('.monitor-cycle .context-cycle svg').isVisible());
 check('Desktop analysis uses two adjacent columns',await p.locator('.monitor-analysis-grid').evaluate(e=>{const a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect();return b.x>=a.right&&Math.abs(a.y-b.y)<2;}));
 check('Only Monitor and Economic data are primary internal buttons',await p.locator('.context-tabs>button').allTextContents().then(t=>JSON.stringify(t)===JSON.stringify(['Monitor','Economic data'])));
 for(const country of ['IDN','USA','EMU','MYS','BRA','WLD']){await p.locator('#macro-country').selectOption(country);check(country+' retains the open monitor and actual country',await p.locator('.macro-direct-monitor').isVisible()&&await p.locator('#macro-country').inputValue()===country);}
 await p.locator('#macro-country').selectOption('USA');await p.locator('.context-more-views>summary').click();await p.locator('[data-context-view=releases]').click();check('Original GDP/CPI source selection remains available',await p.locator('[data-context-release-metric=gdp]').isVisible());await p.locator('[data-context-view=monitor]').click();
 await p.locator('.cycle-year-chip').first().locator('strong').click();check('Inline annual trail updates the quad without opening panels',await p.locator('[data-cycle-year]').inputValue()==='0');
 await p.locator('[data-context-view=indicators]').click();check('Detailed economic-data explorer remains available',await p.locator('.macro-indicator-explorer').isVisible());await p.locator('[data-context-view=monitor]').click();
 for(const width of [1660,1440,1180,1024,768,390,320]){await p.setViewportSize({width,height:1100});await p.waitForTimeout(200);check('Monitor fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('Primary data stays open at '+width,await p.locator('[data-monitor-history] [data-macro-chart]:visible').count()===2&&await p.locator('.monitor-cycle .context-cycle svg').isVisible());}
 await p.locator('#theme-toggle').click();check('Light mode preserves direct data visibility',await p.locator('[data-monitor-metric]:visible').count()===4);await p.locator('#theme-toggle').click();
 check('Existing source arrays remain unchanged',await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroReleases,e._macroExtended,e._macroFeed]);})===before);
 await p.goto('http://127.0.0.1:4175/office/#market/macro/id/overview');await p.locator('#macro-context[data-ready=true]').waitFor();check('Overview monitor also opens without Research briefing panels',await p.locator('.macro-direct-monitor').isVisible()&&await p.locator('.macro-briefing-panel').evaluate(e=>e.tagName==='SECTION'));
 check('Map remains first',await p.locator('#macro-world-map').evaluate(e=>e.parentElement.firstElementChild===e&&e.open));check('No browser errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
