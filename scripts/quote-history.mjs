export function yahooHistory(body,quoteTime){
 const result=body?.chart?.result?.[0],zone=result?.meta?.exchangeTimezoneName||'America/New_York';
 let format;try{format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});}catch{return [];}
 const closes=result?.indicators?.quote?.[0]?.close,stamps=result?.timestamp,limit=Date.parse(quoteTime)+300000;
 if(!Array.isArray(closes)||!Array.isArray(stamps))return [];
 return stamps.flatMap((stamp,i)=>Number.isInteger(stamp)&&stamp>0&&stamp*1000<=limit&&typeof closes[i]==='number'&&Number.isFinite(closes[i])&&closes[i]>0?[{date:format.format(new Date(stamp*1000)),close:closes[i]}]:[]).sort((a,b)=>a.date.localeCompare(b.date)).slice(-20);
}
export function dailyChange(history,price,date){
 const prior=history.filter(p=>p.date<date).at(-1);
 if(!prior||prior.close<=0)return null;const value=price-prior.close,percent=(price/prior.close-1)*100;
 return Number.isFinite(value)&&Number.isFinite(percent)?{value,percent,referenceDate:prior.date,referenceClose:prior.close}:null;
}
