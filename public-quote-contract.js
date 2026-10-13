import {MARKET_CATEGORIES} from './market-catalogue.js';
const positive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
export function validatePublicQuote(q,category,symbol,publishedAt){
 const publication=Date.parse(publishedAt),received=Date.parse(q?.retrievedAt),stamp=Date.parse(q?.timestamp),instrument=MARKET_CATEGORIES[category]?.instruments?.find(i=>i.symbol===symbol);
 if(!MARKET_CATEGORIES[category]||q?.symbol!==symbol||q?.provider!=='yahoo'||q?.realtimeVerified!==false||!positive(q?.price))throw Error('Published quote has an invalid instrument, source or price.');
 const currency=category==='idx'?'IDR':category==='us'?'USD':instrument?.currency;
 if(!currency||q.currency!==currency||instrument&&(q.instrumentType!==instrument.type||q.unit!==instrument.unit))throw Error('Published quote has an incompatible currency, type or unit.');
 if(!Number.isFinite(publication)||!Number.isFinite(received)||!Number.isFinite(stamp)||stamp<=0||stamp>received+300000||received>publication+300000||!date(q.marketDate))throw Error('Published quote has an invalid source or publication time.');
 const zone=category==='idx'||symbol==='^JKSE'?'Asia/Jakarta':'America/New_York',format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}),latestDate=format.format(new Date(received));
 if(['us','idx','bonds'].includes(category)&&q.marketDate!==format.format(new Date(stamp)))throw Error('Published market date does not match the source timestamp.');
 if(!Array.isArray(q.history)||q.history.length>20)throw Error('Published quote history is invalid.');
 for(let i=0;i<q.history.length;i++){const h=q.history[i];if(!date(h.date)||h.date>latestDate||!positive(h.close)||i&&h.date<=q.history[i-1].date)throw Error('Published close history contains invalid, future or duplicate observations.');}
 const prior=q.history.filter(h=>h.date<q.marketDate).at(-1);
 if(prior){const change=q.change;if(!change||change.referenceDate!==prior.date||!close(change.referenceClose,prior.close)||!close(change.value,q.price-prior.close)||!close(change.percent,(q.price/prior.close-1)*100))throw Error('Published change does not reconcile to its recorded reference close.');}
 else if(q.change!==null){const change=q.change;if(change?.referenceKind!=='provider-previous-close'||change.referenceDate!==null||!positive(change.referenceClose)||!close(change.value,q.price-change.referenceClose)||!close(change.percent,(q.price/change.referenceClose-1)*100))throw Error('Published change has no valid source previous close.');}
 return q;
}
