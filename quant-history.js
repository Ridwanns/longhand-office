import {validDate} from './quant-contract.js';
export function prepareHistory(rows,config,metadata){
 const omissions=[],map=new Map();const field=config.basis==='adjusted'?'adjustedClose':'rawClose';
 for(const row of rows){
  if(!validDate(row.date)){omissions.push({date:row.date||null,reason:'Invalid session date'});continue;}
  if(row.date>config.cutoff||row.complete===false){omissions.push({date:row.date,reason:row.complete===false?'Incomplete daily session':'After requested cutoff'});continue;}
  if(!Number.isFinite(row[field])||row[field]<=0){omissions.push({date:row.date,reason:'Missing / non-positive selected close'});continue;}
  if(map.has(row.date))throw Error('Duplicate source session dates.');
  map.set(row.date,{date:row.date,timestamp:row.timestamp??null,rawClose:row.rawClose??null,adjustedClose:row.adjustedClose??null,price:row[field],volume:row.volume??null});
 }
 let observations=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
 const lastEligible=rows.filter(r=>validDate(r.date)&&r.date<=config.cutoff&&r.complete!==false).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 if(lastEligible&&(!Number.isFinite(lastEligible[field])||lastEligible[field]<=0))throw Error('Latest completed session '+lastEligible.date+' has no usable '+config.basis+' close. Select an earlier cutoff explicitly; no older session was silently substituted.');
 // Break at known missing eligible rows and material calendar gaps. No bridging.
 let start=0;const breaks=[];
 for(let i=1;i<observations.length;i++){
  const a=observations[i-1].date,b=observations[i].date;
  if((Date.parse(b)-Date.parse(a))/86400000>10||omissions.some(o=>o.date>a&&o.date<b&&o.reason==='Missing / non-positive selected close')){start=i;breaks.push({after:a,before:b});}
 }
 const excludedSegment=observations.slice(0,start);observations=observations.slice(start);
 if(!observations.length)throw Error('No eligible completed sessions on or before the cutoff.');
 return {metadata:{...metadata,requestedCutoff:config.cutoff,lastCompletedSession:observations.at(-1).date,basis:config.basis,priceDefinition:config.basis==='raw'?'Raw price close; dividends excluded; split discontinuities may distort returns.':(config.market==='US'||metadata.provider==='yahoo')?'Provider adjusted-close proxy for splits and dividends; not exact investor total return. Retrieval-vintage adjustments are not point-in-time historical data.':'Flowless backward adjustment for confirmed split/reverse-split/bonus-share events; dividends excluded. Retrieval-vintage factors are not point-in-time historical data.',missingPolicy:'No zero-fill, interpolation or forward-fill. Latest segment after any known missing eligible close or gap >10 calendar days. Exchange suspensions/holidays are not reconstructed.',sourceRows:rows.length,omissions,segmentBreaks:breaks,excludedSegmentRows:excludedSegment.length},observations,excludedSegment};
}
