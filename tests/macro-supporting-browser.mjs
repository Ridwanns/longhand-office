// Disposable browser context only; no owner records or source snapshots are edited.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  await p.goto(base+'#market/macro/id/overview');await p.locator('#macro-context[data-ready=true]').waitFor();
  const before=await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroReleases,e._macroExtended,e._macroFeed]);});
  check('Indonesia has five additional visible indicators without duplicate GDP, CPI or policy metrics',await p.locator('[data-monitor-indicator]').evaluateAll(nodes=>JSON.stringify(nodes.map(n=>n.dataset.monitorIndicator))===JSON.stringify(['wdi-IDN-unemployment','wdi-IDN-currentAccount','wdi-IDN-fdi','wdi-IDN-reserves','id-jisdor'])));
  const expected=await p.evaluate(()=>document.querySelector('#macro-content')._macroContext.series.filter(s=>['wdi-IDN-unemployment','wdi-IDN-currentAccount','wdi-IDN-fdi','wdi-IDN-reserves','id-jisdor'].includes(s.id)));
  for(const item of expected){
   const card=p.locator('[data-monitor-indicator="'+item.id+'"]'),latest=item.observations.findLast(o=>Number.isFinite(o.value)),fmt=new Intl.NumberFormat('en-GB',{maximumFractionDigits:2,minimumFractionDigits:1}).format(latest.value);
   check(item.id+' displays the actual source number and period',await card.locator('.monitor-indicator-value').innerText().then(t=>t.startsWith(fmt+' '))&&await card.locator('.monitor-indicator-period').innerText().then(t=>t.includes(latest.date.slice(0,4))&&t.includes(item.id==='id-jisdor'?'Daily':'Annual')));
   check(item.id+' retains exact source history values and latest date',await card.locator('[data-macro-chart]').getAttribute('data-macro-points').then(JSON.parse).then(rows=>rows.every(([d,v])=>item.observations.some(o=>o.date===d&&o.value===v))&&rows.at(-1)[0]===latest.date));
   check(item.id+' retains acquisition evidence and an official source link',await card.locator('.monitor-indicator-evidence').textContent().then(t=>t.includes(item.retrievedAt))&&await card.locator('.monitor-indicator-evidence>a').getAttribute('href').then(u=>u.startsWith('https://')));
  }
  for(const width of [1660,1440,1280,1180,1024,768,390,320]){
   await p.setViewportSize({width,height:1050});await p.waitForTimeout(220);
   check('All content fits '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check('Indicator values and source controls fit their cards at '+width+'px',await p.locator('.monitor-indicator').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth+1)));
   if(width>=1280)check('Supporting evidence fills the desktop blank area at '+width+'px',await p.locator('.monitor-analysis-grid').evaluate(e=>{const a=e.children[0].getBoundingClientRect(),b=e.children[1].getBoundingClientRect(),history=b.height;return b.x>=a.right&&Math.abs(a.y-b.y)<2&&Math.abs(a.bottom-b.bottom)<250&&history>1100;}));
   const card=p.locator('[data-monitor-indicator="wdi-IDN-reserves"]');await card.locator('summary').first().click();
   check('Full evidence expands without horizontal overflow at '+width+'px',await card.locator('[data-macro-surface]').isVisible()&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await card.locator('[data-macro-surface]').focus();await p.keyboard.press('Home');
   check('Keyboard inspection reaches the first retained reserve observation at '+width+'px',await card.locator('[data-macro-inspect]').inputValue()==='0');await card.locator('summary').first().click();
  }
  await p.setViewportSize({width:1440,height:1050});await p.locator('[data-context-range]').selectOption('all');
  check('All-history selection preserves long acquired annual observations',await p.locator('[data-monitor-indicator="wdi-IDN-reserves"] [data-macro-chart]').getAttribute('data-macro-points').then(JSON.parse).then(rows=>rows[0][0]<'2000-01-01'));
  await p.locator('[data-context-range]').selectOption('10y');
  await p.locator('#theme-toggle').click();check('Dark theme keeps all five indicators readable and present',await p.locator('[data-monitor-indicator]:visible').count()===5);await p.locator('.monitor-supporting').screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/macro-supporting-dark.png'});await p.locator('#theme-toggle').click();
  for(const country of ['USA','EMU','CHN','MYS','BRA','WLD']){
   await p.locator('#macro-country').selectOption(country);
   check(country+' uses at most six own indicators and does not pad missing sources',await p.locator('[data-monitor-indicator]').evaluateAll((nodes,country)=>nodes.length<=6&&nodes.every(n=>country==='USA'?n.dataset.monitorIndicator.startsWith('us-')||['wdi-USA-currentAccount','broad-dollar'].includes(n.dataset.monitorIndicator):n.dataset.monitorIndicator.startsWith('wdi-'+country+'-')),country));
   check(country+' fits without overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(country==='WLD')check('Unreported world reserves/current account are not fabricated',await p.locator('[data-monitor-indicator="wdi-WLD-reserves"],[data-monitor-indicator="wdi-WLD-currentAccount"]').count()===0);
  }
  await p.locator('#macro-country').selectOption('IDN');
  check('Source snapshots stay byte-for-byte unchanged across controls and chart inspection',await p.evaluate(()=>{const e=document.querySelector('#macro-content');return JSON.stringify([e._macroContext,e._macroReleases,e._macroExtended,e._macroFeed]);})===before);
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/macro-supporting-desktop.png',fullPage:true});
  await p.setViewportSize({width:390,height:950});await p.waitForTimeout(250);await p.locator('.monitor-supporting').screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/macro-supporting-mobile.png'});
  check('No uncaught browser errors',errors.length===0);return {checks,errors};
 }catch(e){throw Error(e.message+'; last passed '+checks.at(-1)+'; errors '+JSON.stringify(errors));}finally{await c.close();}
}
