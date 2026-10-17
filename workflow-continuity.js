import {analysisReference} from './investment-context.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds=new Set(['core','advanced','valuations','predictions','tickers','manual']);
export function studyHref(kind,id){if(!kinds.has(kind)||!id)throw Error('Unknown research destination.');return kind==='core'?'#quant/run/'+encodeURIComponent(id):'#quant/study/'+kind+'/'+encodeURIComponent(id);}
export function studyDestination(route){const m=route.match(/^quant\/study\/(advanced|valuations|predictions|tickers|manual)\/([^/]+)$/);if(!m)return null;try{return {kind:m[1],id:decodeURIComponent(m[2])};}catch{return null;}}
export function recordDestination(route){const m=route.match(/^(theses|decisions)\/([^/]+)(\/reviews)?$/);if(!m)return null;try{return {kind:m[1],id:decodeURIComponent(m[2]),reviews:!!m[3]};}catch{return null;}}
export const recordHref=(kind,id,reviews=false)=>'#'+kind+'/'+encodeURIComponent(id)+(reviews?'/reviews':'');
export function eligiblePortfolios(records,context,mode='paper'){return records.portfolios.filter(p=>(p.mode||'paper')===mode&&p.currency===context.currency);}

// Navigation/evidence only: original artifacts are never mutated or recomputed.
// Non-core archive identifiers live in existing prose, not a new backup schema.
export function studyThesisSeed(kind,study){
 if(!kinds.has(kind)||!study?.id)throw Error('Choose a retained research study.');
 const source=kind==='core'?study.config:kind==='advanced'?study.source:kind==='valuations'?study.fundamental:kind==='tickers'?study.instrument:kind==='manual'?study.artifact?.metadata:study;
 const ticker=source?.ticker||source?.asset||'',market=source?.market||'',currency=source?.currency||study.dataset?.metadata?.currency||'',symbol=market==='IDX'?ticker+'.JK':/^[A-Z]{1,6}(?:[-.][A-Z]{1,2})?$/.test(ticker)?ticker:'';
 if(kind==='core'&&study.status!=='completed')throw Error('Only completed analysis can be used as evidence.');
 const lines=['Retained '+kind+' research — evidence, not an investment recommendation.','Study '+study.id,'Open '+studyHref(kind,study.id),[market,ticker,currency].filter(Boolean).join(' · '),'Retained / registered '+(study.createdAt||study.created||study.savedAt||study.registeredAt||'not supplied'),'History / valuation date '+(source?.cutoff||study.modelCutoff||study.cutoff||study.quote?.marketDate||source?.asOf||'not supplied'),'Price basis '+(source?.basis||study.basis||'not supplied; do not assume adjusted prices')];
 lines.push('Source metadata '+JSON.stringify({provider:source?.provider||study.quote?.provider,retrievedAt:source?.retrievedAt||study.dataset?.metadata?.retrievedAt,publication:study.publishedAt,priceDefinition:study.dataset?.metadata?.priceDefinition,adjustment:source?.adjustment||study.dataset?.metadata?.adjustment}));
 if(kind==='manual')lines.push('Manual method '+(study.artifact?.method||'not supplied')+'; user-supplied asset label '+ticker+'. A descriptive label is not a verified ticker.');
 if(study.resultHash)lines.push('Result hash '+study.resultHash);
 if(study.sourceHash)lines.push('Source hash '+study.sourceHash);
 if(study.settings)lines.push('Retained hypothetical settings '+JSON.stringify(study.settings));
 if(kind==='valuations')lines.push('Fundamental retrieval '+study.fundamental.retrievedAt,'Quote '+study.quote.price+' '+study.quote.currency+' on '+study.quote.marketDate,'Financial period '+(study.fundamental.cashflow?.periodEnd||'not supplied; retrieval date is not a fiscal period'),'Future growth, multiples and discount rates are assumptions, not observed outcomes.');
 if(kind==='predictions')lines.push('Core run '+study.coreRunId+'; result hash '+study.coreResultHash,'Registered forecast; '+study.horizon+' source sessions; status '+study.status+'. Predicted values are not observed market data.');
 if(kind==='advanced')lines.push('Source run '+study.sourceRunId+'; history through '+study.source.cutoff);
 if(kind==='tickers')lines.push('Source publication '+study.publishedAt,'Quote observation '+(study.quote?.marketDate||study.quote?.date||'unavailable'));
 const ref=kind==='core'?analysisReference(study):null;
 return {fields:{title:(ticker||'Research').slice(0,140)+' investment thesis',symbol,evidence:lines.filter(Boolean).join('\n')},analysisRefs:ref?[ref]:[]};
}
export function seedFromThesis(t){return {context:t.researchContext?structuredClone(t.researchContext):undefined,analysisRefs:structuredClone(t.analysisRefs||[]),preThesis:t.id,reports:structuredClone(t.reports||[]),fields:{symbol:t.symbol,assumptions:t.assumptions,evidence:t.evidence,horizon:t.horizon||'',invalidation:t.invalidation||'',portfolioId:t.portfolioId||'',reviewDate:t.reviewDate}};}
export function retainedContextMarkup(r){const c=r.researchContext;return c?'<p class="quiet-note workflow-provenance">Retained evidence: '+esc(c.market+' · '+c.ticker+' · '+c.currency)+' · price observed '+esc(c.priceDate||'unavailable')+' · model history '+esc(c.modelCutoff||'unavailable')+' · captured '+esc(c.capturedAt)+'. Historical source context; not a live quote. <a href="'+studyHref('tickers',c.tickerStudyId)+'">Open original ticker study</a>'+(c.valuationStudyId?' · <a href="'+studyHref('valuations',c.valuationStudyId)+'">Open original valuation</a>':'')+'</p>':'';}
export function relatedRecordsMarkup(records,kind,r){
 const links=[],link=(href,label)=>links.push('<a href="'+esc(href)+'">'+esc(label)+'</a>');
 for(const m of (r.evidence||'').matchAll(/^Open (#quant\/(?:study\/(?:advanced|valuations|predictions|tickers|manual)\/[^\s]+|run\/[^\s]+))$/gm)){const c=r.researchContext;if(c&&(m[1]===studyHref('tickers',c.tickerStudyId)||c.valuationStudyId&&m[1]===studyHref('valuations',c.valuationStudyId)))continue;if((r.analysisRefs||[]).some(a=>m[1]===studyHref('core',a.runId)))continue;link(m[1],'Open retained research evidence');}
 if(kind==='theses')for(const d of records.decisions.filter(d=>d.thesisId===r.id))link(recordHref('decisions',d.id),'Decision · '+d.title);
 if(kind==='decisions'&&r.thesisId){const t=records.theses.find(t=>t.id===r.thesisId);if(t)link(recordHref('theses',t.id),'Thesis · '+t.title);}
 if(kind==='portfolio'){
  for(const t of records.theses.filter(t=>t.portfolioId===r.id))link(recordHref('theses',t.id),'Thesis · '+t.title);
  for(const d of records.decisions.filter(d=>d.portfolioId===r.id)){link(recordHref('decisions',d.id),'Decision · '+d.title);link(recordHref('decisions',d.id,true),'Reviews · '+d.title);}
 }else{
  const p=records.portfolios.find(p=>p.id===r.portfolioId);if(p)link('#portfolio/'+encodeURIComponent(p.id),(p.mode==='real'?'Real':'Paper')+' portfolio · '+p.name);
  link(recordHref(kind,r.id,true),'Reviews · '+(r.reviewHistory||[]).length+' recorded · due '+r.reviewDate);
 }
 return '<nav class="workflow-links" aria-label="Associated records">'+(links.join('')||'<span class="quiet-note">No associated theses or decisions. Records can be linked without entering transactions.</span>')+'</nav>';
}
