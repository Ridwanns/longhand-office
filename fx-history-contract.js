// Public FX references from the European Central Bank's euro foreign exchange reference rates (one publication per
// TARGET business day, for the 14:15 CET concertation). EUR/USD is the reference rate itself. USD/IDR is the cross of
// two reference rates from that same publication (IDR per EUR ÷ USD per EUR), so both legs share one date and time;
// it tracks Bank Indonesia's JISDOR fixing closely but is not JISDOR. The earlier Yahoo IDR=X closes are not used:
// on several days they were more than 3% away from JISDOR. Portfolio use requires explicit dated input review.
export const FX_PROVIDER='European Central Bank';
export const FX_SOURCE_PREFIX='https://data-api.ecb.europa.eu/service/data/EXR/D.IDR+USD.EUR.SP00.A?format=csvdata&detail=dataonly&startPeriod=';
export const FX_SERIES={
 'FX_IDC:USDIDR':{symbol:'USD/IDR',currency:'IDR',unit:'IDR per USD',name:'US dollar to Indonesian rupiah',status:'ECB reference-rate cross',method:'IDR per EUR divided by USD per EUR from the same ECB reference-rate publication, rounded to 2 decimals. A cross of official reference rates, not the JISDOR fixing.'},
 'FX:EURUSD':{symbol:'EUR/USD',currency:'USD',unit:'USD per EUR',name:'Euro to US dollar',status:'ECB reference rate',method:'ECB euro foreign exchange reference rate, USD per EUR.'}
};
export function validateFxHistory(feed,now=Date.now()){
 if(feed?.format!=='longhand-fx-history'||feed.version!==1||!Number.isFinite(Date.parse(feed.generatedAt))||Date.parse(feed.generatedAt)>now+300000||!Array.isArray(feed.entries)||feed.entries.length!==2)throw Error('Invalid FX history snapshot.');
 const seen=new Set();
 for(const e of feed.entries){const spec=FX_SERIES[e.id];if(!spec||seen.has(e.id))throw Error('Unexpected FX instrument.');seen.add(e.id);
  if(e.error){if(typeof e.error!=='string'||e.error.length>240||e.observations)throw Error('Invalid unavailable FX history.');continue;}
  if(e.refreshError!==undefined&&(typeof e.refreshError!=='string'||e.refreshError.length>240))throw Error('Invalid FX refresh status.');
  const start=typeof e.sourceUrl==='string'&&e.sourceUrl.startsWith(FX_SOURCE_PREFIX)?e.sourceUrl.slice(FX_SOURCE_PREFIX.length):'';
  if(e.provider!==FX_PROVIDER||e.symbol!==spec.symbol||e.unit!==spec.unit||e.currency!==spec.currency||e.method!==spec.method||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(e.retrievedAt))||e.retrievedAt>feed.generatedAt||!/^[a-f0-9]{64}$/.test(e.sourceHash)||!Array.isArray(e.observations)||!e.observations.length||!e.observations.some(o=>Number.isFinite(o.value))||e.observations.length>6000)throw Error('Invalid FX source identity.');
  let previous='';for(const o of e.observations){if(!/^\d{4}-\d{2}-\d{2}$/.test(o.date)||new Date(o.date+'T00:00:00Z').toISOString().slice(0,10)!==o.date||o.date<=previous||o.date<start||o.date>=e.retrievedAt.slice(0,10)||o.value!==null&&(!Number.isFinite(o.value)||o.value<=0)||o.status!==spec.status)throw Error('Invalid FX observation.');previous=o.date;}
 }
 return feed;
}
