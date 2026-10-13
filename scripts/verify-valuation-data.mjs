import {readFile} from 'node:fs/promises';
import {autoValuation} from '../auto-valuation-math.js';
import {validatePublicQuote} from '../public-quote-contract.js';
const f=JSON.parse(await readFile('.pages-data/fundamentals.json','utf8')),m=JSON.parse(await readFile('.pages-data/market.json','utf8'));
if(f.format!=='longhand-public-fundamentals'||f.version!==1||!Array.isArray(f.records)||!f.records.length||!Number.isFinite(Date.parse(f.publishedAt)))throw Error('Invalid fundamental publication.');
const seen=new Set(),counts={records:f.records.length,pricedStudies:0,earningsEligible:0,dcfEligible:0,sourcePriceUnavailable:0,currencyWithheld:0};
for(const item of f.records){const key=item.market+':'+item.ticker;if(seen.has(key))throw Error('Duplicate fundamental identity '+key);seen.add(key);const quote=m.quotes?.[(item.market==='IDX'?'idx':'us')+':'+item.ticker]?.quote;if(!quote){counts.sourcePriceUnavailable++;continue;}validatePublicQuote(quote,item.market==='IDX'?'idx':'us',item.ticker,m.publishedAt);const result=autoValuation(item,quote);counts.pricedStudies++;if(result.currentPe!==null)counts.earningsEligible++;if(result.baseFcfePerShare!==null)counts.dcfEligible++;if(item.financialCurrency!==item.currency)counts.currencyWithheld++;}
console.log(JSON.stringify(counts));
