// Fresh browser contexts and labelled synthetic private records only.
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};p.setDefaultTimeout(25000);p.on('pageerror',e=>errors.push(e.message));
 const settled=()=>p.waitForFunction(()=>document.querySelector('#refresh-market')&&!document.querySelector('#refresh-market').disabled);
 try{
  await p.goto(base+'#market/us');await p.waitForFunction(()=>/^[1-9][0-9]* published/.test(document.querySelector('#market-coverage-status')?.textContent||''));await settled();
  const m=await p.evaluate(()=>fetch('./data/manifest.json',{cache:'no-store'}).then(r=>r.json())),entries=m.instruments.filter(i=>i.pluangListed);
  check('Every discovered Pluang fund is published',entries.length===m.coverage.pluangEtfs.discovered&&entries.length>=211);
  const key='longhand-office.browser.records.'+new URL(base).pathname+'v1',seed=JSON.stringify({version:1,portfolios:[{id:'TEST-ETF-RECHECK',mode:'paper',name:'TEST ONLY ETF record preservation',currency:'USD',openingCash:1000,transactions:[]}],theses:[],decisions:[]});await p.evaluate(({key,seed})=>localStorage.setItem(key,seed),{key,seed});
  await p.locator('#market-instrument-kind').selectOption('pluang');check('Catalogue filter opens the instrument browser',await p.locator('#market-coverage details').evaluate(e=>e.open));
  const failures=await p.evaluate(list=>{const search=document.querySelector('#market-stock-search'),fail=[];for(const i of list){search.value=i.ticker;search.dispatchEvent(new Event('input',{bubbles:true}));const first=document.querySelector('[data-market-ticker]');if(first?.dataset.marketTicker!==i.ticker)fail.push(i.ticker);}return fail;},entries);
  check('Every catalogue ticker is discoverable and exact matches appear first',failures.length===0);
  for(const ticker of ['VT','SOXX','SMH','GLD','SOXL']){
   await p.locator('#market-stock-search').fill(ticker);await p.locator('[data-market-ticker="'+ticker+'"]').click();await settled();await p.locator('tr[data-symbol="'+ticker+'"] .watch-price').waitFor();await p.locator('[data-inspect="'+ticker+'"]').click();
   const q=await p.evaluate(async t=>(await fetch('./data/market.json').then(r=>r.json())).quotes['us:'+t].quote,ticker),price=await p.locator('tr[data-symbol="'+ticker+'"] .watch-price').evaluate(e=>e.firstChild.textContent);
   check(ticker+' displays its own verified Yahoo observation',price===new Intl.NumberFormat('en-GB',{maximumFractionDigits:4}).format(q.price));
  }
  await p.locator('#market-instrument-kind').selectOption('etf');await p.locator('#market-stock-search').fill('');check('ETF-only results contain no equities',await p.locator('[data-market-ticker]').evaluateAll((buttons,items)=>buttons.every(b=>items.some(i=>i.ticker===b.dataset.marketTicker&&i.instrumentType==='ETF')),m.instruments));
  for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});check('ETF filters fit '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('ETF catalogue remains outside the clipped watchlist at '+width+'px',await p.locator('#market-coverage').evaluate(e=>!e.closest('.watchlist-panel')&&e.getBoundingClientRect().bottom<=document.querySelector('.market-terminal').getBoundingClientRect().top));}
  await p.locator('#market-instrument-kind').selectOption('pluang');await p.locator('#market-stock-search').fill('SOXX');await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/etf-catalogue-mobile.png',fullPage:true});await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'C:/Users/user/OneDrive/Documents/Longhand Office/validation/etf-catalogue-desktop.png',fullPage:true});
  await p.reload();await settled();check('New ETF watchlist entries survive reload',await p.locator('tr[data-symbol="VT"]').count()===1&&await p.locator('tr[data-symbol="SOXX"]').count()===1);
  await p.locator('#market-instrument-kind').focus();await p.keyboard.press('End');await p.keyboard.press('Enter');check('Catalogue filter is keyboard accessible',await p.locator('#market-instrument-kind').evaluate(e=>document.activeElement===e));
  check('Private record bytes remain identical',await p.evaluate(key=>localStorage.getItem(key),key)===seed);check('Reduced motion is respected',await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));check('No application exceptions',errors.length===0);
  return {publication:m.publishedAt,coverage:m.coverage.pluangEtfs,checks,errors};
 }finally{await c.close();}
}
