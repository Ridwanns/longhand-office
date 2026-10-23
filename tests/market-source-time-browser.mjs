import {readFile} from 'node:fs/promises';
export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};p.on('pageerror',e=>errors.push(e.message));
 try{
 const source=await readFile(new URL('../market-terminal.js',import.meta.url),'utf8');let scenario='ordinary';
 await p.clock.install({time:new Date('2026-10-23T02:00:00Z')});
 await p.route('**/market-terminal.js',r=>r.fulfill({contentType:'text/javascript',body:source}));
 await p.route('**/market-source-time-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="market-data.css"></head><body><main id="root"></main><script type="module">import {marketPage,mountMarket} from "./market-terminal.js";document.querySelector("#root").innerHTML=marketPage("commodities");await mountMarket();</script></body></html>'}));
 await p.route('**/api/market/category/price?**',r=>{const symbol=new URL(r.request().url()).searchParams.get('symbol');let timestamp=scenario==='year-boundary'?'2026-12-31T15:00:00Z':'2026-10-22T20:00:00Z';if(scenario==='ordinary'&&symbol==='MTF=F')timestamp='2025-02-06T09:12:41Z';if(scenario==='ordinary'&&symbol==='CL=F')timestamp='2026-10-15T20:00:00Z';if(scenario==='weekend')timestamp='2026-10-23T20:00:00Z';return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({symbol,provider:'yahoo',currency:'USD',unit:'TEST ONLY source unit',instrumentType:'FUTURE',realtimeVerified:false,timestamp,retrievedAt:new Date().toISOString(),price:100,name:'TEST ONLY source '+symbol,delayMinutes:null,change:null,history:[]})});});
 const open=async()=>{await p.goto(base+'market-source-time-test');await p.waitForFunction(()=>document.querySelector('#refresh-market')?.disabled===false);};
 await open();const coal=p.locator('tr[data-symbol="MTF=F"]'),old=p.locator('tr[data-symbol="CL=F"]'),fresh=p.locator('tr[data-symbol="SI=F"]');
 check('Historical coal row visibly retains its 2025 source year',await coal.innerText().then(s=>s.includes('2025')));
 check('Historical coal is marked outdated without opening its details',await coal.locator('.watch-source-status').isVisible()&&await coal.locator('.watch-source-status').innerText()==='Outdated snapshot');
 check('A fresh retrieval does not erase the old source observation state',await coal.locator('.watch-source-status').getAttribute('title').then(s=>s.includes('2025-02-06')));
 check('Same-year old observations show their year and outdated state',await old.innerText().then(s=>s.includes('2026'))&&await old.locator('.watch-source-status').innerText()==='Outdated snapshot');
 check('Recent observations retain compact dates without an outdated badge',await fresh.locator('.watch-source-status').count()===0&&await fresh.locator('.watch-price').innerText().then(s=>!s.includes('2026')));
 scenario='weekend';await p.clock.setFixedTime(new Date('2026-10-26T02:00:00Z'));await open();check('Friday close remains a dated observation over a normal weekend',await p.locator('.watch-source-status').count()===0);
 scenario='year-boundary';await p.clock.setFixedTime(new Date('2027-01-01T02:00:00Z'));await open();check('A recent prior-year observation still displays its source year',await p.locator('tr[data-symbol="SI=F"] .watch-price').innerText().then(s=>s.includes('2026')));check('A year boundary alone does not mark a recent source outdated',await p.locator('.watch-source-status').count()===0);
 check('No browser script errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
