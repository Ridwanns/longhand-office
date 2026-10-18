export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.goto('http://127.0.0.1:4175/office/#market/macro/id/economy');await p.locator('#macro-context[data-ready=true]').waitFor();await p.locator('[data-context-view=cycle]').click();await p.locator('.cycle-quadrant-desk svg').first().waitFor();
 const quadrant=await p.locator('[data-cycle-observations]').evaluate(e=>JSON.parse(e.dataset.cycleObservations));if(await p.locator('.cycle-quadrant-fill').count()!==4||await p.locator('.cycle-link:visible').count()>1)throw Error('Quadrant layout or initial links');
 await p.locator('[data-cycle-year]').selectOption('0');if(await p.locator('[data-cycle-growth]').innerText().then(t=>!t.includes(new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:2}).format(quadrant[0].growthChange))))throw Error('Selected year mismatch');
 await p.locator('[data-cycle-point="3"]').focus();await p.keyboard.press('Enter');if(await p.locator('[data-cycle-year]').inputValue()!=='3')throw Error('Keyboard inspection');
 await p.locator('[data-cycle-full-path]').check();if(await p.locator('.cycle-link:visible').count()<2)throw Error('Full path toggle');await p.locator('[data-cycle-full-path]').uncheck();
 const result=await p.evaluate(()=>({charts:document.querySelectorAll('.cycle-time-charts [data-macro-chart]').length,trajectoryFolded:!document.querySelector('.cycle-trajectory-detail').open,points:[...document.querySelectorAll('.cycle-time-charts [data-macro-chart]')].map(e=>JSON.parse(e.dataset.macroPoints)),overflow:document.documentElement.scrollWidth>innerWidth}));
 await p.locator('.cycle-trajectory-detail>summary').click();await p.locator('.cycle-original-observations>summary').click();const rows=await p.locator('.cycle-original-observations tbody tr').evaluateAll(ns=>ns.map(e=>[...e.querySelectorAll('td')].slice(-2).map(e=>Number(e.textContent.replaceAll(',','')))));
 result.exactMatch=result.points.every((points,i)=>points.length===rows.length&&points.every((pt,j)=>Math.abs(pt[1]-rows[j][i])<.006));
 for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(180);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at '+width);if(await p.locator('[data-cycle-year]').inputValue()!=='3')throw Error('Year reset after resize');}
 if(!result.exactMatch||result.charts!==2||!result.trajectoryFolded||result.overflow||errors.length)throw Error(JSON.stringify({result,errors}));return {...result,points:result.points.map(x=>x.length),quadrants:4,yearSelection:true,keyboard:true,pathToggle:true,responsiveWidths:[1440,768,390,320],errors};
 }finally{await c.close();}
}
