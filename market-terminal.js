import {marketView} from './market-view.js';
import {macroPage,mountMacro} from './macro-ui.js';
import {preferenceKey} from './workspace-scope.js';
import {dataBadge} from './data-status.js';
import {officialRatesPanel,mountOfficialRates} from './official-rates.js';
import {MARKET_CATEGORIES} from './market-catalogue.js';
import {localIdxPanel,mountLocalIdx} from './idx-msn-ui.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:4}).format(x);
const pct=x=>(x>0?'+':'')+new Intl.NumberFormat('en-GB',{maximumFractionDigits:2,minimumFractionDigits:2}).format(x)+'%';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const key=preferenceKey('longhand-office.watchlists.v1'),cache=new Map();let savedLists={};
try{const raw=JSON.parse(localStorage.getItem(key)||'{}');for(const category of ['us','idx'])if(Array.isArray(raw[category]))savedLists[category]=[...new Set(raw[category].filter(symbol=>typeof symbol==='string'&&(category==='us'?/^[A-Z0-9]{1,12}(-[A-Z0-9]{1,6})?$/:/^[A-Z]{4}$/).test(symbol)))].slice(0,12);}catch{}
const symbolsFor=category=>MARKET_CATEGORIES[category].instruments?.map(i=>i.symbol)||savedLists[category]||MARKET_CATEGORIES[category].examples;
function persistLists(){try{localStorage.setItem(key,JSON.stringify(savedLists));}catch{document.querySelector('#board-status').textContent='Watchlist preferences could not be saved; your portfolio records are unchanged.';}}
const tone=q=>q?.change?.percent>0?'gain':q?.change?.percent<0?'loss':'flat';
function historyFor(q){return (q?.history||[]).filter(p=>typeof p.date==='string'&&typeof p.close==='number'&&Number.isFinite(p.close)&&p.close>0);}
function chart(q,large=false){
 const history=historyFor(q);if(history.length<2)return `<p class="chart-empty">${large?'Not enough source history to draw a chart.':'—'}</p>`;
 const width=large?520:100,height=large?210:36,pad=large?15:3,values=history.map(p=>p.close),low=Math.min(...values),high=Math.max(...values),range=high-low;
 const points=history.map((p,i)=>`${(pad+i/(history.length-1)*(width-pad*2)).toFixed(2)},${(range?height-pad-(p.close-low)/range*(height-pad*2):height/2).toFixed(2)}`).join(' ');
 return `<svg class="source-chart ${tone(q)}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(q.symbol)}: ${history.length} available daily close observations, ${esc(history[0].date)} to ${esc(history.at(-1).date)}"><title>Available source closes; latest daily bar may be in progress</title>${large?`<path class="chart-grid" d="M15 15H505 M15 105H505 M15 195H505"/>`:''}<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="${large?2:1.7}" vector-effect="non-scaling-stroke"/></svg>${large?`<div class="chart-dates"><span>${history[0].date}</span><span>${history.at(-1).date}</span></div><p class="quiet-note">${history.length} available daily closes · range ${num(low)}–${num(high)}${q.provider==='yahoo'?' · current bar may be in progress.':'.'} ${history.at(-1).date<(q.date||q.marketDate||'')?'Chart history ends before the latest price observation.':''}</p>`:''}`;
}
function sourceTime(q,compact=false){if(q.date)return q.date;return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',...(compact?{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'}:{dateStyle:'medium',timeStyle:'medium'})}).format(new Date(q.timestamp))+' WIB';}
const unitFor=(category,q)=>category==='idx'?'IDR / share':category==='us'?'USD / share':q.unit;
export function marketPage(requested='us'){
 const category=Object.hasOwn(MARKET_CATEGORIES,requested)?requested:'us',c=MARKET_CATEGORIES[category],symbols=symbolsFor(category);
 const heading=`<div class="page-heading market-page-heading"><div><p class="eyebrow">THE RESEARCH DESK</p><h1>Markets</h1><p>A view of the market. Your <a href="#portfolios" class="inline-link">Paper and Real portfolios ↗</a> remain separate.</p></div><span class="market-feed-label">${category==='idx'?'IDX / SOURCE READS':'SOURCE SNAPSHOTS'}</span></div>
 <nav class="market-tabs" aria-label="Market categories">${Object.entries(MARKET_CATEGORIES).map(([name,item])=>`<a href="#market/${name}" ${name===category?'aria-current="page"':''}>${item.label}</a>`).join('')}</nav>`;
 const board=`<section id="market-board" data-category="${category}" data-selected="${esc(symbols[0]||'')}" aria-labelledby="market-category-title"><div class="board-heading"><div><h2 id="market-category-title">${c.title}</h2><p>${c.description}</p></div><button type="button" class="secondary" id="refresh-market">↻ Refresh prices</button></div>
 <p class="quiet-note board-source-note">${c.source}</p><label class="market-auto-control"><input id="market-auto-refresh" type="checkbox" checked> Auto-check every 60 seconds while visible</label><p class="quiet-note">Automatic checks request source snapshots, not a streaming feed. IDX Flowless remains daily data; other delays may be unknown. Source observation time, not check time, determines freshness. Checks pause while board controls are focused or an editor is open.</p>
 ${['us','idx'].includes(category)?`<form id="watchlist-form"><label class="sr-only" for="watchlist-symbol">Add ticker</label><input id="watchlist-symbol" name="symbol" required maxlength="${category==='us'?18:7}" pattern="${category==='us'?'[A-Za-z0-9]{1,12}(([.]|-)[A-Za-z0-9]{1,6})?':'[A-Za-z]{4}([.][Jj][Kk])?'}" placeholder="${category==='us'?'Add AAPL, MSFT, NVDA…':'Add BBCA, BBRI, TLKM…'}" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="primary" type="submit">＋ Add ticker</button><button class="secondary" id="reset-watchlist" type="button">Reset list</button></form>`:''}
 <div class="market-terminal"><div class="watchlist-panel"><div class="table-wrap" tabindex="0" role="region" aria-label="Market watchlist; scroll horizontally on small screens"><table class="watchlist-table"><thead><tr><th scope="col">Instrument</th><th scope="col">Last / source time</th><th scope="col">Change %</th><th scope="col">Closes</th></tr></thead><tbody id="watchlist-rows">${symbols.map(symbol=>loadingRow(category,symbol)).join('')}</tbody></table></div><p id="board-status" role="status" aria-live="polite">Loading source observations…</p><p class="quiet-note">Change uses the previous available dated chart close, or the provider previous close when its date is not supplied. Manual refresh is also available. No streaming connection.</p></div><section id="market-detail" class="market-detail" aria-label="Selected market instrument"><p class="quiet-note">Select an instrument to inspect its history and source.</p></section></div>
 </section>`;
 return (category==='macro'?`<div class="macro-page-title"><h1>Macro</h1><p>Growth, inflation and market context.</p></div>`:heading)+(category==='macro'?macroPage(marketView('macro')+board):(category==='bonds'?officialRatesPanel():'')+marketView(category)+(category==='idx'?localIdxPanel():'')+board);
}
function loadingRow(category,symbol){const name=MARKET_CATEGORIES[category].instruments?.find(i=>i.symbol===symbol)?.name||symbol;return `<tr data-symbol="${esc(symbol)}"><td><button class="watch-symbol" type="button" data-inspect="${esc(symbol)}">${esc(name)}<small>${esc(symbol)}${MARKET_CATEGORIES[category].instruments?.find(i=>i.symbol===symbol)?.type==='INDEX'?' · Index':''}</small></button></td><td colspan="3" class="quote-loading">Loading…</td></tr>`;}
async function getQuote(category,symbol,force=false){
 const entry=cache.get(category+symbol);if(!force&&entry&&Date.now()-entry.fetched<60000)return entry;
 const path=category==='idx'?'/api/market/flowless/price':category==='us'?'/api/market/us/price':'/api/market/category/price';
 try{const response=await fetch(path+'?'+new URLSearchParams({category,symbol,asOf:today()})),q=await response.json();if(!response.ok){const failure=Error(q.error||'Source unavailable.');failure.kind=q.kind;throw failure;}
  if(q.symbol!==symbol||typeof q.price!=='number'||!Number.isFinite(q.price)||q.price<=0||category==='idx'&&(q.provider!=='flowless'||q.currency!=='IDR'||q.realtime!==false)||category!=='idx'&&(q.provider!=='yahoo'||q.realtimeVerified!==false||Number.isNaN(Date.parse(q.timestamp))))throw Error('Unexpected source response.');
  const result={quote:q,fetched:Date.now()};cache.set(category+symbol,result);return result;
 }catch(error){const result={error:error.message,errorKind:error.kind,fetched:Date.now()};cache.set(category+symbol,result);return result;}
}
function paintRow(board,symbol,result){
 const row=[...board.querySelectorAll('tr[data-symbol]')].find(r=>r.dataset.symbol===symbol);if(!row)return;
 const q=result.quote,name=MARKET_CATEGORIES[board.dataset.category].instruments?.find(i=>i.symbol===symbol)?.name||q?.name||symbol;
 row.innerHTML=`<td class="watch-name"><button class="watch-symbol" type="button" data-inspect="${esc(symbol)}" aria-pressed="${board.dataset.selected===symbol}">${esc(name)}<small>${esc(symbol)}${MARKET_CATEGORIES[board.dataset.category].instruments?.find(i=>i.symbol===symbol)?.type==='INDEX'?' · Index':''}</small></button>${['us','idx'].includes(board.dataset.category)?`<button type="button" class="watch-remove" data-remove="${esc(symbol)}" aria-label="Remove ${esc(symbol)} from watchlist">×</button>`:''}</td>`+(q?`<td class="watch-price">${num(q.price)}<small>${esc(unitFor(board.dataset.category,q))}</small><small>${esc(sourceTime(q,true))}</small></td><td class="watch-change ${tone(q)}">${q.change?pct(q.change.percent):'No prior close'}${q.change?`<small>vs ${esc(q.change.referenceDate||"provider previous close (date not supplied)")}</small>`:''}</td><td class="watch-spark">${chart(q)}</td>`:`<td colspan="3"><span class="form-error">${result.errorKind==='not-published'?'Not published':result.errorKind==='invalid-data'?'Invalid source data':'Source unavailable'}</span><small>${esc(result.error)}</small></td>`);
 row.classList.toggle('selected',board.dataset.selected===symbol);
}
function paintDetail(board){
 const symbol=board.dataset.selected,entry=cache.get(board.dataset.category+symbol),panel=board.querySelector('#market-detail');
 if(!symbol){panel.innerHTML='<p class="quiet-note">Your watchlist is empty. Add a ticker or reset the list to start again.</p>';return;}
 board.querySelectorAll('[data-inspect]').forEach(button=>{const selected=button.dataset.inspect===symbol;button.setAttribute('aria-pressed',String(selected));button.closest('tr').classList.toggle('selected',selected);});
 if(!entry){panel.innerHTML=`<h3>${esc(symbol)}</h3><p class="quiet-note">Loading source observations…</p>`;return;}
 if(!entry.quote){panel.innerHTML=`<h3>${esc(symbol)}</h3><p class="form-error">${esc(entry.error)}</p><p class="quiet-note">${entry.errorKind==='not-published'?'This saved watchlist entry is retained. Choose a published ticker from Browse available stocks; refreshing cannot add an unpublished instrument.':'No zero or substitute price was used. Refresh to try again.'}</p>`;return;}
 const q=entry.quote,category=board.dataset.category,history=historyFor(q);
 panel.dataset.eligible=String(['us','idx','bonds'].includes(category));
 panel.innerHTML=`<p class="eyebrow">${category==='idx'?'FLOWLESS / DAILY CLOSE':'YAHOO FINANCE / SNAPSHOT'}</p><h3>${esc(MARKET_CATEGORIES[category].instruments?.find(i=>i.symbol===symbol)?.name||q.name||symbol)}</h3><p class="detail-symbol">${esc(symbol)}${q.exchange?' · '+esc(q.exchange):''}</p><div class="detail-price">${num(q.price)}<small>${esc(unitFor(category,q))}</small></div><p class="detail-change ${tone(q)}">${q.change?`${q.change.value>0?'+':''}${num(q.change.value)} (${pct(q.change.percent)})<small> vs ${esc(q.change.referenceDate||"provider previous close (date not supplied)")}</small>`:'Change unavailable: no previous source close.'}</p>${dataBadge({observedAt:q.timestamp||q.date,modelReady:q.modelAvailable!==false})}${chart(q,true)}<dl class="market-provenance"><div><dt>Source ${category==='idx'?'session':'time'}</dt><dd>${esc(sourceTime(q))}</dd></div><div><dt>Data type</dt><dd>${category==='idx'?'Daily close (EOD)':category==='commodities'?'Futures snapshot':category==='bonds'?'Bond ETF snapshot':category==='macro'?'Index level snapshot':'Regular-session snapshot'}</dd></div></dl><p class="quiet-note">${category==='idx'?'Daily data, not real-time.':`Real-time is unverified. ${q.delayMinutes===null?'Delay unknown.':'Source-reported delay: '+num(q.delayMinutes)+' minutes.'} ${(q.timestamp?(Date.now()-Date.parse(q.timestamp))/1000:q.ageSeconds)>86400?'Observation is over 24 hours old.':''}`} Market observations do not update portfolio valuations automatically.</p><details class="source-observations"><summary>View source closes (${history.length})</summary><div class="table-wrap" tabindex="0"><table><thead><tr><th>Date</th><th>Recorded close</th></tr></thead><tbody>${history.map(p=>`<tr><td>${p.date}</td><td>${num(p.close)}</td></tr>`).join('')}</tbody></table></div></details>`;
 if(Number.isFinite(q.marketCap)||Number.isFinite(q.averageDailyVolume3Month))panel.insertAdjacentHTML('beforeend','<p class="quiet-note">'+(Number.isFinite(q.marketCap)?'Source-reported market cap: '+num(q.marketCap)+' '+esc(q.currency)+'. ':'')+(Number.isFinite(q.averageDailyVolume3Month)?'Source average daily volume, 3 months: '+num(q.averageDailyVolume3Month)+' shares. ':'')+'These source estimates are not an execution or liquidity guarantee.</p>');
 if(q.historyNote)panel.insertAdjacentHTML('beforeend','<p class="quiet-note">'+esc(q.historyNote)+'</p>');
 if(['us','idx','bonds'].includes(category))panel.insertAdjacentHTML('beforeend',(q.modelAvailabilityNote?'<p class="quiet-note">'+esc(q.modelAvailabilityNote)+'</p>':'')+'<div class="market-actions"><button class="primary" data-market-models '+(q.modelCutoff?'data-cutoff="'+esc(q.modelCutoff)+'" ':'')+(q.modelAvailable===false?'disabled':'')+'>'+(q.modelAvailable===false?(q.modelAvailabilityNote?.includes('could not be loaded')?'Model list unavailable':'No published eligible model history'):'Run models'+(q.modelCutoff?' · through '+esc(q.modelCutoff):''))+'</button><button class="secondary" data-market-valuation>Use for valuation</button></div>');
}
export async function mountMarket(force=false,quiet=false){
 if(!quiet){mountMacro();mountLocalIdx();mountOfficialRates();}
 const board=document.querySelector('#market-board');if(!board)return;const ticket=(board.requestTicket||0)+1;board.requestTicket=ticket;
 document.dispatchEvent(new CustomEvent('office:market-loading',{detail:{force}}));
 const category=board.dataset.category,symbols=symbolsFor(category),refresh=board.querySelector('#refresh-market');refresh.disabled=true;
 if(!quiet){board.querySelector('#watchlist-rows').innerHTML=symbols.map(symbol=>loadingRow(category,symbol)).join('');board.querySelector('#board-status').textContent='Loading source observations…';paintDetail(board);}
 let cursor=0,available=0;
 await Promise.all(Array.from({length:Math.min(3,symbols.length)},async()=>{while(cursor<symbols.length){const symbol=symbols[cursor++],result=await getQuote(category,symbol,force);if(!board.isConnected||board.requestTicket!==ticket)return;if(result.quote)available++;paintRow(board,symbol,result);if(board.dataset.selected===symbol)paintDetail(board);}}));
 if(!board.isConnected||board.requestTicket!==ticket)return;refresh.disabled=false;board.querySelector('#board-status').textContent=`${available} of ${symbols.length} source observations available · ${new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',timeStyle:'short'}).format(new Date())} WIB`;
 document.dispatchEvent(new CustomEvent('office:market-refreshed',{detail:{category}}));
}
document.addEventListener('click',event=>{
 const models=event.target.closest('[data-market-models]');if(models&&!models.disabled){const board=models.closest('#market-board');openRun({ticker:board.dataset.selected,market:board.dataset.category==='idx'?'IDX':'US',cutoff:models.dataset.cutoff||new Date().toISOString().slice(0,10),horizon:5,basis:'adjusted',seed:20261013});return;}
 const use=event.target.closest('[data-market-valuation]');if(use){const board=use.closest('#market-board'),q=cache.get(board.dataset.category+board.dataset.selected)?.quote;if(q)document.dispatchEvent(new CustomEvent('office:market-valuation',{detail:q}));return;}
 if(event.target.closest('#refresh-market')){mountMarket(true);return;}
 if(event.target.closest('#reset-watchlist')){const board=document.querySelector('#market-board');delete savedLists[board.dataset.category];persistLists();board.dataset.selected=symbolsFor(board.dataset.category)[0]||'';mountMarket();return;}
 const remove=event.target.closest('[data-remove]');if(remove){const board=remove.closest('#market-board'),category=board.dataset.category;savedLists[category]=symbolsFor(category).filter(s=>s!==remove.dataset.remove);persistLists();if(board.dataset.selected===remove.dataset.remove)board.dataset.selected=savedLists[category][0]||'';mountMarket();return;}
 const button=event.target.closest('[data-inspect]');if(button){const board=button.closest('#market-board');board.dataset.selected=button.dataset.inspect;paintDetail(board);}
});
document.addEventListener('submit',event=>{
 const form=event.target;if(form.id!=='watchlist-form')return;event.preventDefault();const board=form.closest('#market-board'),category=board.dataset.category;
 const symbol=form.elements.symbol.value.trim().toUpperCase(),normalized=category==='idx'?symbol.replace(/\.JK$/,''):symbol.replace('.','-'),current=symbolsFor(category);
 if(current.includes(normalized)){board.dataset.selected=normalized;paintDetail(board);form.reset();return;}
 if(current.length>=12){board.querySelector('#board-status').textContent='This watchlist supports up to 12 tickers.';return;}
 savedLists[category]=[...current,normalized];persistLists();board.dataset.selected=normalized;form.reset();mountMarket();
});
import {openRun} from './quant-ui.js';

document.addEventListener('office:preferences-restored',e=>{savedLists=structuredClone(e.detail.watchlists);});
setInterval(()=>{const board=document.querySelector('#market-board');if(!document.hidden&&board?.querySelector('#market-auto-refresh')?.checked&&!board.querySelector('#refresh-market').disabled&&!board.contains(document.activeElement)&&!document.querySelector('dialog[open]'))mountMarket(true,true);},60000);
