import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {projectUsSnapshot} from './us-market-adapter.mjs';
import {projectPagesIdxSnapshot} from './pages-data.mjs';
import {projectMarketSnapshot} from './market-adapter.mjs';
import {validateNativePriceFeed,nativePriceBucket} from '../native-prices.js';
import {validatePublicQuote} from '../public-quote-contract.js';

export function sparkResponses(body,requested){
 if(body?.spark?.error||!Array.isArray(body?.spark?.result))throw Error('Yahoo supplied no usable price batch.');
 const wanted=new Set(requested),out=new Map();
 for(const item of body.spark.result){if(!wanted.has(item.symbol)||out.has(item.symbol)||!Array.isArray(item.response)||item.response.length!==1||item.response[0]?.meta?.symbol!==item.symbol)throw Error('Yahoo batch identity is missing, duplicate or unexpected.');out.set(item.symbol,{chart:{result:item.response,error:null}});}
 return out;
}
export function projectNativePrice(body,category,symbol,retrievedAt){
 const quote=category==='us'?projectUsSnapshot(body,symbol,retrievedAt):category==='idx'?projectPagesIdxSnapshot(body,symbol,retrievedAt):projectMarketSnapshot(body,category,symbol,retrievedAt);
 validatePublicQuote(quote,category,symbol,retrievedAt);return quote;
}
export async function collectNativePrices(base,previous=null,{fetcher=fetch,now=()=>new Date().toISOString(),pause=ms=>new Promise(r=>setTimeout(r,ms)),batchSize=20,concurrency=2}={}){
 if(!Number.isFinite(Date.parse(base?.publishedAt))||!base.quotes||!Number.isInteger(batchSize)||batchSize<1||batchSize>20||!Number.isInteger(concurrency)||concurrency<1||concurrency>2)throw Error('Invalid published price catalogue or collection bounds.');
 if(previous)validateNativePriceFeed(previous);
 const bySymbol=new Map(),quotes={},summary={requested:0,refreshed:0,retained:0,unavailable:0,failures:0,requests:0,rateLimited:false};
 for(const [key,item]of Object.entries(base.quotes)){
  const [category,symbol]=key.split(':');if(!['us','idx','bonds','commodities','macro'].includes(category)||!symbol||!/^[A-Za-z0-9^=._-]{1,24}$/.test(symbol))throw Error('Unexpected published instrument key.');
  const sourceSymbol=category==='idx'?symbol+'.JK':symbol;
  if(!bySymbol.has(sourceSymbol))bySymbol.set(sourceSymbol,[]);bySymbol.get(sourceSymbol).push({key,category,symbol});
  const old=previous?.quotes[key];quotes[key]=old?.quote&&(!item.quote||Date.parse(old.quote.timestamp)>=Date.parse(item.quote.timestamp))?old:item;
 }
 const symbols=[...bySymbol.keys()],batches=[];for(let i=0;i<symbols.length;i+=batchSize)batches.push(symbols.slice(i,i+batchSize));summary.requested=Object.keys(quotes).length;let next=0,stopped=false;
 const failure=(batch,message)=>{for(const symbol of batch)for(const {key}of bySymbol.get(symbol)){quotes[key]={...quotes[key],error:message};summary.failures++;}};
 await Promise.all(Array.from({length:concurrency},async()=>{while(next<batches.length&&!stopped){const batch=batches[next++];try{
  const url=new URL('https://query1.finance.yahoo.com/v7/finance/spark');url.searchParams.set('symbols',batch.join(','));url.searchParams.set('range','1mo');url.searchParams.set('interval','1d');summary.requests++;
  const response=await fetcher(url,{headers:{accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  if([401,403,429].includes(response.status)){stopped=true;summary.rateLimited=true;throw Error('Yahoo declined further price requests (HTTP '+response.status+'). No substitute data.');}
  if(!response.ok)throw Error('Yahoo price batch unavailable (HTTP '+response.status+').');
  const text=await response.text();if(text.length>5000000)throw Error('Yahoo price batch exceeds limit.');const body=JSON.parse(text),mapped=sparkResponses(body,batch),retrievedAt=now();
  for(const sourceSymbol of batch)for(const {key,category,symbol}of bySymbol.get(sourceSymbol)){try{
   const raw=mapped.get(sourceSymbol);if(!raw)throw Error('Yahoo supplied no observation for this instrument.');
   const quote=projectNativePrice(raw,category,symbol,retrievedAt),old=quotes[key]?.quote;
   if(old&&Date.parse(quote.timestamp)<Date.parse(old.timestamp))throw Error('Yahoo returned an older observation; the newer recorded observation is retained.');
   quotes[key]={quote,sourceHash:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};summary.refreshed++;
  }catch(error){quotes[key]={...quotes[key],error:error.message.slice(0,240)};summary.failures++;}}
 }catch(error){failure(batch,error.message.slice(0,240));}await pause(250);}}));
 for(const batch of batches.slice(next))failure(batch,'Collection stopped after source access restriction; retaining dated observations.');
 for(const item of Object.values(quotes)){if(item.quote&&item.error)summary.retained++;if(!item.quote)summary.unavailable++;}
 const feed={format:'longhand-native-prices',version:1,generatedAt:now(),source:'Yahoo Finance spark · source regular-session snapshots',schedule:'Every 5 minutes; scheduler delays and source outages are possible. Not a guaranteed real-time feed.',summary,quotes};validateNativePriceFeed(feed);return feed;
}
export async function writeNativePriceFiles(feed,root){
 validateNativePriceFeed(feed);await mkdir(root+'/native-prices',{recursive:true});const buckets=Array.from({length:128},(_,i)=>({...feed,bucket:i.toString(16).padStart(2,'0'),quotes:{}}));
 for(const [key,item]of Object.entries(feed.quotes)){const i=key.indexOf(':');buckets[parseInt(nativePriceBucket(key.slice(0,i),key.slice(i+1)),16)].quotes[key]=item;}
 await writeFile(root+'/native-prices.json',JSON.stringify(feed));for(const bucket of buckets)await writeFile(root+'/native-prices/'+bucket.bucket+'.json',JSON.stringify(bucket));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const root=process.argv[2]||'dist/office/data',base=JSON.parse(await readFile(root+'/market.json','utf8'));let previous=null;try{previous=JSON.parse(await readFile(root+'/native-prices.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const feed=await collectNativePrices(base,previous);await writeNativePriceFiles(feed,root);console.log(JSON.stringify({generatedAt:feed.generatedAt,...feed.summary}));
}
