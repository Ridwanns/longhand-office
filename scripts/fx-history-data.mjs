import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {FX_SERIES,validateFxHistory} from '../fx-history-contract.js';
export function projectFxHistory(body,id,retrievedAt){
 const spec=FX_SERIES[id],r=body?.chart?.result?.[0];
 if(!spec||r?.meta?.symbol!==spec.symbol||r.meta.currency!==spec.currency||r.meta.instrumentType!=='CURRENCY'||typeof r.meta.exchangeTimezoneName!=='string'||!Array.isArray(r.timestamp)||r.timestamp.length>6000||r.timestamp.length!==r.indicators?.quote?.[0]?.close?.length)throw Error('FX provider identity or observations do not match.');
 const format=new Intl.DateTimeFormat('en-CA',{timeZone:r.meta.exchangeTimezoneName,year:'numeric',month:'2-digit',day:'2-digit'}),today=format.format(new Date(retrievedAt)),rows=new Map();
 r.timestamp.forEach((stamp,i)=>{if(!Number.isInteger(stamp)||stamp<=0||stamp*1000>Date.parse(retrievedAt))throw Error('Invalid FX source timestamp.');const date=format.format(new Date(stamp*1000));if(date>=today||date>=retrievedAt.slice(0,10))return;const value=r.indicators.quote[0].close[i];if(value!==null&&(!Number.isFinite(value)||value<=0))throw Error('Invalid FX close.');if(rows.has(date))throw Error('Duplicate FX source day.');rows.set(date,{date,value,status:'Provider daily close'});});
 if(![...rows.values()].some(o=>Number.isFinite(o.value)))throw Error('No numeric FX source observations.');
 return {id,provider:'Yahoo Finance',symbol:spec.symbol,currency:spec.currency,unit:spec.unit,retrievedAt,sourceUrl:'https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(spec.symbol)+'?interval=1d&range=10y',sourceHash:createHash('sha256').update(JSON.stringify(body)).digest('hex'),timezone:r.meta.exchangeTimezoneName,observations:[...rows.values()].sort((a,b)=>a.date.localeCompare(b.date))};
}
export async function collectFxHistory({directory='.pages-data',fetcher=fetch}={}){
 let previous;try{previous=validateFxHistory(JSON.parse(await readFile(path.join(directory,'fx-history.json'),'utf8')));}catch{}
 const entries=[];for(const [id,spec]of Object.entries(FX_SERIES))try{const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(spec.symbol)+'?interval=1d&range=10y',response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('FX provider HTTP '+response.status);const text=await response.text();if(text.length>3000000)throw Error('FX source exceeds limit.');entries.push(projectFxHistory(JSON.parse(text),id,new Date().toISOString()));}catch(e){const message=String(e.message).slice(0,240),old=previous?.entries.find(s=>s.id===id&&!s.error);entries.push(old?{...old,refreshError:message}:{id,error:message});}
 const feed=validateFxHistory({format:'longhand-fx-history',version:1,generatedAt:new Date().toISOString(),entries});await mkdir(directory,{recursive:true});const temp=path.join(directory,'fx-history-'+process.pid+'.tmp');await writeFile(temp,JSON.stringify(feed));await rename(temp,path.join(directory,'fx-history.json'));console.log(JSON.stringify(entries.map(e=>({id:e.id,rows:e.observations?.length,first:e.observations?.[0]?.date,last:e.observations?.at(-1)?.date,error:e.error||e.refreshError||null}))));return feed;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await collectFxHistory();
let pending;
export async function readFxHistory(){
 if(pending)return pending;
 pending=(async()=>{const directory=new URL('../.pages-data/',import.meta.url);try{const value=validateFxHistory(JSON.parse(await readFile(new URL('fx-history.json',directory),'utf8')));if(Date.now()-Date.parse(value.generatedAt)<15*60*1000)return value;}catch{}
  return collectFxHistory({directory:fileURLToPath(directory)});
 })();try{return await pending;}finally{pending=null;}
}
