// Personal/local reads only. No browser token, install script or trading action.
// Endpoint and symbol lookup informed by MIT-licensed 0xrsydn/idx-cli; see notices.
import {readFile} from 'node:fs/promises';
import {normalizeMsnTicker,projectMsnQuote,projectMsnRatios,projectMsnStatements,validateMsnSnapshot} from '../idx-msn-contract.js';
const PUBLIC_MSN_CLIENT_ID='0QfOX3Vn51YCzitbLaRkTTBadtWpgTN8NZLW0C1SEM'; // Public MSN frontend identifier; not an owner credential.
const BASES={quote:'https://assets.msn.com/service/Finance/Quotes',ratios:'https://api.msn.com/msn/v0/pages/finance/keyratios',statements:'https://assets.msn.com/service/Finance/Equities/financialstatements'};
export function parseMsnSymbols(text){const map=new Map();for(const line of text.trim().split(/\r?\n/)){const [ticker,id,...rest]=line.split('\t');if(!/^[A-Z]{4}$/.test(ticker)||!/^[a-zA-Z0-9]{1,20}$/.test(id)||rest.length||map.has(ticker))throw Error('Invalid or duplicate pinned IDX symbol mapping.');map.set(ticker,id);}if(!map.size||map.size>2000)throw Error('IDX mapping size is unsupported.');return map;}
let symbolsPromise;
const symbols=()=>symbolsPromise??=readFile(new URL('./idx-msn-symbols.tsv',import.meta.url),'utf8').then(parseMsnSymbols);
export async function localMsnSymbols(){return [...(await symbols()).keys()];}
export function createMsnReader({mapping,fetcher=fetch,now=()=>new Date().toISOString(),ttl=120000,maxActive=2}={}){
 const cache=new Map(),inflight=new Map();let active=0;
 async function json(kind,id){const url=new URL(BASES[kind]);url.search=new URLSearchParams({apikey:PUBLIC_MSN_CLIENT_ID,ids:id,wrapodata:'false'});let r;
  try{r=await fetcher(url,{headers:{'User-Agent':'LonghandOffice/1.0 (personal research; https://github.com/Ridwanns/longhand-office)','Accept':'application/json'},redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw Error('MSN '+kind+' request failed or timed out.');}
  if(!r.ok)throw Object.assign(Error('MSN '+kind+' unavailable (HTTP '+r.status+').'),{upstreamStatus:r.status});let body='',size=0;const decoder=new TextDecoder();
  for await(const chunk of r.body){size+=chunk.byteLength;if(size>2000000)throw Error('MSN '+kind+' response exceeds 2 MB.');body+=decoder.decode(chunk,{stream:true});}body+=decoder.decode();try{return JSON.parse(body);}catch{throw Error('MSN '+kind+' returned invalid JSON.');}
 }
 return async value=>{
  let ticker;try{ticker=normalizeMsnTicker(value);}catch(e){throw Object.assign(e,{status:400});}const map=mapping||await symbols(),id=map.get(ticker);if(!id)throw Object.assign(Error('Ticker is not in the pinned IDX/MSN directory. No substitute instrument was requested.'),{status:404});
  const time=Date.parse(now()),old=cache.get(ticker);if(old&&time-old.time>=0&&time-old.time<old.ttl)return {...structuredClone(old.value),cacheHit:true};if(inflight.has(ticker))return structuredClone(await inflight.get(ticker));if(active>=maxActive)throw Object.assign(Error('Two local MSN reads are already running. Wait for one to finish.'),{status:429});
  const promise=(async()=>{active++;const issues=[],out={format:'longhand-local-msn',version:1,provider:'msn',market:'IDX',ticker,fetchedAt:now(),cacheHit:false,quote:null,ratios:null,statements:[],issues};let blocked=false;
   for(const kind of ['quote','ratios','statements']){if(blocked){issues.push('MSN '+kind+' not requested after access/rate limiting.');continue;}try{const raw=await json(kind,id),received=now();out.fetchedAt=received;if(kind==='quote')out.quote=projectMsnQuote(raw,ticker,id,received);if(kind==='ratios')out.ratios=projectMsnRatios(raw,ticker,id,received);if(kind==='statements')out.statements=projectMsnStatements(raw,ticker,id,received);}catch(e){issues.push(e.message.slice(0,500));if([401,403,429].includes(e.upstreamStatus))blocked=true;}}
   out.fetchedAt=now();validateMsnSnapshot(out);cache.set(ticker,{time:Date.parse(now()),ttl:out.quote||out.ratios||out.statements.length?ttl:10000,value:out});while(cache.size>128)cache.delete(cache.keys().next().value);return out;
  })().finally(()=>{active--;inflight.delete(ticker);});inflight.set(ticker,promise);return structuredClone(await promise);
 };
}
export const readLocalMsn=createMsnReader();
