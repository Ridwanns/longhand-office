import {validatePublicQuote} from './public-quote-contract.js';
import {MACRO_SERIES} from './macro-contract.js';
import {RELEASE_SERIES} from './macro-releases-contract.js';
import {EXTENDED_SERIES} from './macro-extended-contract.js';
import {CONTEXT_SERIES} from './macro-context-contract.js';
import {TREASURY_SOURCE,treasurySpread} from './official-rates-contract.js';
export const OVERVIEW_MARKETS=[{category:'macro',symbol:'^JKSE',label:'IHSG',route:'#market/macro/id/markets'},{category:'macro',symbol:'^GSPC',label:'S&P 500',route:'#market/macro/us/markets'},{category:'bonds',symbol:'TLT',label:'Long Treasury ETF',route:'#market/bonds'},{category:'commodities',symbol:'GC=F',label:'Gold futures',route:'#market/commodities'}];
// Closes come from completed sessions only. A bar dated on the retrieval day counts as a close once the exchange's
// local clock had passed 17:00 at retrieval (the fallback the history builders use when no regular-session end is
// supplied). A headline observed before then is an intraday print: it stays visible, labelled as such, never as a close.
const exchangeClock=(at,zone)=>{try{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at)).map(x=>[x.type,x.value]));return {date:p.year+'-'+p.month+'-'+p.day,hour:Number(p.hour)%24};}catch{return null;}};
export function overviewSession(q){
 const history=Array.isArray(q?.history)?q.history:[],date=q?.marketDate||String(q?.timestamp||'').slice(0,10)||null,at=exchangeClock(q?.retrievedAt,q?.exchangeTimezoneName||'America/New_York');
 if(!at)return {date,intraday:null,history};
 const open=at.hour<17;return {date,intraday:open&&date===at.date,history:open?history.filter(r=>r.date!==at.date):history};
}
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
 if(f.yieldCurve!=null){
  const c=f.yieldCurve,tenors=[['2 Yr',2],['5 Yr',5],['10 Yr',10],['20 Yr',20],['30 Yr',30]];
  if(!/^\d{4}-\d{2}-\d{2}$/.test(c.date)||!stamp(c.date,now)||new Date(c.date).toISOString().slice(0,10)!==c.date||!stamp(c.retrievedAt,now)||c.date>c.retrievedAt.slice(0,10)||c.sourceUrl!==TREASURY_SOURCE||!Array.isArray(c.points)||c.points.length!==5)throw Error('Invalid overview Treasury curve.');
  for(const [i,p]of c.points.entries())if(p.tenor!==tenors[i][0]||p.years!==tenors[i][1]||p.value!==null&&(!Number.isFinite(p.value)||p.value< -5||p.value>100))throw Error('Invalid overview Treasury tenor.');
  const spread=treasurySpread({rates:Object.fromEntries(c.points.map(p=>[p.tenor,p.value]))});
  if(c.spreadBp!==spread)throw Error('Overview Treasury spread does not reconcile.');
 }
 return f;
}
