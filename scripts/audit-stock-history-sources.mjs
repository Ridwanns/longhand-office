// Independent read-only source reconciliation of every published equity/ETF history.
// It does not call the production normalizer or modify a snapshot on revisions.
import {readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('.pages-data/manifest.json','utf8'));
const checks=[],failures=[];let cursor=0;
await Promise.all(Array.from({length:4},async()=>{while(cursor<manifest.histories.length){
 const h=manifest.histories[cursor++];
 try{
  const stored=JSON.parse(await readFile('.pages-data/'+h.file,'utf8')),m=stored.metadata,symbol=h.ticker+(h.market==='IDX'?'.JK':'');
  const first=Date.parse(stored.rows[0].date+'T00:00:00Z')/1000-3*86400,last=Date.parse(stored.rows.at(-1).date+'T00:00:00Z')/1000+2*86400;
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?interval=1d&period1='+first+'&period2='+last+'&events=div%2Csplits';
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Provider HTTP '+r.status);
  const body=await r.json(),s=body.chart?.result?.[0],meta=s?.meta;
  if(body.chart?.error||meta?.symbol!==symbol||meta.currency!==m.currency||meta.instrumentType!==m.instrumentType||meta.exchangeName!==m.listing)throw Error('Independent provider identity mismatch');
  const format=new Intl.DateTimeFormat('en-CA',{timeZone:meta.exchangeTimezoneName,year:'numeric',month:'2-digit',day:'2-digit'}),today=format.format(new Date()),rows=new Map();
  s.timestamp.forEach((stamp,i)=>rows.set(format.format(new Date(stamp*1000)),{rawClose:s.indicators.quote[0].close[i],adjustedClose:s.indicators.adjclose?.[0]?.adjclose?.[i]??null,open:s.indicators.quote[0].open[i],high:s.indicators.quote[0].high[i],low:s.indicators.quote[0].low[i],volume:s.indicators.quote[0].volume[i]}));
  let dates=0,values=0,excludedUnfinished=0,adjustedChanged=0,adjustedMaxRelative=0,adjustedMaxAbsolute=0;
  for(const row of stored.rows){if(!row.complete||row.date>=today){excludedUnfinished++;continue;}const actual=rows.get(row.date);if(!actual)throw Error('Missing provider date '+row.date);
   for(const key of ['rawClose','adjustedClose','open','high','low','volume']){const a=row[key],b=actual[key];
    if(key==='adjustedClose'&&Number.isFinite(a)&&Number.isFinite(b)){
     const absolute=Math.abs(a-b),relative=absolute/Math.max(1,Math.abs(a));
     if(absolute>0)adjustedChanged++;adjustedMaxRelative=Math.max(adjustedMaxRelative,relative);adjustedMaxAbsolute=Math.max(adjustedMaxAbsolute,absolute);
     if(relative>1e-5)throw Error('Adjusted provider revision exceeds 0.1 bp relative '+row.date);
    }else if(a===null?b!==null:!Number.isFinite(b)||Math.abs(a-b)>1e-8*Math.max(1,Math.abs(a)))throw Error('Provider vintage/value differs '+row.date+' '+key);
    values++;
   }dates++;
  }
  checks.push({market:h.market,ticker:h.ticker,observations:dates,values,excludedUnfinished,adjustedChanged,adjustedMaxRelative,adjustedMaxAbsolute,sourceUrl:url});
 }catch(e){failures.push({market:h.market,ticker:h.ticker,error:e.message});}
 if((checks.length+failures.length)%200===0)console.log(JSON.stringify({completed:checks.length+failures.length,total:manifest.histories.length,failures:failures.length}));
}}));
const report={auditedAt:new Date().toISOString(),histories:manifest.histories.length,observations:checks.reduce((n,c)=>n+c.observations,0),values:checks.reduce((n,c)=>n+c.values,0),adjustedChanged:checks.reduce((n,c)=>n+c.adjustedChanged,0),adjustedMaxRelative:Math.max(...checks.map(c=>c.adjustedMaxRelative)),checks,failures,tolerance:'Raw OHLC/volume: 1e-8 relative or absolute. Adjusted close: report every nonzero difference, fail above 1e-5 scaled relative (0.1 basis point for prices >=1). This tolerance does not imply identical source values or a proven cause of their differences.',scope:'All retained completed exchange dates for every published stock/ETF file. Six source fields per row; current exchange-date/incomplete rows excluded. Provider revisions are flagged, not silently rewritten; this does not certify exchange-original data.'};
await writeFile('validation/stock-history-source-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,checks:checks.length,failures:failures.length}));if(failures.length)process.exitCode=1;
