import {predictionOutcome,validatePrediction} from './prediction-math.js';
import {validateClosingHistory} from './portfolio-close-prices.js';
const evidence=(h,publishedAt)=>({provider:'Yahoo Finance',sourceUrl:h.metadata.sourceUrl,sourceHash:h.metadata.sourceHash,retrievedAt:h.metadata.retrievedAt,publishedAt});
export const frozenForecastIdentity=p=>JSON.stringify([p.id,p.registeredAt,p.market,p.ticker,p.currency,p.basis,p.cutoff,p.basePrice,p.horizon,p.coreRunId,p.coreModelVersion,p.coreResultHash,p.forecasts]);
export function reviewPrediction(p,history,entry,publishedAt,checkedAt=new Date().toISOString(),failure=null){
 validatePrediction(p);let sourceEvidence,observedSessions=0;
 const finish=(state,reason,outcome=null)=>{const review={checkedAt,state,reason:String(reason).slice(0,600),observedSessions,requiredSessions:p.horizon,...(sourceEvidence?{sourceEvidence}:{})},prior=p.lastReview,changed=!prior||prior.state!==state||prior.sourceEvidence?.sourceHash!==sourceEvidence?.sourceHash||prior.observedSessions!==observedSessions;
  const updated={...p,sourceRevisionUnresolved:state==='revised'?true:state==='unchanged'?false:!!p.sourceRevisionUnresolved,checkNote:review.reason,lastReview:review,reviewHistory:changed?[...(p.reviewHistory||[]),review].slice(-30):p.reviewHistory||[review],...(outcome?{status:'settled',outcome}:{})};validatePrediction(updated);return updated;};
 try{
  if(failure)throw Error(failure);
  if(!Number.isFinite(Date.parse(publishedAt))||Date.parse(publishedAt)>Date.parse(checkedAt)+300000)throw Error('Outcome publication date is invalid or in the future.');
  validateClosingHistory(history,entry,Date.parse(checkedAt));if(Date.parse(history.metadata.retrievedAt)>Date.parse(publishedAt)+300000)throw Error('Outcome acquisition is later than its publication.');
  sourceEvidence=evidence(history,publishedAt);const key=p.basis==='adjusted'?'adjustedClose':'rawClose',future=history.rows.filter(r=>r.complete&&r.date>p.cutoff).slice(0,p.horizon);for(const row of future){if(!Number.isFinite(row[key])||row[key]<=0)throw Error('Outcome target price is missing or invalid; sessions are not skipped or substituted.');observedSessions++;}
  const candidate=predictionOutcome(p,{...history,metadata:{...history.metadata,outcomeEvidence:sourceEvidence}},checkedAt);
  if(!candidate)return finish(p.status==='settled'?'unavailable':'pending',p.status==='settled'?'Retained outcome kept; the current publication lacks its complete outcome window.':'Waiting for '+p.horizon+' completed future source sessions; '+observedSessions+' observed.');
  if(p.status==='settled'){
   const same=p.outcome.date===candidate.date&&p.outcome.rows.length===candidate.rows.length&&p.outcome.rows.every((r,i)=>r.date===candidate.rows[i].date&&Math.abs(r.price-candidate.rows[i].price)<=Math.max(1e-10,Math.abs(r.price)*1e-8));
   return finish(same?'unchanged':'revised',same?'Retained outcome agrees with the checked publication.':'Outcome source window revised. Original outcome retained; prospective headline scores withheld pending review.');
  }
  return finish('settled','Settled from completed source observations with retained source provenance.',candidate);
 }catch(e){const revised=p.status==='settled'&&sourceEvidence&&/basis changed|anchor is missing/.test(e.message);return finish(revised?'revised':'unavailable',revised?'Anchor/basis revised. Original outcome retained; prospective headline scores withheld.':e.message);}
}
export async function reviewPublishedPredictions(records,{fetcher=fetch,checkedAt=new Date().toISOString()}={}){
 if(!Array.isArray(records)||records.length>500)throw Error('Use a bounded prediction registry.');records.forEach(validatePrediction);
 const read=async file=>{const r=await fetcher(new URL('./data/'+file,import.meta.url),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Published outcome source HTTP '+r.status+'.');const text=await r.text();if(text.length>12000000)throw Error('Outcome source exceeds its size limit.');return JSON.parse(text);};
 let manifest;try{manifest=await read('manifest.json');if(manifest.format!=='longhand-public-market-data'||manifest.version!==1||!Array.isArray(manifest.histories)||manifest.histories.length>5000||new Set(manifest.histories.map(e=>e.market+':'+e.ticker)).size!==manifest.histories.length)throw Error('Invalid outcome publication directory.');}catch(e){return records.map(p=>reviewPrediction(p,null,null,null,checkedAt,e.message));}
 const keys=[...new Map(records.map(p=>[p.market+':'+p.ticker,p])).values()],sources=new Map();let index=0;
 await Promise.all(Array.from({length:Math.min(4,keys.length)},async()=>{while(index<keys.length){const p=keys[index++],key=p.market+':'+p.ticker,entry=manifest.histories.find(e=>e.market===p.market&&e.ticker===p.ticker);try{if(!entry||entry.file!=='history/'+p.market+'-'+p.ticker+'.json'||!/^[A-Z]{1,6}(?:-[A-Z])?$/.test(p.ticker))throw Error('Outcome history is not published for this listing.');sources.set(key,{entry,history:await read(entry.file)});}catch(e){sources.set(key,{error:e.message});}}}));
 return records.map(p=>{const source=sources.get(p.market+':'+p.ticker);if(source.error)return reviewPrediction(p,null,null,manifest.publishedAt,checkedAt,source.error);return reviewPrediction(p,source.history,source.entry,manifest.publishedAt,checkedAt);});
}
