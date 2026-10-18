export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));const check=(n,v)=>{if(!v)throw Error(n);checks.push(n);};
 try{
 await p.goto('http://127.0.0.1:4175/office/#market/macro');await p.locator('#macro-context[data-ready=true]').waitFor({state:'attached'});
 const layout=await p.evaluate(()=>{const b=s=>document.querySelector(s).getBoundingClientRect(),title=b('.macro-page-title'),scope=b('[data-macro-scope]'),map=b('.atlas-primary'),detail=b('.atlas-detail');return {oneTitle:document.querySelectorAll('h1').length===1,sameHeader:Math.abs(title.y-scope.y)<2,sideBySide:detail.x>=map.right&&Math.abs(detail.y-map.y)<2,readingsFit:detail.bottom<=1000};});
 for(const [name,value]of Object.entries(layout))check(name,value);check('Sticky navigation has an opaque surface',await p.locator('.macro-section-nav').evaluate(e=>getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)'));
 await p.locator('[data-macro-destination=economy]').click();await p.locator('#macro-context[data-ready=true]').waitFor();await p.locator('.context-more-views>summary').click();await p.locator('[data-context-view=cycle]').click();
 check('Four named quadrants visible',await p.locator('[data-cycle-zone]').count()===4&&await p.locator('.cycle-zone-label').allTextContents().then(t=>[1,2,3,4].every(q=>t.some(s=>s.includes('Quad '+q)))));
 check('Frequency summary and chronological annual trail are adjacent',await p.locator('.cycle-regime-context').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length===2));
 await p.locator('.cycle-year-chip').first().locator('strong').click();check('Clicking a year label updates the inspection',await p.locator('[data-cycle-year]').inputValue()==='0');
 check('Year badge matches the selected year',await p.locator('[data-cycle-state]').innerText().then(t=>t.includes('2014')));
 for(const width of [1440,1180,1024,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(200);check('No overflow at '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 check('No browser exceptions',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
