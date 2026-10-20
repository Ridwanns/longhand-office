import {validatePublicQuote} from './public-quote-contract.js';
export function validateNativePriceFeed(feed,now=Date.now()){
 const stamp=Date.parse(feed?.generatedAt);
 if(feed?.format!=='longhand-native-prices'||feed.version!==1||!Number.isFinite(stamp)||stamp>now+300000||!feed.quotes||Array.isArray(feed.quotes)||Object.keys(feed.quotes).length>20000)throw Error('Invalid native price publication.');
 for(const [key,item]of Object.entries(feed.quotes)){
  const colon=key.indexOf(':'),category=key.slice(0,colon),symbol=key.slice(colon+1);
  if(colon<1||!symbol||!item||typeof item!=='object'||!item.quote&&!item.error||item.error!==undefined&&(typeof item.error!=='string'||item.error.length>240))throw Error('Invalid native price record.');
  if(item.quote)validatePublicQuote(item.quote,category,symbol,feed.generatedAt);
 }
 return feed;
}
export function selectNativePrice(base,feed,category,symbol){
 const item=feed?.quotes?.[category+':'+symbol],candidate=item?.quote,original=base?.quote;
 // Never choose by check time alone. An older source timestamp cannot displace a newer quote.
 if(!candidate||original&&(Date.parse(candidate.timestamp)<Date.parse(original.timestamp)||candidate.timestamp===original.timestamp&&Date.parse(candidate.retrievedAt)<Date.parse(original.retrievedAt)))return {item:base,publicationTime:null,note:item?.error?'Price refresh unavailable for this instrument; retaining its dated publication.':'No newer source observation in the price-refresh publication.'};
 return {item,publicationTime:feed.generatedAt,note:feed.availabilityError|| (item.error?'Price refresh failed; retaining the last validated source observation.':'Automatic source snapshots · scheduled every 5 minutes; runs and source delivery may be delayed. Real-time entitlement is unverified.')};
}
export function nativePriceBucket(category,symbol){let hash=2166136261;for(const c of category+':'+symbol){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return ((hash>>>0)%128).toString(16).padStart(2,'0');}
const cache=new Map();
if(typeof document!=='undefined')document.addEventListener('office:market-loading',e=>{if(e.detail?.force)for(const entry of cache.values())entry.at=0;});
export async function readNativePrices(category,symbol,force=false){
 const bucket=nativePriceBucket(category,symbol),entry=cache.get(bucket);
 if(!force&&entry&&Date.now()-entry.at<60000)return entry.promise;
 const next={at:Date.now(),feed:entry?.feed};next.promise=(async()=>{const r=await fetch(new URL('./data/native-prices/'+bucket+'.json',import.meta.url),{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Price-refresh publication unavailable.');const text=await r.text();if(text.length>2000000)throw Error('Price-refresh bucket exceeds size limit.');const feed=validateNativePriceFeed(JSON.parse(text));if(feed.bucket!==bucket||Object.keys(feed.quotes).some(key=>{const i=key.indexOf(':');return nativePriceBucket(key.slice(0,i),key.slice(i+1))!==bucket;}))throw Error('Price-refresh bucket identity mismatch.');next.feed=feed;return feed;})().catch(()=>next.feed?{...next.feed,availabilityError:'Price refresh unavailable; retaining the last validated publication with its original source time.'}:null);cache.set(bucket,next);return next.promise;
}
