import {projectValuationFundamental} from './valuation-fundamentals.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {configFor,hash,normalizeHistory} from './quant-data.mjs';
import {projectUsSnapshot} from './us-market-adapter.mjs';
import {projectMarketSnapshot} from './market-adapter.mjs';
import {yahooHistory,dailyChange} from './quote-history.mjs';
import {selectModelCutoff} from './select-pages-cutoff.mjs';
import {MARKET_CATEGORIES} from '../market-catalogue.js';
import {STOCK_UNIVERSE} from '../pages/stock-universe.js';
import {recentLiquidity} from './pages-liquidity.mjs';
import {screenerInstrument,screenerQuote} from './screener-quotes.mjs';
import {PLUANG_ETF_CATALOGUE,seedPluangCatalogue,pluangCatalogueCoverage} from './pluang-etf-catalogue.mjs';
export function projectPagesHistory(raw,config,retrievedAt=new Date().toISOString()){
 const r=raw?.chart?.result?.[0],m=r?.meta,symbol=config.ticker+(config.market==='IDX'?'.JK':'');
 if(raw?.chart?.error||!r||m?.symbol!==symbol||m.currency!==(config.market==='IDX'?'IDR':'USD')||!['EQUITY','ETF'].includes(m.instrumentType)||(config.market==='IDX'?m.exchangeName!=='JKT':!['NMS','NGM','NCM','NYQ','ASE','PCX','BTS','BATS'].includes(m.exchangeName)))throw Error('Unexpected ticker, exchange, currency or instrument type from history source.');
 const times=r.timestamp,q=r.indicators?.quote?.[0],adj=r.indicators?.adjclose?.[0]?.adjclose;
 if(!Array.isArray(times)||!Array.isArray(q?.close)||times.length>10000)throw Error('Invalid history arrays.');
 const zone=m.exchangeTimezoneName||(config.market==='IDX'?'Asia/Jakarta':'America/New_York'),fmt=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}),now=new Date(retrievedAt),current=fmt.format(now),end=m.currentTradingPeriod?.regular?.end,hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',hourCycle:'h23'}).format(now));
 const todayComplete=end?now.getTime()/1000>=end+900:hour>=17;
 const rows=times.map((t,i)=>({date:fmt.format(new Date(t*1000)),timestamp:t,rawClose:q.close[i],adjustedClose:adj?.[i]??null,open:q.open?.[i]??null,high:q.high?.[i]??null,low:q.low?.[i]??null,volume:q.volume?.[i]??null,complete:fmt.format(new Date(t*1000))<current||fmt.format(new Date(t*1000))===current&&todayComplete}));
 const metadata={ticker:config.ticker,market:config.market,provider:'yahoo',listing:m.exchangeName,instrumentType:m.instrumentType,currency:m.currency,timezone:zone,source:'Yahoo Finance published daily history',sourceUrl:'https://finance.yahoo.com/quote/'+encodeURIComponent(symbol)+'/',retrievedAt,sourceHash:hash(raw),corporateActions:r.events||{},completionPolicy:'Past exchange dates; current session only after regular-session end +15 minutes (fallback 17:00 exchange local time).'};
 return {rows,metadata};
}
export function projectPagesIdxSnapshot(raw,ticker,retrievedAt){
 const m=raw?.chart?.result?.[0]?.meta;
 if(!m||m.symbol!==ticker+'.JK'||m.currency!=='IDR'||m.exchangeName!=='JKT'||m.instrumentType!=='EQUITY'||!Number.isFinite(m.regularMarketPrice)||m.regularMarketPrice<=0||!Number.isInteger(m.regularMarketTime)||m.regularMarketTime*1000>Date.parse(retrievedAt)+300000)throw Error('Invalid IDX snapshot.');
 const timestamp=new Date(m.regularMarketTime*1000).toISOString(),marketDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp)),history=yahooHistory(raw,retrievedAt);
 return {provider:'yahoo',market:'IDX',symbol:ticker,currency:'IDR',price:m.regularMarketPrice,name:m.longName||m.shortName||ticker,exchange:m.fullExchangeName||m.exchangeName,priceKind:'regular-session-snapshot',timestamp,retrievedAt,marketDate,history,change:dailyChange(history,m.regularMarketPrice,marketDate),ageSeconds:Math.max(0,Math.floor((Date.parse(retrievedAt)-m.regularMarketTime*1000)/1000)),delayMinutes:null,realtimeVerified:false,sourceUrl:'https://finance.yahoo.com/quote/'+ticker+'.JK/'};
}
async function fetchChart(symbol,cutoff,history){
 const start=new Date(cutoff+'T00:00:00Z');start.setUTCFullYear(start.getUTCFullYear()-5);
 const parameters=history?'interval=1d&period1='+Math.floor(start.getTime()/1000)+'&period2='+(Math.floor(Date.parse(cutoff+'T00:00:00Z')/1000)+86400)+'&events=div%2Csplits':'interval=1d&range=5d';
 const response=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?'+parameters,{signal:AbortSignal.timeout(25000),redirect:'error',headers:{Accept:'application/json','User-Agent':'LonghandOffice-public-market-snapshots/1.0'}});
 if(!response.ok)throw Error('Provider returned HTTP '+response.status+'. No substitute data.');
 const reader=response.body.getReader(),chunks=[];let bytes=0;
 for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>12000000){await reader.cancel();throw Error('History exceeds 12 MB.');}chunks.push(Buffer.from(value));}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function generatePagesData(){
 const output=path.resolve('.pages-data'),cutoff=new Date().toISOString().slice(0,10),startedAt=new Date().toISOString(),quotes={},histories=[],errors=[],fundamentals=[];
 await mkdir(path.join(output,'history'),{recursive:true});
 const screener=JSON.parse(await readFile(path.join(output,'screener.json'),'utf8')),instruments=[],coverage={};
 for(const market of ['US','IDX']){const source=screener.markets[market];if(!source?.entries?.length)throw Error('Run yahoo-stock-directory.py before generating public data.');coverage[market]={reportedTotal:source.reportedTotal,retrievedUnique:source.retrievedUnique,pages:source.pages,source:'Yahoo Finance equity screener via yfinance',query:source.query};for(const entry of source.entries){const instrument=screenerInstrument(entry,market);if(!instrument)continue;instruments.push(instrument);fundamentals.push(projectValuationFundamental(entry,market));const category=market==='US'?'us':'idx';try{quotes[category+':'+instrument.ticker]={quote:screenerQuote(entry,market)};}catch(e){quotes[category+':'+instrument.ticker]={error:e.message};}}coverage[market].published=instruments.filter(i=>i.market===market).length;}
 const parse=(market,defaults,env)=>[...new Set([...defaults,...instruments.filter(i=>i.market===market&&/^[A-Z]{1,6}(?:-[A-Z])?$/.test(i.ticker)).sort((a,b)=>(b.marketCap??-1)-(a.marketCap??-1)).slice(0,market==='US'?500:20000).map(i=>i.ticker),...String(env||'').split(/[\s,]+/).filter(Boolean).map(t=>configFor({market,ticker:t,cutoff,horizon:5}).ticker)])];
 seedPluangCatalogue(instruments);
 const us=parse('US',[...STOCK_UNIVERSE.US,...MARKET_CATEGORIES.bonds.instruments.map(i=>i.symbol),...PLUANG_ETF_CATALOGUE.records.map(i=>i.ticker)],process.env.OFFICE_US_TICKERS),idx=parse('IDX',STOCK_UNIVERSE.IDX,process.env.OFFICE_IDX_TICKERS);
 const tasks=[...us.map(ticker=>({category:'us',ticker,market:'US',history:true})),...idx.map(ticker=>({category:'idx',ticker,market:'IDX',history:true})),...['commodities','macro'].flatMap(category=>MARKET_CATEGORIES[category].instruments.map(i=>({category,ticker:i.symbol,history:false})))];
 let next=0;
 await Promise.all(Array.from({length:3},async()=>{while(next<tasks.length){const t=tasks[next++];try{
  const raw=await fetchChart(t.ticker+(t.market==='IDX'?'.JK':''),cutoff,t.history),retrievedAt=new Date().toISOString();
  const candidate=instruments.find(i=>i.market===t.market&&i.ticker===t.ticker),sourceType=raw?.chart?.result?.[0]?.meta?.instrumentType;
  if(candidate?.pluangListed&&sourceType!=='ETF')throw Error('Pluang fund listing could not be verified as an ETF at Yahoo. No substitute instrument was used.');
  const quote=t.category==='us'?projectUsSnapshot(raw,t.ticker,retrievedAt):t.category==='idx'?projectPagesIdxSnapshot(raw,t.ticker,retrievedAt):projectMarketSnapshot(raw,t.category,t.ticker,retrievedAt);
  if(candidate){candidate.instrumentType=sourceType;candidate.name=quote.name||candidate.name;candidate.source='Yahoo chart';}
  quote.publishedSnapshot=true;const instrument=instruments.find(i=>i.ticker===t.ticker&&i.market===t.market);if(instrument){quote.marketCap=instrument.marketCap;quote.capitalizationRetrievedAt=instrument.capitalizationRetrievedAt;quote.averageDailyVolume3Month=instrument.averageDailyVolume3Month;}else if(t.history)instruments.push({ticker:t.ticker,market:t.market,name:quote.name,currency:quote.currency,marketCap:null,source:'Yahoo chart'});quotes[t.category+':'+t.ticker]={quote};
  if(t.history){const config=configFor({market:t.market,ticker:t.ticker,cutoff,horizon:5}),input=projectPagesHistory(raw,config,retrievedAt),completed=input.rows.filter(r=>r.complete),latest=completed.at(-1),lastUsable=completed.filter(r=>Number.isFinite(r.adjustedClose)&&r.adjustedClose>0).at(-1);if(!lastUsable)throw Error('No usable completed history.');const selected=selectModelCutoff(input,config),file='history/'+t.market+'-'+t.ticker+'.json';await writeFile(path.join(output,file),JSON.stringify(input));histories.push({ticker:t.ticker,name:quote.name,market:t.market,currency:input.metadata.currency,liquidity20:recentLiquidity(input.rows),marketCap:null,file,rows:input.rows.length,retrievedAt,latestCompleted:latest.date,lastUsableClose:lastUsable.date,...selected,latestCompletedUsable:latest.date===lastUsable.date});}
  }catch(e){if(!quotes[t.category+':'+t.ticker]?.quote)quotes[t.category+':'+t.ticker]={error:e.message};errors.push({category:t.category,ticker:t.ticker,error:e.message});}}}));
 for(const instrument of MARKET_CATEGORIES.bonds.instruments)quotes['bonds:'+instrument.symbol]=quotes['us:'+instrument.symbol]?.quote?{quote:{...quotes['us:'+instrument.symbol].quote,category:'bonds',name:instrument.name,unit:instrument.unit,instrumentType:'ETF',priceKind:'source-snapshot'}}:quotes['us:'+instrument.symbol]||{error:'Snapshot unavailable.'};
 for(const instrument of instruments){const h=histories.find(h=>h.market===instrument.market&&h.ticker===instrument.ticker),item=quotes[(instrument.market==='US'?'us':'idx')+':'+instrument.ticker];instrument.priceAvailable=!!item?.quote;instrument.modelCutoff=h?.modelCutoff||null;instrument.historyPublished=!!h;}
 for(const market of ['US','IDX']){coverage[market].coreAdditions=instruments.filter(i=>i.market===market).length-coverage[market].published;coverage[market].published=instruments.filter(i=>i.market===market).length;}
 coverage.pluangEtfs=pluangCatalogueCoverage(instruments);
 const publishedAt=new Date().toISOString(),manifest={format:'longhand-public-market-data',version:1,startedAt,publishedAt,cutoff,instruments:instruments.sort((a,b)=>(a.market+a.ticker).localeCompare(b.market+b.ticker)),coverage,screenerRetrievedAt:screener.retrievedAt,histories:histories.sort((a,b)=>(a.market+a.ticker).localeCompare(b.market+b.ticker)),errors,policy:'Published provider snapshots, not streaming or guaranteed real-time. New runs fit in your browser from this retrieval vintage. No portfolio records or private analyses are published.'};
 const cashflows=JSON.parse(await readFile(path.join(output,'cashflows.json'),'utf8').catch(()=>'{"records":[]}'));for(const f of fundamentals){const found=cashflows.records?.find(r=>r.ticker===f.ticker&&r.market===f.market);if(found){f.cashflow=found.cashflow;f.cashflowError=found.error;f.cashflowRetrievedAt=found.retrievedAt;}}
 await writeFile(path.join(output,'fundamentals.json'),JSON.stringify({format:'longhand-public-fundamentals',version:1,publishedAt,records:fundamentals}));
 await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest));await writeFile(path.join(output,'market.json'),JSON.stringify({publishedAt,quotes}));
 if(!histories.some(h=>h.market==='US'&&h.modelObservations>=350)||!histories.some(h=>h.market==='IDX'&&h.modelObservations>=350))throw Error('Cannot publish a working US/IDX Quant release: one market has no usable history. Existing deployment is preserved.');
 console.log(JSON.stringify({histories:histories.length,quotes:Object.keys(quotes).length,providerFailures:errors.length,publishedAt}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await generatePagesData();
