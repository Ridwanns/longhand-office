import {publicManifest} from './browser-api.js';
const states=new WeakMap(),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=(value,category)=>value.trim().toUpperCase().replace(category==='idx'?/\.JK$/:/[.]/,category==='idx'?'':'-');
async function mount(){
 const form=document.querySelector('#watchlist-form');if(!form)return;
 let state=states.get(form);
 if(!state){
  state={items:[],category:form.closest('#market-board').dataset.category};states.set(form,state);
  const section=document.createElement('section');section.id='market-coverage';section.innerHTML='<p id="market-coverage-status" class="quiet-note" role="status">Loading available stocks…</p><details class="stock-coverage"><summary>Browse available stocks</summary><div class="coverage-filter"><label>Filter by ticker or company<input id="market-stock-search" type="search" placeholder="e.g. ADRO or Berkshire"></label></div><div class="coverage-list"></div></details>';form.after(section);
  form.insertAdjacentHTML('beforeend','<datalist id="market-tickers"></datalist>');form.elements.symbol.setAttribute('list','market-tickers');form.elements.symbol.setAttribute('aria-describedby','market-coverage-status');
  state.update=()=>{const ticker=normalize(form.elements.symbol.value,state.category),selected=state.items.find(h=>h.ticker===ticker),known=!ticker||!!selected;form.querySelector('[type=submit]').disabled=!ticker||!selected;form.elements.symbol.setCustomValidity(known?'':'Choose a published ticker from Browse available stocks.');section.querySelector('#market-coverage-status').textContent=!ticker?state.items.length+' published stocks/ETFs available. Type a ticker or choose from the list below.':selected?selected.ticker+' · '+selected.name+' — available in this publication.':'Ticker not published. Choose from Browse available stocks; no substitute price will be used.';};
  form.elements.symbol.addEventListener('input',state.update);form.elements.symbol.addEventListener('change',state.update);form.addEventListener('reset',()=>setTimeout(state.update,0));state.update();
 }
 const request=(state.request||0)+1;state.request=request;
 try{
  const manifest=await publicManifest();if(!form.isConnected||request!==state.request)return;
  const items=manifest.histories.filter(h=>h.market===(state.category==='idx'?'IDX':'US'));state.items=items;
  form.querySelector('#market-tickers').innerHTML=items.map(h=>'<option value="'+esc(h.ticker)+'">'+esc(h.name||h.ticker)+'</option>').join('');
  const section=form.nextElementSibling,signature=items.map(h=>h.ticker+'|'+h.name).join(';');
  if(state.signature!==signature){state.signature=signature;section.querySelector('.coverage-list').innerHTML=items.map(h=>'<button type="button" data-market-ticker="'+esc(h.ticker)+'" data-market-search="'+esc((h.ticker+' '+h.name).toLowerCase())+'"><strong>'+esc(h.ticker)+'</strong><span>'+esc(h.name||h.ticker)+'</span></button>').join('');}
  state.update();
 }catch(e){if(form.isConnected)form.nextElementSibling.querySelector('#market-coverage-status').textContent='Stock coverage could not be loaded. '+e.message;}
}
document.addEventListener('submit',e=>{if(e.target.id!=='watchlist-form')return;const state=states.get(e.target),ticker=normalize(e.target.elements.symbol.value,state?.category||'us');if(!state?.items.some(h=>h.ticker===ticker)){e.preventDefault();e.stopImmediatePropagation();state?.update();}},true);
document.addEventListener('click',e=>{const button=e.target.closest('[data-market-ticker]'),form=document.querySelector('#watchlist-form');if(!button||!form)return;form.elements.symbol.value=button.dataset.marketTicker;form.elements.symbol.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();});
document.addEventListener('input',e=>{if(e.target.id!=='market-stock-search')return;const needle=e.target.value.trim().toLowerCase();document.querySelectorAll('[data-market-search]').forEach(b=>b.hidden=!b.dataset.marketSearch.includes(needle));});
new MutationObserver(()=>{const form=document.querySelector('#watchlist-form');if(form&&!states.has(form))mount();}).observe(document.querySelector('#main'),{childList:true});
document.addEventListener('office:market-refreshed',()=>mount());mount();
