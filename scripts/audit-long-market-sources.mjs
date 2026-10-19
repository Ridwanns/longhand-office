// Independent reconciliation of all loaded closes and all yearly Treasury files.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const feed=JSON.parse(await readFile('.pages-data/market-history.json','utf8')),rates=JSON.parse(await readFile('.pages-data/official-rates.json','utf8'));
const checks=[],failures=[];let index=0;
const tasks=[...feed.entries.map(e=>({kind:'market',e})),...(rates.acquisitions||[]).map(e=>({kind:'treasury',e}))];
await Promise.all(Array.from({length:3},async()=>{while(index<tasks.length){const {kind,e}=tasks[index++];try{
 if(kind==='market'){
  if(!e.quote)throw Error(e.error||'Missing collected series');const q=e.quote,end=new Date(q.retrievedAt),start=new Date(end);start.setUTCFullYear(start.getUTCFullYear()-20);
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(e.symbol)+'?interval=1d&period1='+Math.floor(start.getTime()/1000)+'&period2='+Math.floor(end.getTime()/1000),response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Source HTTP '+response.status);
  const raw=await response.json(),r=raw.chart?.result?.[0],m=r?.meta;if(raw.chart?.error||m?.symbol!==e.symbol||m.currency!==q.currency||m.instrumentType!==q.instrumentType)throw Error('Independent source identity mismatch');
  const format=new Intl.DateTimeFormat('en-CA',{timeZone:m.exchangeTimezoneName||'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}),today=format.format(new Date()),closes=new Map();
  for(let i=0;i<r.timestamp.length;i++){const date=format.format(new Date(r.timestamp[i]*1000)),v=r.indicators.quote[0].close[i];if(Number.isFinite(v)&&(m.instrumentType==='FUTURE'||v>0))closes.set(date,v);}
  let compared=0,negative=0;for(const o of q.history){if(o.date>=today)continue;const v=closes.get(o.date);if(!Number.isFinite(v)||Math.abs(v-o.close)>1e-8*Math.max(1,Math.abs(o.close)))throw Error('Source vintage/value mismatch at '+o.date);compared++;if(o.close<0)negative++;}
  checks.push({kind,symbol:e.symbol,currency:q.currency,unit:q.unit,comparedClosedObservations:compared,negativeObservations:negative,first:q.history[0]?.date,last:q.history.at(-1)?.date,sourceUrl:url});
 }else{
  const response=await fetch(e.sourceUrl,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Treasury HTTP '+response.status);const text=await response.text(),lines=text.trim().split(/\r?\n/),cells=l=>l.split(',').map(v=>v.replaceAll('"','').trim()),header=cells(lines.shift()).map(t=>t==='1.5 Month'?'1.5 Mo':t),rows=new Map();
  for(const line of lines){const row=cells(line),[month,day,year]=row[0].split('/'),date=year+'-'+month+'-'+day;rows.set(date,Object.fromEntries(header.slice(1).map((t,i)=>[t,['','N/A'].includes(row[i+1])?null:Number(row[i+1])])));}
  let compared=0,numericValues=0;for(const row of rates.observations.filter(o=>o.date.startsWith(e.year+'-'))){const source=rows.get(row.date);if(!source)throw Error('Treasury date mismatch '+row.date);for(const [tenor,value]of Object.entries(row.rates)){if(value!==(source[tenor]??null))throw Error('Treasury value mismatch '+row.date+' '+tenor);compared++;if(value!==null)numericValues++;}}
  checks.push({kind,year:e.year,comparedValues:compared,numericValues,missingValues:compared-numericValues,omittedEmptyDates:e.omittedEmptyDates||[],sourceUrl:e.sourceUrl});
 }
 }catch(error){failures.push({kind,id:e.symbol||e.year,error:error.message});}}}));
const report={auditedAt:new Date().toISOString(),marketSeries:feed.entries.length,treasuryFiles:rates.acquisitions?.length,closedMarketObservations:checks.filter(c=>c.kind==='market').reduce((n,c)=>n+c.comparedClosedObservations,0),treasuryValues:checks.filter(c=>c.kind==='treasury').reduce((n,c)=>n+c.comparedValues,0),policy:'Current exchange-date bars are excluded from historical reconciliation because they may still change intraday. No missing observation is filled.',checks,failures};
await mkdir('validation',{recursive:true});await writeFile('validation/long-market-independent-source-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,checks:checks.length}));if(failures.length)process.exitCode=1;
