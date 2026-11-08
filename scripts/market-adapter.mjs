import {MARKET_CATEGORIES,marketProviderTypeMatches} from '../market-catalogue.js';
import {fetchYahooChart} from './us-market-adapter.mjs';
import {yahooHistory,dailyChange} from './quote-history.mjs';
export function marketInstrument(category,symbol){
 const instrument=MARKET_CATEGORIES[category]?.instruments?.find(item=>item.symbol===symbol);
 if(!instrument)throw Error('Select an available instrument in this category.');
 return instrument;
}
export function projectMarketSnapshot(body,category,symbol,retrievedAt){
 const instrument=marketInstrument(category,symbol),meta=body?.chart?.result?.[0]?.meta;
 if(body?.chart?.error||!meta||meta.symbol!==symbol||!marketProviderTypeMatches(instrument,meta.instrumentType,meta.exchangeName)||meta.currency!==instrument.currency)throw Error('The source instrument, provider classification or currency does not match.');
 if(typeof meta.regularMarketPrice!=='number'||!Number.isFinite(meta.regularMarketPrice)||instrument.type!=='FUTURE'&&meta.regularMarketPrice<=0)throw Error('Price or level unavailable. No zero was substituted.');
 const received=Date.parse(retrievedAt),stamp=meta.regularMarketTime;
 if(!Number.isFinite(received)||!Number.isInteger(stamp)||stamp<=0||stamp*1000>received+300000)throw Error('Invalid source timestamp.');
 const snapshotTimestamp=new Date(stamp*1000).toISOString(),bars=yahooHistory(body,retrievedAt,{withStamp:true}),history=bars.map(({date,close})=>({date,close}));
 const zone=meta.exchangeTimezoneName||'America/New_York';let snapshotDate,retrievalDate;try{const format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});snapshotDate=format.format(new Date(snapshotTimestamp));retrievalDate=format.format(new Date(received));}catch{snapshotDate=null;retrievalDate=null;}
 // Yahoo's regularMarketPrice can be an intraday or days-old print on thin futures (OJ=F, CC=F) while the
 // daily bars already carry later, completed sessions. Once the latest bar's exchange date has ended,
 // or the bars run past the snapshot date, headline that bar's close; the raw snapshot is kept for audit.
 const last=bars.at(-1),useBar=Boolean(snapshotDate&&retrievalDate&&last&&(last.date>snapshotDate||last.date===snapshotDate&&last.date<retrievalDate));
 const price=useBar?last.close:meta.regularMarketPrice,timestamp=useBar?new Date(last.stamp*1000).toISOString():snapshotTimestamp,marketDate=useBar?last.date:snapshotDate,observedStamp=useBar?last.stamp:stamp;
 return {provider:'yahoo',category,symbol,name:instrument.name,price,currency:meta.currency,sourceUrl:'https://finance.yahoo.com/quote/'+encodeURIComponent(symbol)+'/history/',
  unit:instrument.unit,instrumentType:instrument.type,sourceInstrumentType:meta.instrumentType,sourceExchange:meta.exchangeName||null,priceKind:useBar?'daily-bar-close':'source-snapshot',...(useBar?{date:last.date,sourceSnapshot:{price:meta.regularMarketPrice,timestamp:snapshotTimestamp}}:{}),timestamp,retrievedAt,exchangeTimezoneName:typeof meta.exchangeTimezoneName==='string'?meta.exchangeTimezoneName:null,marketDate,history,change:marketDate?dailyChange(history,price,marketDate):null,
  historyNote:'Chart dates use the exchange calendar. Where multiple source timestamps share a date, the latest observation is retained. Current bars may be in progress; futures observations are not certified settlement prices.',
  ageSeconds:Math.max(0,Math.floor((received-observedStamp*1000)/1000)),realtimeVerified:false,exchange:meta.fullExchangeName||meta.exchangeName||null,
  delayMinutes:typeof meta.exchangeDataDelayedBy==='number'&&Number.isFinite(meta.exchangeDataDelayedBy)&&meta.exchangeDataDelayedBy>=0?meta.exchangeDataDelayedBy:null};
}
export async function readMarketSnapshot(category,symbol,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 marketInstrument(category,symbol);
 return projectMarketSnapshot(await fetchYahooChart(symbol,fetcher),category,symbol,now());
}
