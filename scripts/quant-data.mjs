import {createHash} from 'node:crypto';
import {MODEL_VERSION} from '../quant-math.js';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const validId=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
export function configFor(input){
 if(!input||!['US','IDX'].includes(input.market))throw Error('Choose US or IDX.');
 let ticker=String(input.ticker||'').trim().toUpperCase();ticker=input.market==='IDX'?ticker.replace(/\.JK$/,''):ticker.replace('.','-');
 if(!(input.market==='US'?/^[A-Z]{1,6}(?:-[A-Z])?$/:/^[A-Z]{4}$/).test(ticker))throw Error('Invalid supported equity / ETF ticker.');
 if(!validDate(input.cutoff)||input.cutoff>new Date().toISOString().slice(0,10))throw Error('Choose a valid cutoff no later than today UTC.');
 if(![5,20].includes(Number(input.horizon)))throw Error('Horizon must be 5 or 20 observed trading sessions.');
 const basis=input.basis||'adjusted';if(!['raw','adjusted'].includes(basis))throw Error('Choose raw or adjusted closes.');
 const seed=Number(input.seed??20261013);if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw Error('Seed must be an integer from 1 through 4294967295.');
 return {ticker,market:input.market,cutoff:input.cutoff,horizon:Number(input.horizon),basis,seed,modelVersion:MODEL_VERSION};
}
export function normalizeHistory(rows,config,metadata){
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
 return {metadata:{...metadata,requestedCutoff:config.cutoff,lastCompletedSession:observations.at(-1).date,basis:config.basis,priceDefinition:config.basis==='raw'?'Raw price close; dividends excluded; split discontinuities may distort returns.':config.market==='US'?'Provider adjusted-close proxy for splits and dividends; not exact investor total return. Retrieval-vintage adjustments are not point-in-time historical data.':'Flowless backward adjustment for confirmed split/reverse-split/bonus-share events; dividends excluded. Retrieval-vintage factors are not point-in-time historical data.',missingPolicy:'No zero-fill, interpolation or forward-fill. Latest segment after any known missing eligible close or gap >10 calendar days. Exchange suspensions/holidays are not reconstructed.',sourceRows:rows.length,omissions,segmentBreaks:breaks,excludedSegmentRows:excludedSegment.length},observations,excludedSegment,dataHash:hash(observations)};
}
async function boundedFetch(url,signal){
 const response=await fetch(url,{signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(25000)]),redirect:'error',headers:{'User-Agent':'LonghandOffice-local-research/1.0','Accept':'application/json'}});
 if(!response.ok)throw Error('History provider returned HTTP '+response.status+'. Retry later; no substitute observations used.');
 const reader=response.body.getReader();let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000000){await reader.cancel();throw Error('History response exceeds 12 MB.');}chunks.push(Buffer.from(value));}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function acquireHistory(config,signal){
 const retrievedAt=new Date().toISOString();
 if(config.market==='IDX'){
  const url='http://127.0.0.1:8000/api/ticker/'+encodeURIComponent(config.ticker),raw=await boundedFetch(url,signal);
  if(raw.ticker!==config.ticker||!Array.isArray(raw.series)||raw.series.length>10000)throw Error('Flowless returned a different ticker or unavailable daily history.');
  const nowParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
  return normalizeHistory(raw.series.map(r=>({date:r.trade_date,rawClose:r.close,adjustedClose:r.adj_close,volume:r.volume,complete:r.trade_date<nowParts||r.trade_date===nowParts&&hour>=17})),config,{ticker:config.ticker,listing:'IDX',instrumentType:'EQUITY',currency:'IDR',timezone:'Asia/Jakarta',source:'Owner Flowless local daily history',sourceUrl:url,retrievedAt,sourceHash:hash(raw),adjustmentAuthority:'Flowless src/idxflow/splits.py + api.py: confirmed corporate-action split-like events, close * adj_factor; excludes dividends.'});
 }
 const start=new Date(config.cutoff+'T00:00:00Z');start.setUTCFullYear(start.getUTCFullYear()-5);
 const period1=Math.floor(start.getTime()/1000),period2=Math.floor(Date.parse(config.cutoff+'T00:00:00Z')/1000)+86400;
 const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(config.ticker)+'?interval=1d&period1='+period1+'&period2='+period2+'&events=div%2Csplits',raw=await boundedFetch(url,signal),r=raw.chart?.result?.[0],meta=r?.meta;
 if(!r||raw.chart.error)throw Error('No Yahoo daily history for this ticker.');
 if(!['EQUITY','ETF'].includes(meta.instrumentType)||meta.currency!=='USD'||!['NMS','NGM','NCM','NYQ','ASE','PCX','BTS','BATS'].includes(meta.exchangeName))throw Error('Quant Lab currently supports USD US-listed equities and ETFs only.');
 if(String(meta.symbol).toUpperCase()!==config.ticker)throw Error('History ticker does not match request.');
 const dates=r.timestamp,quote=r.indicators?.quote?.[0],adj=r.indicators?.adjclose?.[0]?.adjclose;if(!Array.isArray(dates)||!Array.isArray(quote?.close)||dates.length>10000)throw Error('Invalid daily history arrays.');
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:meta.exchangeTimezoneName||'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}),now=new Date(),current=fmt.format(now),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(now)),end=meta.currentTradingPeriod?.regular?.end;
 const todayComplete=end?Date.now()/1000>=end+900:hour>=17;
 const rows=dates.map((t,i)=>({date:fmt.format(new Date(t*1000)),timestamp:t,rawClose:quote.close[i],adjustedClose:adj?.[i],volume:quote.volume?.[i],complete:fmt.format(new Date(t*1000))<current||fmt.format(new Date(t*1000))===current&&todayComplete}));
 return normalizeHistory(rows,config,{ticker:config.ticker,listing:meta.exchangeName,instrumentType:meta.instrumentType,currency:meta.currency,timezone:meta.exchangeTimezoneName||'America/New_York',source:'Yahoo Finance daily chart',sourceUrl:url,retrievedAt,sourceHash:hash(raw),corporateActions:r.events||{},completionPolicy:'Past exchange dates; current session only after source regular-session end +15 minutes (fallback 17:00 New York).'});
}
