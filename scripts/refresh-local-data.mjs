// Refresh the local edition's public data from the original sources, then rebuild the sheet data beside it.
// Run from the repository root:  node scripts/refresh-local-data.mjs   (or: npm run data:refresh)
// Writes only .pages-data (git-ignored); the previous snapshot is kept in .pages-data-previous. The committed design
// preview is never touched: the sheets are rebuilt into .pages-data/sheet-data, which the local server prefers.
// A source that fails keeps its previous value and original date (the app's own retention rule).
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
const failed=[];
const step=(label,cmd,args)=>{console.log('== '+label);const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit'});if(r.status!==0){failed.push(label);console.log('!! FAILED '+label+(r.error?' ('+r.error.message+')':''));}};
await rm(path.join(root,'.pages-data-previous'),{recursive:true,force:true});
await cp(path.join(root,'.pages-data'),path.join(root,'.pages-data-previous'),{recursive:true});
step('yahoo-stock-directory',python,['-I','scripts/yahoo-stock-directory.py']);
for(const s of ['official-rates-data','market-history-data','macro-data','macro-context-data','macro-extended-data','macro-indicators-data','macro-releases-data','fx-history-data','pages-data'])step(s,node,['scripts/'+s+'.mjs']);
step('retain previous values for failed sources',node,['-e',"import('./scripts/retain-macro-data.mjs').then(m=>m.retainMacroData('.pages-data','.pages-data-previous'))"]);
step('retain previous Treasury years that failed',node,['-e',"import('./scripts/official-rates-data.mjs').then(m=>m.retainOfficialRatesFile('.pages-data','.pages-data-previous'))"]);
step('data-coverage',node,['scripts/data-coverage.mjs']);
step('native-prices',node,['scripts/native-prices-data.mjs','.pages-data']);
step('sheet-data',node,['-e',"import('./scripts/sheet-data.mjs').then(async m=>console.log(await m.buildSheetData(process.cwd(),'.pages-data','.pages-data/sheet-data')))"]);
console.log(failed.length?'Done with '+failed.length+' failed step(s): '+failed.join(', ')+'. Their previous data was kept.':'Done. Reload the Office page; the running server reads the new files.');
process.exitCode=failed.length?1:0;
