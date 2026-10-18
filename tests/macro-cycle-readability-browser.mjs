export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
 await p.goto('http://127.0.0.1:4175/office/#market/macro/id/economy');await p.locator('#macro-context[data-ready=true]').waitFor();await p.locator('[data-context-view=cycle]').click();await p.locator('.cycle-time-charts svg').first().waitFor();
 const result=await p.evaluate(()=>({charts:document.querySelectorAll('.cycle-time-charts [data-macro-chart]').length,trajectoryFolded:!document.querySelector('.cycle-trajectory-detail').open,points:[...document.querySelectorAll('.cycle-time-charts [data-macro-chart]')].map(e=>JSON.parse(e.dataset.macroPoints)),overflow:document.documentElement.scrollWidth>innerWidth}));
 await p.locator('.cycle-trajectory-detail>summary').click();const rows=await p.locator('.context-cycle tbody tr').evaluateAll(ns=>ns.map(e=>[...e.querySelectorAll('td')].slice(-2).map(e=>Number(e.textContent.replaceAll(',','')))));
 result.exactMatch=result.points.every((points,i)=>points.length===rows.length&&points.every((pt,j)=>Math.abs(pt[1]-rows[j][i])<.006));
 for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(180);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at '+width);}
 if(!result.exactMatch||result.charts!==2||!result.trajectoryFolded||result.overflow||errors.length)throw Error(JSON.stringify({result,errors}));return {...result,points:result.points.map(x=>x.length),responsiveWidths:[1440,768,390,320],errors};
 }finally{await c.close();}
}
