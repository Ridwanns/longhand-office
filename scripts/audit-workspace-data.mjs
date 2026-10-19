// Read-only coverage and contract audit. No model refitting or personal records.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {validatePublicQuote} from '../public-quote-contract.js';
import {configFor,normalizeHistory} from './quant-data.mjs';
import {validateMacroFeed} from '../macro-contract.js';
import {validateMacroContext} from '../macro-context-contract.js';
import {validateMacroReleases} from '../macro-releases-contract.js';
import {validateMacroExtended} from '../macro-extended-contract.js';
import {validateOfficialRates} from '../official-rates-contract.js';
import {validateFxHistory} from '../fx-history-contract.js';
import {validateMarketHistories} from '../market-history-contract.js';
import {validateSecFeed} from '../sec-fundamentals-contract.js';
import {autoValuation} from '../auto-valuation-math.js';
const directory=path.resolve(process.argv.find(x=>x.startsWith('--data='))?.slice(7)||'.pages-data');
const read=name=>readFile(path.join(directory,name),'utf8'),json=async name=>JSON.parse(await read(name));
const report={auditedAt:new Date().toISOString(),directory,checks:[],unavailable:[],failures:[]};
const validators={'macro.json':validateMacroFeed,'macro-context.json':validateMacroContext,'macro-releases.json':validateMacroReleases,'macro-extended.json':validateMacroExtended,'official-rates.json':validateOfficialRates,'fx-history.json':validateFxHistory,'market-history.json':validateMarketHistories,'sec-fundamentals.json':validateSecFeed};
for(const [file,validate]of Object.entries(validators)){
 try{const data=validate(await json(file)),series=data.series||data.entries||data.records||[data];let observations=0;
  for(const s of series){const rows=s.observations||s.quote?.history||s.annual?.facts||[];observations+=rows.length;if(s.error||s.status==='unavailable'||data.series&&(!rows.length||rows.every(o=>o.value===null)))report.unavailable.push({file,id:s.id||s.symbol||s.ticker||s.category||'feed',reason:s.error||s.reason||'No numeric observations'});}
  report.checks.push({file,series:series.length,observations,publication:data.generatedAt||data.publishedAt||data.retrievedAt});
 }catch(e){report.failures.push({file,error:e.message});}
}
const manifest=await json('manifest.json'),market=await json('market.json');let quotes=0,histories=0,normalized=0,priceOnly=0;
if(manifest.format!=='longhand-public-market-data'||market.publishedAt!==manifest.publishedAt||!Array.isArray(manifest.instruments)||!Array.isArray(manifest.histories))throw Error('Market manifest/publication mismatch');
for(const [key,item]of Object.entries(market.quotes)){
 const [category,ticker]=key.split(':');if(!item.quote){report.unavailable.push({file:'market.json',id:key,reason:item.error||'No quote'});continue;}
 try{validatePublicQuote(item.quote,category,ticker,market.publishedAt);quotes++;}catch(e){report.failures.push({file:'market.json',id:key,error:e.message});}
}
const seen=new Set();
for(const h of manifest.histories){
 const key=h.market+':'+h.ticker;
 try{
  if(seen.has(key)||h.file!=='history/'+h.market+'-'+h.ticker+'.json'||!/^history\/(US|IDX)-[A-Z]{1,6}(?:-[A-Z])?\.json$/.test(h.file))throw Error('Duplicate or invalid history identity');seen.add(key);
  const raw=await json(h.file),m=raw.metadata;if(raw.rows.length!==h.rows)throw Error('History length differs from manifest');
  if(m.ticker!==h.ticker||m.market!==h.market||m.provider!=='yahoo'||m.currency!==(h.market==='IDX'?'IDR':'USD')||!['EQUITY','ETF'].includes(m.instrumentType)||m.retrievedAt!==h.retrievedAt||!Number.isFinite(Date.parse(m.retrievedAt))||Date.parse(m.retrievedAt)>Date.now()+300000||!/^[a-f0-9]{64}$/.test(m.sourceHash)||raw.rows.some(r=>typeof r.complete!=='boolean')||!(h.market==='IDX'?m.listing==='JKT'&&m.timezone==='Asia/Jakarta':['NMS','NGM','NCM','NYQ','ASE','PCX','BTS','BATS'].includes(m.listing)))throw Error('History identity, currency, exchange or acquisition mismatch');
  if(h.modelCutoff){for(const basis of ['raw','adjusted']){const config=configFor({market:h.market,ticker:h.ticker,cutoff:h.modelCutoff,basis,horizon:20,seed:20261020,historySource:'published-yahoo'});const dataset=normalizeHistory(raw.rows,config,m);normalized+=dataset.observations.length;}}
  else priceOnly++;
  histories++;
 }catch(e){report.failures.push({file:h.file,id:key,error:e.message});}
}
report.market={publishedAt:manifest.publishedAt,quotes,quoteEntries:Object.keys(market.quotes).length,histories,eligibleHistories:histories-priceOnly,priceOnly,normalizedObservations:normalized};
const fundamentals=await json('fundamentals.json'),cashflows=await json('cashflows.json'),ids=new Set();let priced=0,earnings=0,fcfe=0;
if(fundamentals.format!=='longhand-public-fundamentals'||fundamentals.version!==1||fundamentals.publishedAt!==manifest.publishedAt||!Array.isArray(fundamentals.records)||cashflows.format!=='longhand-public-cashflows'||cashflows.version!==1)throw Error('Fundamental or cash-flow publication mismatch');
for(const f of fundamentals.records){const key=f.market+':'+f.ticker;try{if(ids.has(key))throw Error('Duplicate fundamental identity');ids.add(key);const quote=market.quotes[(f.market==='IDX'?'idx:':'us:')+f.ticker]?.quote;if(!quote)continue;const result=autoValuation(f,quote);priced++;if(result.currentPe!==null)earnings++;if(result.baseFcfePerShare!==null)fcfe++;}catch(e){report.failures.push({file:'fundamentals.json',id:key,error:e.message});}}
for(const c of cashflows.records){const f=fundamentals.records.find(f=>f.ticker===c.ticker&&f.market===c.market);if(!f||JSON.stringify(c.cashflow)!==JSON.stringify(f.cashflow)||c.error!==f.cashflowError||c.retrievedAt!==f.cashflowRetrievedAt)report.failures.push({file:'cashflows.json',id:c.market+':'+c.ticker,error:'Cash-flow evidence differs from fundamental publication'});}
report.fundamentals={publishedAt:fundamentals.publishedAt,records:fundamentals.records.length,priced,earningsEligible:earnings,fcfeEligible:fcfe,cashflowRecords:cashflows.records.length,cashflowsAvailable:cashflows.records.filter(r=>r.cashflow).length,cashflowRetrievedAt:cashflows.retrievedAt};
await mkdir('validation',{recursive:true});await writeFile('validation/workspace-data-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(report.failures.length)process.exitCode=1;
