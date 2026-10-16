import {writeFile,mkdir,rename,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {fetchYahooChart} from './us-market-adapter.mjs';
import {projectMarketSnapshot} from './market-adapter.mjs';
import {yahooHistory} from './quote-history.mjs';
import {HISTORY_INSTRUMENTS,validateMarketHistories} from '../market-history-contract.js';
export async function collectMarketHistories(){
 let next=0;const entries=[];await Promise.all(Array.from({length:3},async()=>{while(next<HISTORY_INSTRUMENTS.length){const {category,symbol}=HISTORY_INSTRUMENTS[next++];try{const raw=await fetchYahooChart(symbol,fetch,'10y'),retrievedAt=new Date().toISOString(),quote=projectMarketSnapshot(raw,category,symbol,retrievedAt);quote.history=yahooHistory(raw,retrievedAt,{limit:6000});entries.push({category,symbol,quote});}catch(e){entries.push({category,symbol,error:String(e.message).slice(0,240)});}}}));
 const feed=validateMarketHistories({format:'longhand-market-histories',version:1,publishedAt:new Date().toISOString(),entries});await mkdir('.pages-data',{recursive:true});const tmp='.pages-data/market-history-'+process.pid+'.tmp';await writeFile(tmp,JSON.stringify(feed));await rename(tmp,'.pages-data/market-history.json');console.log(JSON.stringify(feed.entries.map(e=>({category:e.category,symbol:e.symbol,points:e.quote?.history.length||0,first:e.quote?.history[0]?.date,last:e.quote?.history.at(-1)?.date,error:e.error||null}))));return feed;
}
let pending=null;
export async function readMarketHistories(){
 if(pending)return pending;pending=(async()=>{try{const d=validateMarketHistories(JSON.parse(await readFile(new URL('../.pages-data/market-history.json',import.meta.url),'utf8')));if(Date.now()-Date.parse(d.publishedAt)<15*60*1000)return d;}catch{}return collectMarketHistories();})();try{return await pending;}finally{pending=null;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await collectMarketHistories();
