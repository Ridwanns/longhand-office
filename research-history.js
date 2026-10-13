const fields=['title','symbol','portfolioId','thesisId','horizon','assumptions','evidence','risks','invalidation','rationale','expected','date','reviewDate','reports'];
export function entrySnapshot(record){return Object.fromEntries(fields.filter(k=>record[k]!==undefined).map(k=>[k,structuredClone(record[k])]));}
export function retainEntryHistory(next,previous){
 const now=new Date().toISOString();next.originalEntry=structuredClone(previous?.originalEntry||entrySnapshot(previous||next));next.originalRetainedAt=previous?.originalRetainedAt||now;
 next.entryRevisions=structuredClone(previous?.entryRevisions||[]);
 if(previous)next.entryRevisions.push({id:crypto.randomUUID(),recordedAt:now,entry:entrySnapshot(previous)});
 return next;
}
