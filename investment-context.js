const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
export function validateResearchContext(c){
 if(!c||c.version!==1||!['US','IDX'].includes(c.market)||!/^[A-Z]{1,6}(-[A-Z])?$/.test(c.ticker)||c.currency!==(c.market==='IDX'?'IDR':'USD')||!Number.isFinite(Date.parse(c.capturedAt))||!uuid(c.tickerStudyId)||!(c.valuationStudyId===null||uuid(c.valuationStudyId))||!(c.sourcePrice===null||typeof c.sourcePrice==='number'&&Number.isFinite(c.sourcePrice)&&c.sourcePrice>0)||!(c.priceDate===null||date(c.priceDate))||!(c.modelCutoff===null||date(c.modelCutoff)))throw Error('Invalid retained research context.');
 return c;
}
export const researchSymbol=c=>c.market==='IDX'?c.ticker+'.JK':c.ticker;
const normalize=(symbol,market)=>market==='IDX'?String(symbol).toUpperCase().replace(/\.JK$/,''):String(symbol).toUpperCase().replace('.','-');
export function transactionSymbol(context,portfolio){const existing=[...new Set(portfolio.transactions.map(t=>t.symbol))].filter(s=>normalize(s,context.market)===context.ticker);return existing.length===1?existing[0]:existing.length>1?'':researchSymbol(context);}
export function analysisReference(run){return run?{runId:run.id,ticker:run.config.ticker,market:run.config.market,cutoff:run.config.cutoff,modelVersion:run.results.modelVersion,resultHash:run.resultHash}:null;}
export function checkPaperLink(records,portfolioId,decisionId,thesisId,symbol){
 const p=records.portfolios.find(p=>p.id===portfolioId),d=records.decisions.find(d=>d.id===decisionId),t=records.theses.find(t=>t.id===thesisId);
 if(!p||(p.mode||'paper')!=='paper'||!d||!t||d.thesisId!==t.id||d.portfolioId&&d.portfolioId!==p.id)throw Error('Choose the paper portfolio linked to this decision. Existing links were preserved.');
 const c=d.researchContext||t.researchContext;if(!c||p.currency!==c.currency||normalize(symbol,c.market)!==c.ticker)throw Error('Paper transaction must match the research instrument and currency.');
 return {p,d,t};
}
