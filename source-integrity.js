// Source observations are compared only within matching identities and definitions.
// No missing value, adjusted bar, currency or fiscal period is silently substituted.
const finite=v=>typeof v==='number'&&Number.isFinite(v),iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(s)&&finite(Date.parse(s)),day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&finite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const need=(ok,reason)=>{if(!ok)throw Error(reason);};
const fields=['rawClose','adjustedClose','open','high','low','volume'];
function closedRows(packet){
 need(packet&&typeof packet.identity==='string'&&iso(packet.retrievedAt)&&Array.isArray(packet.rows)&&packet.rows.length<=10000,'Invalid history comparison packet.');
 const out=new Map();let prior='';
 for(const r of packet.rows){need(day(r.date)&&r.date>prior,'Comparison dates must be real, unique and ordered.');prior=r.date;need(fields.every(k=>r[k]===undefined||r[k]===null||finite(r[k])),'Nonfinite source observation.');if(r.complete!==true)continue;out.set(r.date,r);}
 return out;
}
export function historyRevision(previous,current){
 const after=closedRows(current),base={identity:current.identity,previousAt:previous?.retrievedAt||null,currentAt:current.retrievedAt,commonRows:0,newRows:0,backfilledRows:0,removedRows:0,changedRows:0,rawChanges:0,adjustedChanges:0,valueChecks:0,maxAbsoluteChanges:Object.fromEntries(fields.map(k=>[k,0])),samples:[]};
 if(!previous)return {...base,status:'initial',newRows:after.size};
 const before=closedRows(previous);
 if(previous.identity!==current.identity)return {...base,status:'identity-mismatch'};
 if(Date.parse(previous.retrievedAt)>Date.parse(current.retrievedAt))return {...base,status:'older-acquisition'};
 const first=current.rows[0]?.date,lastBefore=previous.rows.at(-1)?.date;
 for(const [date,row]of before){
  // A rolling source window can expire its oldest date; that is not a withdrawal.
  if(first&&date<first)continue;
  const next=after.get(date);if(!next){
   // A current unfinished session is not a completed-bar withdrawal.
   if(current.rows.some(r=>r.date===date&&r.complete!==true))continue;
   base.removedRows++;if(base.samples.length<12)base.samples.push({date,field:'row',previous:row.rawClose??null,current:null});continue;
  }
  base.commonRows++;let changed=false;
  for(const key of fields){const a=row[key]??null,b=next[key]??null;if(a===null&&b===null)continue;base.valueChecks++;if(a===b)continue;changed=true;if(key==='adjustedClose')base.adjustedChanges++;else base.rawChanges++;if(finite(a)&&finite(b)){const delta=Math.abs(a-b);need(finite(delta),'Source difference exceeds numeric bounds.');base.maxAbsoluteChanges[key]=Math.max(base.maxAbsoluteChanges[key],delta);}if(base.samples.length<12)base.samples.push({date,field:key,previous:a,current:b});}
  if(changed)base.changedRows++;
 }
 for(const [date,row] of after)if(!before.has(date)){if(!lastBefore||date>lastBefore)base.newRows++;else{base.backfilledRows++;if(base.samples.length<12)base.samples.push({date,field:'row',previous:null,current:row.rawClose??null});}}
 const status=base.rawChanges||base.removedRows||base.backfilledRows?'revised':base.adjustedChanges?'adjusted-revision':previous.retrievedAt===current.retrievedAt?'same-vintage':'unchanged';
 return {...base,status};
}
export function observationFreshness(quote,now=Date.now()){
 need(finite(now),'Invalid freshness reference time.');
 if(!quote)return {status:'unavailable',ageDays:null,acquisitionAgeDays:null};
 const t=Date.parse(quote.timestamp),a=Date.parse(quote.retrievedAt);
 if(!finite(t)||!finite(a)||t>now+300000||a>now+300000)return {status:'unverified-date',ageDays:null,acquisitionAgeDays:null};
 const ageDays=Math.max(0,(now-t)/86400000),acquisitionAgeDays=Math.max(0,(now-a)/86400000);
 return {status:ageDays>3?'older-observation':'dated',ageDays,acquisitionAgeDays};
}
export function missingHistoryRecords(previous,current,publishedAt){
 need(Array.isArray(previous)&&Array.isArray(current)&&iso(publishedAt),'Invalid history directory comparison.');
 const currentIds=new Set(current.map(h=>h.market+':'+h.ticker));
 return previous.filter(h=>!currentIds.has(h.market+':'+h.ticker)).map(h=>({id:h.market+':'+h.ticker,status:'unavailable',identity:h.market+':'+h.ticker,previousAt:h.retrievedAt,currentAt:publishedAt,commonRows:0,newRows:0,backfilledRows:0,removedRows:0,changedRows:0,rawChanges:0,adjustedChanges:0,valueChecks:0,samples:[],reason:'Present in the prior public history directory; no current acquired history. No old data is represented as newly refreshed.'}));
}
export function compareDefinedMetrics(a,b){
 const keys=['ticker','currency','unit','key','scope','basis','start','end'];
 if(!a||!b||keys.some(k=>!a[k]||!b[k]||a[k]!==b[k]))return {status:'not-comparable',difference:null,reason:'Issuer, period, currency, EPS basis and scope must all match. Undated TTM is not annual or YTD.'};
 if(!finite(a.value)||!finite(b.value))return {status:'unavailable',difference:null,reason:'Missing source value.'};
 const difference=b.value-a.value;if(!finite(difference))return {status:'not-comparable',difference:null,reason:'Difference exceeds numerical bounds.'};
 const tolerance=(finite(a.resolution)&&a.resolution>0?a.resolution/2:0)+(finite(b.resolution)&&b.resolution>0?b.resolution/2:0);
 return {status:difference===0?'matched':Math.abs(difference)<=tolerance?'within-rounding':'different',difference,reason:difference===0?'Same definition and exact source value.':Math.abs(difference)<=tolerance?'Nonzero difference within declared source rounding.':'Same definition, different reported values.'};
}
export const IDX_FACTS={epsBasic:'Basic EPS',epsDiluted:'Diluted EPS',netIncomeOwners:'Profit attributable to owners',equityOwners:'Equity attributable to owners',basicAverageShares:'Weighted average basic shares',dilutedAverageShares:'Weighted average diluted shares',issuedShares:'Issued shares',treasuryShares:'Treasury shares',cfo:'Consolidated operating cash flow',capex:'Reported capital expenditure',netBorrowing:'Reported net borrowing'};
export function validateIdxReviews(registry,now=Date.now()){
 need(registry?.format==='longhand-idx-primary-reviews'&&registry.version===1&&Array.isArray(registry.reports)&&registry.reports.length<=150,'Invalid IDX primary review registry.');
 const ids=new Set();for(const r of registry.reports){
  need(typeof r.id==='string'&&/^[A-Z]{4}-\d{4}-(?:FY|H1|9M)$/.test(r.id)&&!ids.has(r.id),'Duplicate or invalid issuer review identity.');ids.add(r.id);
  need(/^[A-Z]{4}$/.test(r.ticker)&&r.id===r.ticker+'-'+r.periodEnd?.slice(0,4)+'-'+({annual:'FY','six-month':'H1','nine-month':'9M'}[r.frequency])&&typeof r.entityName==='string'&&r.entityName.length<=200&&r.scope==='consolidated'&&['annual','six-month','nine-month'].includes(r.frequency)&&day(r.periodStart)&&day(r.periodEnd)&&r.periodStart<r.periodEnd&&r.periodEnd<=new Date(now).toISOString().slice(0,10),'Invalid issuer report period or scope.');
  need(/^[A-Z]{3}$/.test(r.currency)&&iso(r.reviewedAt)&&Date.parse(r.reviewedAt)<=now+300000&&r.periodEnd<=r.reviewedAt.slice(0,10)&&/^[a-f0-9]{64}$/.test(r.documentSha256),'Invalid source review currency, time or fingerprint.');
  const url=new URL(r.documentUrl);need(url.protocol==='https:'&&!url.username&&!url.password&&Array.isArray(r.sourceHosts)&&r.sourceHosts.length>0&&r.sourceHosts.includes(url.hostname)&&r.sourceHosts.every(h=>/^[a-z0-9.-]+$/.test(h)),'Invalid primary source location.');
  need(Array.isArray(r.facts)&&r.facts.length>0&&r.facts.length<=Object.keys(IDX_FACTS).length&&new Set(r.facts.map(f=>f.key)).size===r.facts.length&&Array.isArray(r.limitations)&&r.limitations.length<=12&&r.limitations.every(s=>typeof s==='string'&&s.length<=800),'Invalid reviewed facts or limitations.');
  if(r.publishedDate!==undefined&&r.publishedDate!==null)need(day(r.publishedDate)&&r.publishedDate>=r.periodEnd&&r.publishedDate<=r.reviewedAt.slice(0,10),'Invalid issuer publication date.');
  for(const f of r.facts){const eps=f.key.startsWith('eps'),shares=f.key.endsWith('Shares');need(Object.hasOwn(IDX_FACTS,f.key)&&finite(f.value)&&[1,1000,1000000,1000000000].includes(f.scale)&&finite(f.value*f.scale)&&Number.isInteger(f.page)&&f.page>0&&f.page<=1200&&(!r.pdfPages||f.page<=r.pdfPages)&&typeof f.printedPage==='string'&&f.printedPage.length<=30&&Number.isInteger(f.decimals)&&f.decimals>=0&&f.decimals<=8&&f.unit===(eps?'currency/share':shares?'shares':'currency')&&(!eps||f.scale===1),'Invalid reviewed fact unit, scale, rounding or page.');}
  const days=(Date.parse(r.periodEnd)-Date.parse(r.periodStart))/86400000+1;need(r.frequency==='annual'?days>=350&&days<=380:r.frequency==='six-month'?days>=170&&days<=190:days>=260&&days<=280,'Report duration does not match its stated frequency.');
 }
 return registry;
}
export function reportedEpsReconciliation(report,basis='basic'){
 const get=key=>report.facts.find(f=>f.key===key),income=get('netIncomeOwners'),shares=get(basis==='basic'?'basicAverageShares':'dilutedAverageShares'),eps=get(basis==='basic'?'epsBasic':'epsDiluted');
 if(!income||!shares||!eps||shares.value<=0)return {status:'unavailable',computed:null,reported:eps?.value??null,reason:'Matching owner profit, EPS and weighted average shares are not all reported for this basis.'};
 const ni=income.value*income.scale,denom=shares.value*shares.scale,computed=ni/denom,niR=income.scale*10**(-income.decimals)/2,shareR=shares.scale*10**(-shares.decimals)/2,epsR=10**(-eps.decimals)/2;
 if(denom<=shareR||![computed,niR,shareR].every(finite))return {status:'unavailable',computed:null,reported:eps.value,reason:'The reported denominator cannot support a bounded reconciliation.'};
 const candidates=[(ni-niR)/(denom-shareR),(ni-niR)/(denom+shareR),(ni+niR)/(denom-shareR),(ni+niR)/(denom+shareR)],low=Math.min(...candidates)-epsR,high=Math.max(...candidates)+epsR;
 return {status:eps.value>=low&&eps.value<=high?'within-rounding':'different',computed,reported:eps.value,reason:'Owner profit ÷ matching weighted average shares; source rounding retained.'};
}
export function filingBookValue(report){
 const get=key=>report.facts.find(f=>f.key===key),equity=get('equityOwners'),issued=get('issuedShares'),treasury=get('treasuryShares');
 if(!equity||!issued||!treasury)return null;
 const netShares=issued.value*issued.scale-treasury.value*treasury.scale,value=equity.value*equity.scale/netShares;
 return netShares>0&&finite(value)?{value,currency:report.currency,asOf:report.periodEnd,netShares}:null;
}
export function validateIdxEvidence(feed,now=Date.now()){
 need(feed?.format==='longhand-idx-primary-evidence'&&feed.version===1&&iso(feed.publishedAt)&&Date.parse(feed.publishedAt)<=now+300000&&Array.isArray(feed.researchTickers)&&feed.researchTickers.length<=100&&new Set(feed.researchTickers).size===feed.researchTickers.length&&feed.researchTickers.every(t=>/^[A-Z]{4}$/.test(t))&&Array.isArray(feed.records)&&feed.records.length<=150,'Invalid IDX evidence publication.');
 const wrapper={format:'longhand-source-integrity',version:1,generatedAt:feed.publishedAt,publicationAt:feed.publishedAt,histories:[],quotes:[],filings:feed.records};validateSourceIntegrity(wrapper,now);return feed;
}
export function validateSourceIntegrity(feed,now=Date.now()){
 need(feed?.format==='longhand-source-integrity'&&feed.version===1&&iso(feed.generatedAt)&&Date.parse(feed.generatedAt)<=now+300000&&iso(feed.publicationAt)&&Date.parse(feed.publicationAt)<=now+300000&&Array.isArray(feed.histories)&&feed.histories.length<=7000&&Array.isArray(feed.filings)&&feed.filings.length<=150&&Array.isArray(feed.quotes)&&feed.quotes.length<=20000,'Invalid source integrity feed.');
 need(new Set(feed.histories.map(r=>r.id)).size===feed.histories.length&&new Set(feed.filings.map(r=>r.id)).size===feed.filings.length&&new Set(feed.quotes.map(r=>r.id)).size===feed.quotes.length,'Duplicate integrity identity.');
 for(const h of feed.histories)need(typeof h.id==='string'&&iso(h.currentAt)&&Date.parse(h.currentAt)<=now+300000&&(h.previousAt===null||iso(h.previousAt)&&Date.parse(h.previousAt)<=now+300000)&&['initial','identity-mismatch','older-acquisition','revised','adjusted-revision','unchanged','same-vintage','unverified-calendar','unavailable'].includes(h.status)&&['commonRows','newRows','backfilledRows','removedRows','changedRows','rawChanges','adjustedChanges','valueChecks'].every(k=>Number.isSafeInteger(h[k])&&h[k]>=0)&&Array.isArray(h.samples)&&h.samples.length<=12&&h.samples.every(s=>day(s.date)&&['row',...fields].includes(s.field)&&[s.previous,s.current].every(v=>v===null||finite(v))),'Invalid history revision evidence.');
 for(const f of feed.filings){validateIdxReviews({format:'longhand-idx-primary-reviews',version:1,reports:[f.review]},now);need(f.id===f.review.id&&['matched','changed','unavailable'].includes(f.status)&&iso(f.checkedAt)&&Date.parse(f.checkedAt)<=now+300000&&(f.status==='matched'?f.acquiredSha256===f.review.documentSha256:f.status==='changed'?/^[a-f0-9]{64}$/.test(f.acquiredSha256)&&f.acquiredSha256!==f.review.documentSha256:f.acquiredSha256===null)&&typeof f.reason==='string','Invalid report acquisition evidence.');}
 for(const q of feed.quotes)need(typeof q.id==='string'&&['unavailable','unverified-date','older-observation','dated'].includes(q.status)&&(q.ageDays===null||finite(q.ageDays)&&q.ageDays>=0),'Invalid dated quote evidence.');
 return feed;
}
