import {validId} from './quant-contract.js';
import {normalizedResearchSeries,portfolioResearch,RESEARCH_VERSION} from './research-math.js';
import {validatePublicQuote} from './public-quote-contract.js';
export const TICKER_STUDY_VERSION='longhand-ticker-1.0.0';
const need=(ok,message)=>{if(!ok)throw Error(message);};
export function resolveTicker(text,manifest){
 const raw=String(text).trim().toUpperCase(),match=raw.match(/^(US:|IDX:)?([A-Z]{1,6}(?:[.-][A-Z])?)(\.JK)?$/);
 if(!match||match[1]==='US:'&&match[3])return [];
 const market=match[1]?.slice(0,-1)||(match[3]?'IDX':null),symbol=match[2].replace('.','-');
 return (manifest.instruments||manifest.histories||[]).filter(i=>i.ticker===symbol&&(!market||i.market===market)&&['US','IDX'].includes(i.market));
}
export function tickerRisk(series){return portfolioResearch({series:[series],basis:'adjusted',weights:[1],annualization:252,riskFreeAnnual:null});}
export function validateTickerStudy(value){
 need(value?.format==='longhand-ticker-study'&&value.version===1&&value.mathVersion===TICKER_STUDY_VERSION&&value.researchVersion===RESEARCH_VERSION,'Unsupported ticker study.');
 need(validId(value.id)&&Number.isFinite(Date.parse(value.savedAt))&&Number.isFinite(Date.parse(value.publishedAt)),'Invalid study identity or date.');
 need(Date.parse(value.savedAt)<=Date.now()+300000&&Date.parse(value.publishedAt)<=Date.now()+300000,'Future study or publication timestamps are not accepted.');
 const i=value.instrument;
 need(i&&['US','IDX'].includes(i.market)&&/^[A-Z]{1,6}(-[A-Z])?$/.test(i.ticker)&&i.currency===(i.market==='US'?'USD':'IDR')&&typeof i.name==='string'&&i.name.length<=300,'Invalid ticker identity or currency.');
 const quote=value.quote===null?null:validatePublicQuote(value.quote,i.market==='US'?'us':'idx',i.ticker,value.publishedAt);
 let series=null,risk=null;
 if(value.series!==null){series=normalizedResearchSeries({series:[value.series]},{basis:'adjusted'})[0];need(series.symbol===i.ticker&&series.currency===i.currency,'History belongs to another instrument.');try{risk=tickerRisk(series);}catch{ /* Retain source rows even when frequency gaps prevent a daily study. */ }}
 need(JSON.stringify(risk)===JSON.stringify(value.risk),'Historical statistics do not reconcile to the retained prices.');
 for(const key of ['quoteError','historyError'])need(value[key]===null||typeof value[key]==='string'&&value[key].length<=1000,'Invalid source status.');
 need(quote!==null||typeof value.quoteError==='string','Missing quote must explain source availability.');
 need(series!==null||typeof value.historyError==='string','Missing history must explain source availability.');
 need(risk!==null||typeof value.historyError==='string','Unavailable risk must explain the history limitation.');
 need(value.runId===null||validId(value.runId),'Invalid saved analysis reference.');
 need(value.modelCutoff===null||/^\d{4}-\d{2}-\d{2}$/.test(value.modelCutoff)&&Number.isFinite(Date.parse(value.modelCutoff))&&new Date(value.modelCutoff).toISOString().slice(0,10)===value.modelCutoff&&value.modelCutoff<=value.publishedAt.slice(0,10),'Invalid model cutoff.');
 return {format:value.format,version:1,mathVersion:TICKER_STUDY_VERSION,researchVersion:RESEARCH_VERSION,id:value.id,savedAt:value.savedAt,publishedAt:value.publishedAt,instrument:{ticker:i.ticker,market:i.market,currency:i.currency,name:i.name},quote,quoteError:value.quoteError,series,risk,historyError:value.historyError,runId:value.runId,modelCutoff:value.modelCutoff};
}
export function validateTickerBackup(value){
 need(value?.format==='longhand-ticker-backup'&&value.version===1&&Array.isArray(value.studies)&&value.studies.length>=1&&value.studies.length<=200,'Use an exported ticker-desk backup with 1–200 studies.');
 const studies=value.studies.map(validateTickerStudy);need(new Set(studies.map(s=>s.id)).size===studies.length,'Duplicate study IDs.');return studies;
}
