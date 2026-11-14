// Sheet 05 Portfolio from the design preview, holding the Office's own portfolio components.
// The preview worked from clearly labelled example ledgers priced at published closes. Here every section is filled
// with the live, tested components instead (valuation, published-close pricing, transaction ledger, cash flows,
// performance, statement reconciliation, related decisions), rendered hidden with the page so their own mounts run
// unchanged and then moved into the sheet. Recording, editing, pricing and reconciling work exactly as before.
import {hostSheet} from './sheet-host.js';
import {mountSheetViews} from './sheet-views.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// section headings from the preview (design/preview/portfolio.js)
const SECTIONS=[
 ['groups','Portfolio','Paper and Real, kept in separate groups.','Paper tests an approach with simulated cash and transactions. Real holds manual records of your actual investments. There is no brokerage connection or order execution.'],
 ['holdings','Holdings &amp; valuation','Recorded holdings, valued on a date you choose.','Weighted-average cost includes fees. Cost, realised trading profit and unrealised P/L are kept separate. Each currency stands alone.'],
 ['journal','Transaction journal','Every trade, with its cost calculation.','Your prices and fees. Each sale shows the average cost it consumed and the trading profit it realised.'],
 ['income','Capital and income','Deposits, withdrawals and dividends, dated.','External flows are recorded separately from trades. They mark the boundaries that time-weighted return needs.'],
 ['pricing','Published daily closes','Price your recorded holdings.','Choose a published close for each holding. The original raw close and the ledger price are shown with their session, so a stale price is visible.'],
 ['performance','Performance · dated capital','Return, cash flows &amp; FX.','Time-weighted return links subperiods split at each external flow; money-weighted return solves the internal rate of return on investor cash flows.'],
 ['reconcile','Statement reconciliation','Match cash &amp; share quantities.','Compare a closing statement with the ledger. Differences are shown, never silently corrected.'],
 ['decisions','Decision room','The decision journal.','Preserve what you knew, what you expected and what happened next. Earlier text is retained when you add a review.']];
const PER_PORTFOLIO=['holdings','journal','income','pricing','performance','reconcile'];
export function portfolioSheetPage(live,{kind,route}){
 const sections=SECTIONS.map(([id,kicker,title,lede])=>`<section class="msec" id="${id}"><div class="panel glass"><div class="sec-head"><div><div class="kicker">${kicker}</div><h2>${title}</h2><p>${lede}</p></div></div><div class="lh-embedded" data-embed="${id}"></div></div></section>`).join('');
 return `<div class="lh-sheet lh-sheet-portfolio" data-sheet="portfolio" data-kind="${esc(kind)}" data-route="${esc(route)}"><nav class="mtabs" id="mtabs" aria-label="Sheet 05 Portfolio sections"><div class="seg"></div></nav><div class="lh-sheet-body"><section class="msec lead-sec"><div class="kicker" data-portfolio-kicker>Sheet 05 · Portfolio · manual records, Paper and Real kept apart</div><h1 data-portfolio-title>Your records, kept apart and priced honestly.</h1><p class="dek" data-portfolio-dek>Real holds your actual investments, entered by hand. Paper holds simulations. Both stay in this browser, and holdings are valued only with the prices you record or a dated published close.</p></section>${sections}</div><div class="lh-sheet-foot"><span>Your records stay in this browser. There is no brokerage connection and no order is placed.</span></div></div><div class="lh-live-holder" hidden>${live}</div>`;
}
let host=null;
const move=(holder,slot,selector,{intro=false,open=false}={})=>{const el=holder.querySelector(selector);if(!el)return false;if(intro)el.classList.add('lh-intro-hidden');if(open&&el.tagName==='DETAILS')el.open=true;slot.append(el);return true;};
function choose(holder,root){
 // list and decision pages: the per-portfolio views point to the portfolios themselves
 const links=[...holder.querySelectorAll('a[href^="#portfolio/"]')].filter((a,i,all)=>all.findIndex(b=>b.getAttribute('href')===a.getAttribute('href'))===i);
 const list=links.length?`<ul class="lh-portfolio-list">${links.map(a=>`<li><a href="${esc(a.getAttribute('href'))}"><span>${esc(a.textContent.trim())}</span><span>Open →</span></a></li>`).join('')}</ul>`:'';
 for(const id of PER_PORTFOLIO){const slot=root.querySelector(`[data-embed="${id}"]`);slot.innerHTML=`<p class="lh-sheet-empty">${links.length?'Choose a portfolio to see this view.':'No portfolio is recorded in this group yet. Create one in the overview of this sheet.'}</p>${list}`;}
}
export function mountPortfolioSheet(){
 const root=document.querySelector('[data-sheet="portfolio"]');if(!root)return;host?.stop();host=hostSheet(root);
 const holder=root.parentElement.querySelector('.lh-live-holder'),kind=root.dataset.kind,slot=id=>root.querySelector(`[data-embed="${id}"]`);
 const head=holder.querySelector('.page-heading');
 if(kind==='detail'){
  const name=head?.querySelector('h1')?.textContent.trim(),eyebrow=head?.querySelector('.eyebrow')?.textContent.trim().toLowerCase(),lede=head?.querySelector('p:not(.eyebrow)')?.textContent.trim();
  if(name)root.querySelector('[data-portfolio-title]').textContent=name;
  if(eyebrow)root.querySelector('[data-portfolio-kicker]').textContent='Sheet 05 · Portfolio · '+eyebrow;
  if(lede)root.querySelector('[data-portfolio-dek]').textContent=lede;
  for(const s of ['a.back-link','.page-heading .toolbar','.toolbar','dl.ledger-summary.paper-balance'])move(holder,slot('groups'),s);
  move(holder,slot('pricing'),'.published-portfolio-prices');
  move(holder,slot('holdings'),'#manual-valuation');
  move(holder,slot('journal'),'#ledger-details',{open:true});
  move(holder,slot('income'),'.cash-flow-section');
  move(holder,slot('performance'),'.portfolio-performance',{intro:true});
  move(holder,slot('reconcile'),'.statement-reconciliation');
  move(holder,slot('decisions'),'nav.workflow-links');
  for(const id of PER_PORTFOLIO)if(!slot(id).children.length)slot(id).innerHTML='<p class="lh-sheet-empty">Nothing to show for this portfolio yet.</p>';
 }else{
  choose(holder,root);
  if(kind==='decisions'){
   root.querySelector('[data-portfolio-kicker]').textContent='Sheet 05 · Portfolio · decision room';
   [...holder.children].forEach(el=>{if(!el.matches('.page-heading'))slot('decisions').append(el);});
  }else{
   root.querySelector('[data-portfolio-kicker]').textContent='Sheet 05 · Portfolio · '+(kind==='real'?'Real · actual investments':'Paper · simulation');
   // the preview's group cards, Paper and Real, with the live counts and the live create action for this group
   const tabs=[...holder.querySelectorAll('nav.portfolio-mode-tabs a')],count=i=>Number((tabs[i]?.textContent.match(/\d+/)||['0'])[0]),create=holder.querySelector('.page-heading button.primary,.page-heading .toolbar button')||holder.querySelector('button.primary');
   const card=(i,id,label,route,empty,some)=>{const n=count(i),current=kind===id;return `<div class="pg${current?' on':''}" data-group="${id}"><div class="kicker">${label}</div><b class="num">${n}</b><span>${n?some(n):empty}</span>${current?'<span data-create-slot></span>':`<a class="btn-line" href="${route}">Open ${id==='real'?'Real':'Paper'} →</a>`}</div>`;};
   const groups=document.createElement('div');
   groups.innerHTML=`<div class="pgroups">${card(0,'paper','Paper · simulation','#portfolios','Paper is empty. Create a portfolio with simulated opening cash to test an approach.',n=>`Paper portfolio${n===1?'':'s'} in this browser`)}${card(1,'real','Real · actual investments','#portfolios/real','Real is empty. Create a portfolio, then enter actual transactions from your own records.',n=>`Real portfolio${n===1?'':'s'} in this browser`)}</div>`;
   if(create)groups.querySelector('[data-create-slot]').replaceWith(create);
   // the steps in the preview's three columns, with this page's own wording
   const steps=[...holder.querySelectorAll('ol.paper-steps > li')].map((li,i)=>{const t=li.querySelector('strong,b,h3')?.textContent.trim()||li.firstChild?.textContent.trim()||'',d=li.textContent.replace(t,'').trim();return `<div><span class="tn">${i+1}</span><b>${esc(t.replace(/^\d+\.\s*/,''))}</b><p class="src">${esc(d)}</p></div>`;}).join('');
   if(steps)groups.insertAdjacentHTML('beforeend',`<div class="steps">${steps}</div>`);
   slot('groups').append(...groups.childNodes);
   // then the portfolio list (or its empty state) and the page's notes; the old tabs and steps give way to the cards
   [...holder.children].forEach(el=>{if(!el.matches('.page-heading,nav.portfolio-mode-tabs,ol.paper-steps'))slot('groups').append(el);});
  }
 }
 if(!slot('decisions').children.length)slot('decisions').innerHTML='<p class="lh-sheet-empty"><a href="#decisions">Open the decision journal →</a></p>';
 else if(kind!=='decisions')slot('decisions').insertAdjacentHTML('beforeend','<p class="lh-sheet-empty"><a href="#decisions">Open the decision journal →</a></p>');
 mountSheetViews(host.listen,'portfolio');
 if(kind==='decisions'&&typeof window.showView==='function')window.showView('decisions',{push:false,scroll:false});
}
