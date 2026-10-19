// Visual/keyboard audit in a disposable context, using public data and a storage sentinel.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
 const go=async route=>{await p.goto(base+'#'+route);await p.locator('#main h1').waitFor();if(route.startsWith('market/macro'))await p.locator('#macro-context[data-ready=true]').waitFor();};
 try{
  await go('overview');await p.evaluate(()=>localStorage.setItem('TEST-ONLY-refinement','TEST ONLY preserved bytes'));
  const records=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('records'))));
  check('Only working Office modules are exposed',await p.locator('.office-strip>a:visible').count()===3&&await p.locator('.office-strip>div:visible').count()===0);
  await go('market/us');check('Desktop has one market category navigation',await p.locator('.market-tabs').isHidden()&&await p.locator('.office-context [data-office-destination=us]').isVisible());
  await go('portfolios');check('Review destination is consolidated in the sidebar',await p.locator('#office-navigation [data-office-destination=reviews]').count()===0&&await p.locator('#office-navigation [data-office-destination=decisions]').isVisible());
  await go('quant');await p.locator('.research-lab[data-has-instrument=false]').waitFor();
  check('Empty research context does not displace ticker entry',await p.locator('.lab-context').isHidden()&&(await p.locator('#automatic-ticker').boundingBox()).y<700);
  check('Unused ticker actions do not occupy the empty desk',await p.locator('.ticker-archive-actions>button:disabled:visible').count()===0);
  await p.locator('#automatic-ticker').focus();check('Ticker entry supports direct keyboard focus',await p.locator('#automatic-ticker').evaluate(e=>e===document.activeElement));
  await p.keyboard.press('Control+k');await p.locator('#page-finder-input').fill('source information');check('Consolidated source destination remains searchable',await p.locator('#page-finder-results a').count()===1);await p.keyboard.press('Enter');await p.locator('#macro-context[data-ready=true]').waitFor();check('Search still opens exact source evidence',p.url().includes('/id/sources'));await go('data-sources');
  check('Provider details are collapsed until requested',await p.locator('.source-notice').isHidden());await p.locator('.official-source-directory>summary').click();
  check('Official source directory has six institutions and usable internal destinations',await p.locator('.official-source-grid article').count()===6&&await p.locator('.official-source-grid a[href^="#market/"]').count()===6);
  const sources=await p.locator('.official-source-grid a[target=_blank]').evaluateAll(ns=>ns.map(a=>({url:a.href,rel:a.rel})));
  check('Official source links keep expected issuers and safe new tabs',sources.length===6&&sources.every(a=>['www.bps.go.id','www.bi.go.id','www.bls.gov','home.treasury.gov','www.ecb.europa.eu','data.worldbank.org'].includes(new URL(a.url).hostname)&&a.rel.includes('noopener')));
  await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/refined-sources-desktop.png'});
  const routes=['overview','market/us','market/idx','market/bonds','market/commodities','market/macro/us/overview','market/macro/id/rates','quant','portfolios','portfolios/real','theses','decisions','library','records','data-sources'];
  for(const theme of ['light','dark']){
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme-toggle').click();
   for(const width of [1440,1024,768,390,320]){
    await p.setViewportSize({width,height:1000});
    for(const route of routes){await go(route);check(theme+' '+route+' fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   }
   await p.setViewportSize({width:1440,height:1000});
   for(const [name,route]of [['overview','overview'],['research','quant'],['macro','market/macro/us/overview'],['market','market/us']]){await go(route);await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/refined-'+name+'-'+theme+'.png'});}
  }
  await p.setViewportSize({width:390,height:844});await go('market/us');check('Mobile retains category navigation',await p.locator('.market-tabs').isVisible());await p.locator('#office-menu').click();check('Mobile opens a modal drawer',await p.locator('#office-sidebar').getAttribute('aria-modal')==='true');await p.keyboard.press('Escape');check('Drawer restores keyboard focus',await p.locator('#office-menu').evaluate(e=>e===document.activeElement));
  await go('quant');await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/refined-research-mobile.png'});await go('overview');await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/refined-overview-mobile.png'});
  check('Visual navigation preserves original record bytes',JSON.stringify(records)===JSON.stringify(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('records'))))));
  check('Sentinel survives all views and themes',await p.evaluate(()=>localStorage.getItem('TEST-ONLY-refinement'))==='TEST ONLY preserved bytes');check('No JavaScript errors',errors.length===0);
  return {checks,errors};
 }catch(e){throw Error(e.message+'; last passed: '+checks.at(-1)+'; URL '+p.url());}finally{await c.close();}
}
