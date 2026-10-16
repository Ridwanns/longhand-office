import {validateMarketHistories,historyWindow} from './market-history-contract.js';
import {lineFigure} from './quant-charts.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const historyFeedUrl='/api/market/history';
let historyPromise=null,historyChecked=0;
export const CHART_INSTRUMENTS={
 fx:[['FX_IDC:USDIDR','US dollar / Indonesian rupiah','IDR per USD'],['FX:EURUSD','Euro / US dollar','USD per EUR']],
 macro:[['IDX:COMPOSITE','IDX Composite (IHSG)','Index'],['SP:SPX','S&P 500','Index'],['NASDAQ:IXIC','Nasdaq Composite','Index'],['DJ:DJI','Dow Jones Industrial Average','Index'],['CBOE:VIX','Cboe Volatility Index','Index']],
 us:[['NASDAQ:AAPL','Apple','Stock'],['NASDAQ:MSFT','Microsoft','Stock'],['NASDAQ:NVDA','NVIDIA','Stock'],['NYSE:BRK.B','Berkshire Hathaway Class B','Stock']],
 idx:[['IDX:BBCA','Bank Central Asia','Stock'],['IDX:BBRI','Bank Rakyat Indonesia','Stock'],['IDX:TLKM','Telkom Indonesia','Stock'],['IDX:ADRO','Alamtri Resources Indonesia','Stock']],
 bonds:[['OFFICE:TLT','iShares 20+ Year Treasury Bond ETF','Bond ETF'],['OFFICE:IEF','iShares 7–10 Year Treasury Bond ETF','Bond ETF'],['OFFICE:LQD','iShares iBoxx $ Investment Grade Corporate Bond ETF','Bond ETF']],
 commodities:[['COMEX:GC1!','Gold','Continuous futures'],['COMEX:SI1!','Silver','Continuous futures'],['NYMEX:CL1!','WTI crude oil','Continuous futures']]
};
// Public widget coverage checked on 16 October 2026. Restricted symbols use
// separately labelled Office observations inline; no CFD/ETF substitution.
const EMBED_SYMBOLS=new Set(['IDX:COMPOSITE','NASDAQ:AAPL','NASDAQ:MSFT','NASDAQ:NVDA','NYSE:BRK.B','IDX:BBCA','IDX:BBRI','IDX:TLKM','IDX:ADRO','FX_IDC:USDIDR','FX:EURUSD']);
const SNAPSHOT_SYMBOLS={
 'OFFICE:TLT':['bonds','TLT'],'OFFICE:IEF':['bonds','IEF'],'OFFICE:LQD':['bonds','LQD'],
 'SP:SPX':['macro','^GSPC'],'NASDAQ:IXIC':['macro','^IXIC'],
 'DJ:DJI':['macro','^DJI'],'CBOE:VIX':['macro','^VIX'],
 'COMEX:GC1!':['commodities','GC=F'],'COMEX:SI1!':['commodities','SI=F'],'NYMEX:CL1!':['commodities','CL=F']
};
let readSnapshot=null;
const availability=(symbol,dynamic=false)=>symbol.startsWith('OFFICE:')?'Office chart · dated Yahoo Finance bond ETF history. Fund share prices are separate from Treasury yields.':symbol.startsWith('FX')?'TradingView · provider FX observations; source timing and status appear in the chart.':symbol.startsWith('IDX:')?'TradingView · end-of-day IDX data.':(EMBED_SYMBOLS.has(symbol)||dynamic)?'TradingView · delayed Cboe One data.':'Office chart · dated Yahoo Finance observations. TradingView does not permit this original instrument in its public widget.';
export function configureMarketView(reader){readSnapshot=reader;}
export function marketView(category='macro'){
 category=Object.hasOwn(CHART_INSTRUMENTS,category)?category:'macro';
 const list=CHART_INSTRUMENTS[category],region=typeof location==='undefined'?'id':location.hash.split('/')[2],selected=category==='macro'&&['us','eu','global'].includes(region)?'SP:SPX':category==='fx'&&['us','eu','global'].includes(region)?'FX:EURUSD':list[0][0];
 return `<section class="market-chart-desk" data-chart-category="${esc(category)}" aria-label="Inline market chart"><div class="macro-section-title"><div><p class="eyebrow">MARKET CHART</p><h3>${category==='bonds'?'Bond ETF history':'Explore the market'}</h3></div><span data-chart-provider>${EMBED_SYMBOLS.has(selected)?'TradingView':'Office source chart'}</span></div><div class="market-chart-controls"><label>Instrument<select data-chart-instrument>${list.map(([symbol,name,type])=>`<option value="${symbol}" ${symbol===selected?'selected':''}>${esc(name)} · ${esc(type)}</option>`).join('')}</select></label><label>History<select data-chart-range><option value="1Y">1 year</option><option value="5Y">5 years</option><option value="10Y" selected>10 years</option><option value="ALL">All available</option></select></label><label>Observations<select data-chart-frequency><option value="daily">Daily</option><option value="weekly" selected>Weekly</option><option value="monthly">Monthly</option></select></label></div><p class="market-chart-availability" role="status">${availability(selected)}</p><div class="market-embed-slot"><p role="status">Preparing the chart…</p></div><details class="market-chart-notes"><summary>Source & data status</summary><p>TradingView charts update independently of Office snapshots. IDX widget data is end-of-day; US widget stocks use delayed Cboe One data. Restricted indices and futures use separately labelled Yahoo Finance snapshots here, with their original observation times. Futures providers may use different contract-roll conventions; the Office series is not the TradingView continuous-series history.</p><p>Third-party charts run in a sandboxed cross-origin frame. No portfolio, thesis, decision, API key or model input is passed. Chart observations do not update portfolio valuations or retained model inputs automatically.</p></details></section>`;
}
export function mountMarketViews(root=document){for(const desk of root.querySelectorAll('.market-chart-desk'))if(!desk.dataset.mounted){desk.dataset.mounted='true';loadChart(desk);}}
export function syncMarketView(category,symbol,quote){
 const desk=[...document.querySelectorAll('.market-chart-desk')].find(d=>d.dataset.chartCategory===category);if(!desk||!['us','idx','macro','commodities','bonds'].includes(category))return;
 let target=Object.entries(SNAPSHOT_SYMBOLS).find(([,s])=>s[0]===category&&s[1]===symbol)?.[0];
 if(category==='idx'&&/^[A-Z]{4}$/.test(symbol))target='IDX:'+symbol;
 if(category==='us'&&/^[A-Z]{1,6}(?:-[A-Z])?$/.test(symbol)){
  const venue=quote.exchange||'';const prefix=/Nasdaq|NMS|NGM|NCM/i.test(venue)?'NASDAQ':/Arca|American|AMEX|PCX|ASE/i.test(venue)?'AMEX':/NYSE|New York|NYQ/i.test(venue)?'NYSE':null;
  if(prefix)target=prefix+':'+symbol.replace('-','.');
 }
 if(!target)return;const select=desk.querySelector('[data-chart-instrument]');
 if(![...select.options].some(o=>o.value===target)){
  if(!['us','idx'].includes(category))return;
  const option=document.createElement('option');option.value=target;option.textContent=(quote.name||symbol)+' · '+symbol;select.append(option);
  desk._chartInstruments??=CHART_INSTRUMENTS[category].map(i=>[...i]);desk._chartInstruments.push([target,quote.name||symbol,'Stock']);
  (desk._chartDynamic??=new Set()).add(target);
 }
 if(select.value!==target){select.value=target;loadChart(desk);}
}
async function loadChart(desk,force=false){
 const symbol=desk.querySelector('[data-chart-instrument]').value,list=desk._chartInstruments||CHART_INSTRUMENTS[desk.dataset.chartCategory];
 if(!list?.some(i=>i[0]===symbol))return;
 const range=desk.querySelector('[data-chart-range]').value,frequency=desk.querySelector('[data-chart-frequency]').value;
 const ticket=desk._chartTicket=(desk._chartTicket||0)+1,slot=desk.querySelector('.market-embed-slot'),name=list.find(i=>i[0]===symbol)[1];
 desk.querySelector('.market-chart-availability').textContent=availability(symbol,desk._chartDynamic?.has(symbol));
 desk.querySelector('[data-chart-provider]').textContent=EMBED_SYMBOLS.has(symbol)||desk._chartDynamic?.has(symbol)?'TradingView':'Office source chart';
 if(EMBED_SYMBOLS.has(symbol)||desk._chartDynamic?.has(symbol)){
  desk.dataset.source='tradingview';const theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  // Official iframe endpoint emitted by TradingView's embed script. Third-party
  // JavaScript never executes in the Office document or storage origin.
  const config={autosize:true,symbol,interval:frequency==='daily'?'D':frequency==='monthly'?'M':'W',range:({"1Y":'12M',"5Y":'60M',"10Y":'120M',ALL:'ALL'})[range],timezone:'Etc/UTC',theme,style:'2',locale:'en',allow_symbol_change:false,save_image:false,hide_volume:true,hide_side_toolbar:true,withdateranges:true,backgroundColor:theme==='dark'?'#18191b':'#ffffff',gridColor:theme==='dark'?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)',support_host:'https://www.tradingview.com',width:'100%',height:'100%',utm_source:location.hostname,utm_medium:'widget_new',utm_campaign:'advanced-chart'};
  const iframe=document.createElement('iframe');iframe.title=name+' — TradingView chart';iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');iframe.referrerPolicy='no-referrer';iframe.src='https://s.tradingview.com/embed-widget/advanced-chart/?locale=en#'+encodeURIComponent(JSON.stringify(config));slot.replaceChildren(iframe);return;
 }
 desk.dataset.source='snapshot';slot.innerHTML='<p role="status">Reading the original source snapshot…</p>';
 try{
  const source=SNAPSHOT_SYMBOLS[symbol];if(!source||!readSnapshot)throw Error('The original source is not connected.');
  let result,longError=null;try{result={quote:await readHistoricalQuote(...source,force)};}catch(e){longError=e.message;result=await readSnapshot(...source,force);}
  if(!desk.isConnected||desk._chartTicket!==ticket||desk.querySelector('[data-chart-instrument]').value!==symbol)return;
  if(!result.quote)throw Error(result.error||'Original source unavailable.');
  const q=result.quote,history=q.history||[],stamp=q.timestamp||q.date;
  if(!Number.isFinite(q.price)||q.price<=0||!Number.isFinite(Date.parse(stamp)))throw Error('Invalid original price observation.');
  const fullValues=history.filter(o=>typeof o.date==='string'&&Number.isFinite(o.close)&&o.close>0),values=historyWindow(fullValues,range,frequency),width=Math.max(220,slot.clientWidth-44),formatted=new Intl.NumberFormat('en-GB',{maximumFractionDigits:4}).format(q.price);
  slot.innerHTML=`<div class="market-inline-snapshot"><p class="eyebrow">YAHOO FINANCE / SOURCE SNAPSHOT</p><h4>${esc(name)}</h4><p class="market-inline-price">${formatted}<small>${esc(q.unit||q.currency)}</small></p><p class="quiet-note">${longError?'Long history unavailable: '+esc(longError)+'. Showing only available snapshot history. ':''}Observed ${esc(stamp)} · ${q.delayMinutes===null||q.delayMinutes===undefined?'Delay unknown':esc(q.delayMinutes)+' minutes source-reported delay'} · real-time unverified.</p>${values.length?lineFigure([{name:frequency==='daily'?'Source close':frequency==='weekly'?'Last available close per week':'Last available close per month',values:values.map(o=>o.close)}],values.map(o=>o.date),{title:name+' · source history',unit:q.unit||q.currency,width:width<700?520:920,renderWidth:width-42,xLabel:'Available exchange dates',note:`${fullValues[0]?.date||'Unavailable'} to ${fullValues.at(-1)?.date||'Unavailable'} available. ${frequency==='daily'?'Daily closes':frequency==='weekly'?'Last reported close in each week':'Last reported close in each month'}; no filled periods. Source Close basis; not total return. Current bars may be in progress.`}):'<p class="quiet-note">No dated source history is available. The latest observation above is not a fabricated chart.</p>'}</div>`;
 }catch(error){if(desk.isConnected&&desk._chartTicket===ticket)slot.innerHTML=`<p class="form-error">${esc(error.message)}</p><p class="quiet-note">No substitute instrument or zero value was used.</p><button class="secondary" type="button" data-chart-retry>Retry source</button>`;}
}

async function readHistoricalQuote(category,symbol,force=false){
 if(force||Date.now()-historyChecked>15*60*1000)historyPromise=null;
 historyPromise??=(historyChecked=Date.now(),fetch(historyFeedUrl,{cache:'no-store',signal:AbortSignal.timeout(30000)}).then(async r=>{if(!r.ok)throw Error('Historical source unavailable.');const text=await r.text();if(text.length>6000000)throw Error('Historical feed exceeds size limit.');return validateMarketHistories(JSON.parse(text));}).catch(e=>{historyPromise=null;throw e;}));
 const feed=await historyPromise,entry=feed.entries.find(e=>e.category===category&&e.symbol===symbol);if(!entry||entry.error)throw Error(entry?.error||'No historical coverage.');return entry.quote;
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-chart-retry]');if(button)loadChart(button.closest('.market-chart-desk'),true);});
document.addEventListener('change',e=>{if(e.target.matches('[data-chart-instrument],[data-chart-range],[data-chart-frequency]'))loadChart(e.target.closest('.market-chart-desk'));});
new MutationObserver(()=>document.querySelectorAll('.market-chart-desk[data-source="tradingview"]').forEach(desk=>loadChart(desk))).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
