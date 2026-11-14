// Sheets 04 to 06 (Research Lab, Portfolio, Records & Data Sources) from the design preview, applied to the live pages.
// These pages hold the visitor's own records, kept in this browser, so their tools stay exactly as they are; this layer
// only adds the sheet's presentation: the sheet label above the page heading, the heading first on the page, and the
// "Deep analysis" chooser that lists the sheet's other views. Labels and routes come from the Office's own navigation.
import {WORKSPACE_PAGES} from './workspace-navigation.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SHEETS={
 research:{no:'04',name:'Research Lab',match:r=>r==='quant'||r.startsWith('quant/'),overview:r=>r==='quant'||r==='quant/view/overview'},
 portfolio:{no:'05',name:'Portfolio',match:r=>r==='portfolios'||r==='portfolios/real'||r.startsWith('portfolio/')||r==='decisions'||r==='theses',overview:r=>r==='portfolios'||r==='portfolios/real'},
 records:{no:'06',name:'Records & Data Sources',match:r=>r==='records'||r==='data-sources'||r.startsWith('data-sources/')||r==='library',overview:r=>r==='records'||r==='data-sources'}};
// what each view is for, in the words of the design preview where it had them
const LINES={
 '#quant/view/overview':'The instrument brief: price, historical risk and the models available for a ticker.',
 '#quant/view/models':'Core model forecasts, Monte Carlo and bootstrap paths, returns, volatility, regimes, tail risk and a benchmark.',
 '#quant/view/validation':'Registered forecasts and how each one has been scored so far.',
 '#quant/view/valuation':'Valuation scenarios with every assumption in view.',
 '#quant/view/thesis':'Claims, the tests that would prove them wrong, and the evidence.',
 '#quant/view/saved':'Every retained run and study, with the inputs it used.',
 '#quant/view/tools':'Options, bonds and the manual calculators.',
 real:'Actual investments, recorded by hand with their own prices and fees.',paper:'Simulated cash and transactions to test an approach.',
 theses:'Investment theses with their claims and review dates.',decisions:'Every decision, dated, with the reasoning at the time.',
 records:'Backups, the encrypted vault and the health of this workspace.','data-sources':'Every connected series with its dates, flags and original source.',
 library:'Published Longhand research reports.'};
function views(key,main){
 if(key==='research')return [...main.querySelectorAll('nav.research-views a[href]')].map(a=>({label:a.textContent.trim(),route:a.getAttribute('href'),current:a.hasAttribute('aria-current')||a.classList.contains('active')}));
 const group=key==='portfolio'?'Portfolio':'Workspace';
 const pages=WORKSPACE_PAGES.filter(p=>p.group===group&&p.route&&!p.finderOnly).map(p=>({label:p.label,route:p.route,id:p.id,current:location.hash===p.route}));
 // the published Library belongs with Records & Data Sources in the design
 return key==='records'?[...pages,{label:'Library',route:'#library',id:'library',current:location.hash==='#library'}]:pages;
}
// Research Lab as preview sheet 04: the general headline, and every view opened by the preview's numbered detail
// heading (bubble, label, description). The view's own title element is kept: the Lab focuses it when a view opens.
const RESEARCH_DETAILS={
 overview:['Research overview',''],
 models:['Advanced research','Core methods include AR(1), Ridge, Mean and Zero. Advanced methods cover return forecasts, volatility, market regimes, tail risk and scenarios. Unavailable analyses explain what is missing.'],
 validation:['Validation & accountability','Eligible fresh core forecasts can be frozen and observed over five or twenty future source sessions. Pending outcomes are never scored as zero.'],
 valuation:['Valuation sensitivity','Scenario assumptions are editable and are not market facts. Fundamentals are not inferred from a ticker; enter them from a filing you trust.'],
 thesis:['Investment lab','Give an idea a clear argument, evidence and a date to reconsider. Earlier text is retained when you revise.'],
 saved:['Saved research','Searchable archives of core analyses, advanced studies, registered forecasts, manual studies, ticker studies and valuations.'],
 tools:['Advanced tools','Research toolkit · options, fixed income and portfolio risk. Inputs are yours; nothing is inferred from a stock ticker.']};
const RESEARCH_HEADLINE='Study the evidence. Keep assumptions and retained research in view.';
function researchSheet(main){
 const head=main.querySelector('.quant-head'),h1=head?.querySelector('h1'),lede=head?.querySelector(':scope>p:last-child');
 if(h1&&h1.textContent!==RESEARCH_HEADLINE){h1.textContent=RESEARCH_HEADLINE;if(lede&&lede.textContent.trim()===RESEARCH_HEADLINE)lede.classList.add('lh-skin-original');}
 const order=Object.keys(RESEARCH_DETAILS);
 // the view bar follows the heading, as the preview's section row does; the selected-instrument card comes after it
 const bar=main.querySelector('nav.research-views'),context=main.querySelector('.quant-content > .lab-context');
 if(bar&&context&&context.compareDocumentPosition(bar)&Node.DOCUMENT_POSITION_FOLLOWING)context.before(bar);
 // Detail 1 is the instrument panel itself, as on the preview: bubble, label, "Start with a ticker."
 const desk=main.querySelector('[data-lab-pane="overview"] .ticker-desk');
 if(desk&&!desk.classList.contains('lh-detail')){desk.classList.add('lh-detail');const bubble=document.createElement('span');bubble.className='lh-dbub';bubble.setAttribute('aria-hidden','true');bubble.innerHTML='<b>1</b><i>04</i>';desk.prepend(bubble);const eyebrow=desk.querySelector(':scope>.eyebrow');if(eyebrow&&!eyebrow.textContent.startsWith('Detail'))eyebrow.textContent='Detail 1 · '+eyebrow.textContent;}
 main.querySelectorAll('.research-lab .lab-section-title').forEach(title=>{
  if(title.closest('.lh-sec-head'))return;
  const view=title.closest('[data-lab-pane]')?.dataset.labPane;if(!RESEARCH_DETAILS[view]||view==='overview')return;
  const [kicker,lede]=RESEARCH_DETAILS[view]||['',''],n=order.indexOf(view)+1;
  const wrap=document.createElement('div');wrap.className='lh-sec-head';
  wrap.innerHTML=`<span class="lh-dbub" aria-hidden="true"><b>${n||''}</b><i>04</i></span><div class="lh-sec-text"><p class="lh-skin-kicker">Detail ${n} · ${esc(kicker)}</p></div>`;
  title.before(wrap);wrap.querySelector('.lh-sec-text').append(title);
  if(lede){const p=document.createElement('p');p.className='lh-sec-lede';p.textContent=lede;wrap.querySelector('.lh-sec-text').append(p);}
 });
}
export function applySheetSkin(route){
 const main=document.querySelector('main#main');let key=Object.keys(SHEETS).find(k=>SHEETS[k].match(route));
 // a page that is a full ported sheet (Records) already carries the design
 if(main?.querySelector('.lh-sheet'))key=undefined;
 document.body.dataset.sheet=key||'';if(!key||!main)return;
 const sheet=SHEETS[key],head=main.querySelector('.quant-head,.page-heading');
 if(head&&!head.classList.contains('lh-skin-head')){
  head.classList.add('lh-skin-head');
  const eyebrow=head.querySelector('.eyebrow');
  const label=document.createElement('p');label.className='lh-skin-kicker';const lead=sheet.name.toLowerCase().split(' ')[0],raw=(eyebrow?.textContent.trim().toLowerCase()||'').replace(/^\d+\s*\/\s*/,''),original=raw.startsWith(lead+' /')?raw.slice(raw.indexOf('/')+1).trim():raw;
  label.textContent=`Sheet ${sheet.no} · ${sheet.name}`+(original?' · '+original:'');
  if(eyebrow){eyebrow.classList.add('lh-skin-original');eyebrow.before(label);}else head.prepend(label);
  // the heading opens the sheet: on Records it followed the backup panels
  const first=[...main.children].find(e=>!e.matches('.test-banner,.error-banner,.recovery-notice,aside'));
  if(first&&first!==head&&head.parentElement===main)main.insertBefore(head,first);
 }
 if(key==='research')researchSheet(main);
 if(sheet.overview(route)&&!main.querySelector('.lh-deep')){
  const list=views(key,main).filter(v=>!v.current&&v.route!=='#'+route);
  if(list.length){
   const deep=document.createElement('section');deep.className='lh-deep';deep.setAttribute('aria-labelledby','lh-deep-title');
   deep.innerHTML=`<div class="lh-deep-head"><div><p class="lh-skin-kicker">Deep analysis</p><h2 id="lh-deep-title">Choose what to study next</h2></div><p>Each view opens on its own. Your records stay in this browser.</p></div><div class="lh-tiles">${list.map((v,i)=>`<a class="lh-tile" href="${esc(v.route)}"><span class="lh-tile-no">${String(i+1).padStart(2,'0')}</span><span class="lh-tile-title">${esc(v.label)}</span><span class="lh-tile-line">${esc(LINES[v.route]||LINES[v.id]||'')}</span><span class="lh-tile-go">Open →</span></a>`).join('')}</div>`;
   main.append(deep);
  }
 }
}
