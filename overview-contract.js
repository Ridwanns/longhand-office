import {validatePublicQuote} from './public-quote-contract.js';
import {MACRO_SERIES} from './macro-contract.js';
import {RELEASE_SERIES} from './macro-releases-contract.js';
import {EXTENDED_SERIES} from './macro-extended-contract.js';
import {CONTEXT_SERIES} from './macro-context-contract.js';
export const OVERVIEW_MARKETS=[{category:'macro',symbol:'^JKSE',label:'IHSG',route:'#market/macro/id/markets'},{category:'macro',symbol:'^GSPC',label:'S&P 500',route:'#market/macro/us/markets'},{category:'bonds',symbol:'TLT',label:'Long Treasury ETF',route:'#market/bonds'},{category:'commodities',symbol:'GC=F',label:'Gold futures',route:'#market/commodities'}];
const stamp=(v,now)=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&Date.parse(v)<=now+300000;
const https=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validateOverviewFeed(f,now=Date.now()){
 if(f?.format!=='longhand-overview'||f.version!==1||!stamp(f.assembledAt,now)||!stamp(f.marketPublishedAt,now)||!Array.isArray(f.markets)||f.markets.length!==OVERVIEW_MARKETS.length||!Array.isArray(f.macro)||f.macro.length!==2)throw Error('Invalid overview publication.');
 for(const [i,m]of f.markets.entries()){
  const expected=OVERVIEW_MARKETS[i];if(m.category!==expected.category||m.symbol!==expected.symbol)throw Error('Overview instrument identity mismatch.');
  if(m.error){if(typeof m.error!=='string'||m.quote)throw Error('Invalid unavailable overview instrument.');continue;}
  const q=m.quote;validatePublicQuote({...q,history:q?.history?.slice(-20)},m.category,m.symbol,f.marketPublishedAt);
  if(!Array.isArray(q.history)||q.history.length>370)throw Error('Overview history exceeds limit.');
  let prior='';for(const row of q.history){if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!stamp(row.date,now)||new Date(row.date).toISOString().slice(0,10)!==row.date||row.date<=prior||row.date>q.retrievedAt.slice(0,10)||!Number.isFinite(row.close)||row.close<=0)throw Error('Invalid overview source close.');prior=row.date;}
 }
 for(const [i,c]of f.macro.entries()){
  if(c.country!==['IDN','USA'][i]||!Array.isArray(c.readings)||c.readings.length!==4)throw Error('Invalid overview economy.');
  for(const [j,r]of c.readings.entries()){
   if(r.key!==['gdp','inflation','policy','yield'][j]||!Array.isArray(r.items)||r.items.length>12)throw Error('Invalid overview indicator.');
   for(const s of r.items){const spec=RELEASE_SERIES[s.id]||EXTENDED_SERIES[s.id]||CONTEXT_SERIES[s.id]||MACRO_SERIES[s.id];if(!spec||!stamp(s.retrievedAt,now)||s.spec?.frequency!==spec.frequency||!https(s.spec.sourceUrl)||!Array.isArray(s.observations)||s.observations.length>120)throw Error('Invalid overview macro evidence.');let previous='';for(const o of s.observations){if(!stamp(o.date,now)||o.date<=previous||o.value!==null&&!Number.isFinite(o.value)||o.releasedAt&&!stamp(o.releasedAt,now)||o.sourceUrl&&!https(o.sourceUrl))throw Error('Invalid overview macro observation.');previous=o.date;}}
  }
 }
 for(const r of f.context||[]){if(!['USDIDR','UST10Y'].includes(r.key)||!Number.isFinite(r.value)||!stamp(r.date,now)||!stamp(r.retrievedAt,now)||!https(r.sourceUrl))throw Error('Invalid overview context reading.');}
 return f;
}
