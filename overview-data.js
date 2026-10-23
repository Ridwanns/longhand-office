// Read-only overview calculations. No storage, acquisition, FX inference or
// hypothetical performance is introduced by this presentation adapter.
import {valuation,PRICE_MAX_AGE_DAYS} from './model.js';
import {treasurySpread} from './official-rates-contract.js';

const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const countKeys=['portfolioCount','completeCount','incompleteCount','positionCount','missingPriceCount','stalePriceCount','currencyMismatchCount','unknownCashCount','invalidCount'];
const counts=()=>Object.fromEntries(countKeys.map(k=>[k,0]));

// Decimal summation retains the ledger's millionth/legacy precision instead of
// introducing binary addition drift when accounts are combined for display.
function sum(values){
 if(!values.length)return 0;
 if(values.some(x=>!finite(x)))throw Error('Overview totals require finite recorded values.');
 const parts=values.map(x=>{const [m,e='0']=String(x).split('e');return {digits:BigInt(m.replace('.','')),places:(m.split('.')[1]?.length||0)-Number(e)};}),places=Math.max(0,...parts.map(x=>x.places));
 const total=parts.reduce((s,x)=>s+x.digits*10n**BigInt(places-x.places),0n),negative=total<0n,digits=String(negative?-total:total).padStart(places+1,'0');
 const value=places?Number((negative?'-':'')+digits.slice(0,-places)+'.'+digits.slice(-places)):Number(total);
 if(!finite(value))throw Error('Overview total exceeds the supported numerical range.');
 return value;
}

export function overviewPortfolioSummary(data,asOf,mode='real'){
 if(!day(asOf)||!['real','paper'].includes(mode))throw Error('Choose a valid overview date and Real or Paper mode.');
 const selected=(data?.portfolios||[]).filter(p=>(p.mode||'paper')===mode),portfolios=selected.map(p=>{
  const row={id:p.id,name:p.name,currency:p.currency,mode,...counts(),portfolioCount:1,maxAgeDays:PRICE_MAX_AGE_DAYS};
  try{
   const v=valuation(p,asOf),complete=v.complete&&finite(v.total),positions=v.rows.map(r=>({symbol:r.symbol,quantity:r.quantity,cost:r.cost,marketValue:r.marketValue,unrealizedPnl:r.unrealized,priceDate:r.quote?.date||null,priceCurrency:r.quote?.currency||null,priceAgeDays:r.ageDays,state:r.state}));
   return {...row,complete,completeCount:Number(complete),incompleteCount:Number(!complete),positionCount:positions.length,missingPriceCount:v.missing,stalePriceCount:v.outdated,currencyMismatchCount:v.currencyMismatch,unknownCashCount:Number(v.cashBalance===null),cash:v.cashBalance,nav:complete?v.total:null,recordedCost:complete?sum(positions.map(r=>r.cost)):null,unrealizedPnl:complete?sum(positions.map(r=>r.unrealizedPnl)):null,positions,reason:null};
  }catch(error){return {...row,complete:false,incompleteCount:1,invalidCount:1,cash:null,nav:null,recordedCost:null,unrealizedPnl:null,positions:[],reason:error.message};}
 });
 const currencies=[...new Set(portfolios.map(p=>p.currency))].sort(),groups=currencies.map(currency=>{
  const accounts=portfolios.filter(p=>p.currency===currency),complete=accounts.every(p=>p.complete),stats=counts();
  for(const p of accounts)for(const k of countKeys)stats[k]+=p[k];
  const nav=complete?sum(accounts.map(p=>p.nav)):null,cash=accounts.every(p=>p.cash!==null)?sum(accounts.map(p=>p.cash)):null,positions=[];
  // Exact ledger symbols remain distinct. Incomplete accounts never generate
  // weights or a partial value that could be mistaken for the whole portfolio.
  if(complete){
   const symbols=[...new Set(accounts.flatMap(p=>p.positions.map(r=>r.symbol)))].sort();
   for(const symbol of symbols){const held=accounts.flatMap(p=>p.positions.filter(r=>r.symbol===symbol)),marketValue=sum(held.map(r=>r.marketValue));positions.push({symbol,quantity:sum(held.map(r=>r.quantity)),marketValue,recordedCost:sum(held.map(r=>r.cost)),unrealizedPnl:sum(held.map(r=>r.unrealizedPnl)),weight:nav>0?marketValue/nav:null,priceDates:[...new Set(held.map(r=>r.priceDate))].sort()});}
   positions.sort((a,b)=>b.marketValue-a.marketValue||a.symbol.localeCompare(b.symbol));
  }
  return {currency,...stats,complete,nav,cash,recordedCost:complete?sum(accounts.map(p=>p.recordedCost)):null,unrealizedPnl:complete?sum(accounts.map(p=>p.unrealizedPnl)):null,positions,largestPosition:complete&&nav>0&&positions.length?positions[0]:null,portfolios:accounts};
 });
 const stats=counts();for(const p of portfolios)for(const k of countKeys)stats[k]+=p[k];
 return {asOf,mode,...stats,maxAgeDays:PRICE_MAX_AGE_DAYS,groups,portfolios};
}

export function overviewReviewQueue(data,today){
 if(!day(today))throw Error('Choose a valid review date.');
 const rows=[];
 for(const [kind,list]of [['thesis',data?.theses||[]],['decision',data?.decisions||[]]])for(const r of list){
  if(kind==='thesis'?r.status==='Archived':r.status!=='Open')continue;
  if(!day(r.reviewDate))continue;
  rows.push({kind,id:r.id,title:r.title,symbol:r.symbol||'',status:r.status,reviewDate:r.reviewDate,due:r.reviewDate<=today,overdueDays:Math.max(0,Math.round((Date.parse(today)-Date.parse(r.reviewDate))/86400000)),href:'#'+(kind==='thesis'?'theses':'decisions')+'/'+encodeURIComponent(r.id)+'/reviews'});
 }
 return rows.sort((a,b)=>a.reviewDate.localeCompare(b.reviewDate)||a.kind.localeCompare(b.kind)||String(a.id).localeCompare(String(b.id)));
}

// Optional range is {start:'YYYY-MM-DD',end:'YYYY-MM-DD'}. Values are rebased
// closing prices, not total returns; every plotted date must exist in all inputs.
export function buildAlignedMarketComparison(series,range={}){
 const unavailable=reason=>({available:false,reason,dates:[],baseDate:null,endDate:null,observations:0,series:[],returnKind:'price-return'});
 if(!Array.isArray(series)||!series.length||series.length>12)return unavailable('Choose one to twelve dated market histories.');
 if(!range||typeof range!=='object'||Array.isArray(range)||range.start!==undefined&&!day(range.start)||range.end!==undefined&&!day(range.end)||range.start&&range.end&&range.start>range.end)return unavailable('The comparison date range is invalid.');
 const identities=new Set(),prepared=[];
 for(const s of series){
  if(!s||typeof s.key!=='string'||!s.key||identities.has(s.key)||typeof s.label!=='string'||!Array.isArray(s.observations))return unavailable('Market histories need unique identities and dated observations.');
  identities.add(s.key);const seen=new Set(),rows=[];
  for(const r of s.observations){
   if(!r||!day(r.date)||seen.has(r.date)||!finite(r.close)||r.close<=0)return unavailable('A market history has duplicate dates or invalid closing prices.');
   seen.add(r.date);if((!range.start||r.date>=range.start)&&(!range.end||r.date<=range.end))rows.push({date:r.date,close:r.close});
  }
  rows.sort((a,b)=>a.date.localeCompare(b.date));prepared.push({key:s.key,label:s.label,rows,map:new Map(rows.map(r=>[r.date,r.close]))});
 }
 const dates=prepared[0].rows.map(r=>r.date).filter(date=>prepared.every(s=>s.map.has(date)));
 if(dates.length<2)return unavailable('Fewer than two shared closing dates; no missing price is filled.');
 const aligned=prepared.map(s=>{const base=s.map.get(dates[0]),points=dates.map(date=>({date,close:s.map.get(date),value:s.map.get(date)/base*100}));return {key:s.key,label:s.label,points,priceReturn:s.map.get(dates.at(-1))/base-1,omittedDates:s.rows.length-dates.length};});
 if(aligned.some(s=>!finite(s.priceReturn)||s.points.some(p=>!finite(p.value))))return unavailable('The supplied price scale exceeds the supported numerical range.');
 return {available:true,reason:null,dates,baseDate:dates[0],endDate:dates.at(-1),observations:dates.length,series:aligned,returnKind:'price-return'};
}

// Select one source date, including its missing values. Never assemble a curve across dates.
export function overviewYieldCurve(rates){
 const tenors=[['2 Yr',2],['5 Yr',5],['10 Yr',10],['20 Yr',20],['30 Yr',30]];
 const row=rates?.observations?.findLast(r=>tenors.some(([tenor])=>Number.isFinite(r.rates?.[tenor])));
 if(!row)return null;
 return {date:row.date,retrievedAt:rates.retrievedAt,sourceUrl:rates.sourceUrl,points:tenors.map(([tenor,years])=>({tenor,years,value:Number.isFinite(row.rates[tenor])?row.rates[tenor]:null})),spreadBp:treasurySpread(row)};
}
