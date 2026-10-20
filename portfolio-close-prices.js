import {valuation,validateValuation} from './model.js';
import {validateFxHistory} from './fx-history-contract.js';
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
export function portfolioListing(symbol,currency){
 const market=currency==='USD'?'US':currency==='IDR'?'IDX':null,ticker=String(symbol).trim().toUpperCase().replace(market==='IDX'?/\.JK$/:/[.]/g,market==='IDX'?'':'-');
 if(!market||!(market==='IDX'?/^[A-Z]{4}$/:/^[A-Z]{1,6}(?:-[A-Z])?$/).test(ticker))throw Error('No supported same-currency stock/ETF listing for '+symbol+'. Supply a reviewed price instead.');
 return {market,ticker,currency,key:market+':'+ticker};
}
export function validateClosingHistory(h,entry,now=Date.now()){
 const m=h?.metadata,listing=entry.market==='IDX'?['JKT']:['NMS','NGM','NCM','NYQ','ASE','PCX','BTS','BATS'];
 if(!m||m.provider!=='yahoo'||m.market!==entry.market||m.ticker!==entry.ticker||m.currency!==entry.currency||!listing.includes(m.listing)||!['EQUITY','ETF'].includes(m.instrumentType)||m.timezone!==(entry.market==='IDX'?'Asia/Jakarta':'America/New_York')||m.retrievedAt!==entry.retrievedAt||!iso(m.retrievedAt)||Date.parse(m.retrievedAt)>now+300000||!/^[a-f0-9]{64}$/.test(m.sourceHash)||m.sourceUrl!=='https://finance.yahoo.com/quote/'+entry.ticker+(entry.market==='IDX'?'.JK/':'/')||!Array.isArray(h.rows)||h.rows.length!==entry.rows||h.rows.length>10000||!m.corporateActions||typeof m.corporateActions!=='object'||Array.isArray(m.corporateActions))throw Error('Published history identity, currency, provenance or acquisition vintage does not match its directory.');
 const acquired=new Intl.DateTimeFormat('en-CA',{timeZone:m.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(m.retrievedAt));let previous='';
 for(const r of h.rows){if(!day(r.date)||r.date<=previous||r.date>acquired||typeof r.complete!=='boolean'||r.rawClose!==null&&r.rawClose!==undefined&&(!Number.isFinite(r.rawClose)||r.rawClose<=0))throw Error('Invalid, duplicate, unordered or future closing observation.');previous=r.date;}
 return h;
}
export function closingPriceRecord(portfolio,symbol,date,history,entry,{now=Date.now(),id=crypto.randomUUID()}={}){
 if(!day(date)||Date.parse(date)>now)throw Error('Choose a valid past or current assessment date.');
 const listing=portfolioListing(symbol,portfolio.currency);if(entry?.market!==listing.market||entry?.ticker!==listing.ticker||entry?.currency!==listing.currency)throw Error('This holding has no matching published history.');
 const h=validateClosingHistory(history,entry,now),m=h.metadata,row=h.rows.find(r=>r.date===date&&r.complete===true);
 if(!row||!Number.isFinite(row.rawClose)||row.rawClose<=0)throw Error('No completed raw close on '+date+'. No previous session or adjusted close is substituted.');
 const first=portfolio.transactions.filter(t=>t.symbol===symbol&&t.side==='Buy'&&t.date<=date).map(t=>t.date).sort()[0];if(!first)throw Error('No recorded purchase for this holding on the selected date.');
 for(const s of Object.values(m.corporateActions.splits||{})){
  if(!Number.isFinite(s.date)||s.date<=0||s.date*1000>Date.parse(m.retrievedAt)+300000)throw Error('Invalid published split evidence.');
  const d=new Intl.DateTimeFormat('en-CA',{timeZone:m.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s.date*1000));
  if(d>=first)throw Error('Published split on '+d+' may change the ledger/source share basis. Review quantities and supply a price manually; no split adjustment is inferred.');
 }
 const price=Number(row.rawClose.toFixed(6));if(price<=0)throw Error('Source close is below the ledger price precision.');
 const record={id,symbol,date,price,currency:portfolio.currency,origin:'market',market:listing.market,provider:'Yahoo Finance',priceKind:'published-completed-close',retrievedAt:m.retrievedAt,sourcePrice:row.rawClose,sourceHash:m.sourceHash,sourceUrl:m.sourceUrl,source:'Yahoo published raw close; '+date+'; acquired '+m.retrievedAt+'; ledger price rounded to 6 decimal places; original '+row.rawClose+'; SHA-256 '+m.sourceHash};
 validateValuation(record,portfolio);return record;
}
export function closingNavPreview(p,date,histories,{now=Date.now()}={}){
 const initial=valuation(p,date,0),prices=[],issues=[];
 for(const row of initial.rows){try{const key=portfolioListing(row.symbol,p.currency).key,source=histories.get(key);if(!source)throw Error('No published history loaded for this listing.');if(source.error)throw Error(source.error);prices.push(closingPriceRecord(p,row.symbol,date,source.history,source.entry,{now}));}catch(e){issues.push({symbol:row.symbol,reason:e.message});}}
 const result=valuation({...p,valuations:[...(p.valuations||[]),...prices]},date,0);
 if(initial.cashBalance===null)issues.push({symbol:'Cash',reason:'Opening cash is unknown. Published prices cannot establish a complete portfolio NAV.'});
 return {date,currency:p.currency,prices,issues,complete:issues.length===0&&result.complete,total:issues.length===0&&result.complete?result.total:null,cash:initial.cashBalance,holdings:result.rows,policy:'Exact-date completed raw closes, same-currency listings and recorded closing-date ledger balances. Ledger prices rounded to 6 decimals; original source prices retained. Known splits since the first recorded purchase block automation. Broker positions, omitted dividends and taxes are not independently reconciled.'};
}
export function exactPublishedFx(feed,date,from,to){
 validateFxHistory(feed);if(!day(date)||!/^[A-Z]{3}$/.test(from)||!/^[A-Z]{3}$/.test(to))throw Error('Choose a valid FX observation date and currency pair.');if(from===to)return {date,from,to,rate:1,source:'Identity conversion; same currency.'};
 const pair=from==='USD'&&to==='IDR'?['FX_IDC:USDIDR',false]:from==='IDR'&&to==='USD'?['FX_IDC:USDIDR',true]:from==='EUR'&&to==='USD'?['FX:EURUSD',false]:from==='USD'&&to==='EUR'?['FX:EURUSD',true]:null;
 if(!pair)throw Error('No connected direct/inverse FX series for '+from+' → '+to+'. No cross-rate is synthesized.');
 const e=feed.entries.find(e=>e.id===pair[0]),o=e?.observations?.find(o=>o.date===date&&Number.isFinite(o.value));if(!o)throw Error('No reported '+from+' → '+to+' FX observation on '+date+'. Dates are not carried forward.');
 const rate=pair[1]?1/o.value:o.value;if(!Number.isFinite(rate)||rate<=0)throw Error('Invalid inverted FX rate.');
 return {date,from,to,rate,source:e.provider+' reference · '+e.unit+' · '+date+' · '+(pair[1]?'explicit reciprocal of ':'direct ')+o.value+' · acquired '+e.retrievedAt+' · '+e.sourceUrl+' · SHA-256 '+e.sourceHash};
}
export async function loadClosingHistories(p,dates,{fetcher=fetch,signal}={}){
 const json=async file=>{const r=await fetcher(new URL('./data/'+file,import.meta.url),{credentials:'omit',cache:'no-store',signal:signal||AbortSignal.timeout(25000)});if(!r.ok)throw Error('Published '+file+' unavailable (HTTP '+r.status+').');const s=await r.text();if(s.length>12000000)throw Error('Published input exceeds its size limit.');return JSON.parse(s);};
 const manifest=await json('manifest.json');if(manifest.format!=='longhand-public-market-data'||manifest.version!==1||!iso(manifest.publishedAt)||Date.parse(manifest.publishedAt)>Date.now()+300000||!Array.isArray(manifest.histories)||manifest.histories.length>5000||new Set(manifest.histories.map(h=>h.market+':'+h.ticker)).size!==manifest.histories.length)throw Error('Invalid public history directory.');
 const wanted=new Map(),errors=new Map();for(const date of dates)for(const r of valuation(p,date,0).rows){try{const l=portfolioListing(r.symbol,p.currency);wanted.set(l.key,l);}catch(e){errors.set(r.symbol,e.message);}}
 if(wanted.size>100)throw Error('Automatic closing valuation supports up to 100 distinct holdings per request.');
 const histories=new Map(),queue=[...wanted.values()];let next=0;
 await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{while(next<queue.length){const l=queue[next++],entry=manifest.histories.find(h=>h.market===l.market&&h.ticker===l.ticker);try{if(!entry||entry.currency!==l.currency||entry.file!=='history/'+l.market+'-'+l.ticker+'.json')throw Error('No published same-currency daily history.');const history=await json(entry.file);validateClosingHistory(history,entry);histories.set(l.key,{entry,history});}catch(e){errors.set(l.key,e.message);histories.set(l.key,{error:e.message});}}}));
 return {histories,errors,publishedAt:manifest.publishedAt};
}
