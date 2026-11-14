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
export function applySheetSkin(route){
 const main=document.querySelector('main#main'),key=Object.keys(SHEETS).find(k=>SHEETS[k].match(route));
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
 if(sheet.overview(route)&&!main.querySelector('.lh-deep')){
  const list=views(key,main).filter(v=>!v.current&&v.route!=='#'+route);
  if(list.length){
   const deep=document.createElement('section');deep.className='lh-deep';deep.setAttribute('aria-labelledby','lh-deep-title');
   deep.innerHTML=`<div class="lh-deep-head"><div><p class="lh-skin-kicker">Deep analysis</p><h2 id="lh-deep-title">Choose what to study next</h2></div><p>Each view opens on its own. Your records stay in this browser.</p></div><div class="lh-tiles">${list.map((v,i)=>`<a class="lh-tile" href="${esc(v.route)}"><span class="lh-tile-no">${String(i+1).padStart(2,'0')}</span><span class="lh-tile-title">${esc(v.label)}</span><span class="lh-tile-line">${esc(LINES[v.route]||LINES[v.id]||'')}</span><span class="lh-tile-go">Open →</span></a>`).join('')}</div>`;
   main.append(deep);
  }
 }
}
