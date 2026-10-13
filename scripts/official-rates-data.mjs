import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// DOM-free contract lives in its own module so acquisition also runs in Node.
import {TREASURY_SOURCE,TREASURY_TENORS,validateOfficialRates} from '../official-rates-contract.js';
export function treasuryCsvUrl(year){if(!Number.isInteger(year)||year<1990||year>2100)throw Error('Invalid Treasury year.');return `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;}
export function projectTreasuryCsv(text,retrievedAt=new Date().toISOString()){
 if(typeof text!=='string'||text.length>200000)throw Error('Invalid Treasury CSV size.');
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/),cells=line=>line.split(',').map(c=>c.replace(/^"|"$/g,'').trim()),head=cells(lines.shift());
 if(head[0]!=='Date'||new Set(head).size!==head.length||TREASURY_TENORS.some(t=>!head.includes(t)))throw Error('Treasury CSV columns changed.');
 const observations=lines.map(line=>{const values=cells(line);if(values.length!==head.length)throw Error('Malformed Treasury row.');const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(values[0]);if(!m)throw Error('Invalid Treasury date.');const rates={};for(const t of TREASURY_TENORS){const v=values[head.indexOf(t)];if(!['','N/A'].includes(v)&&! /^-?\d+(?:\.\d+)?$/.test(v))throw Error('Invalid Treasury yield.');rates[t]=['','N/A'].includes(v)?null:Number(v);}return {date:`${m[3]}-${m[1]}-${m[2]}`,rates};}).sort((a,b)=>a.date.localeCompare(b.date));
 return validateOfficialRates({format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt,sourceHash:createHash('sha256').update(text).digest('hex'),observations});
}
export async function collectOfficialRates(){
 let data;try{const year=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',year:'numeric'}).format(new Date())),response=await fetch(treasuryCsvUrl(year),{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'text/csv','User-Agent':'LonghandOffice-official-rates/1.0'}});if(!response.ok)throw Error('Treasury returned HTTP '+response.status);const reader=response.body.getReader(),chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>200000){await reader.cancel();throw Error('Treasury release exceeds size limit.');}chunks.push(Buffer.from(value));}data=projectTreasuryCsv(Buffer.concat(chunks).toString('utf8'));
 }catch(error){data={format:'longhand-official-rates',version:1,provider:'us-treasury',sourceUrl:TREASURY_SOURCE,unit:'percent per year',retrievedAt:new Date().toISOString(),observations:[],error:String(error.message).slice(0,240)};validateOfficialRates(data);}
 const output=path.resolve('.pages-data');await mkdir(output,{recursive:true});await writeFile(path.join(output,'official-rates.json'),JSON.stringify(data));console.log(JSON.stringify({provider:data.provider,observations:data.observations.length,latest:data.observations.at(-1)?.date,error:data.error||null}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectOfficialRates();
