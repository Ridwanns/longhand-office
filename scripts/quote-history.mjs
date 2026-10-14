export function yahooHistory(body,quoteTime){
 const result=body?.chart?.result?.[0],zone=result?.meta?.exchangeTimezoneName||'America/New_York';
 let format;try{format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});}catch{return [];}
 const closes=result?.indicators?.quote?.[0]?.close,stamps=result?.timestamp,received=Date.parse(quoteTime),limit=received+300000;
 if(!Number.isFinite(received)||!Array.isArray(closes)||!Array.isArray(stamps))return [];
 const currentDate=format.format(new Date(received)),byDate=new Map();
 for(let i=0;i<stamps.length;i++){
  const stamp=stamps[i],close=closes[i];if(!Number.isInteger(stamp)||stamp<=0||stamp*1000>limit||typeof close!=='number'||!Number.isFinite(close)||close<=0)continue;
  const date=format.format(new Date(stamp*1000));if(date>currentDate)continue;
  const old=byDate.get(date);
  // Overnight futures may append an observation to a calendar date already present.
  // Retain the latest actual timestamp, never interpolate or merge their prices.
  if(old?.stamp===stamp&&old.close!==close)return [];
  if(!old||stamp>old.stamp)byDate.set(date,{date,close,stamp});
 }
 return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-20).map(({date,close})=>({date,close}));
}
export function dailyChange(history,price,date){
 const prior=history.filter(p=>p.date<date).at(-1);
 if(!prior||prior.close<=0)return null;const value=price-prior.close,percent=(price/prior.close-1)*100;
 return Number.isFinite(value)&&Number.isFinite(percent)?{value,percent,referenceDate:prior.date,referenceClose:prior.close}:null;
}
