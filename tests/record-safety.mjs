const key='longhand-office.v1',origin='http://127.0.0.1:4174';
const legacy={version:1,portfolios:[{id:'legacy-portfolio',name:'TEST ONLY — legacy portfolio',currency:'USD',transactions:[{id:'legacy-buy',symbol:'TEST',date:'2026-10-01',side:'Buy',quantity:1.12345678,price:10,fee:0,note:'TEST ONLY — legacy precision'}]}],theses:[{id:'legacy-thesis',title:'TEST ONLY — retained report',symbol:'TEST',status:'Draft',assumptions:'TEST',evidence:'TEST',risks:'TEST',reviewDate:'2026-10-12',reports:['published-report-not-in-current-snapshot']}],decisions:[{id:'legacy-decision',title:'TEST ONLY — legacy decision',date:'2026-10-01',reviewDate:'2026-10-12',rationale:'TEST',expected:'TEST',outcome:'',status:'Open',thesisId:'legacy-thesis',reports:[]}]};
export async function run(original){
 const before=await original.evaluate(k=>localStorage.getItem(k),key);
 const context=await original.context().browser().newContext({reducedMotion:'reduce'});
 const test=await context.newPage(),checks=[];
 const check=(name,value)=>{if(!value)throw Error('Assertion failed: '+name);checks.push({check:name,passed:true});};
 const stored=()=>test.evaluate(k=>localStorage.getItem(k),key);
 const set=v=>test.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:JSON.stringify(v)});
 try {
  await test.goto(origin);await test.locator('main h1').waitFor();await set(legacy);await test.reload();await test.locator('main h1').waitFor();
  check('Legacy records load without a storage write',await stored()===JSON.stringify(legacy));
  await test.goto(origin+'/#portfolio/legacy-portfolio');
  check('Legacy cash is unknown instead of invented',await test.locator('[data-value=cash]').innerText()==='Not recorded');
  await test.goto(origin+'/#theses');await test.getByRole('button',{name:'Read & edit thesis'}).click();
  check('Missing catalogue reference remains selected',await test.locator('input[value="published-report-not-in-current-snapshot"]').isChecked());
  await test.getByLabel('Thesis title',{exact:true}).fill('TEST ONLY — retained report after edit');await test.getByRole('button',{name:'Save record',exact:true}).click();await test.locator('dialog').waitFor({state:'hidden'});
  check('Editing a thesis preserves unavailable report links',JSON.parse(await stored()).theses[0].reports[0]==='published-report-not-in-current-snapshot');
  check('Editing preserves unrelated legacy transaction precision',JSON.parse(await stored()).portfolios[0].transactions[0].quantity===1.12345678);
  await test.goto(origin+'/#decisions');await test.getByRole('button',{name:'Read & edit decision'}).click();
  check('Legacy decision opens without portfolio field in its backup',await test.getByLabel('Related portfolio').inputValue()==='');await test.keyboard.press('Escape');

  await test.goto(origin+'/#portfolio/legacy-portfolio');await test.getByRole('button',{name:'Edit portfolio'}).click();
  await test.getByLabel('Portfolio name').fill('TEST ONLY — stale attempted name');
  const newer=JSON.parse(await stored());newer.portfolios[0].name='TEST ONLY — newer stored name';await set(newer);
  await test.getByRole('button',{name:'Save record',exact:true}).click();await test.locator('.form-error').filter({hasText:'changed in another tab'}).waitFor();
  check('Stale save rejects without overwriting newer records',await stored()===JSON.stringify(newer));await test.keyboard.press('Escape');await test.reload();
  const other=await context.newPage();await other.goto(origin+'/#portfolios');await other.locator('main h1').waitFor();
  await test.getByRole('button',{name:'Edit portfolio'}).click();
  const updated=structuredClone(newer);updated.portfolios[0].name='TEST ONLY — change from another tab';await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:JSON.stringify(updated)});
  await test.locator('dialog').waitFor({state:'hidden'});
  check('Storage event closes a stale editor and shows newer records',await test.getByRole('heading',{name:updated.portfolios[0].name}).count()===1);
  await other.close();

  await test.goto(origin+'/#records');await test.getByRole('button',{name:'Restore from backup'}).click();
  await test.getByLabel('Backup file').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await test.locator('#restore-summary').filter({hasText:'Validated:'}).waitFor();
  const afterOpen=structuredClone(updated);afterOpen.portfolios[0].name='TEST ONLY — changed while restore open';await set(afterOpen);
  await test.getByRole('checkbox').check();await test.getByRole('button',{name:'Replace records',exact:true}).click();await test.locator('.form-error').filter({hasText:'Records changed'}).waitFor();
  check('Restore rejects replacement after a concurrent record change',await stored()===JSON.stringify(afterOpen));await test.keyboard.press('Escape');await test.reload();
  await test.getByRole('button',{name:'Restore from backup'}).click();
  await test.evaluate(()=>{const original=File.prototype.text;File.prototype.text=async function(){if(this.name==='slow.json')await new Promise(r=>setTimeout(r,500));return original.call(this);};});
  await test.getByLabel('Backup file').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await test.getByLabel('Backup file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":2}')});
  await test.waitForTimeout(600);
  check('A slower previous file cannot override the latest invalid file',await test.getByRole('button',{name:'Replace records',exact:true}).isDisabled() && (await test.locator('.form-error').innerText()).includes('supported'));
  check('Safety tests do not change original browser records',before===await original.evaluate(k=>localStorage.getItem(k),key));
  return {checks,originalRecordsUnchanged:true};
 } finally {await context.close();}
}
