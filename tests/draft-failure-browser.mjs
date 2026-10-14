export async function run(original,base='http://127.0.0.1:4175/office/'){
 const c=await original.context().browser().newContext({reducedMotion:'reduce'}),p=await c.newPage(),checks=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(name,ok)=>{if(!ok)throw Error(name);checks.push({name,passed:true});};
 try{
 await p.goto(base+'#quant');await p.locator('[data-quant-jump=calculator]').click();
 await p.waitForFunction(()=>document.querySelector('[data-draft-state=atlas]')?.textContent.includes('Drafts save automatically'));
 const records=await p.evaluate(()=>{const saved=Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('records.'))),original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args){if(this.name.includes('continuity.')&&args[1]==='readwrite')throw new DOMException('TEST ONLY simulated quota failure','QuotaExceededError');return original.apply(this,args);};return saved;});
 await p.locator('#atlas-form [name=asset]').fill('TEST ONLY recover after storage failure');
 await p.waitForFunction(()=>document.querySelector('[data-draft-state=atlas]').textContent.includes('Not saved'));
 check('Failed autosave is explicitly identified',await p.locator('[data-draft-state=atlas]').innerText().then(s=>s.includes('Not saved')));
 const pending=p.waitForEvent('download');await p.locator('#atlas-form').getByRole('button',{name:'Export draft',exact:true}).click();
 check('Raw draft export remains available after a failed save',(await pending).suggestedFilename()==='longhand-atlas-draft.json');
 await p.waitForTimeout(500);check('Export does not leave a misleading Saving indicator',await p.locator('[data-draft-state=atlas]').innerText().then(s=>s.includes('Not saved')&&!s.includes('Saving')));
 await p.locator('#atlas-form [name=source]').fill('TEST ONLY still recoverable');await p.waitForTimeout(500);
 check('Later edits preserve the failure notice and raw input',await p.locator('[data-draft-state=atlas]').innerText().then(s=>s.includes('Not saved'))&&await p.locator('#atlas-form [name=asset]').inputValue()==='TEST ONLY recover after storage failure');
 check('Complete backup refuses an unsaved draft',await p.evaluate(async()=>{try{await(await import('./complete-backup.js')).exportCompleteBackup();return false;}catch{return true;}}));
 check('Office records are unchanged by research storage failure',await p.evaluate(saved=>JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('records.'))))===JSON.stringify(saved),records));
 check('No unhandled JavaScript errors',errors.length===0);return {checks,errors};
 }finally{await c.close();}
}
