export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().startsWith('https://s.tradingview.com/'))external.push(r.url());});
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  await p.route('https://s.tradingview.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><p>TEST ONLY provider frame; no synthetic price.</p>'}));
  for(const [route,category,token]of [['market/us','us','Delayed'],['market/idx','idx','End-of-day'],['market/bonds','bonds','Delayed'],['market/commodities','commodities','Streaming OTC'],['market/macro/id/markets','macro','CFDs']]){
   await p.goto(base+'#'+route);const panel=p.locator('[data-market-feed]');await panel.locator('iframe').waitFor();await p.waitForFunction(()=>document.querySelector('[data-feed-status]')?.textContent.startsWith('Provider panel opened'));
   const source=await panel.locator('iframe').getAttribute('src'),config=JSON.parse(decodeURIComponent(new URL(source).hash.slice(1)));
   check(category+' loads an isolated provider frame with clear data timing',new URL(source).origin==='https://s.tradingview.com'&&new URL(source).pathname==='/embed-widget/market-overview/'&&await panel.locator('.feed-timing').innerText().then(t=>t.includes(token)));
   check(category+' has no credential, portfolio, plugin response or Office record in the frame URL',Object.keys(config).every(k=>['width','height','tabs','showChart','showSymbolLogo','colorTheme','isTransparent','locale'].includes(k))&&!/token|password|chatSession|portfolio/i.test(source));
   check(category+' does not treat an iframe load as proof of a live tick',await panel.locator('[data-feed-status]').innerText().then(t=>t.includes('Provider panel opened')&&!t.includes('Live')));
   if(category==='us')check('US feed follows the verified watchlist rather than a fixed unrelated symbol list',config.tabs[0].symbols.every(s=>/^(NASDAQ|NYSE|AMEX):/.test(s.s))&&config.tabs[0].symbols.length===await p.locator('#watchlist-rows tr[data-symbol]').count());
   if(category==='us'){
    await p.locator('#watchlist-symbol').fill('META');await p.locator('#watchlist-form').evaluate(e=>e.requestSubmit());await p.waitForFunction(()=>document.querySelector('[data-market-feed] iframe')?.src.includes('META'));
    const current=JSON.parse(decodeURIComponent(new URL(await panel.locator('iframe').getAttribute('src')).hash.slice(1)));check('Adding a published stock resolves its actual venue before including it in the provider feed',current.tabs[0].symbols.some(s=>s.s==='NASDAQ:META')&&current.tabs[0].symbols.length===5);
   }
   if(category==='commodities')check('Gold spot is explicitly separate from futures and retail gram quotes',config.tabs[0].symbols[0].s==='OANDA:XAUUSD'&&await panel.locator('.feed-definition').innerText().then(t=>t.includes('not COMEX')&&t.includes('USD per troy ounce')));
   if(category==='bonds')check('All 19 connected bond ETFs retain their own verified listing and exposure group',config.tabs.length===4&&config.tabs.flatMap(t=>t.symbols).length===19&&await panel.locator('.feed-definition').innerText().then(t=>t.includes('not individual bond execution prices')));
   if(category==='macro')check('Cash-index and CFD instruments stay in separate labelled tabs',config.tabs.length===2&&config.tabs[0].symbols.every(s=>!s.s.startsWith('FOREXCOM:'))&&config.tabs[1].symbols.every(s=>s.s.startsWith('FOREXCOM:')&&s.d.includes('CFD')));
   const history=p.locator('.market-chart-desk');await history.scrollIntoViewIfNeeded();await p.waitForFunction(()=>!!document.querySelector('.market-chart-desk')?._nativeHistory);const before=await history.evaluate(e=>JSON.stringify(e._nativeHistory.quote));
   await panel.scrollIntoViewIfNeeded();await panel.locator('iframe').waitFor();await panel.locator('[data-feed-pause]').click();check(category+' pause closes the provider frame',await panel.locator('iframe').count()===0);
   await panel.locator('[data-feed-pause]').click();await panel.locator('iframe').waitFor();await p.locator('#theme-toggle').click();await p.waitForTimeout(100);const dark=JSON.parse(decodeURIComponent(new URL(await panel.locator('iframe').getAttribute('src')).hash.slice(1)));check(category+' reloads the provider with the selected theme',dark.colorTheme==='dark');
   await panel.locator('[data-feed-reconnect]').click();check(category+' reconnect does not alter dated source observations',await history.evaluate((e,b)=>JSON.stringify(e._nativeHistory.quote)===b,before));
   for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(150);check(category+' feed fits '+width+'px',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
   await p.locator('#theme-toggle').click();await p.setViewportSize({width:1440,height:1000});
  }
  check('Provider embeds make GET-only requests to the allowlisted public host',external.length>0&&external.every(u=>u.startsWith('https://s.tradingview.com/embed-widget/market-overview/')));check('No parent-page errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
