import {publicManifest} from './browser-api.js';
const states=new WeakMap(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=(value,category)=>value.trim().toUpperCase().replace(category==='idx'?/\.JK$/:/[.]/,category==='idx'?'':'-');
async function mount(){
 const form=document.querySelector('#watchlist-form');if(!form)return;
 let state=states.get(form);
 if(!state){
  state={items:[],category:form.closest('#market-board').dataset.category};states.set(form,state);
  const section=document.createElement('section');section.id='market-coverage';section.innerHTML='<p id="market-coverage-status" class="quiet-note" role="status">Loading available stocks…</p><details class="stock-coverage"><summary>Browse available stocks</summary><div class="coverage-filter"><label>Search all published tickers or companies<input id="market-stock-search" type="search" placeholder="e.g. PLTR, Palantir, ADRO or bank"></label></div><p id="market-match-count" class="quiet-note" role="status"></p><div class="coverage-list"></div></details>';form.after(section);
  form.insertAdjacentHTML('beforeend','<datalist id="market-tickers"></datalist>');form.elements.symbol.setAttribute('list','market-tickers');form.elements.symbol.setAttribute('aria-describedby','market-coverage-status');
  state.render=()=>{const query=section.querySelector('#market-stock-search').value.trim().toLowerCase(),matches=state.items.filter(h=>(h.ticker+' '+h.name).toLowerCase().includes(query)),visible=matches.slice(0,60);section.querySelector('#market-match-count').textContent=matches.length+' matches · showing '+visible.length+'. Search to narrow the list. Default order uses source-reported capitalization where supplied; no liquidity guarantee.';section.querySelector('.coverage-list').innerHTML=visible.map(h=>'<button type="button" data-market-ticker="'+esc(h.ticker)+'"><strong>'+esc(h.ticker)+'</strong><span>'+esc(h.name||h.ticker)+'</span><small>'+(h.priceAvailable===false?'Price missing at source':h.modelCutoff?'Price & model history':'Price · model history not ready/published')+'</small></button>').join('');};
  state.update=()=>{const ticker=normalize(form.elements.symbol.value,state.category),selected=state.items.find(h=>h.ticker===ticker),known=!ticker||!!selected;form.querySelector('[type=submit]').disabled=!ticker||!selected;form.elements.symbol.setCustomValidity(known?'':'Choose a published ticker from Browse available stocks.');section.querySelector('#market-coverage-status').textContent=!ticker?state.items.length+' published stocks/ETFs searchable. Prices and model histories have separate coverage.':selected?selected.ticker+' · '+selected.name+' — '+(selected.priceAvailable===false?'source price missing; availability is explained in the watchlist.':'available in this publication.'):'Ticker not published. Search the full Yahoo universe below; no substitute price will be used.';const needle=ticker.toLowerCase();form.querySelector('#market-tickers').innerHTML=state.items.filter(h=>!needle||(h.ticker+' '+h.name).toLowerCase().includes(needle)).slice(0,150).map(h=>'<option value="'+esc(h.ticker)+'">'+esc(h.name||h.ticker)+'</option>').join('');};
  form.elements.symbol.addEventListener('input',state.update);form.elements.symbol.addEventListener('change',state.update);form.addEventListener('reset',()=>setTimeout(state.update,0));state.update();
 }
 const request=(state.request||0)+1;state.request=request;
 try{
  const manifest=await publicManifest();if(!form.isConnected||request!==state.request)return;
  state.items=(manifest.instruments||manifest.histories).filter(h=>h.market===(state.category==='idx'?'IDX':'US')).sort((a,b)=>(b.marketCap??-1)-(a.marketCap??-1)||a.ticker.localeCompare(b.ticker));state.update();state.render();
 }catch(e){if(form.isConnected)form.nextElementSibling.querySelector('#market-coverage-status').textContent='Stock coverage could not be loaded. '+e.message;}
}
document.addEventListener('submit',e=>{if(e.target.id!=='watchlist-form')return;const state=states.get(e.target),ticker=normalize(e.target.elements.symbol.value,state?.category||'us');if(!state?.items.some(h=>h.ticker===ticker)){e.preventDefault();e.stopImmediatePropagation();state?.update();}},true);
document.addEventListener('click',e=>{const button=e.target.closest('[data-market-ticker]'),form=document.querySelector('#watchlist-form');if(!button||!form)return;form.elements.symbol.value=button.dataset.marketTicker;form.elements.symbol.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();});
document.addEventListener('input',e=>{if(e.target.id==='market-stock-search')states.get(document.querySelector('#watchlist-form'))?.render();});
new MutationObserver(()=>{const form=document.querySelector('#watchlist-form');if(form&&!states.has(form))mount();}).observe(document.querySelector('#main'),{childList:true});
document.addEventListener('office:market-refreshed',()=>mount());mount();
