export async function run(original){
 await original.goto('http://127.0.0.1:4173/');const before=await original.evaluate(()=>localStorage.getItem('longhand-office.v1'));
 const context=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',hasTouch:true}),page=await context.newPage(),checks=[],observations=[],errors=[];
 const root='http://127.0.0.1:4174/?preview=flowless',out='C:/Users/user/OneDrive/Documents/Longhand Office/validation';
 const check=(name,ok)=>{if(!ok)throw Error('Assertion: '+name);checks.push(name);};page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(root+'#market/us');await page.getByRole('heading',{name:'Markets',exact:true}).waitFor();
  const fixtureBefore=await page.evaluate(()=>localStorage.getItem('longhand-office.v1.flowless-preview'));
  check('Five category tabs',await page.getByRole('navigation',{name:'Market categories'}).getByRole('link').count()===5);
  for(const [category,symbol,unit] of [['us','AAPL','USD / share'],['idx','BBRI','IDR / share'],['bonds','TLT','USD / ETF share'],['commodities','GC=F','USD / troy ounce'],['macro','^JKSE','index points']]){
   await page.goto(root+'#market/'+category);await page.locator('#market-board').waitFor();await page.waitForFunction(()=>!document.querySelector('#refresh-market').disabled);
   await page.locator('[data-inspect="'+symbol+'"]').click();const text=await page.locator('#market-detail').innerText();
   check(category+' actual source with correct units',text.includes(symbol)&&text.includes(unit));check(category+' source time visible',text.toLowerCase().includes(category==='idx'?'source session':'source time'));observations.push({category,text});
   for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});check(category+' fits '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   if(category==='commodities')await page.screenshot({path:out+'/market-commodities-desktop.png',fullPage:true});
   if(category==='macro'){check('Macro feed clearly unconnected',await page.getByText('Numerical macro feeds are not connected yet.',{exact:false}).isVisible());await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/market-mobile.png',fullPage:true});}
  }
  check('Browsing markets preserves records',fixtureBefore===await page.evaluate(()=>localStorage.getItem('longhand-office.v1.flowless-preview')));
  await page.goto(root+'#portfolios');await page.getByRole('heading',{name:'Paper portfolios',exact:true}).waitFor();check('Three paper steps and separate market search',await page.locator('.paper-steps li').count()===3&&await page.locator('#market-board').count()===0);await page.screenshot({path:out+'/paper-simple-list.png',fullPage:true});
  await page.goto(root+'#portfolio/flowless-demo-portfolio');await page.locator('#ledger-details').waitFor();check('Detailed ledger collapsed initially',await page.locator('#ledger-details').evaluate(e=>!e.open));
  await page.locator('#ledger-details summary').focus();await page.keyboard.press('Enter');check('Ledger detail keyboard accessible',await page.locator('#ledger-details').evaluate(e=>e.open));
  check('Cash and fees retained',await page.locator('[data-value=cash]').innerText()==='444,500'&&await page.locator('[data-value=fees]').innerText()==='5,500');
  await page.locator('#ledger-details summary').click();await page.screenshot({path:out+'/paper-simple-detail.png',fullPage:true});await page.reload();await page.locator('#ledger-details').waitFor();check('Paper records persist unchanged',fixtureBefore===await page.evaluate(()=>localStorage.getItem('longhand-office.v1.flowless-preview')));
  check('Original records unchanged',before===await original.evaluate(()=>localStorage.getItem('longhand-office.v1')));check('No uncaught errors',errors.length===0);
  return {date:'2026-10-13',checks,observations,errors,originalRecordsUnchanged:true};
 }finally{await context.close();}
}
