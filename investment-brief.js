import {dataState} from './data-status.js';
import {tickerRisk} from './ticker-study.js';
import {analysisReference} from './investment-context.js';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const matches=(i,x)=>x?.market===i.market&&x?.ticker===i.ticker;
export function investmentBrief(study,{core=null,valuation=null,advanced=null,now=Date.now()}={}){
 if(!study?.instrument)return null;const i=study.instrument,q=study.quote;
 core=core?.status==='completed'&&matches(i,core.config)&&core.dataset?.observations?.length&&core.results?.modelVersion&&/^[a-f0-9]{64}$/.test(core.resultHash)?core:null;
 valuation=matches(i,valuation?.fundamental)&&valuation.quote?.currency===i.currency?valuation:null;
 advanced=core&&advanced?.sourceRunId===core.id?advanced:null;
 const r=study.risk,v=valuation?.result,issues=[];
 const state=dataState({available:!!q,observedAt:q?.timestamp||q?.date,modelReady:!!study.modelCutoff,hasFundamentals:valuation?finite(v.earningsYield):null,now});
 if(state.kind!=='snapshot')issues.push(state.detail);if(study.historyError)issues.push(study.historyError);
 if(!core)issues.push(study.modelCutoff?'Core model result is pending or not retained for this study.':'No eligible full model history.');
 if(!valuation)issues.push('Matching fundamental valuation is loading or unavailable.');else{issues.push(...v.reasons);if(v.dcfReason)issues.push('FCFE valuation unavailable: '+v.dcfReason);}
 const context={version:1,market:i.market,ticker:i.ticker,currency:i.currency,capturedAt:new Date(now).toISOString(),tickerStudyId:study.id,valuationStudyId:valuation?.id||null,sourcePrice:q?.price??null,priceDate:q?.marketDate||q?.date||null,modelCutoff:core?.config.cutoff||study.modelCutoff};
 return {instrument:i,quote:q,state,context,core,advanced,valuation,risk:r,issues:[...new Set(issues)],analysisRef:analysisReference(core),scenarioRows:v?.rows||[],settings:v?.settings||null};
}
export function briefEvidence(b,{audit=false}={}){
 const i=b.instrument,q=b.quote,v=b.valuation;const pct=n=>finite(n)?(n*100).toFixed(3)+'%':'Unavailable',num=n=>finite(n)?String(n):'Unavailable';
 const lines=['Retained research brief — source observations and hypothetical assumptions; not an investment recommendation.',i.market+' · '+i.ticker+' · '+i.currency,'Captured '+b.context.capturedAt,'Source price '+num(q?.price)+' '+i.currency+'; date '+(b.context.priceDate||'unavailable')];
 if(b.risk)lines.push('Adjusted-price historical annualized volatility '+pct(b.risk.annualizedVolatility)+'; maximum drawdown '+pct(b.risk.hypotheticalMaxDrawdown)+'; '+b.risk.firstDate+' to '+b.risk.lastDate+'; '+b.risk.observedReturns+' observed returns.');
 if(b.core)lines.push('Retained core model: '+b.core.config.basis+' prices; history through '+b.core.config.cutoff+'. Historical model scores are not established prospective performance.');
 if(v){lines.push('Valuation source price '+v.quote.price+' '+i.currency+' on '+v.quote.marketDate+'; fundamental retrieval '+v.fundamental.retrievedAt+'. TTM fiscal-period end is not supplied.','Assumptions: '+v.settings.years+' years; required annual return '+pct(v.settings.requiredReturn)+'; annual growth stress ±'+pct(v.settings.growthSpread)+'; exit P/E stress ±'+pct(v.settings.peSpread)+'; terminal growth '+pct(v.settings.terminalGrowth)+'; cost-of-equity stress ±'+pct(v.settings.discountSpread)+'.');if(v.fundamental.cashflow)lines.push('Annual FCFE period '+v.fundamental.cashflow.periodEnd+'; base FCFE per diluted average share '+num(v.result.baseFcfePerShare)+' '+i.currency+'.');for(const row of b.scenarioRows)lines.push(row.name+': year '+b.settings.years+' earnings price '+num(row.terminalPrice)+'; discounted earnings entry '+num(row.discountedEntry)+'; FCFE DCF '+num(row.dcf)+' '+i.currency+' per share.');lines.push(v.result.assumptionPolicy);}
 lines.push(...b.issues);if(audit){lines.push('Retained source identifiers — use with the complete Office backup.','Ticker study '+b.context.tickerStudyId,'Valuation study '+(v?.id||'unavailable'));if(b.core)lines.push('Core run '+b.core.id+'; '+b.core.results.modelVersion+'; result hash '+b.core.resultHash);}return lines.join('\n');
}
export function compareTickerStudies(studies){
 if(!Array.isArray(studies)||studies.length<2||studies.length>4||new Set(studies.map(s=>s.instrument.market+':'+s.instrument.ticker)).size!==studies.length)throw Error('Choose two to four distinct retained instruments.');
 const groups=new Map();for(const s of studies){const k=s.instrument.market+' · '+s.instrument.currency;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s);}
 return [...groups].map(([group,rows])=>{let common=rows[0].series?.rows.map(r=>r.date)||[];for(const s of rows.slice(1)){const dates=new Set(s.series?.rows.map(r=>r.date)||[]);common=common.filter(d=>dates.has(d));}const dates=new Set(common);let reason=common.length<3?'Insufficient common source observations.':null;
 const results=rows.map(s=>{let risk=null;if(!reason){try{risk=tickerRisk({...s.series,rows:s.series.rows.filter(r=>dates.has(r.date))});}catch(e){reason=e.message;}}return {study:s,risk};});if(reason)for(const r of results)r.risk=null;
 return {group,firstDate:common[0]||null,lastDate:common.at(-1)||null,observations:common.length,reason,rows:results};});
}
