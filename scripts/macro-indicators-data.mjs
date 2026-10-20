import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MACRO_INDICATORS,INDICATOR_REVIEWED_AT,validateMacroIndicators} from '../macro-indicators-contract.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
export const indicatorGemUrl=code=>'https://api.worldbank.org/v2/country/IDN/indicator/'+code+'?source=15&format=json&date=1999M01:'+new Date().getUTCFullYear()+'M12&frequency=M&per_page=20000';
export function parseIndicatorGem(data,code){
 if(data?.[0]?.page!==1||data[0].pages!==1||String(data[0].sourceid)!=='15'||!Array.isArray(data[1])||data[0].total!==data[1].length)throw Error('Incomplete GEM indicator response.');
 const rows=data[1].map(o=>{if(o.country?.id!=='IDN'||o.countryiso3code&&o.countryiso3code!=='IDN'||o.indicator?.id!==code||!/^\d{4}M(0[1-9]|1[0-2])$/.test(o.date)||o.value!==null&&(!Number.isFinite(o.value)||o.value<0)||o.obs_status&&!['E','P'].includes(o.obs_status))throw Error('GEM indicator identity, monthly unit basis or value changed.');return {date:o.date.slice(0,4)+'-'+o.date.slice(-2)+'-01',value:o.value};}).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(rows.map(o=>o.date)).size!==rows.length||!rows.some(o=>Number.isFinite(o.value)))throw Error('No numeric GEM history supplied.');return rows;
}
export function transformIndicatorRows(rows,transform,other=[]){
 const map=new Map(rows.map(o=>[o.date,o.value])),second=new Map(other.map(o=>[o.date,o.value]));
 return rows.map(o=>{let value=null;if(transform==='yoy'){const prior=map.get((Number(o.date.slice(0,4))-1)+o.date.slice(4));if(Number.isFinite(o.value)&&Number.isFinite(prior)&&prior>0)value=100*(o.value/prior-1);}else if(transform==='balance'){const imports=second.get(o.date);if(Number.isFinite(o.value)&&Number.isFinite(imports))value=(o.value-imports)/1000;}else if(transform==='billions')value=o.value===null?null:o.value/1000;else throw Error('Unknown macro indicator transformation.');return {date:o.date,value,status:value===null?'missing':'derived'};});
}
async function fetchText(url){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Official indicator source HTTP '+r.status);const text=await r.text();if(text.length>2000000)throw Error('Indicator response too large.');return text;}
export async function collectMacroIndicators({fetchSource=fetchText,now=()=>new Date().toISOString(),reviewed}={}){
 const record=reviewed||JSON.parse(await readFile(new URL('../sources/macro-indicators-reviewed.json',import.meta.url),'utf8'));
 if(record.reviewedAt!==INDICATOR_REVIEWED_AT)throw Error('Supplementary release review vintage changed.');const codes=[...new Set(Object.values(MACRO_INDICATORS).filter(s=>s.provider==='gem'&&s.transform!=='balance').map(s=>s.code))],responses=new Map();
 await Promise.all(codes.map(async code=>{try{const text=await fetchSource(indicatorGemUrl(code));responses.set(code,{rows:parseIndicatorGem(JSON.parse(text),code),hash:hash(text),retrievedAt:now()});}catch(e){responses.set(code,{error:String(e.message).slice(0,240),retrievedAt:now()});}}));
 const series=Object.entries(MACRO_INDICATORS).map(([id,spec])=>{const base={id,sourceUrl:spec.sourceUrl,unit:spec.unit,frequency:spec.frequency,retrievedAt:spec.provider==='reviewed'?record.reviewedAt:responses.get(spec.transform==='balance'?'DXGSRMRCHNSCD':spec.code).retrievedAt};
  try{if(spec.provider==='reviewed'){const entry=record.series.find(s=>s.id===id);if(!entry)throw Error('Reviewed indicator missing.');return {...base,sourceHash:hash(JSON.stringify(entry)),observations:entry.observations};}
   const r=responses.get(spec.transform==='balance'?'DXGSRMRCHNSCD':spec.code),other=spec.transform==='balance'?responses.get('DMGSRMRCHNSCD'):null;if(r.error||other?.error)throw Error(r.error||other.error);
   const observations=transformIndicatorRows(r.rows,spec.transform,other?.rows).filter(o=>o.date<=base.retrievedAt.slice(0,10));return {...base,sourceHash:other?hash(r.hash+'|'+other.hash):r.hash,...(other?{componentHashes:[r.hash,other.hash]}:{}),observations};
  }catch(e){return {...base,observations:[],error:String(e.message).slice(0,240)};}
 });
 const feed=validateMacroIndicators({format:'longhand-macro-indicators',version:1,generatedAt:now(),series,expectations:(record.expectations||[]).map(e=>({...e,reviewedAt:record.reviewedAt,sourceHash:hash(JSON.stringify(e))}))});await mkdir('.pages-data',{recursive:true});const tmp='.pages-data/macro-indicators-'+process.pid+'.tmp';await writeFile(tmp,JSON.stringify(feed));await rename(tmp,'.pages-data/macro-indicators.json');console.log(JSON.stringify({series:series.length,available:series.filter(s=>!s.error).length,errors:series.filter(s=>s.error).map(s=>({id:s.id,error:s.error}))}));return feed;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectMacroIndicators();
