import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MACRO_SERIES,WORLD_BANK_URL,EURO_GDP_URL,EURO_CPI_URL,periodIndex,periodEnd,validateMacroFeed} from '../macro-contract.js';
const hash=text=>createHash('sha256').update(text).digest('hex');
const numeric=text=>{if(!/^-?\d+(?:\.\d+)?$/.test(text))throw Error('Non-numeric source value.');return Number(text);};
export function csvRows(text,{ragged=false}={}){
 if(typeof text!=='string'||text.length>1000000)throw Error('Invalid CSV size.');
 const rows=[];let row=[],cell='',quoted=false;
 for(let j=0;j<text.length;j++){const c=text[j];if(c==='"'){if(quoted&&text[j+1]==='"'){cell+='"';j++;}else if(!quoted&&cell.length)throw Error('Malformed CSV quoting.');else quoted=!quoted;}
  else if(!quoted&&(c===','||c==='\n')){row.push(cell.replace(/\r$/,''));cell='';if(c==='\n'){if(row.some(v=>v!==''))rows.push(row);row=[];}}
  else cell+=c;
 }
 if(quoted)throw Error('Unclosed CSV field.');if(cell.length||row.length){row.push(cell.replace(/\r$/,''));if(row.some(v=>v!==''))rows.push(row);}
 if(rows.length<2||new Set(rows[0]).size!==rows[0].length||!ragged&&rows.slice(1).some(r=>r.length!==rows[0].length))throw Error('Malformed CSV table.');return rows;
}
export function projectFred(text,id){
 const code=id==='us-gdp'?'GDPC1':id==='us-cpi'?'CPIAUCSL':null;if(!code)throw Error('Unexpected FRED series.');
 const rows=csvRows(text);if(rows[0].join(',')!=='observation_date,'+code)throw Error('FRED columns changed.');
 const spec=MACRO_SERIES[id],values=new Map(),lag=spec.frequency==='Q'?4:12;let prior=-Infinity;
 for(const [date,value] of rows.slice(1)){if(!/^\d{4}-\d{2}-01$/.test(date))throw Error('Unexpected FRED observation date.');const month=Number(date.slice(5,7));if(spec.frequency==='Q'&&![1,4,7,10].includes(month))throw Error('Unexpected quarter start.');const period=spec.frequency==='Q'?date.slice(0,4)+'-Q'+(Math.floor((month-1)/3)+1):date.slice(0,7),index=periodIndex(period,spec.frequency);if(index<=prior)throw Error('Unsorted or duplicate FRED dates.');prior=index;const n=value==='.'||value===''?null:numeric(value);if(n!==null&&(!Number.isFinite(n)||n<=0))throw Error('Invalid FRED level.');values.set(index,{period,value:n});}
 const first=Math.min(...values.keys());return [...values].filter(([index])=>index>=first+lag).map(([index,o])=>({period:o.period,value:o.value!==null&&values.get(index-lag)?.value>0?100*(o.value/values.get(index-lag).value-1):null,status:'derived',releasedAt:null,sourceUrl:spec.url}));
}
export function projectEuroGdp(data){
 const singleton={freq:'Q',unit:'CLV_PCH_SM',s_adj:'SCA',na_item:'B1GQ',geo:'EA'};
 if(data?.class!=='dataset'||data.source!=='ESTAT'||JSON.stringify(data.id)!==JSON.stringify([...Object.keys(singleton),'time'])||data.size.length!==6||data.size.slice(0,5).some(n=>n!==1))throw Error('Eurostat dimensions changed.');
 for(const [dimension,key] of Object.entries(singleton)){const entries=Object.entries(data.dimension?.[dimension]?.category?.index||{});if(entries.length!==1||entries[0][0]!==key||entries[0][1]!==0)throw Error('Eurostat scope or units changed.');}
 const periods=Object.entries(data.dimension.time.category.index);if(periods.length!==data.size[5])throw Error('Eurostat period count changed.');
 return periods.sort((a,b)=>a[1]-b[1]).map(([period,index])=>{const flag=data.status?.[index]||'';if(!['','p','e'].includes(flag))throw Error('Unsupported Eurostat observation flag.');return {period,value:data.value?.[index]??null,status:flag==='p'?'provisional':flag==='e'?'estimate':'reported',releasedAt:null,sourceUrl:EURO_GDP_URL};});
}
export function projectEuroCpi(text){
 const rows=csvRows(text),head=rows.shift(),required=['KEY','FREQ','REF_AREA','ADJUSTMENT','ICP_ITEM','DATA_PROVIDER','ICP_SUFFIX','TIME_PERIOD','OBS_VALUE','OBS_STATUS','UNIT','UNIT_MULT'];if(required.some(k=>!head.includes(k)))throw Error('ECB columns changed.');
 const get=(row,key)=>row[head.indexOf(key)];
 return rows.map(row=>{for(const [k,v] of Object.entries({KEY:'HICP.M.U2.N.000000.4D0.ANR',FREQ:'M',REF_AREA:'U2',ADJUSTMENT:'N',ICP_ITEM:'000000',DATA_PROVIDER:'4D0',ICP_SUFFIX:'ANR',UNIT:'PCCH',UNIT_MULT:'0'}))if(get(row,k)!==v)throw Error('ECB series or units changed.');const flag=get(row,'OBS_STATUS');if(!['A','E','P','M'].includes(flag))throw Error('Unsupported ECB status.');const value=get(row,'OBS_VALUE');return {period:get(row,'TIME_PERIOD'),value:value===''||flag==='M'?null:numeric(value),status:flag==='E'?'estimate':flag==='P'?'provisional':'reported',releasedAt:null,sourceUrl:EURO_CPI_URL};});
}
export function projectWorldBank(data,id){
 const spec=MACRO_SERIES[id];if(!spec?.indicator||!Array.isArray(data)||data.length!==2||data[0].pages!==1||data[0].page!==1||!Array.isArray(data[1]))throw Error('Incomplete World Bank response.');
 return data[1].filter(r=>r.countryiso3code===spec.country&&r.indicator?.id===spec.indicator&&r.value!==null).map(r=>({period:r.date,value:r.value,status:'reported',releasedAt:null,sourceUrl:WORLD_BANK_URL})).sort((a,b)=>a.period.localeCompare(b.period));
}
async function publicText(url){
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'text/csv,application/json','User-Agent':'LonghandOffice-public-macro/1.0'}});if(!response.ok)throw Error('Official source returned HTTP '+response.status);let size=0;const chunks=[],reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000){await reader.cancel();throw Error('Official response exceeds size limit.');}chunks.push(Buffer.from(value));}return Buffer.concat(chunks).toString('utf8');
}
export async function collectMacro(){
 const reviewedText=await readFile(new URL('../sources/macro-indonesia-reviewed.json',import.meta.url),'utf8'),reviewed=JSON.parse(reviewedText);
 const groups=[['us-gdp'],['us-cpi'],['eu-gdp'],['eu-cpi'],Object.keys(MACRO_SERIES).filter(k=>k.startsWith('annual-'))];
 const collected=await Promise.all(groups.map(async ids=>{const retrievedAt=new Date().toISOString();try{const text=await publicText(MACRO_SERIES[ids[0]].url);return ids.map(id=>{const spec=MACRO_SERIES[id],observations=id.startsWith('us-')?projectFred(text,id):id==='eu-gdp'?projectEuroGdp(JSON.parse(text)):id==='eu-cpi'?projectEuroCpi(text):projectWorldBank(JSON.parse(text),id);const s={id,retrievedAt,sourceUrl:spec.url,sourceHash:hash(text),acquisition:spec.acquisition,observations}; // Validate each independently, preserving other sources when one fails.
   return s;});}catch(error){return ids.map(id=>({id,retrievedAt,sourceUrl:MACRO_SERIES[id].url,acquisition:'automatic',observations:[],error:String(error.message).slice(0,240)}));}}));
 const generatedAt=new Date().toISOString(),series=[...reviewed.series.map(s=>({...s,retrievedAt:reviewed.reviewedAt,sourceUrl:MACRO_SERIES[s.id].url,sourceHash:hash(reviewedText),acquisition:'reviewed-release'})),...collected.flat()];
 // Check each series using a complete, unavailable skeleton. A malformed provider cannot block other feeds.
 for(let j=0;j<series.length;j++){const s=series[j];try{const skeleton=Object.entries(MACRO_SERIES).map(([id,spec])=>id===s.id?s:{id,retrievedAt:generatedAt,sourceUrl:spec.url,acquisition:spec.acquisition,error:'Not collected',observations:[]});validateMacroFeed({format:'longhand-macro',version:1,generatedAt,series:skeleton});}catch(e){series[j]={id:s.id,retrievedAt:s.retrievedAt,sourceUrl:s.sourceUrl,acquisition:s.acquisition,observations:[],error:String(e.message).slice(0,240)};}}
 const feed=validateMacroFeed({format:'longhand-macro',version:1,generatedAt,series});await mkdir('.pages-data',{recursive:true});const temporary='.pages-data/macro-'+process.pid+'-'+Date.now()+'.tmp';await writeFile(temporary,JSON.stringify(feed));await rename(temporary,'.pages-data/macro.json');console.log(JSON.stringify(feed.series.map(s=>({id:s.id,latest:s.observations.at(-1)?.period,error:s.error||null}))));return feed;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectMacro();
