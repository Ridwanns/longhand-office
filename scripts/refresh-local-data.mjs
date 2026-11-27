// Refresh the local edition's public data from the original sources, then rebuild the sheet data beside it.
// Run from the repository root:  node scripts/refresh-local-data.mjs   (or: npm run data:refresh)
// It follows the same steps, in the same order, as the Pages publication (.github/workflows/pages.yml), with the
// previous local snapshot as the baseline instead of the previous Pages artifact.
// Writes only .pages-data (git-ignored); the previous snapshot is kept in .pages-data-previous. The committed design
// preview is never touched: the sheets are rebuilt into .pages-data/sheet-data, which the local server prefers.
// A source that fails keeps its previous value and original date (the app's own retention rule). A failed check is
// reported and the data is still written, so you can see what the check objected to.
// This runner only orchestrates: every step runs in the patched Node runtime that the data scripts require.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {cp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const root=process.cwd();
if(!existsSync(path.join(root,'scripts','pages-data.mjs'))||!existsSync(path.join(root,'.pages-data')))throw Error('Run this from the Longhand Office folder, which needs an existing .pages-data snapshot.');
const local=process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local');
const node=[path.join(root,'.tools','security-node','node-v24.22.1-win-x64','node.exe'),path.join(local,'node-portable','node-v24.22.1-win-x64','node.exe')].find(existsSync)||process.execPath;
const python=[path.join(root,'.tools','yfinance','Scripts','python.exe')].find(existsSync)||'python';
const PREVIOUS='.pages-data-previous';
const failed=[],checks=[];
const run=(label,cmd,args,{check=false,env={}}={})=>{console.log('\n== '+(check?'check: ':'')+label+' ('+new Date().toLocaleTimeString()+')');const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});if(r.status!==0){(check?checks:failed).push(label);console.log('!! '+(check?'CHECK FAILED ':'FAILED ')+label+(r.error?' ('+r.error.message+')':''));}return r.status===0;};
const js=(label,code,options)=>run(label,node,['-e',code],options);
const started=Date.now();
await rm(path.join(root,PREVIOUS),{recursive:true,force:true});
await cp(path.join(root,'.pages-data'),path.join(root,PREVIOUS),{recursive:true});
// 1. stock directory, valuation cash flows and the published stock snapshot
const directory=run('yahoo-stock-directory',python,['-I','scripts/yahoo-stock-directory.py']);
if(directory)run('valuation cash flows',python,['-I','scripts/collect-valuation-cashflows.py']);
run('pages-data (quotes, histories, fundamentals)',node,['scripts/pages-data.mjs']);
for(const s of ['verify-valuation-data','verify-advanced-publication','verify-pages-universe'])run(s,node,['scripts/'+s+'.mjs'],{check:true});
// 2. official rates, long market histories, FX
run('official-rates-data (US Treasury)',node,['scripts/official-rates-data.mjs']);
js('retain previous Treasury years that failed',`import('./scripts/official-rates-data.mjs').then(m=>m.retainOfficialRatesFile('.pages-data','${PREVIOUS}'))`);
for(const s of ['market-history-data','fx-history-data'])run(s,node,['scripts/'+s+'.mjs']);
// 3. macro, then keep the previous value of any series whose refresh failed
for(const s of ['macro-data','macro-context-data','macro-releases-data','macro-indicators-data','macro-extended-data'])run(s,node,['scripts/'+s+'.mjs']);
js('retain previous values for failed macro series',`import('./scripts/retain-macro-data.mjs').then(m=>m.retainMacroData('.pages-data','${PREVIOUS}'))`);
// the audits are repository scripts that import their sibling modules, so they run as the CI runs them (without -I)
run('audit-macro-extended',python,['scripts/audit-macro-extended.py','--baseline',PREVIOUS+'/macro-extended.json'],{check:true});
if(run('verify-macro-outlook',node,['scripts/verify-macro-outlook.mjs'],{check:true}))run('audit-macro-outlook',python,['scripts/audit-macro-outlook.py'],{check:true});
// 4. issuer evidence and source revisions against the previous snapshot
run('sec-fundamentals',node,['scripts/sec-fundamentals.mjs']);
js('source-integrity (revisions, reviewed IDX filings)',`import('./scripts/source-integrity-data.mjs').then(m=>m.collectSourceIntegrity({baseline:'${PREVIOUS}'}))`);
// 5. coverage, native price buckets, sheets
run('data-coverage',node,['scripts/data-coverage.mjs']);
run('native-prices',node,['scripts/native-prices-data.mjs','.pages-data']);
js('sheet-data',"import('./scripts/sheet-data.mjs').then(async m=>console.log(await m.buildSheetData(process.cwd(),'.pages-data','.pages-data/sheet-data')))");
const minutes=((Date.now()-started)/60000).toFixed(1);
console.log('\n'+(failed.length?'Done in '+minutes+' min with '+failed.length+' failed source step(s): '+failed.join(', ')+'. Their previous data was kept.':'Done in '+minutes+' min. Every source step succeeded.')+(checks.length?' Checks that failed: '+checks.join(', ')+'.':' Every check passed.')+' Reload the Office page; the running server reads the new files.');
process.exitCode=failed.length||checks.length?1:0;
