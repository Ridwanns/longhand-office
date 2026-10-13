export async function run(original){
 const context=await original.context().browser().newContext({reducedMotion:'reduce'}),page=await context.newPage(),checks=[],errors=[];
 const out='C:/Users/user/OneDrive/Documents/Longhand Office/validation',root='http://127.0.0.1:4174/?test-workspace=5e47296c-98e7-4a57-a105-457961efabba';
 page.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 try{
  for(const theme of ['light','dark'])for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await page.goto(root+'#overview');await page.locator('h1').waitFor();await page.evaluate(theme=>{localStorage.setItem('longhand-office.theme',theme);},theme);
   for(const [room,hash] of [['portfolio','portfolio/28e6e6f5-397d-4314-bf27-0a9861513ecc'],['quant','quant/run/621a3661-ec2e-432c-aa37-0e999967bcda']]){
    await page.goto(root+'#'+hash);await page.reload();await page.locator(room==='quant'?'.quant-values':'[data-value=cash]').waitFor();
    check(room+' '+theme+' '+width+' theme and no document overflow',await page.evaluate(theme=>document.documentElement.dataset.theme===theme&&document.documentElement.scrollWidth<=innerWidth,theme));
    if(width!==320)await page.screenshot({path:out+'/audit-'+room+'-'+theme+'-'+width+'.png',fullPage:true});
   }
  }
  check('Populated views have no browser JavaScript exceptions',errors.length===0);return {checks,errors};
 }finally{await context.close();}
}
