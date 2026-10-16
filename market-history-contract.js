import {MARKET_CATEGORIES} from './market-catalogue.js';
import {validatePublicQuote} from './public-quote-contract.js';
export const HISTORY_INSTRUMENTS=['macro','commodities','bonds'].flatMap(category=>MARKET_CATEGORIES[category].instruments.map(i=>({category,symbol:i.symbol})));
export function validateMarketHistories(feed,now=Date.now()){
 if(feed?.format!=='longhand-market-histories'||feed.version!==1||!Number.isFinite(Date.parse(feed.publishedAt))||Date.parse(feed.publishedAt)>now+300000||!Array.isArray(feed.entries)||feed.entries.length!==HISTORY_INSTRUMENTS.length)throw Error('Invalid historical market feed.');
 const seen=new Set();for(const entry of feed.entries){const key=entry.category+':'+entry.symbol;if(seen.has(key)||!HISTORY_INSTRUMENTS.some(i=>i.category===entry.category&&i.symbol===entry.symbol))throw Error('Unexpected historical instrument.');seen.add(key);
  if(entry.error){if(typeof entry.error!=='string'||entry.error.length>240||entry.quote)throw Error('Invalid unavailable historical series.');continue;}
  const q=entry.quote;if(!q||!Array.isArray(q.history)||q.history.length>6000)throw Error('Invalid historical observations.');validatePublicQuote({...q,history:q.history.slice(-20)},entry.category,entry.symbol,feed.publishedAt);
  let prior='';for(const o of q.history){if(typeof o.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(o.date)||new Date(o.date+'T00:00:00Z').toISOString().slice(0,10)!==o.date||o.date<=prior||o.date>q.retrievedAt.slice(0,10)||!Number.isFinite(o.close)||o.close<=0)throw Error('Invalid, duplicate or future historical close.');prior=o.date;}
 }return feed;
}

export function historyWindow(observations,range='10Y',frequency='weekly'){
 if(!['1Y','5Y','10Y','ALL'].includes(range)||!['daily','weekly','monthly'].includes(frequency))throw Error('Invalid chart window.');
 if(!observations.length)return [];const last=new Date(observations.at(-1).date+'T00:00:00Z'),start=new Date(last);if(range!=='ALL')start.setUTCFullYear(start.getUTCFullYear()-Number(range.slice(0,-1)));
 const selected=observations.filter(o=>range==='ALL'||o.date>=start.toISOString().slice(0,10));if(frequency==='daily')return selected.map(o=>({...o}));
 const grouped=new Map();for(const o of selected){let key=o.date.slice(0,7);if(frequency==='weekly'){const d=new Date(o.date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);key=d.toISOString().slice(0,10);}grouped.set(key,{...o});}return [...grouped.values()];
}
