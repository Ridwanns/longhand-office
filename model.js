import {validatePerformanceWorkbook} from './portfolio-performance.js';
import {validateResearchContext,researchSymbol,checkPaperLink} from './investment-context.js';
export const KEY = 'longhand-office.v1';
export const empty = () => ({version:1, portfolios:[], theses:[], decisions:[]});
const text = (x,n=20000) => typeof x==='string' && x.length<=n;
const date = x => text(x,10) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x).toISOString().slice(0,10)===x;
const reports = x => Array.isArray(x) && x.length<=100 && x.every(r=>text(r,200));
const SCALE = 1000000n;
const decimals = value => {const [mantissa,exponent='0']=String(value).split('e');return Math.max(0,(mantissa.split('.')[1]?.length||0)-Number(exponent));};

// Integer millionths avoid binary floating-point drift. A partial sale releases
// proportional weighted-average cost rounded to a millionth; the final sale
// releases all remaining cost so rounding never leaves a residual position.
function units(value,label='Amount',scale=SCALE) {
 if (typeof value!=='number' || !Number.isFinite(value) || value<0) throw Error(`${label} must be a finite non-negative number.`);
 const [mantissa,exp='0']=String(value).split('e');
 const digits=mantissa.replace('.','');
 const shift=String(scale).length-1+Number(exp)-(mantissa.split('.')[1]?.length||0);
 if(shift<0) throw Error(`${label} supports at most six decimal places.`);
 return BigInt(digits)*10n**BigInt(shift);
}
const roundedDivide = (n,d) => (n+d/2n)/d;
function amount(value,scale=SCALE) {
 const negative=value<0n,places=String(scale).length-1;
 const digits=String(negative?-value:value).padStart(places+1,'0');
 const result=Number(`${negative?'-':''}${digits.slice(0,-places)}.${digits.slice(-places)}`);
 if(!Number.isFinite(result)) throw Error('Ledger total exceeds the supported numeric range.');
 return result;
}
function validTransaction(t,ids) {
 if (!t || !text(t.id,100) || !t.id || (ids && ids.has(t.id)) || !date(t.date) || !text(t.symbol,30) || !t.symbol.trim() || !['Buy','Sell'].includes(t.side) || !text(t.note)) throw Error('Invalid transaction fields.');
 if(typeof t.quantity!=='number'||!Number.isFinite(t.quantity)||t.quantity<=0) throw Error('Quantity must be greater than zero.');
 for(const [name,value] of [['Price',t.price],['Fee',t.fee]])if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error(`${name} must be a finite non-negative number.`);
 ids?.add(t.id);
}

export function ledger(portfolio,{referenceTransactions=portfolio.transactions}={}) {
 // Preserve older higher-precision records without rewriting their original values.
 const precision=portfolio.transactions.reduce((n,t)=>Math.max(n,decimals(t.quantity),decimals(t.price),decimals(t.fee)),(portfolio.cashFlows||[]).reduce((n,f)=>Math.max(n,decimals(f.amount)),Math.max(6,decimals(portfolio.openingCash??0))));
 const scale=10n**BigInt(precision),toUnits=(v,l)=>units(v,l,scale),toAmount=v=>amount(v,scale);
 const positions=new Map();
 const referenceSymbols=new Set(referenceTransactions.map(t=>t?.symbol));
 const funded=portfolio.openingCash!==undefined && portfolio.openingCash!==null;
 const initial=funded?toUnits(portfolio.openingCash,'Opening cash'):0n;
 let cash=initial, fees=0n, realized=0n, outlay=0n,dividends=0n,contributions=0n;
 const entries=[];
 // Stable sorting preserves recorded order for transactions on the same date.
 const events=[...portfolio.transactions.map((t,i)=>({...t,_kind:'transaction',_order:t.sequence??i+1})),...(portfolio.cashFlows||[]).map((t,i)=>({...t,_kind:'cashflow',_order:t.sequence??portfolio.transactions.length+i+1}))].sort((a,b)=>a.date.localeCompare(b.date)||a._order-b._order);
 for(const t of events) {
  if(t.sequence!==undefined&&(!Number.isSafeInteger(t.sequence)||t.sequence<1))throw Error('Invalid event ordering.');
  if(t._kind==='cashflow'){validateCashFlow(t,portfolio,referenceSymbols);const value=toUnits(t.amount,'Cash flow'),flow=t.type==='Withdrawal'?-value:value;cash+=flow;if(t.type==='Dividend')dividends+=value;else contributions+=flow;if(funded&&cash<0n)throw Error('Insufficient recorded cash on this date, including cash flows.');entries.push({id:t.id,cashFlow:toAmount(flow),cashBalance:funded?toAmount(cash):null,realized:0,gross:0});continue;}
  validTransaction(t);
  const quantity=toUnits(t.quantity,'Quantity'),price=toUnits(t.price,'Price'),fee=toUnits(t.fee,'Fee');
  const gross=roundedDivide(quantity*price,scale);
  const p=positions.get(t.symbol)||{symbol:t.symbol,quantity:0n,cost:0n,outlay:0n,fees:0n,realized:0n};
  let profit=0n,flow;
  if(t.side==='Buy') {p.quantity+=quantity; p.cost+=gross+fee; flow=-gross-fee;}
  else {
   if(quantity>p.quantity) throw Error('This sale exceeds recorded holdings on that date. Short selling is not supported.');
   const released=quantity===p.quantity?p.cost:roundedDivide(p.cost*quantity,p.quantity);
   profit=gross-fee-released;
   p.quantity-=quantity;p.cost-=released;flow=gross-fee;p.realized+=profit;
  }
  cash+=flow; fees+=fee;realized+=profit;outlay-=flow;p.outlay-=flow;p.fees+=fee;
  if(funded && cash<0n) throw Error('Insufficient recorded cash on this date, including fees.');
  [cash,fees,realized,outlay,p.quantity,p.cost,p.outlay,p.fees,p.realized].forEach(toAmount);
  positions.set(t.symbol,p);
  entries.push({id:t.id,gross:toAmount(gross),cashFlow:toAmount(flow),realized:toAmount(profit),cashBalance:funded?toAmount(cash):null});
 }
 return {openingCash:funded?toAmount(initial):null,cashBalance:funded?toAmount(cash):null,netCashFlow:toAmount(-outlay),dividendIncome:toAmount(dividends),netContributions:toAmount(contributions),fees:toAmount(fees),realized:toAmount(realized),entries,holdings:[...positions.values()].map(p=>({symbol:p.symbol,quantity:toAmount(p.quantity),outlay:toAmount(p.outlay),cost:toAmount(p.cost),averageCost:p.quantity?toAmount(roundedDivide(p.cost*scale,p.quantity)):0,fees:toAmount(p.fees),realized:toAmount(p.realized)}))};
}
export const holdings = p => ledger(p).holdings;
export const nextSequence=p=>Math.max(p.transactions.length+(p.cashFlows||[]).length,...[...p.transactions,...(p.cashFlows||[])].map(t=>t.sequence||0))+1;
export function validateCashFlow(f,p,symbols){
 if(!f||!text(f.id,100)||!f.id||!date(f.date)||!['Deposit','Withdrawal','Dividend'].includes(f.type)||f.currency!==p.currency||!text(f.note)||!(f.symbol===undefined||text(f.symbol,30)))throw Error('Invalid cash flow: choose a date, type, note and the portfolio currency. No FX conversion is supported.');
 units(f.amount,'Cash-flow amount');if(f.amount<=0||f.amount>Number.MAX_SAFE_INTEGER/1e6)throw Error('Cash-flow amount must be positive and within the supported range.');
 if(f.symbol&&!(symbols?symbols.has(f.symbol):p.transactions.some(t=>t.symbol===f.symbol)))throw Error('Cash-flow instrument must be a recorded portfolio instrument.');
 return f;
}
export function checkCashFlow(p,f){validateCashFlow(f,p);return ledger({...p,cashFlows:[...(p.cashFlows||[]),f]});}
export function checkTransaction(portfolio,transaction) {
 validTransaction(transaction);
 if(transaction.price<=0) throw Error('Transaction price must be greater than zero.');
 for(const [name,value] of [['Quantity',transaction.quantity],['Price',transaction.price],['Fee',transaction.fee]]){units(value,name);if(value>Number.MAX_SAFE_INTEGER/1e6)throw Error(`${name} exceeds the supported input range.`);}
 return ledger({...portfolio,transactions:[...portfolio.transactions,transaction]});
}
export const PRICE_MAX_AGE_DAYS=30;
export function validateValuation(record,portfolio,symbols){
 if(!record||!text(record.id,100)||!record.id||!text(record.symbol,30)||!(symbols?symbols.has(record.symbol):portfolio.transactions.some(t=>t.symbol===record.symbol))||!date(record.date)||!text(record.currency,3)||!/^[A-Z]{3}$/.test(record.currency)||!(record.source===undefined||text(record.source,1000)))throw Error('Invalid valuation record: select a recorded instrument, valid date and three-letter currency.');
 units(record.price,'User-supplied price');
 if(record.price>Number.MAX_SAFE_INTEGER/1e6)throw Error('User-supplied price exceeds the supported input range.');
 if(record.origin!==undefined&&!['manual','flowless','market'].includes(record.origin))throw Error('Unknown price origin.');
 if(record.origin==='market'&&(!['US','IDX'].includes(record.market)||record.price<=0||!text(record.retrievedAt,40)||Number.isNaN(Date.parse(record.retrievedAt))||!text(record.provider,100)||!text(record.priceKind,100)||record.currency!==portfolio.currency))throw Error('Invalid market observation provenance or incompatible currency.');
 if(record.origin==='flowless'&&(record.currency!=='IDR'||record.price<=0||record.market!=='IDX'||record.priceKind!=='daily-close'||!text(record.sourceSymbol,4)||!/^[A-Z]{4}$/.test(record.sourceSymbol)||record.sourceSymbol!==record.symbol.toUpperCase().replace(/\.JK$/,'')||!text(record.retrievedAt,40)||Number.isNaN(Date.parse(record.retrievedAt))))throw Error('Invalid Flowless daily-close provenance.');
 if(record.priceKind==='published-completed-close'&&(record.origin!=='market'||!Number.isFinite(record.sourcePrice)||record.sourcePrice<=0||record.price!==Number(record.sourcePrice.toFixed(6))||!/^[a-f0-9]{64}$/.test(record.sourceHash)||record.provider!=='Yahoo Finance'||record.sourceUrl!=='https://finance.yahoo.com/quote/'+record.symbol.trim().toUpperCase().replace(record.market==='IDX'?/\.JK$/:/[.]/g,record.market==='IDX'?'':'-')+(record.market==='IDX'?'.JK/':'/')))throw Error('Published closing price does not reconcile to its retained source value and listing.');
 return record;
}

export function valuation(portfolio,asOf,maxAgeDays=PRICE_MAX_AGE_DAYS){
 if(!date(asOf)||!Number.isInteger(maxAgeDays)||maxAgeDays<0)throw Error('Choose a valid assessment date and price-age threshold.');
 const recorded=ledger({...portfolio,transactions:portfolio.transactions.map((t,i)=>({...t,sequence:t.sequence??i+1})).filter(t=>t.date<=asOf),cashFlows:(portfolio.cashFlows||[]).map((f,i)=>({...f,sequence:f.sequence??portfolio.transactions.length+i+1})).filter(t=>t.date<=asOf)},{referenceTransactions:portfolio.transactions});
 const quotes=portfolio.valuations||[],held=recorded.holdings.filter(h=>h.quantity>0);
 const selected=new Map(),quotedSymbols=new Set();for(const q of quotes){quotedSymbols.add(q.symbol);if(q.date<=asOf){const previous=selected.get(q.symbol);if(!previous||q.date>=previous.date)selected.set(q.symbol,q);}}
 const precision=quotes.reduce((n,q)=>Math.max(n,decimals(q.price)),held.reduce((n,h)=>Math.max(n,decimals(h.quantity),decimals(h.cost)),Math.max(6,decimals(recorded.cashBalance??0))));
 const scale=10n**BigInt(precision),toUnits=v=>units(v,'Valuation amount',scale),toAmount=v=>amount(v,scale);
 const rows=held.map(h=>{
  const quote=selected.get(h.symbol)||null;
  const ageDays=quote?Math.round((Date.parse(asOf)-Date.parse(quote.date))/86400000):null;
  const state=!quote?(quotedSymbols.has(h.symbol)?'future':'missing'):ageDays>maxAgeDays?'outdated':'current';
  const marketValue=quote?toAmount(roundedDivide(toUnits(h.quantity)*toUnits(quote.price),scale)):null;
  const unrealized=quote?.currency===portfolio.currency?toAmount(toUnits(marketValue)-toUnits(h.cost)):null;
  return {...h,quote,ageDays,state,marketValue,unrealized,weight:null,weightBasis:null};
 });
 const map=new Map();
 function bucket(currency){if(!map.has(currency))map.set(currency,{currency,pricedHoldings:0,holdingsCount:0,cash:currency===portfolio.currency?recorded.cashBalance:null,subtotal:null,largest:null});return map.get(currency);}
 bucket(portfolio.currency);
 for(const r of rows)if(r.quote){const b=bucket(r.quote.currency);b.pricedHoldings=toAmount(toUnits(b.pricedHoldings)+toUnits(r.marketValue));b.holdingsCount++;}
 const coverage=rows.every(r=>r.state==='current');
 for(const b of map.values()){
  b.subtotal=b.holdingsCount||b.cash!==null?toAmount(toUnits(b.pricedHoldings)+toUnits(b.cash??0)):null;
  const cashKnown=b.currency!==portfolio.currency||recorded.cashBalance!==null;
  if(coverage&&cashKnown&&b.subtotal>0){
   const candidates=rows.filter(r=>r.quote?.currency===b.currency);
   for(const r of candidates){r.weight=r.marketValue/b.subtotal*100;r.weightBasis=b.currency===portfolio.currency?'Portfolio currency value including recorded cash':`${b.currency} priced holdings only; cash is recorded in ${portfolio.currency}`;}
   const largest=candidates.reduce((a,r)=>!a||r.marketValue>a.marketValue?r:a,null);
   if(largest)b.largest={symbol:largest.symbol,weight:largest.weight};
  }
 }
 const sameCurrency=rows.every(r=>r.quote?.currency===portfolio.currency);
 const complete=coverage&&sameCurrency&&recorded.cashBalance!==null;
 const base=map.get(portfolio.currency);
 const total=complete?base.subtotal:null;
 return {asOf,maxAgeDays,rows,buckets:[...map.values()],cashBalance:recorded.cashBalance,complete,total,largest:complete?base.largest:null,missing:rows.filter(r=>r.state==='missing'||r.state==='future').length,outdated:rows.filter(r=>r.state==='outdated').length,currencyMismatch:rows.filter(r=>r.quote&&r.quote.currency!==portfolio.currency).length};
}
export function validate(data) {
 if(!data || data.version!==1 || !['portfolios','theses','decisions'].every(k=>Array.isArray(data[k]) && data[k].length<=10000)) throw Error('This is not a supported Longhand Office backup.');
 const ids=new Set();
 const base=r=>{if(!r || !text(r.id,100) || !r.id || ids.has(r.id))return false;ids.add(r.id);return true;};
 if(!data.portfolios.every(p=>base(p) && text(p.name,120) && p.name.trim() && typeof p.currency==='string' && /^[A-Z]{3}$/.test(p.currency) && Array.isArray(p.transactions) && p.transactions.length<=50000)) throw Error('Invalid portfolio data.');
 for(const p of data.portfolios) {
  const symbols=new Set(p.transactions.map(t=>t?.symbol));
  if(p.mode!==undefined&&!['paper','real'].includes(p.mode))throw Error('Invalid portfolio mode: choose paper or real.');
  if(p.cashFlows!==undefined){if(!Array.isArray(p.cashFlows)||p.cashFlows.length>50000)throw Error('Invalid cash-flow history.');for(const f of p.cashFlows){validateCashFlow(f,p,symbols);if(ids.has(f.id))throw Error('Duplicate cash-flow ID.');ids.add(f.id);}}
  for(const t of p.transactions)validTransaction(t,ids);ledger(p);
  if(p.performanceWorkbook!==undefined)validatePerformanceWorkbook(p.performanceWorkbook,p,{checkLedger:false});
  if(p.valuations!==undefined){
   if(!Array.isArray(p.valuations)||p.valuations.length>50000)throw Error('Invalid valuation history.');
   for(const q of p.valuations){validateValuation(q,p,symbols);if(ids.has(q.id))throw Error('Duplicate valuation record ID.');ids.add(q.id);}
  }
 }
 if(!data.theses.every(t=>base(t) && text(t.title,180) && t.title.trim() && text(t.symbol,30) && text(t.assumptions) && text(t.evidence) && text(t.risks) && date(t.reviewDate) && ['Draft','Researching','Conviction','Archived'].includes(t.status) && reports(t.reports))) throw Error('Invalid thesis data.');
 if(!data.decisions.every(d=>base(d) && text(d.title,180) && d.title.trim() && date(d.date) && date(d.reviewDate) && text(d.rationale) && text(d.expected) && text(d.outcome) && text(d.thesisId,100) && (!d.thesisId || data.theses.some(t=>t.id===d.thesisId)) && (d.portfolioId===undefined || text(d.portfolioId,100) && (!d.portfolioId || data.portfolios.some(p=>p.id===d.portfolioId))) && reports(d.reports) && ['Open','Reviewed'].includes(d.status))) throw Error('Invalid journal data or broken thesis/portfolio link.');
 for(const record of [...data.theses,...data.decisions]){
  if(record.researchContext!==undefined){validateResearchContext(record.researchContext);if(record.symbol!==researchSymbol(record.researchContext))throw Error('Retained research belongs to another ticker. Create a separate record for another instrument.');const p=data.portfolios.find(p=>p.id===record.portfolioId);if(p&&p.currency!==record.researchContext.currency)throw Error('Research and linked portfolio currencies must match. No FX is inferred.');}
  const snapshot=x=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid retained original entry.');for(const [k,v] of Object.entries(x)){if(k==='reports'){if(!reports(v))throw Error('Invalid original research links.');}else if(!text(v))throw Error('Invalid retained prose.');}};
  if(record.originalEntry!==undefined){snapshot(record.originalEntry);if(!text(record.originalRetainedAt,40)||Number.isNaN(Date.parse(record.originalRetainedAt)))throw Error('Invalid original retention date.');}
  if(record.entryRevisions!==undefined){if(!Array.isArray(record.entryRevisions)||record.entryRevisions.length>1000)throw Error('Invalid entry history.');for(const rev of record.entryRevisions){if(!rev||!text(rev.id,100)||!rev.id||ids.has(rev.id)||!text(rev.recordedAt,40)||Number.isNaN(Date.parse(rev.recordedAt)))throw Error('Invalid entry revision.');snapshot(rev.entry);ids.add(rev.id);}}
  if(record.portfolioId!==undefined&&(!text(record.portfolioId,100)||record.portfolioId&&!data.portfolios.some(p=>p.id===record.portfolioId)))throw Error('Broken portfolio reference.');
  for(const k of ['horizon','invalidation','lessons','nextAction','symbol','assumptions','evidence'])if(record[k]!==undefined&&!text(record[k]))throw Error('Invalid research fields.');
  if(record.analysisRefs!==undefined){if(!Array.isArray(record.analysisRefs)||record.analysisRefs.length>100)throw Error('Invalid analysis references.');for(const r of record.analysisRefs)if(!r||!text(r.runId,100)||!r.runId||!date(r.cutoff)||!text(r.modelVersion,100)||!text(r.ticker,30)||!['US','IDX'].includes(r.market)||!text(r.resultHash,64)||!/^[a-f0-9]{64}$/.test(r.resultHash))throw Error('Invalid immutable analysis reference.');}
  if(record.reviewHistory!==undefined){if(!Array.isArray(record.reviewHistory)||record.reviewHistory.length>1000)throw Error('Invalid review history.');for(const r of record.reviewHistory){if(!r||!text(r.id,100)||!r.id||ids.has(r.id)||!date(r.date)||!text(r.outcome)||!r.outcome.trim()||!text(r.lessons)||!text(r.nextAction)||!['Held','Changed','Unclear'].includes(r.reasoningHeld)||!text(r.recordedAt,40)||Number.isNaN(Date.parse(r.recordedAt)))throw Error('Invalid outcome review.');ids.add(r.id);}}
 }
 for(const p of data.portfolios)for(const t of p.transactions){
  if(t.decisionId!==undefined||t.thesisId!==undefined){const d=data.decisions.find(d=>d.id===t.decisionId),th=data.theses.find(th=>th.id===t.thesisId);if(!text(t.decisionId,100)||!text(t.thesisId,100)||!d||!th||d.thesisId!==th.id||d.portfolioId!==p.id||(p.mode||'paper')!=='paper')throw Error('Broken paper transaction decision/thesis link.');if(d.researchContext||th.researchContext)checkPaperLink(data,p.id,d.id,th.id,t.symbol);}
 }
 return data;
}
