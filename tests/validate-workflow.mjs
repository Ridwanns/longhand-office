const assert={ok(value,label){if(!value)throw Error('Assertion failed: '+label);},equal(a,b){if(a!==b)throw Error(`Expected ${b}, received ${a}`);},deepEqual(a,b){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Records differ');}};
const output='C:/Users/user/OneDrive/Documents/Longhand Office/validation';
const origin='http://127.0.0.1:4174';
const key='longhand-office.v1';
const recordName='TEST ONLY — weighted-average paper portfolio';

export async function run(original){
 const originalBefore=await original.evaluate(k=>localStorage.getItem(k),key);
 const browser=original.context().browser();
 const source=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const restoreContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const test=await source.newPage(),restored=await restoreContext.newPage();
 const errors=[],checks=[];
 test.on('pageerror',e=>errors.push(e.message));
 restored.on('pageerror',e=>errors.push(e.message));
 const mark=(check,result=true)=>{assert.ok(result,check);checks.push({check,passed:true});};
 const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 async function save(){await test.getByRole('button',{name:'Save record',exact:true}).click();await test.locator('dialog').waitFor({state:'hidden'});}
 async function navigate(hash){await test.goto(origin+'/#'+hash);await test.locator('main h1').waitFor();}
 async function trade(side,date,q,price,fee){
  await test.getByRole('button',{name:'＋ Catat beli / jual'}).click();
  await test.getByLabel('Transaction date',{exact:true}).fill(date);
  await test.getByLabel('Side',{exact:true}).selectOption(side);
  await test.getByLabel('Instrument / ticker',{exact:true}).fill('TEST');
  await test.getByLabel('Quantity',{exact:true}).fill(String(q));
  await test.getByLabel('Price per unit',{exact:true}).fill(String(price));
  await test.getByLabel('Total fee',{exact:true}).fill(String(fee));
  await test.getByLabel('Transaction note',{exact:true}).fill('TEST ONLY — supplied simulation, not a market quote.');
  await test.getByRole('button',{name:'Record transaction',exact:true}).click();
 }
 try {
  await navigate('library');
  mark('Test context starts with no records',await test.evaluate(k=>localStorage.getItem(k)===null,key));
  await test.getByRole('searchbox').fill('Coal Still Burns');
  const report=test.locator('.report-list article').first();
  const reportTitle=await report.locator('h2').innerText();
  const reportHref=await report.locator('h2 a').getAttribute('href');
  await report.getByRole('button',{name:'Use in a thesis'}).click();
  const selectedReport=await test.locator('input[name=reports]:checked').inputValue();
  mark('Selecting public report preselects its attachment',!!selectedReport && reportHref.startsWith('https://longhandresearch.github.io/'));
  await test.getByLabel('Thesis title',{exact:true}).fill('TEST ONLY — coal sector evidence exercise');
  await test.getByLabel('Instrument / ticker (optional)').fill('TEST');
  await test.getByLabel('Assumptions & investment argument').fill('TEST ONLY. Evaluate the published evidence before forming an investment view. No investment recommendation.');
  await test.getByLabel('Supporting evidence',{exact:true}).fill('TEST ONLY — selected Longhand Research report.');
  await test.getByLabel('Risks & what would change your mind').fill('TEST ONLY — incomplete evidence, changing conditions.');
  await test.getByLabel('Review date',{exact:true}).fill('2026-10-12');
  await save();
  let d=await state(test);
  mark('Published report ID saved in thesis',d.theses[0].reports.includes(selectedReport));
  await test.screenshot({path:output+'/thesis-desktop.png',fullPage:true});

  await navigate('portfolios');
  await test.getByRole('button',{name:'＋ New portfolio'}).click();
  await test.getByLabel('Portfolio name').fill(recordName);
  await test.getByLabel('Base currency').selectOption('USD');
  await test.getByLabel('Opening simulated cash (optional)').fill('10000');
  await save();
  await trade('Buy','2026-10-01',100,20,10);await test.locator('dialog').waitFor({state:'hidden'});
  await trade('Buy','2026-10-02',50,24,5);await test.locator('dialog').waitFor({state:'hidden'});
  await trade('Sell','2026-10-03',60,30,6);await test.locator('dialog').waitFor({state:'hidden'});
  await trade('Sell','2026-10-04',30,18,3);await test.locator('dialog').waitFor({state:'hidden'});
  const result=await test.evaluate(async k=>{const d=JSON.parse(localStorage.getItem(k));const {ledger}=await import('./model.js');return ledger(d.portfolios[0]);},key);
  assert.equal(result.cashBalance,9116);assert.equal(result.realized,402);assert.equal(result.fees,24);assert.equal(result.holdings[0].quantity,60);assert.equal(result.holdings[0].cost,1286);
  mark('Whole-share ledger matches independent reference values');
  mark('Displayed cash, fees and realized profit match calculations',(await test.locator('[data-value=cash]').innerText())==='9,116' && (await test.locator('[data-value=fees]').innerText())==='24' && (await test.locator('[data-value=realized]').innerText())==='402');
  mark('Remaining cost explicitly distinguished from market value',await test.getByText('Recorded cost, not market value',{exact:true}).count()===1);
  await test.screenshot({path:output+'/portfolio-desktop.png',fullPage:true});
  const validState=JSON.stringify(await state(test));
  await trade('Sell','2026-10-05',61,30,6);
  await test.locator('.form-error').filter({hasText:'exceeds'}).waitFor();
  mark('Overselling rejected without changing records',JSON.stringify(await state(test))===validState);
  await test.keyboard.press('Escape');
  await trade('Buy','2026-10-05',1000,20,1);
  await test.locator('.form-error').filter({hasText:'Insufficient'}).waitFor();
  mark('Unfunded purchases rejected including fees',JSON.stringify(await state(test))===validState);
  await test.keyboard.press('Escape');
  await trade('Buy','2026-10-05',1,-1,0);
  mark('Negative price rejected by native form constraints',await test.getByLabel('Price per unit').evaluate(e=>!e.validity.valid) && JSON.stringify(await state(test))===validState);
  await test.keyboard.press('Escape');

  await navigate('theses');
  await test.getByRole('button',{name:'Record a decision',exact:true}).click();
  d=await state(test);
  mark('Decision created from thesis preselects its link',await test.getByLabel('Related thesis').inputValue()===d.theses[0].id);
  await test.getByLabel('Decision title',{exact:true}).fill('TEST ONLY — simulated entry and partial exits');
  await test.getByLabel('Decision date',{exact:true}).fill('2026-10-01');
  await test.getByLabel('Review date',{exact:true}).fill('2026-10-12');
  await test.getByLabel('Related portfolio').selectOption(d.portfolios[0].id);
  await test.getByLabel('Reasoning — what did you know?').fill('TEST ONLY — exercise the report → thesis → portfolio → decision chain. Prices and fees are synthetic test inputs.');
  await test.getByLabel('Expected outcome — what would success look like?').fill('TEST ONLY — expected final cash USD 9,116, 60 shares at recorded cost USD 1,286; realized profit USD 402 after fees.');
  await test.locator('input[name=reports]').evaluateAll((es,id)=>es.find(e=>e.value===id).click(),selectedReport);
  await save();
  await test.getByRole('button',{name:'Review outcome',exact:true}).click();
  await test.getByLabel('What happened? What did you learn?').fill('TEST ONLY — arithmetic matched the independent example. Cash USD 9,116; 60 shares with recorded cost USD 1,286; fees USD 24; realized profit USD 402. Market value and unrealized return remain unknown.');
  await test.getByRole('button',{name:'Save outcome review',exact:true}).click();
  await test.locator('dialog').waitFor({state:'hidden'});
  const beforeReload=JSON.stringify(await state(test));
  await test.reload();await test.locator('.outcome').waitFor();
  d=await state(test);
  mark('All records unchanged after reload',JSON.stringify(d)===beforeReload);
  mark('Thesis, portfolio, report and review links persist',d.decisions[0].thesisId===d.theses[0].id && d.decisions[0].portfolioId===d.portfolios[0].id && d.theses[0].reports[0]===selectedReport && d.decisions[0].reports[0]===selectedReport && d.decisions[0].status==='Reviewed' && d.decisions[0].reviewDate==='2026-10-12');
  await test.screenshot({path:output+'/decision-desktop.png',fullPage:true});
  await test.getByRole('button',{name:'Read & edit decision'}).click();
  mark('Editor restores both decision links',await test.getByLabel('Related thesis').inputValue()===d.theses[0].id && await test.getByLabel('Related portfolio').inputValue()===d.portfolios[0].id);
  await test.keyboard.press('Escape');

  await navigate('records');
  const [download]=await Promise.all([test.waitForEvent('download'),test.getByRole('button',{name:'Export records ↓'}).click()]);
  await download.saveAs(output+'/TEST-ONLY-backup.json');
  await restored.goto(origin+'/#records');await restored.locator('main h1').waitFor();
  mark('Restore context starts empty',await restored.evaluate(k=>localStorage.getItem(k)===null,key));
  // A separate origin's sentinel proves restoring port 4174 cannot overwrite port 4173.
  const sentinel=await restoreContext.newPage();await sentinel.goto('http://127.0.0.1:4173/');
  const sentinelValue=JSON.stringify({version:1,portfolios:[],theses:[],decisions:[],testSentinel:'TEST ONLY — protected original origin'});
  await sentinel.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:sentinelValue});
  await restored.getByRole('button',{name:'Restore from backup'}).click();
  await restored.getByLabel('Backup file').setInputFiles(output+'/TEST-ONLY-backup.json');
  await restored.locator('#restore-summary').filter({hasText:'Validated:'}).waitFor();
  const exported=JSON.parse(await restored.getByLabel('Backup file').evaluate(e=>e.files[0].text()));
  assert.deepEqual(exported,d);mark('Export contains every record and link');
  await restored.getByRole('checkbox').check();
  await restored.getByRole('button',{name:'Replace records',exact:true}).click();
  await restored.locator('dialog').waitFor({state:'hidden'});
  assert.deepEqual(await state(restored),exported);mark('Isolated restore matches export field-for-field');
  await restored.reload();assert.deepEqual(await state(restored),exported);mark('Restored records persist after reload');
  mark('Restore leaves original-origin sentinel unchanged',await sentinel.evaluate(k=>localStorage.getItem(k),key)===sentinelValue);
  await restored.getByRole('button',{name:'Restore from backup'}).click();
  await restored.getByLabel('Backup file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":2}')});
  await restored.locator('.form-error').filter({hasText:'supported'}).waitFor();
  mark('Malformed backup rejected without replacing records',await restored.getByRole('button',{name:'Replace records',exact:true}).isDisabled() && JSON.stringify(await state(restored))===JSON.stringify(exported));
  await restored.keyboard.press('Escape');

  await navigate('portfolio/'+d.portfolios[0].id);
  for(const width of [320,390,768]) {
   await test.setViewportSize({width,height:844});
   mark('Portfolio layout fits '+width+'px',await test.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await test.setViewportSize({width:390,height:844});
  await test.screenshot({path:output+'/portfolio-mobile.png',fullPage:true});
  const scrollTable=test.getByRole('region',{name:'Holdings table; scroll horizontally on small screens'});
  await scrollTable.focus();await test.keyboard.press('ArrowRight');await test.waitForTimeout(200);
  mark('Holdings table scrolls with keyboard on mobile',await scrollTable.evaluate(e=>e.scrollLeft>0));
  await test.getByRole('button',{name:'＋ Catat beli / jual'}).click();
  mark('Transaction editor fits mobile width',await test.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
  const controls=test.locator('dialog button,dialog input,dialog select,dialog textarea');
  await controls.last().focus();await test.keyboard.press('Tab');
  mark('Modal keyboard focus stays inside editor',await test.evaluate(()=>document.activeElement.closest('dialog')!==null));
  await test.keyboard.press('Escape');mark('Escape closes the editor',await test.locator('dialog[open]').count()===0);
  await navigate('decisions');
  mark('Decision layout fits mobile',await test.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await test.screenshot({path:output+'/decision-mobile.png',fullPage:true});
  await test.setViewportSize({width:1440,height:1000});
  await navigate('overview');
  mark('Reduced-motion entrance has no animation',await test.locator('.architecture').evaluate(e=>getComputedStyle(e).animationName)==='none');
  await test.locator('.office-room.available a').first().focus();
  mark('Room purpose visible on keyboard focus',(await test.locator('#room-purpose').innerText()).includes('Published Longhand Research'));
  await test.keyboard.press('Enter');await test.waitForURL('**/#library');mark('Keyboard room activation navigates');
  await test.emulateMedia({reducedMotion:'no-preference'});await navigate('overview');
  const animation=await test.locator('.architecture').evaluate(e=>getComputedStyle(e).animationDuration);
  mark('Regular entrance motion remains brief',parseFloat(animation)<=0.7 && parseFloat(animation)>0);
  await test.waitForTimeout(800);await test.screenshot({path:output+'/office-desktop.png',fullPage:true});
  await test.emulateMedia({reducedMotion:'reduce'});await test.setViewportSize({width:390,height:844});await test.reload();await test.locator('.architecture svg').waitFor();
  mark('Overview fits mobile',await test.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await test.screenshot({path:output+'/office-mobile.png',fullPage:true});
  mark('No uncaught browser errors',errors.length===0);
  mark('Existing original browser records unchanged',originalBefore===await original.evaluate(k=>localStorage.getItem(k),key));
  const summary={date:'2026-10-12',checks,reportTitle,reportHref,ledger:result,originalRecordsUnchanged:true,isolatedRestore:true,browserErrors:errors};
  return summary;
 } finally {
  await source.close();await restoreContext.close();
 }
}
