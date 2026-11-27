import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {FX_PROVIDER,FX_SERIES,FX_SOURCE_PREFIX,validateFxHistory} from '../fx-history-contract.js';
// ECB euro reference rates, both currencies in one compact CSV (KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,
// TIME_PERIOD,OBS_VALUE). Every row is checked for its identity; nothing is filled, carried forward or substituted.
export const fxSourceUrl=startPeriod=>FX_SOURCE_PREFIX+startPeriod;
const validDay=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
export function parseEcbReferenceRates(text){
 if(typeof text!=='string'||text.length>3000000)throw Error('ECB reference-rate response size is invalid.');
 const lines=text.replace(/^﻿/,'').trim().split(/\r?\n/),head=lines.shift()?.split(',')||[];
 const col=name=>{const i=head.indexOf(name);if(i<0)throw Error('ECB reference-rate columns changed.');return i;};
 const [freq,currency,denominator,type,suffix,period,value]=['FREQ','CURRENCY','CURRENCY_DENOM','EXR_TYPE','EXR_SUFFIX','TIME_PERIOD','OBS_VALUE'].map(col);
 const days=new Map();
 for(const line of lines){
  const c=line.split(',');
  if(c.length!==head.length||c[freq]!=='D'||c[denominator]!=='EUR'||c[type]!=='SP00'||c[suffix]!=='A'||!['IDR','USD'].includes(c[currency]))throw Error('ECB reference-rate identity changed.');
  const date=c[period];if(!validDay(date))throw Error('Invalid ECB reference-rate date.');
  const v=c[value]===''?null:Number(c[value]);if(v!==null&&(!Number.isFinite(v)||v<=0))throw Error('Invalid ECB reference rate.');
  const day=days.get(date)||{};if(c[currency] in day)throw Error('Duplicate ECB reference-rate day.');day[c[currency]]=v;days.set(date,day);
 }
 if(!days.size)throw Error('No ECB reference rates supplied.');
 return days;
}
export function projectFxHistory(text,retrievedAt,startPeriod){
 if(!validDay(startPeriod))throw Error('Invalid FX start period.');
 const days=[...parseEcbReferenceRates(text)].sort(([a],[b])=>a.localeCompare(b)).filter(([date])=>date>=startPeriod&&date<retrievedAt.slice(0,10));
 const sourceHash=createHash('sha256').update(text).digest('hex'),sourceUrl=fxSourceUrl(startPeriod);
 const entry=(id,observations)=>{const spec=FX_SERIES[id];if(!observations.some(o=>Number.isFinite(o.value)))throw Error('No numeric ECB reference rates for '+spec.symbol+'.');return {id,provider:FX_PROVIDER,symbol:spec.symbol,currency:spec.currency,unit:spec.unit,method:spec.method,retrievedAt,sourceUrl,sourceHash,timezone:'Europe/Berlin',observations};};
 // both legs come from the same publication; a day missing either leg has no cross
 const cross=(idr,usd)=>Number.isFinite(idr)&&Number.isFinite(usd)?Math.round(idr/usd*100)/100:null;
 return [
  entry('FX_IDC:USDIDR',days.map(([date,r])=>({date,value:cross(r.IDR,r.USD),status:FX_SERIES['FX_IDC:USDIDR'].status}))),
  entry('FX:EURUSD',days.filter(([,r])=>'USD' in r).map(([date,r])=>({date,value:r.USD,status:FX_SERIES['FX:EURUSD'].status})))
 ];
}
export async function collectFxHistory({directory='.pages-data',fetcher=fetch,now=()=>new Date().toISOString()}={}){
 let previous;try{previous=validateFxHistory(JSON.parse(await readFile(path.join(directory,'fx-history.json'),'utf8')));}catch{}
 const retrievedAt=now(),start=new Date(retrievedAt);start.setUTCFullYear(start.getUTCFullYear()-10);const startPeriod=start.toISOString().slice(0,10);
 let entries;
 try{
  const response=await fetcher(fxSourceUrl(startPeriod),{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('ECB reference rates HTTP '+response.status);
  entries=projectFxHistory(await response.text(),retrievedAt,startPeriod);
 }catch(e){
  // a failed refresh keeps the last validated history with its original dates and hash, and says so
  const message=String(e.message).slice(0,240);
  entries=Object.keys(FX_SERIES).map(id=>{const old=previous?.entries.find(s=>s.id===id&&!s.error);return old?{...old,refreshError:message}:{id,error:message};});
 }
 const feed=validateFxHistory({format:'longhand-fx-history',version:1,generatedAt:new Date().toISOString(),entries});
 await mkdir(directory,{recursive:true});const temp=path.join(directory,'fx-history-'+process.pid+'.tmp');await writeFile(temp,JSON.stringify(feed));await rename(temp,path.join(directory,'fx-history.json'));
 console.log(JSON.stringify(entries.map(e=>({id:e.id,rows:e.observations?.length,first:e.observations?.[0]?.date,last:e.observations?.at(-1)?.date,error:e.error||e.refreshError||null}))));
 return feed;
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await collectFxHistory();
let pending;
export async function readFxHistory(){
 if(pending)return pending;
 pending=(async()=>{const directory=new URL('../.pages-data/',import.meta.url);try{const value=validateFxHistory(JSON.parse(await readFile(new URL('fx-history.json',directory),'utf8')));if(Date.now()-Date.parse(value.generatedAt)<15*60*1000)return value;}catch{}
  return collectFxHistory({directory:fileURLToPath(directory)});
 })();try{return await pending;}finally{pending=null;}
}
