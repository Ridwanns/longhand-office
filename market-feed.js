// Display-only public provider frames. No provider prices enter Office records or models.
import {MARKET_CATEGORIES} from './market-catalogue.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const group=(name,rows)=>({name,symbols:rows.map(([name,displayName])=>({name,displayName}))});
export const MARKET_FEEDS={
 us:{title:'US stock prices',timing:'Delayed exchange data',note:'US stocks use the public Cboe One feed. D means delayed. This is not a consolidated real-time exchange entitlement.',groups:[group('US stocks · USD per share',[['NASDAQ:AAPL','Apple'],['NASDAQ:MSFT','Microsoft'],['NASDAQ:NVDA','NVIDIA'],['NYSE:BRK.B','Berkshire Hathaway B']])]},
 idx:{title:'Indonesia stock prices',timing:'End-of-day data',note:'The public IDX widget supplies end-of-day stocks and indices. E means end of day; automatic updates do not turn this into an intraday IDX feed.',groups:[group('IDX stocks · IDR per share',[['IDX:BBCA','Bank Central Asia'],['IDX:BBRI','Bank Rakyat Indonesia'],['IDX:TLKM','Telkom Indonesia'],['IDX:ADRO','Alamtri Resources Indonesia']])]},
 macro:{title:'Index market prices',timing:'Cash indices: end of day · CFDs: broker feed',note:'Cash-index levels and broker index CFDs are separate instruments. US cash-index data is not available in this public widget; the US rows below are explicitly labelled CFDs, not substitute index levels.',groups:[group('Cash indices · end of day',[['IDX:COMPOSITE','IHSG · index points'],['INDEX:DEU40','DAX · index points'],['INDEX:NKY','Nikkei 225 · index points']]),group('US index CFDs · broker quotes, not cash indices',[['FOREXCOM:SPXUSD','S&P 500 CFD · FOREX.com'],['FOREXCOM:NSXUSD','Nasdaq 100 CFD · FOREX.com'],['FOREXCOM:DJI','Dow CFD · FOREX.com']])]},
 bonds:{title:'Bond ETF prices',timing:'Delayed exchange data',note:'Bond ETFs are quoted in USD per share. These are not individual bond execution prices or government yields. All connected bond ETFs are grouped by exposure. The official yield curve below retains its own release date.',groups:[group('Bond ETFs · USD per share',[['NASDAQ:TLT','TLT · 20+ year Treasury ETF'],['NASDAQ:IEF','IEF · 7–10 year Treasury ETF'],['AMEX:LQD','LQD · corporate bond ETF']])]},
 commodities:{title:'Gold spot price',timing:'Streaming OTC provider quote',note:'OANDA XAU/USD is a spot-gold reference in USD per troy ounce. It is not COMEX gold futures, an Indonesian retail-gold quote, or a guaranteed execution price. A closed market can retain the last quote.',groups:[group('Spot gold · USD per troy ounce',[['OANDA:XAUUSD','Gold spot · OANDA XAU/USD']])]}
};
export function marketFeedUrl(category,theme='light',groups){
 const feed=Object.hasOwn(MARKET_FEEDS,category)?MARKET_FEEDS[category]:null;if(!feed)throw Error('Unsupported market feed.');
 const tabs=(groups||feed.groups).map((g,i)=>({title:category==='macro'?(i===0?'Cash indices · EOD':'US index CFDs'):g.name,symbols:g.symbols.map(s=>({s:s.name,d:s.displayName}))}));
 const url=new URL('https://s.tradingview.com/embed-widget/market-overview/');url.searchParams.set('locale','en');url.hash=encodeURIComponent(JSON.stringify({width:'100%',height:'100%',tabs,showChart:false,showSymbolLogo:false,colorTheme:theme==='dark'?'dark':'light',isTransparent:false,locale:'en'}));return url.href;
}
export function verifiedFeedStock(category,q){
 if(!q||!['yahoo','flowless'].includes(q.provider))return null;
 if(category==='idx'&&/^[A-Z]{4}$/.test(q.symbol)&&q.currency==='IDR'&&(q.provider==='flowless'||/^(Jakarta|JKT|IDX)$/i.test(q.exchange||'')))return {name:'IDX:'+q.symbol,displayName:q.symbol+' · IDR/share'};
 if(!['us','bonds'].includes(category)||q.provider!=='yahoo'||q.currency!=='USD'||!/^[A-Z]{1,6}(?:-[A-Z])?$/.test(q.symbol)||category==='bonds'&&(q.instrumentType!=='ETF'||!MARKET_CATEGORIES.bonds.instruments.some(i=>i.symbol===q.symbol)))return null;
 const venue=/^(NasdaqGS|NasdaqGM|NasdaqCM|NMS|NGM|NCM|NASDAQ)$/i.test(q.exchange||'')?'NASDAQ':/^(NYSE|NYQ)$/i.test(q.exchange||'')?'NYSE':/^(NYSEArca|NYSE Arca|American|AMEX|PCX|ASE)$/i.test(q.exchange||'')?'AMEX':null;
 return venue?{name:venue+':'+q.symbol.replace('-','.'),displayName:q.symbol+' · USD/share'}:null;
}
export function marketFeedPanel(category){
 const feed=Object.hasOwn(MARKET_FEEDS,category)?MARKET_FEEDS[category]:null;if(!feed)return '';
 const count=feed.groups.reduce((n,g)=>n+g.symbols.length,0);
 return `<section class="market-connected-feed" data-market-feed="${esc(category)}" aria-label="Connected provider market prices"><header><div><p class="eyebrow">CONNECTED MARKET FEED</p><h2>${esc(feed.title)}</h2></div><span class="feed-timing">${esc(feed.timing)}</span></header><p class="feed-definition">${esc(feed.note)}</p><p data-feed-mapping hidden></p><div class="market-provider-frame" data-feed-frame data-feed-rows="${count}"><p>Opening the provider price panel…</p></div><div class="feed-controls"><p data-feed-status role="status">The provider updates prices independently of the published Office snapshot.</p><button type="button" class="secondary" data-feed-pause>Pause feed</button><button type="button" class="secondary" data-feed-reconnect>Reconnect</button></div><p class="feed-attribution"><a href="https://www.tradingview.com/markets/" target="_blank" rel="noopener noreferrer">Market quotes by TradingView</a> · D = delayed · E = end of day. Provider session and market status apply. <a href="https://www.tradingview.com/widget-docs/markets/" target="_blank" rel="noopener noreferrer">Data coverage</a></p><details class="feed-sources"><summary>TradingView, Yahoo & Pluang</summary><p>TradingView supplies this embedded public price panel. Quotes stay inside the provider frame. Yahoo supplies the dated research snapshot and histories below. The Pluang chat connector can read market prices in an authorized chat; it is not a background website API. No Pluang credentials or chat quotes are published here.</p><p>Public stock/index feeds may be delayed or end of day. Full exchange real-time data requires appropriate website data rights and a supported data service. An iframe loading is not proof that every symbol is updating; inspect its D/E badges and any unavailable-symbol message.</p></details></section>`;
}
const mounted=new Map();let installed=false;
function refreshFeed(panel,{reconnect=false}={}){
 const state=mounted.get(panel);if(!state)return;const slot=panel.querySelector('[data-feed-frame]'),status=panel.querySelector('[data-feed-status]'),button=panel.querySelector('[data-feed-pause]');
 if(!panel.isConnected){mounted.delete(panel);state.observer.disconnect();return;}
 button.textContent=state.paused?'Resume feed':'Pause feed';
 if(state.paused||document.hidden||!state.visible){slot.replaceChildren();status.textContent=state.paused?'Feed paused. Resume to request the provider again.':document.hidden?'Feed suspended while this browser tab is hidden.':'Feed waits until the panel is visible.';return;}
 if(state.groups?.length===0){slot.replaceChildren();status.textContent='No verified watchlist listings loaded. The research snapshot can be checked below.';return;}
 const theme=document.documentElement.dataset.theme==='dark'?'dark':'light',url=marketFeedUrl(panel.dataset.marketFeed,theme,state.groups);
 if(!reconnect&&slot.querySelector('iframe')?.src===url)return;
 const frame=document.createElement('iframe');frame.src=url;frame.title=MARKET_FEEDS[panel.dataset.marketFeed].title+' · TradingView provider prices';frame.referrerPolicy='no-referrer';frame.setAttribute('allow','fullscreen');
 // Cross-origin frame isolation prevents access to the Office vault and retained studies.
 frame.addEventListener('load',()=>{if(slot.firstElementChild===frame)status.textContent='Provider panel opened · prices, session and delay status are shown inside.';});
 frame.addEventListener('error',()=>{if(slot.firstElementChild===frame)status.textContent='Provider panel unavailable. Reconnect or inspect the dated research snapshot below.';});
 slot.replaceChildren(frame);status.textContent='Opening provider prices… This does not certify a live tick.';
}
export function mountMarketFeeds(root=document){
 for(const [panel,state]of mounted)if(!panel.isConnected){state.observer.disconnect();mounted.delete(panel);}
 for(const panel of root.querySelectorAll('[data-market-feed]'))if(!mounted.has(panel)){
  const state={paused:false,visible:false,groups:['us','idx','bonds'].includes(panel.dataset.marketFeed)?[]:undefined,observer:new IntersectionObserver(entries=>{state.visible=entries.some(e=>e.isIntersecting);refreshFeed(panel);},{rootMargin:'100px'})};mounted.set(panel,state);state.observer.observe(panel);
  panel.querySelector('[data-feed-pause]').addEventListener('click',()=>{state.paused=!state.paused;refreshFeed(panel);});panel.querySelector('[data-feed-reconnect]').addEventListener('click',()=>{state.paused=false;refreshFeed(panel,{reconnect:true});});
 }
 if(!installed){installed=true;document.addEventListener('visibilitychange',()=>{for(const panel of mounted.keys())refreshFeed(panel);});new MutationObserver(()=>{for(const panel of mounted.keys())refreshFeed(panel);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});}
}
export function setMarketFeedQuotes(category,entries){
 if(!['us','idx','bonds'].includes(category))return;
 for(const [panel,state]of mounted)if(panel.dataset.marketFeed===category){
  const symbols=[],missing=[];for(const e of entries){const item=verifiedFeedStock(category,e.quote);if(item)symbols.push(item);else missing.push(e.symbol);}
  state.groups=category==='bonds'?[['Treasury ETFs',['TLT','IEF','SHY','IEI','TLH','SGOV','BIL']],['Inflation-linked',['TIP','STIP']],['Corporate bonds',['LQD','VCIT','VCSH','HYG','JNK']],['Broad & international',['BND','AGG','EMB','EMLC','BNDX']]].map(([name,ids])=>({name,symbols:symbols.filter(s=>ids.includes(s.name.split(':')[1]))})).filter(g=>g.symbols.length):symbols.length?[{name:category==='us'?'US stocks · USD/share':'IDX stocks · IDR/share',symbols}]:[];
  const info=panel.querySelector('[data-feed-mapping]');info.hidden=!missing.length;info.textContent=missing.length?'No verified provider listing for '+missing.join(', ')+'. No exchange or price was guessed.':'';
  const slot=panel.querySelector('[data-feed-frame]'),rows=Math.max(0,...state.groups.map(g=>g.symbols.length));slot.dataset.feedRows=String(rows);slot.style.height=Math.min(560,Math.max(180,72*rows+28))+'px';refreshFeed(panel);
 }
}
