// Independent Office adapter for the Yahoo chart source documented by StockSharp.Yahoo.
// No StockSharp source or trading engine is embedded.
const BASE='https://query1.finance.yahoo.com/v8/finance/chart/';
import {yahooHistory,dailyChange} from './quote-history.mjs';
const US_EXCHANGES=new Set(['NMS','NGM','NCM','NYQ','ASE','PCX','BATS','BTS']);
export function normalizeUsSymbol(value){
 const symbol=String(value??'').trim().toUpperCase().replace('.', '-');
 if(!/^[A-Z]{1,6}(?:-[A-Z])?$/.test(symbol))throw Error('Use a US ticker such as AAPL, MSFT, NVDA or BRK-B.');
 return symbol;
}
export function projectUsSnapshot(body,symbol,retrievedAt){
 const meta=body?.chart?.result?.[0]?.meta;
 if(body?.chart?.error||!meta)throw Error('The ticker is unavailable from the US source.');
 if(meta.symbol!==symbol||meta.currency!=='USD'||!US_EXCHANGES.has(meta.exchangeName)||!['EQUITY','ETF'].includes(meta.instrumentType))throw Error('This source supports US stocks and ETFs in USD. Choose Indonesia for IDX stocks.');
 if(typeof meta.regularMarketPrice!=='number'||!Number.isFinite(meta.regularMarketPrice)||meta.regularMarketPrice<=0)throw Error('The US source has no valid regular-session price. No zero or substitute was used.');
 const received=Date.parse(retrievedAt),stamp=meta.regularMarketTime;
 if(!Number.isFinite(received)||!Number.isInteger(stamp)||stamp<=0||stamp*1000>received+300000)throw Error('The US source has no valid price timestamp.');
 const timestamp=new Date(stamp*1000).toISOString();
 const history=yahooHistory(body,retrievedAt),marketDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
 const delayed=typeof meta.exchangeDataDelayedBy==='number'&&Number.isFinite(meta.exchangeDataDelayedBy)&&meta.exchangeDataDelayedBy>=0?meta.exchangeDataDelayedBy:null;
 return {provider:'yahoo',market:'US',symbol,currency:'USD',price:meta.regularMarketPrice,
  name:typeof meta.longName==='string'?meta.longName:typeof meta.shortName==='string'?meta.shortName:null,
  exchange:meta.fullExchangeName||meta.exchangeName,priceKind:'regular-session-snapshot',timestamp,retrievedAt,
  marketDate,history,change:dailyChange(history,meta.regularMarketPrice,marketDate),
  ageSeconds:Math.max(0,Math.floor((received-stamp*1000)/1000)),delayMinutes:delayed,realtimeVerified:false,
  sourceUrl:'https://finance.yahoo.com/quote/'+symbol+'/',volume:typeof meta.regularMarketVolume==='number'&&Number.isFinite(meta.regularMarketVolume)&&meta.regularMarketVolume>=0?meta.regularMarketVolume:null};
}
export async function fetchYahooChart(symbol,fetcher=fetch){
 let response;
 try{response=await fetcher(BASE+encodeURIComponent(symbol)+'?interval=1d&range=5d',{redirect:'error',signal:AbortSignal.timeout(15000),headers:{accept:'application/json'}});}
 catch(error){throw Error(error.name==='TimeoutError'?'The Yahoo source timed out. Try again.':'The Yahoo source could not be reached. Try again.');}
 if(!response.ok)throw Error(response.status===429?'The Yahoo request limit was reached. Wait before trying again.':response.status===404?'Ticker not found at Yahoo.':'The Yahoo source is unavailable.');
 let body;try{body=await response.json();}catch{throw Error('Invalid response from Yahoo.');}
 return body;
}
export async function readUsSnapshot(input,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 const symbol=normalizeUsSymbol(input);
 return projectUsSnapshot(await fetchYahooChart(symbol,fetcher),symbol,now());
}
