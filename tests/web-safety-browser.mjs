export async function run(original){
 const c=await original.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[],requests=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});},root='http://127.0.0.1:4175/office/';
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
 try{
  await p.goto(root+'#overview');await p.locator('h1').waitFor();
  const safety=await p.evaluate(async()=>{
   const {api}=await import('./browser-api.js'),data={version:1,portfolios:[],theses:[],decisions:[]},id=crypto.randomUUID();
   const a=await api('workspace',{id,revision:0,data});
   const saved=await Promise.allSettled([api('workspace',{id,revision:a.revision,data}),api('workspace',{id,revision:a.revision,data})]);
   const current=await api('workspace?id='+id),snapshots=await api('backups?id='+id);
   let stale,invalid;try{await api('workspace',{id,revision:1,data});}catch(e){stale=e.message;}
   try{await api('workspace',{id,revision:current.revision,data:{...data,version:999}});}catch(e){invalid=e.message;}
   const after=await api('workspace?id='+id),later=await api('backups?id='+id);
   return {oneWinner:saved.filter(r=>r.status==='fulfilled').length===1,revision:current.revision,stale,invalid,unchanged:JSON.stringify(current)===JSON.stringify(after),sameSnapshots:snapshots.length===later.length};
  });
  check('Only one concurrent browser-vault save wins',safety.oneWinner&&safety.revision===2);check('Stale revision rejects without overwrite',safety.stale.includes('changed')&&safety.unchanged);check('Invalid records reject before writing',!!safety.invalid&&safety.sameSnapshots);
  await p.goto(root+'#quant');await p.locator('[data-desk-mode=advanced]').click();await p.locator('[data-history-ticker=AAPL]').first().waitFor({state:'attached'});
  const result=await p.evaluate(async()=>{const {api}=await import('./browser-api.js'),id=crypto.randomUUID(),config={id,ticker:'AAPL',market:'US',cutoff:'2026-10-09',horizon:5,seed:123,basis:'adjusted'};const a=await api('runs',config),b=await api('runs',config);let conflict;try{await api('runs',{...config,ticker:'MSFT'});}catch(e){conflict=e.message;}return {id,a:a.id,b:b.id,conflict};});
  check('Repeated request UUID is idempotent',result.a===result.b);check('Different ticker cannot reuse a request UUID',result.conflict.includes('different'));
  await p.goto(root+'#quant/run/'+result.id);await p.locator('.quant-values').waitFor({state:'attached',timeout:60000});
  const integrity=await p.evaluate(async()=>{const {api}=await import('./browser-api.js'),r=document.querySelector('#quant-run')._run,bad=structuredClone(r);bad.results.simulation.terminal.bins=[];const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(bad.results)));bad.resultHash=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');let message;try{await api('validate-backup',{format:'longhand-office-backup',formatVersion:2,records:{version:1,portfolios:[],theses:[],decisions:[]},analyses:[bad]});}catch(e){message=e.message;}return {message,unchanged:(await api('run/'+r.id)).resultHash===r.resultHash};});
  check('Rehashed malformed analysis backup rejects in browser',integrity.message.includes('incomplete'));check('Rejected analysis leaves existing run unchanged',integrity.unchanged);
  const cancel=await p.evaluate(async()=>{const {api}=await import('./browser-api.js'),id=crypto.randomUUID();await api('runs',{id,ticker:'MSFT',market:'US',cutoff:'2026-10-09',horizon:20,seed:123,basis:'raw'});await api('cancel',{id});return id;});await p.waitForTimeout(1000);check('Cancellation remains persisted after worker callbacks',await p.evaluate(async id=>{const {api}=await import('./browser-api.js');return (await api('run/'+id)).status==='cancelled';},cancel));
  for(const width of [1440,390,320]){await p.setViewportSize({width,height:900});for(const route of ['overview','portfolios','theses','decisions','library','records','market/us','market/idx','market/bonds','market/commodities','market/macro','quant','quant/run/'+result.id]){await p.goto(root+'#'+route);await p.locator('h1').waitFor();if(route.startsWith('quant/run'))await p.locator('.quant-values').waitFor({state:'attached'});check(route.split('/').slice(0,2).join('/')+' fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
  await p.goto(root+'#quant');await p.locator('[data-desk-mode=advanced]').click();await p.locator('[data-history-ticker=AAPL]').first().waitFor({state:'attached'});await p.locator('a.skip').focus();await p.keyboard.press('Enter');check('Skip link preserves Quant and focuses main',p.url().endsWith('#quant')&&await p.evaluate(()=>document.activeElement.id==='main'));check('Reduced-motion animation suppression',await p.locator('#main').evaluate(e=>getComputedStyle(e).animationName==='none'));
  check('No private-record network uploads or local API requests',requests.every(r=>r.method==='GET'&&!r.body&&!r.url.includes('/api/')&&!r.url.includes('4173')&&!r.url.includes('4174')&&!r.url.includes('8000')));
  check('No browser exceptions',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
