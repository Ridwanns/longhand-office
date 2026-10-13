import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {configFor,normalizeHistory,hash} from './quant-data.mjs';
import {analyze} from '../quant-math.js';
import {validateAnalysis} from './analysis-backup.mjs';
import {validatePublicQuote} from '../public-quote-contract.js';
const manifest=JSON.parse(await readFile('.pages-data/manifest.json','utf8')),cases=[],unavailable=[];
for(const h of manifest.histories){if(!h.modelCutoff){unavailable.push({ticker:h.ticker,market:h.market,reason:'No eligible contiguous 350-observation cutoff.'});continue;}const input=JSON.parse(await readFile('.pages-data/'+h.file,'utf8'));
 for(const basis of ['raw','adjusted'])for(const horizon of [5,20]){const config=configFor({ticker:h.ticker,market:h.market,cutoff:h.modelCutoff,basis,horizon,seed:20261013});try{const dataset=normalizeHistory(input.rows,config,input.metadata),results=analyze(dataset,config),run={id:randomUUID(),status:'completed',version:1,config,configHash:hash(config),dataset,results,resultHash:hash(results),codeHash:'offline-public-universe-verification'};validateAnalysis(run);cases.push({ticker:h.ticker,market:h.market,basis,horizon,observations:dataset.observations.length,cutoff:h.modelCutoff,passed:true});}catch(e){cases.push({ticker:h.ticker,market:h.market,basis,horizon,passed:false,error:e.message});}}
}
const market=JSON.parse(await readFile('.pages-data/market.json','utf8')),quotes=Object.entries(market.quotes).map(([instrument,r])=>{const [category,symbol]=instrument.split(':');try{validatePublicQuote(r.quote,category,symbol,market.publishedAt);return {instrument,passed:true,source:r.quote.provider};}catch(e){return {instrument,passed:false,error:r.error||e.message};}});
await mkdir('validation',{recursive:true});await writeFile('validation/universe-model-results.json',JSON.stringify({publishedAt:manifest.publishedAt,cases,unavailable,providerErrors:manifest.errors,quotes},null,2));
const failures=cases.filter(r=>!r.passed);console.log(JSON.stringify({histories:manifest.histories.length,modelCases:cases.length,passed:cases.length-failures.length,failures,unavailable,quoteCases:quotes.length,quoteFailures:quotes.filter(r=>!r.passed)}));if(failures.length||unavailable.length||quotes.some(r=>!r.passed))process.exitCode=1;
