import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {MODEL_VERSION} from '../quant-math.js';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
import {configFor} from '../quant-contract.js';
import {prepareHistory} from '../quant-history.js';
export {configFor,validId} from '../quant-contract.js';
export function normalizeHistory(rows,config,metadata){const d=prepareHistory(rows,config,metadata);return {...d,dataHash:hash(d.observations)};}
export async function acquirePublishedHistory(input,read=async name=>readFile(new URL('../.pages-data/'+name,import.meta.url),'utf8')){
 const config=configFor(input),file='history/'+config.market+'-'+config.ticker+'.json';
 const json=async name=>{let text;try{text=await read(name);}catch{throw Error('Published Yahoo history is unavailable locally. Rebuild the public data files; no other provider was substituted.');}if(typeof text!=='string'||Buffer.byteLength(text)>12000000)throw Error('Published history file exceeds 12 MB.');return JSON.parse(text);};
 const manifest=await json('manifest.json'),entry=manifest.histories?.find(h=>h.market===config.market&&h.ticker===config.ticker);
 if(manifest.format!=='longhand-public-market-data'||manifest.version!==1||!Number.isFinite(Date.parse(manifest.publishedAt))||!entry||entry.file!==file)throw Error('No matching published Yahoo history directory entry.');
 const raw=await json(file),m=raw.metadata,received=new Date().toISOString();
 if(!m||m.ticker!==config.ticker||m.market!==config.market||m.provider!=='yahoo'||m.currency!==(config.market==='IDX'?'IDR':'USD')||!['EQUITY','ETF'].includes(m.instrumentType)||m.retrievedAt!==entry.retrievedAt||!Number.isFinite(Date.parse(m.retrievedAt))||Date.parse(m.retrievedAt)>Date.parse(received)+300000||!/^[a-f0-9]{64}$/.test(m.sourceHash)||!Array.isArray(raw.rows)||raw.rows.length>10000||raw.rows.some(r=>!r||typeof r.complete!=='boolean')||!(config.market==='IDX'?m.listing==='JKT'&&m.timezone==='Asia/Jakarta':['NMS','NGM','NCM','NYQ','ASE','PCX','BTS','BATS'].includes(m.listing)))throw Error('Published history identity, currency, acquisition vintage or schema mismatch. No substitute history was used.');
 return normalizeHistory(raw.rows,config,{...m,source:'Yahoo Finance published daily history (local snapshot)',publishedAt:manifest.publishedAt,loadedAt:received,publishedFileHash:hash(raw),acquisitionPolicy:'Explicit published-yahoo selection; complete retained Yahoo file only. No Flowless/MSN mixing or live fallback.'});
}
async function boundedFetch(url,signal){
 const response=await fetch(url,{signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(25000)]),redirect:'error',headers:{'User-Agent':'LonghandOffice-local-research/1.0','Accept':'application/json'}});
 if(!response.ok)throw Error('History provider returned HTTP '+response.status+'. Retry later; no substitute observations used.');
 const reader=response.body.getReader();let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000000){await reader.cancel();throw Error('History response exceeds 12 MB.');}chunks.push(Buffer.from(value));}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function acquireHistory(config,signal){
 if(config.historySource==='published-yahoo')return acquirePublishedHistory(config);
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
