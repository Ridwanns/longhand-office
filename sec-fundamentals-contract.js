// Annual reported facts are evidence, not TTM estimates or automatic DCF inputs.
export const SEC_METRICS=[
 {key:'revenue',label:'Reported revenue',unit:'USD',tags:['RevenueFromContractWithCustomerExcludingAssessedTax','SalesRevenueNet','Revenues']},
 {key:'netIncome',label:'Reported net income',unit:'USD',tags:['NetIncomeLoss']},
 {key:'eps',label:'Reported diluted EPS',unit:'USD/shares',tags:['EarningsPerShareDiluted']},
 {key:'dilutedShares',label:'Diluted average shares',unit:'shares',tags:['WeightedAverageNumberOfDilutedSharesOutstanding']},
 {key:'operatingCashflow',label:'Reported operating cash flow',unit:'USD',tags:['NetCashProvidedByUsedInOperatingActivities']},
 {key:'capex',label:'Reported PP&E cash payment',unit:'USD',tags:['PaymentsToAcquirePropertyPlantAndEquipment']},
 {key:'assets',label:'Reported total assets',unit:'USD',instant:true,tags:['Assets']},
 {key:'equity',label:'Reported stockholders’ equity',unit:'USD',instant:true,tags:['StockholdersEquity']}
];
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const annual=x=>day(x.start)&&day(x.end)&&(Date.parse(x.end)-Date.parse(x.start))/86400000>=330&&(Date.parse(x.end)-Date.parse(x.start))/86400000<=400;
const acceptable=(x,asOf)=>['10-K','10-K/A'].includes(x.form)&&day(x.filed)&&day(x.end)&&x.filed<=asOf&&x.end<=x.filed&&/^\d{10}-\d{2}-\d{6}$/.test(x.accn)&&typeof x.val==='number'&&Number.isFinite(x.val)&&Math.abs(x.val)<=1e18;
function rows(f,m){return m.tags.flatMap(tag=>(f.facts?.['us-gaap']?.[tag]?.units?.[m.unit]||[]).map(x=>({...x,tag})));}
export function projectSecAnnual(f,{ticker,cik,retrievedAt}){
 const base={ticker,cik:String(cik).padStart(10,'0'),market:'US',currency:'USD',retrievedAt,status:'unavailable',reason:null,annual:null};
 if(!iso(retrievedAt)||!/^\d{10}$/.test(base.cik)||Number(f.cik)!==Number(cik)||typeof f.entityName!=='string'||!f.entityName.trim())throw Error('SEC issuer identity or retrieval date is invalid.');
 const asOf=retrievedAt.slice(0,10),candidates=SEC_METRICS.filter(m=>!m.instant).flatMap(m=>rows(f,m)).filter(x=>acceptable(x,asOf)&&annual(x));
 candidates.sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed)||b.accn.localeCompare(a.accn));
 const anchor=candidates[0];if(!anchor){base.reason='No supported USD US-GAAP annual 10-K period. Foreign filings, custom tags and quarterly/TTM estimates are not inferred.';return base;}
 const facts=SEC_METRICS.map(m=>{
  const found=rows(f,m).filter(x=>acceptable(x,asOf)&&x.accn===anchor.accn&&x.end===anchor.end&&(m.instant?!x.start:x.start===anchor.start&&annual(x)));
  // Multiple competing tags/values are not silently resolved by precedence.
  const values=new Set(found.map(x=>x.val));const selected=values.size===1?found[0]:null;
  return {key:m.key,tag:selected?.tag||null,unit:m.unit,value:selected?.val??null,reason:selected?null:values.size>1?'Competing same-filing values; withheld.':'No matching standard-tag fact in this annual filing.'};
 });
 const result={...base,status:'available',entityName:f.entityName,annual:{start:anchor.start,end:anchor.end,filed:anchor.filed,accession:anchor.accn,form:anchor.form,facts}};validateSecRecord(result);return result;
}
export function validateSecRecord(r){
 if(!r||r.market!=='US'||r.currency!=='USD'||typeof r.ticker!=='string'||!/^[A-Z]{1,6}(?:-[A-Z])?$/.test(r.ticker)||!(r.cik===null||typeof r.cik==='string'&&/^\d{10}$/.test(r.cik))||!iso(r.retrievedAt)||!['available','unavailable'].includes(r.status))throw Error('Invalid SEC record identity or timestamp.');
 if(r.status==='unavailable'){if(r.annual!==null||typeof r.reason!=='string'||!r.reason||r.reason.length>600)throw Error('Invalid SEC missing-data record.');return r;}
 const a=r.annual;if(!r.cik||typeof r.entityName!=='string'||!r.entityName.trim()||r.entityName.length>300||r.reason!==null||!a||!annual(a)||!acceptable({...a,accn:a.accession,val:0},r.retrievedAt.slice(0,10))||!Array.isArray(a.facts)||a.facts.length!==SEC_METRICS.length)throw Error('Invalid SEC annual period or issuer.');
 for(const [i,m]of SEC_METRICS.entries()){const x=a.facts[i];if(x?.key!==m.key||x.unit!==m.unit||!(x.value===null||typeof x.value==='number'&&Number.isFinite(x.value)&&Math.abs(x.value)<=1e18)||!(x.value===null?x.tag===null&&typeof x.reason==='string'&&x.reason.length>0&&x.reason.length<=300:m.tags.includes(x.tag)&&x.reason===null))throw Error('Invalid SEC annual fact.');}
 return r;
}
export function validateSecFeed(f){if(f?.format!=='longhand-sec-annual-facts'||f.version!==1||!iso(f.publishedAt)||!Array.isArray(f.records)||f.records.length>40||new Set(f.records.map(r=>r.ticker)).size!==f.records.length)throw Error('Invalid SEC evidence feed.');for(const r of f.records){validateSecRecord(r);if(r.retrievedAt>f.publishedAt)throw Error('SEC record retrieval is newer than its publication.');}return f;}
export function secEvidence(r){validateSecRecord(r);if(r.status!=='available')return '';const a=r.annual;return ['Official SEC annual evidence — '+r.ticker+'; '+r.entityName+'; CIK '+r.cik,a.start+' to '+a.end+'; '+a.form+' filed '+a.filed+'; accession '+a.accession+'; retrieved '+r.retrievedAt,...a.facts.map(x=>SEC_METRICS.find(m=>m.key===x.key).label+': '+(x.value===null?'Unavailable ('+x.reason+')':x.value+' '+x.unit+'; us-gaap:'+x.tag)),'Same-filing reported USD facts. Annual values are not TTM. Diluted EPS/share-class comparability and current eligibility need review; these facts do not replace retained valuation inputs.','Source https://data.sec.gov/api/xbrl/companyfacts/CIK'+r.cik+'.json'].join('\n');}
