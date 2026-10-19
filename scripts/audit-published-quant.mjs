// Three retained public-data runs reconciled by Python's independent Cholesky solver.
// This samples live application math, not every instrument/model combination.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {configFor,acquirePublishedHistory} from './quant-data.mjs';
import {analyze} from '../quant-math.js';
const manifest=JSON.parse(await readFile('.pages-data/manifest.json','utf8'));
await mkdir('validation',{recursive:true});
const results=[];
for(const [market,ticker] of [['US','AAPL'],['IDX','BBCA'],['US','BND']]){
 const entry=manifest.histories.find(h=>h.market===market&&h.ticker===ticker);
 if(!entry?.modelCutoff)throw Error('Missing public model history '+ticker);
 const config=configFor({market,ticker,cutoff:entry.modelCutoff,basis:'adjusted',horizon:20,seed:20261020,historySource:'published-yahoo'});
 const dataset=await acquirePublishedHistory(config),run={id:randomUUID(),config,dataset,results:analyze(dataset,config)};
 const file='validation/independent-quant-input-'+ticker+'.json',output='validation/independent-quant-'+ticker+'.json';
 await writeFile(file,JSON.stringify(run));
 const reference=spawnSync('python',['scripts/reference-quant.py','--file',file,'--output',output],{encoding:'utf8',timeout:180000});
 if(reference.status!==0)throw Error(reference.stderr||reference.stdout||'Independent Python failed');
 results.push(JSON.parse(reference.stdout));
}
await writeFile('validation/published-quant-audit.json',JSON.stringify({auditedAt:new Date().toISOString(),results,scope:'AAPL, BBCA and BND adjusted public histories. Independent historical risk, final AR1/Ridge forecasts, score arithmetic and maturity chronology; not a refit of every model or every security.'},null,2));
console.log(JSON.stringify({results}));
