import {writeFile,mkdir,rename,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {fetchYahooChart} from './us-market-adapter.mjs';
import {projectMarketSnapshot} from './market-adapter.mjs';
import {yahooHistory} from './quote-history.mjs';
import {HISTORY_INSTRUMENTS,validateMarketHistories} from '../market-history-contract.js';
export async function collectMarketHistories({directory='.pages-data',fetcher=fetch,attempts=3,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),requireComplete=process.env.OFFICE_REQUIRE_COMPLETE_HISTORY==='1'}={}){
 if(!Number.isInteger(attempts)||attempts<1||attempts>3)throw Error('Use one to three source attempts.');
 let previous;try{previous=validateMarketHistories(JSON.parse(await readFile(path.join(directory,'market-history.json'),'utf8')));}catch{}
 let next=0;const entries=[];await Promise.all(Array.from({length:3},async()=>{while(next<HISTORY_INSTRUMENTS.length){const {category,symbol}=HISTORY_INSTRUMENTS[next++];let error;
  for(let attempt=0;attempt<attempts;attempt++)try{const raw=await fetchYahooChart(symbol,fetcher,'20y'),retrievedAt=new Date().toISOString(),quote=projectMarketSnapshot(raw,category,symbol,retrievedAt);quote.history=yahooHistory(raw,retrievedAt,{limit:6000});entries.push({category,symbol,quote});error=null;break;}catch(e){error=String(e.message).slice(0,240);if(attempt+1<attempts)await wait(2000*2**attempt);}
  if(error){const retained=previous?.entries.find(e=>e.category===category&&e.symbol===symbol&&e.quote);entries.push(retained?{category,symbol,quote:retained.quote,refreshError:error,refreshAttemptAt:new Date().toISOString()}:{category,symbol,error});}
 }}));
 const feed=validateMarketHistories({format:'longhand-market-histories',version:1,publishedAt:new Date().toISOString(),entries});
 if(requireComplete&&feed.entries.some(e=>!e.quote))throw Error('Publication withheld: incomplete market histories: '+feed.entries.filter(e=>!e.quote).map(e=>e.symbol).join(', '));
 await mkdir(directory,{recursive:true});const tmp=path.join(directory,'market-history-'+process.pid+'.tmp');await writeFile(tmp,JSON.stringify(feed));await rename(tmp,path.join(directory,'market-history.json'));console.log(JSON.stringify(feed.entries.map(e=>({category:e.category,symbol:e.symbol,points:e.quote?.history.length||0,first:e.quote?.history[0]?.date,last:e.quote?.history.at(-1)?.date,error:e.error||e.refreshError||null,retained:!!e.refreshError}))));return feed;
}
let pending=null;
export async function readMarketHistories(){
 if(pending)return pending;pending=(async()=>{try{const d=validateMarketHistories(JSON.parse(await readFile(new URL('../.pages-data/market-history.json',import.meta.url),'utf8')));if(Date.now()-Date.parse(d.publishedAt)<15*60*1000)return d;}catch{}return collectMarketHistories();})();try{return await pending;}finally{pending=null;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectMarketHistories();
