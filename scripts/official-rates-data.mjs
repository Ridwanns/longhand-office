import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// DOM-free contract lives in its own module so acquisition also runs in Node.
import {TREASURY_SOURCE,TREASURY_TENORS,validateOfficialRates} from '../official-rates-contract.js';
export function treasuryCsvUrl(year){if(!Number.isInteger(year)||year<1990||year>2100)throw Error('Invalid Treasury year.');return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;}
export function projectTreasuryCsv(text,retrievedAt=new Date().toISOString()){
 if(typeof text!=='string'||text.length>200000)throw Error('Invalid Treasury CSV size.');
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/),cells=line=>line.split(',').map(c=>c.replace(/^"|"$/g,'').trim()),head=cells(lines.shift()).map(t=>t==='1.5 Month'?'1.5 Mo':t);
 if(head[0]!=='Date'||new Set(head).size!==head.length||TREASURY_TENORS.filter(t=>!['1.5 Mo','2 Mo','4 Mo'].includes(t)).some(t=>!head.includes(t)))throw Error('Treasury CSV columns changed.');
 const parsed=lines.map(line=>{const values=cells(line);if(values.length!==head.length)throw Error('Malformed Treasury row.');const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(values[0]);if(!m)throw Error('Invalid Treasury date.');const rates={};for(const t of TREASURY_TENORS){const v=head.includes(t)?values[head.indexOf(t)]:'';if(!['','N/A'].includes(v)&&! /^-?\d+(?:\.\d+)?$/.test(v))throw Error('Invalid Treasury yield.');rates[t]=['','N/A'].includes(v)?null:Number(v);}return {date:`${m[3]}-${m[1]}-${m[2]}`,rates};}).sort((a,b)=>a.date.localeCompare(b.date));
 for(const [tenor,began]of [['1.5 Mo','2025-02-18'],['2 Mo','2018-10-16'],['4 Mo','2022-10-19']])if(!head.includes(tenor)&&parsed.some(o=>o.date>=began))throw Error('Treasury CSV is missing a maturity available in this period.');
 const observations=parsed.filter(o=>TREASURY_TENORS.some(t=>o.rates[t]!==null)),omittedEmptyDates=parsed.filter(o=>TREASURY_TENORS.every(t=>o.rates[t]===null)).map(o=>o.date);
 return validateOfficialRates({omittedEmptyDates,format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt,sourceHash:createHash('sha256').update(text).digest('hex'),observations});
}
export async function collectOfficialRates({years=20,fetcher=fetch,now=()=>new Date().toISOString()}={}){
 if(!Number.isInteger(years)||years<1||years>20)throw Error('Use one to twenty years of Treasury history.');
 const retrievedAt=now(),year=Number(retrievedAt.slice(0,4)),start=new Date(retrievedAt);start.setUTCFullYear(year-years);
 const cutoff=start.toISOString().slice(0,10),requested=Array.from({length:years+1},(_,i)=>year-years+i),packets=[],historyErrors=[];let next=0;
 await Promise.all(Array.from({length:3},async()=>{while(next<requested.length){const y=requested[next++],url=treasuryCsvUrl(y);try{const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(25000),headers:{Accept:'text/csv','User-Agent':'LonghandOffice-official-rates/1.0'}});if(!response.ok)throw Error('Treasury HTTP '+response.status);const text=await response.text(),data=projectTreasuryCsv(text,retrievedAt);if(data.observations.some(o=>!o.date.startsWith(String(y)+'-')))throw Error('Treasury source year mismatch');packets.push({year:y,sourceUrl:url,sourceHash:data.sourceHash,retrievedAt,omittedEmptyDates:data.omittedEmptyDates,observations:data.observations});}catch(e){historyErrors.push({year:y,error:String(e.message).slice(0,240)});}}}));
 const observations=packets.flatMap(p=>p.observations).filter(o=>o.date>=cutoff).sort((a,b)=>a.date.localeCompare(b.date)),acquisitions=packets.sort((a,b)=>a.year-b.year).map(({observations,...p})=>({...p,observations:observations.length}));
 const data={format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt,observations,acquisitions,historyErrors,requestedStart:cutoff,sourceHash:createHash('sha256').update(JSON.stringify(acquisitions)).digest('hex')};
 if(!observations.length){data.error='Treasury history is unavailable.';delete data.sourceHash;}
 validateOfficialRates(data);await mkdir('.pages-data',{recursive:true});await writeFile('.pages-data/official-rates.json',JSON.stringify(data));console.log(JSON.stringify({provider:data.provider,observations:observations.length,first:observations[0]?.date,latest:observations.at(-1)?.date,yearsAcquired:packets.length,historyErrors}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectOfficialRates();
