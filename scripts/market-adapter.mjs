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
 const timestamp=new Date(stamp*1000).toISOString(),history=yahooHistory(body,retrievedAt);
 const zone=meta.exchangeTimezoneName||'America/New_York';let marketDate;try{marketDate=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));}catch{marketDate=null;}
 return {provider:'yahoo',category,symbol,name:instrument.name,price:meta.regularMarketPrice,currency:meta.currency,sourceUrl:'https://finance.yahoo.com/quote/'+encodeURIComponent(symbol)+'/history/',
  unit:instrument.unit,instrumentType:instrument.type,sourceInstrumentType:meta.instrumentType,sourceExchange:meta.exchangeName||null,priceKind:'source-snapshot',timestamp,retrievedAt,marketDate,history,change:marketDate?dailyChange(history,meta.regularMarketPrice,marketDate):null,
  historyNote:'Chart dates use the exchange calendar. Where multiple source timestamps share a date, the latest observation is retained. Current bars may be in progress; futures observations are not certified settlement prices.',
  ageSeconds:Math.max(0,Math.floor((received-stamp*1000)/1000)),realtimeVerified:false,exchange:meta.fullExchangeName||meta.exchangeName||null,
  delayMinutes:typeof meta.exchangeDataDelayedBy==='number'&&Number.isFinite(meta.exchangeDataDelayedBy)&&meta.exchangeDataDelayedBy>=0?meta.exchangeDataDelayedBy:null};
}
export async function readMarketSnapshot(category,symbol,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 marketInstrument(category,symbol);
 return projectMarketSnapshot(await fetchYahooChart(symbol,fetcher),category,symbol,now());
}
