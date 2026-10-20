// Public provider FX references. Portfolio use requires explicit dated input review.
export const FX_SERIES={
 'FX_IDC:USDIDR':{symbol:'IDR=X',currency:'IDR',unit:'IDR per USD',name:'US dollar to Indonesian rupiah'},
 'FX:EURUSD':{symbol:'EURUSD=X',currency:'USD',unit:'USD per EUR',name:'Euro to US dollar'}
};
export function validateFxHistory(feed,now=Date.now()){
 if(feed?.format!=='longhand-fx-history'||feed.version!==1||!Number.isFinite(Date.parse(feed.generatedAt))||Date.parse(feed.generatedAt)>now+300000||!Array.isArray(feed.entries)||feed.entries.length!==2)throw Error('Invalid FX history snapshot.');
 const seen=new Set();
 for(const e of feed.entries){const spec=FX_SERIES[e.id];if(!spec||seen.has(e.id))throw Error('Unexpected FX instrument.');seen.add(e.id);
  if(e.error){if(typeof e.error!=='string'||e.error.length>240||e.observations)throw Error('Invalid unavailable FX history.');continue;}
  if(e.refreshError!==undefined&&(typeof e.refreshError!=='string'||e.refreshError.length>240))throw Error('Invalid FX refresh status.');
  if(e.provider!=='Yahoo Finance'||e.symbol!==spec.symbol||e.unit!==spec.unit||e.currency!==spec.currency||e.sourceUrl!=='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(spec.symbol)+'?interval=1d&range=10y'||!Number.isFinite(Date.parse(e.retrievedAt))||e.retrievedAt>feed.generatedAt||!/^[a-f0-9]{64}$/.test(e.sourceHash)||!Array.isArray(e.observations)||!e.observations.length||!e.observations.some(o=>Number.isFinite(o.value))||e.observations.length>6000)throw Error('Invalid FX source identity.');
  let previous='';for(const o of e.observations){if(!/^\d{4}-\d{2}-\d{2}$/.test(o.date)||new Date(o.date+'T00:00:00Z').toISOString().slice(0,10)!==o.date||o.date<=previous||o.date>=e.retrievedAt.slice(0,10)||o.value!==null&&(!Number.isFinite(o.value)||o.value<=0))throw Error('Invalid FX observation.');previous=o.date;}
 }
 return feed;
}
