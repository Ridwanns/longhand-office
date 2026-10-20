export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1660,height:1050},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 const selector='.scientific-plot>svg,.context-chart-plot>svg,.latest-cycle-plot>svg,.context-cycle>svg,svg.macro-data-chart,.outlook-chart>svg';
 try{
  for(const route of ['market/macro/id/economy','market/macro/id/outlook','market/macro/id/rates','market/bonds','market/commodities','market/us','market/idx','market/fx']){
   await p.goto(base+'#'+route);await p.waitForFunction(s=>[...document.querySelectorAll(s)].some(e=>e.getBoundingClientRect().width>100),selector);if(await p.locator('#market-board').count())await p.waitForFunction(()=>!document.querySelector('#refresh-market')?.disabled);await p.waitForTimeout(200);
   const geometry=()=>p.locator(selector).evaluateAll(nodes=>JSON.stringify(nodes.map(e=>[...e.querySelectorAll('path,polyline,rect')].map(n=>[n.getAttribute('d'),n.getAttribute('points'),n.getAttribute('x'),n.getAttribute('y'),n.getAttribute('height')]))));
   const baseline=await geometry();await p.locator('#theme-toggle').click();await p.waitForTimeout(70);check(route+' theme changes preserve plotted geometry',await geometry()===baseline);
   for(const width of [1660,1280,768,390,320]){
    await p.setViewportSize({width,height:1050});await p.waitForTimeout(160);
    const sizes=await p.locator(selector).evaluateAll(nodes=>nodes.filter(svg=>svg.getBoundingClientRect().width>0).flatMap(svg=>[...svg.querySelectorAll('text')].filter(e=>e.getBoundingClientRect().width>0).map(e=>parseFloat(getComputedStyle(e).fontSize)*Math.hypot(e.getScreenCTM().a,e.getScreenCTM().b))));
    check(route+' labels stay at 11 screen pixels at '+width,sizes.length>0&&sizes.every(n=>n>=10.95&&n<=11.05));
    check(route+' fits the page at '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   if(route==='market/macro/id/economy'){
    const details=p.locator('.macro-legacy-history');if(await details.count()){await details.evaluate(e=>e.open=true);await p.waitForTimeout(150);check('Previously collapsed charts receive screen-sized labels when opened',await details.locator('svg text').evaluateAll(nodes=>nodes.filter(e=>e.getBoundingClientRect().width).every(e=>Math.abs(parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a-11)<.05)));}
   }
   await p.locator('#theme-toggle').click();await p.setViewportSize({width:1660,height:1050});
  }
  check('No chart-sizing browser errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
