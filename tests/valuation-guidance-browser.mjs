export async function run(original){
 const root='http://127.0.0.1:4175/office/',key='longhand-office.browser.records./office/v1',c=await original.context().browser().newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 try{
  await p.goto(root+'#portfolios');await p.locator('h1').waitFor();
  const trade={id:'TEST-trade',symbol:'AAPL',side:'Buy',date:'2026-10-01',quantity:2,price:10,fee:0,note:'TEST ONLY'},portfolios=[{id:'TEST-empty-unknown',name:'TEST ONLY empty unknown cash',currency:'USD',transactions:[]},{id:'TEST-empty-zero',name:'TEST ONLY empty explicit zero',currency:'USD',openingCash:0,transactions:[]},{id:'TEST-missing-price',name:'TEST ONLY missing price',currency:'USD',openingCash:1000,transactions:[trade]},{id:'TEST-priced-unknown',name:'TEST ONLY priced holding unknown cash',currency:'USD',transactions:[{...trade,id:'TEST-priced-trade'}],valuations:[{id:'TEST-price',symbol:'AAPL',currency:'USD',price:20,date:'2026-10-13',source:'TEST ONLY supplied price'}]}];
  await p.evaluate(({key,portfolios})=>localStorage.setItem(key,JSON.stringify({version:1,portfolios,theses:[],decisions:[]})),{key,portfolios});const before=await p.evaluate(k=>localStorage.getItem(k),key);
  for(const fixture of portfolios){await p.goto(root+'#portfolio/'+fixture.id);await p.reload();await p.locator('[data-value=portfolio-value]').waitFor();
   const value=await p.locator('[data-value=portfolio-value]').innerText(),concentration=await p.locator('[data-value=concentration]').innerText(),warning=await p.locator('.valuation-warning').count()?await p.locator('.valuation-warning').innerText():'';
   if(fixture.id==='TEST-empty-unknown')check('Empty unknown-cash portfolio asks for opening cash, not prices',value==='Cash not recorded'&&concentration==='Not applicable'&&warning.includes('Edit portfolio')&&!warning.includes('Supply a price'));
   if(fixture.id==='TEST-empty-zero')check('Explicit zero cash stays zero and requires no holding price',value==='0 USD'&&concentration==='Not applicable'&&!warning);
   if(fixture.id==='TEST-missing-price')check('A missing holding price gets a specific price instruction',value==='Unavailable'&&warning.includes('Supply a price')&&!warning.includes('opening cash'));
   if(fixture.id==='TEST-priced-unknown')check('A priced holding with unknown cash asks only for cash',value==='Unavailable'&&warning.includes('opening cash')&&!warning.includes('Supply a price')&&(await p.locator('table').first().innerText()).includes('40 USD'));
   check(fixture.id+' fits mobile and preserves records',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&before===await p.evaluate(k=>localStorage.getItem(k),key));
  }
  check('No browser JavaScript exceptions',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
