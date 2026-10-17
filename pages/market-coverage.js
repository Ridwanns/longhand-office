export function filterMarketInstruments(items,{query='',kind='all'}={}){
 const needle=query.trim().toLowerCase();
 return items.filter(i=>(kind==='all'||kind==='etf'&&i.instrumentType==='ETF'||kind==='pluang'&&i.pluangListed===true)&&(!needle||[i.ticker,i.name,i.pluangName].some(s=>String(s||'').toLowerCase().includes(needle)))).sort((a,b)=>Number(b.ticker.toLowerCase()===needle)-Number(a.ticker.toLowerCase()===needle));
}
export function instrumentAvailability(item){
 if(item.priceAvailable===false)return 'Price unavailable from source';
 return item.modelCutoff?'Price and model history available':item.historyPublished?'Price and chart history available; model history insufficient':'Price available; model history not published';
}
