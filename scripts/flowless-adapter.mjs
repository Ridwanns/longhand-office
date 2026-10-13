const FLOWLESS='http://127.0.0.1:8000';
import {dailyChange} from './quote-history.mjs';
export function normalizeIdxSymbol(value){
 const symbol=String(value??'').trim().toUpperCase().replace(/\.JK$/,'');
 if(!/^[A-Z]{4}$/.test(symbol))throw Error('Choose a four-letter IDX stock ticker, such as BBCA or BBCA.JK.');
 return symbol;
}
export function validMarketDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;}
export function projectFlowless(body,symbol,asOf,retrievedAt){
 if(!validMarketDate(asOf))throw Error('Choose a valid assessment date.');
 if(body?.ticker!==symbol||!Array.isArray(body.series))throw Error('Flowless returned an unexpected ticker or price-series shape.');
 const eligible=body.series.filter(r=>validMarketDate(r.trade_date)&&r.trade_date<=asOf);
 const row=eligible.reduce((a,b)=>!a||b.trade_date>a.trade_date?b:a,null);
 if(!row)throw Error('Flowless has no recorded session for this instrument on or before the assessment date.');
 if(typeof row.close!=='number'||!Number.isFinite(row.close)||row.close<=0||row.close>9007199254||Number(row.close.toFixed(6))!==row.close)throw Error('The selected Flowless session has no usable positive raw closing price. No older price or zero was substituted.');
 const history=eligible.filter(p=>typeof p.close==='number'&&Number.isFinite(p.close)&&p.close>0).sort((a,b)=>a.trade_date.localeCompare(b.trade_date)).slice(-20).map(p=>({date:p.trade_date,close:p.close}));
 return {provider:'flowless',symbol,name:typeof body.name==='string'?body.name:null,price:row.close,currency:'IDR',date:row.trade_date,history,change:dailyChange(history,row.close,row.trade_date),priceKind:'daily-close',market:'IDX',retrievedAt,realtime:false,sourceUrl:FLOWLESS+'/api/ticker/'+symbol,volume:typeof row.volume==='number'&&Number.isFinite(row.volume)&&row.volume>=0?row.volume:null,latestAvailableDate:body.series.reduce((latest,r)=>validMarketDate(r.trade_date)&&r.trade_date>latest?r.trade_date:latest,''),note:'Raw daily close from your local Flowless database. Not a live quote; no split-adjusted chart price or exchange rate is substituted.'};
}
async function json(url,fetcher){
 const response=await fetcher(url,{signal:AbortSignal.timeout(15000),redirect:'error',headers:{accept:'application/json'}});
 if(!response.ok)throw Error(response.status===404?'Instrument not found in the local Flowless database.':'Flowless could not serve this read. Its existing data was not changed.');
 return response.json();
}
export async function readFlowlessPrice(symbol,asOf,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 const normalized=normalizeIdxSymbol(symbol);if(!validMarketDate(asOf))throw Error('Choose a valid assessment date.');
 const body=await json(FLOWLESS+'/api/ticker/'+normalized,fetcher);
 return projectFlowless(body,normalized,asOf,now());
}
export async function readFlowlessStatus({fetcher=fetch}={}){
 const body=await json(FLOWLESS+'/api/health',fetcher);
 if(!['ok','no_data'].includes(body.status)||!(body.latest_trade_date===null||validMarketDate(body.latest_trade_date)))throw Error('Unexpected Flowless health response.');
 return {provider:'flowless',status:body.status,latestTradeDate:body.latest_trade_date,priceKind:'daily-close',market:'IDX',realtime:false,sourceUrl:FLOWLESS};
}
