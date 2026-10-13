export async function run(original){
 const c=await original.context().browser().newContext(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{await p.goto('http://127.0.0.1:4175/office/#quant');
 const verification=await p.evaluate(async()=>{
  const {api,publicManifest,browserMarketFetch}=await import('./browser-api.js'),manifest=await publicManifest(),cases=[];
  // Exercise actual Workers only for eligible histories; insufficient history is an explicit source state.
  const eligible=manifest.histories.filter(h=>h.modelCutoff),priceOnly=manifest.histories.filter(h=>!h.modelCutoff).map(h=>({market:h.market,ticker:h.ticker}));
  for(let start=0;start<eligible.length;start+=2){await Promise.all(eligible.slice(start,start+2).map(async h=>{
   const id=crypto.randomUUID();await api('runs',{id,market:h.market,ticker:h.ticker,cutoff:h.modelCutoff,horizon:5,basis:'adjusted',seed:20261013});
   let j;const deadline=Date.now()+60000;do{await new Promise(r=>setTimeout(r,100));j=await api('run/'+id);}while(['queued','running'].includes(j.status)&&Date.now()<deadline);
   cases.push({market:h.market,ticker:h.ticker,status:j.status,observations:j.dataset?.observations.length,error:j.error});
  }));}
  const market=await fetch('./data/market.json').then(r=>r.json()),quotes=[];
  for(const instrument of Object.keys(market.quotes)){const [category,symbol]=instrument.split(':'),path=category==='idx'?'flowless/price':category==='us'?'us/price':'category/price',response=await browserMarketFetch('/api/market/'+path+'?'+new URLSearchParams({category,symbol})),q=await response.json(),withheld=!market.quotes[instrument].quote;quotes.push({instrument,withheld,passed:withheld?!response.ok&&!q.price&&q.kind==='source-unavailable':response.ok&&q.symbol===symbol&&Number.isFinite(q.price)&&q.price>0,error:q.error});}
  return {publication:manifest.publishedAt,cases,quotes,priceOnly};
 });
 const failures=verification.cases.filter(r=>r.status!=='completed'||r.observations<350),quoteFailures=verification.quotes.filter(r=>!r.passed);if(failures.length||quoteFailures.length||errors.length)throw Error(JSON.stringify({failures,quoteFailures,errors}));
 const layouts=[];for(const category of ['us','idx','bonds','commodities','macro']){await p.goto('http://127.0.0.1:4175/office/#market/'+category);await p.locator('#watchlist-rows .watch-price').first().waitFor();await p.waitForFunction(()=>!document.querySelector('#watchlist-rows .quote-loading'));for(const width of [1440,390,320]){await p.setViewportSize({width,height:900});const passed=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);if(!passed)throw Error('Market overflow '+category+' '+width);layouts.push({category,width,passed});}}
 return {...verification,layouts,errors};
 }finally{await c.close();}
}
