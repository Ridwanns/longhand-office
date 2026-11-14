// Shared sheet views (overview + deep-analysis chooser + one view per section). Ported from design/preview/sheet-views.js;
// views switch inside the page and the URL hash stays the Office route.
// Shared sheet views: each sheet opens on an overview (its lead section plus a "Deep analysis" chooser),
// and every other section opens on its own. Used by Markets, Research Lab, Portfolio and Records.
// Hidden views stay laid out off-screen at full width, so their charts keep the right size.
export function mountSheetViews(listen,page){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pc=v=>v==null||!Number.isFinite(v)?'—':(v>=0?'+':'−')+Math.abs(v).toFixed(2)+'%';
const rows=sel=>$$(sel).length;
const firstSentence=id=>{const p=$('#'+id+' .sec-head p');if(!p)return '';const t=p.textContent.trim();const m=t.match(/^.*?[.!?](\s|$)/);return (m?m[0]:t).trim()};
const best=list=>list.filter(x=>Number.isFinite(x.m1)).sort((a,b)=>b.m1-a.m1);

const CONFIG={
  markets:()=>{const K=window.MARKETS;if(!K)return null;const ten=K.ust.latest.find(p=>p[0]==='10 Yr');
    const tile=(list,label)=>{const b=best(list);return b.length?`Best month: ${b[0].name} ${pc(b[0].m1)}; weakest: ${b.at(-1).name} ${pc(b.at(-1).m1)}.`:label};
    return {overview:['indices'],views:[
      {id:'us',t:'US stocks & ETFs',fig:`${K.us.length}`,unit:'on the watchlist',line:tile(K.us,'')},
      {id:'idx',t:'Indonesia',fig:`${K.idx.length}`,unit:'IDX stocks',line:tile(K.idx,'')},
      {id:'bonds',t:'Treasuries & bond ETFs',also:['bondetf'],fig:ten?`${ten[2].toFixed(2)}%`:'—',unit:'US 10-year',line:`Par yield curve against one month and one year earlier, yield history by maturity, and ${K.bonds.length} bond ETFs.`},
      {id:'commodities',t:'Commodities',fig:`${K.commodities.length}`,unit:'contracts',line:tile(K.commodities,'')},
      {id:'msources',t:'Sources',fig:`${K.indices.length+K.us.length+K.idx.length+K.bonds.length+K.commodities.length+1}`,unit:'series',line:'Every instrument with its symbol, unit, coverage and last close. Dated snapshots, not a live feed.'}]}},
  research:()=>{const R=window.RESEARCH;if(!R)return null;
    return {overview:['brief'],views:[
      {id:'compare',t:'Compare',fig:'Vol · MDD',unit:'and correlation',line:firstSentence('compare')},
      {id:'models',t:'Quant models',fig:`${R.core5.config.horizon} & ${R.core20.config.horizon}`,unit:'session horizons',line:'Core model forecasts, Monte Carlo and bootstrap paths, returns, volatility, regimes, tail risk and a benchmark.'},
      {id:'accountability',t:'Accountability',fig:'0',unit:'scored so far',line:firstSentence('accountability')},
      {id:'valuation',t:'Valuation',fig:'EPS · Revenue',unit:'two methods',line:firstSentence('valuation')},
      {id:'thesis',t:'Thesis',fig:'Frame',unit:'claims and tests',line:firstSentence('thesis')},
      {id:'library',t:'Library',fig:`${R.catalogue.length}`,unit:'published reports',line:firstSentence('library')},
      {id:'saved',t:'Saved research',fig:`${R.runs.length}`,unit:'retained runs',line:firstSentence('saved')},
      {id:'tools',t:'Advanced tools',fig:'Options · Bonds',unit:'calculators',line:firstSentence('tools')}]}},
  portfolio:()=>({overview:['groups'],views:[
      {id:'holdings',t:'Holdings',fig:`${rows('#holdings tbody tr')||'—'}`,unit:'positions',line:firstSentence('holdings')},
      {id:'journal',t:'Journal',fig:`${rows('#journal tbody tr')||'—'}`,unit:'entries',line:'Every trade, fee and cash movement, dated and kept in order.'},
      {id:'income',t:'Capital & income',line:firstSentence('income')},
      {id:'pricing',t:'Pricing',line:firstSentence('pricing')},
      {id:'performance',t:'Performance',fig:'TWR · MWR',unit:'two returns',line:firstSentence('performance')},
      {id:'reconcile',t:'Reconciliation',line:firstSentence('reconcile')},
      {id:'decisions',t:'Decisions',line:firstSentence('decisions')}]}),
  records:()=>{const R=window.RECORDS;if(!R)return null;
    return {overview:['coverage'],views:[
      {id:'publications',t:'Publications',fig:`${R.publications.length}`,unit:'sources timed',line:firstSentence('publications')},
      {id:'ledger',t:'Dataset ledger',fig:`${R.attention.length}`,unit:'need attention',line:'Every connected series with its dates, flags and original source, filterable by area.'},
      {id:'providers',t:'Providers',fig:'4',unit:'connections',line:'Yahoo, Pluang, Flowless and SEC, each with its authorization status.'},
      {id:'inspect',t:'Inspect & import',fig:`${R.csvColumns.length}`,unit:'template columns',line:'Check a CSV or JSON file against the import template. The file never leaves your browser.'},
      {id:'official',t:'Official sources',fig:'6',unit:'agencies',line:firstSentence('official')},
      {id:'backup',t:'Backup & recovery',line:firstSentence('backup')},
      {id:'sync',t:'Checkpoint sync',fig:'Off',unit:'not configured',line:firstSentence('sync')},
      {id:'vault',t:'This workspace',line:firstSentence('vault')}]}}
};

function init(){
  const make=CONFIG[page];if(!make)return;const cfg=make();if(!cfg)return;
  const nav=$('#mtabs'),main=$('.lh-sheet-body');if(!nav||!main)return;
  const lead=$('.lh-sheet-body .lead-sec');
  const viewIds=cfg.views.map(v=>v.id),allIds=['overview',...viewIds];
  const secsOf=id=>id==='overview'?[lead,...cfg.overview.map(i=>$('#'+i))].filter(Boolean):[$('#'+id),...((cfg.views.find(v=>v.id===id)||{}).also||[]).map(i=>$('#'+i))].filter(Boolean);
  // deep-analysis chooser, placed after the overview sections
  const deep=document.createElement('section');deep.className='msec deep';deep.id='deep';
  deep.innerHTML=`<div class="deep-head"><div><div class="kicker">Deep analysis</div><h2>Choose what to study next</h2></div><p>Each view opens on its own. The back button returns here.</p></div>
    <div class="tiles">${cfg.views.map((v,i)=>`<button class="tile" type="button" data-view="${v.id}"><span class="tn">${String(i+1).padStart(2,'0')}</span><span class="tt">${esc(v.t)}</span>
      ${v.fig?`<span class="tf"><b>${esc(v.fig)}</b>${v.unit?`<small>${esc(v.unit)}</small>`:''}</span>`:'<span class="tf"></span>'}<span class="tl">${esc(v.line||'')}</span><span class="go">Open →</span></button>`).join('')}</div>`;
  const lastOv=secsOf('overview').at(-1);lastOv.after(deep);
  main.style.position='relative';
  nav.innerHTML=`<button type="button" class="back" data-view="overview" hidden>← Overview</button><div class="seg" role="tablist" aria-label="Views">${[{id:'overview',t:'Overview'},...cfg.views].map(v=>`<button role="tab" data-view="${v.id}">${esc(v.t)}</button>`).join('')}</div>`;
  let VIEW=null;
  function show(v,{push=true,scroll=true}={}){
    if(!allIds.includes(v))v='overview';const prev=VIEW;VIEW=v;
    const on=new Set([...secsOf(v),...(v==='overview'?[deep]:[])]);
    for(const s of $$('.lh-sheet-body > section')){const vis=on.has(s);s.classList.toggle('view-off',!vis);s.setAttribute('aria-hidden',String(!vis));if(vis&&prev!==null&&prev!==v){s.classList.remove('lh-enter');void s.offsetWidth;s.classList.add('lh-enter')}}
    $$('#mtabs button[data-view]').forEach(b=>{const o=b.dataset.view===v;b.classList.toggle('on',o);if(b.getAttribute('role')==='tab')b.setAttribute('aria-selected',o)});
    const back=nav.querySelector('.back');if(back)back.hidden=v==='overview';
    if(scroll&&prev!==null)window.scrollTo({top:0,behavior:'auto'});
    if(prev!==null)setTimeout(()=>dispatchEvent(new Event('resize')),30);
  }
  listen(document,'click',e=>{const b=e.target.closest('[data-view]');if(!b||!allIds.includes(b.dataset.view))return;e.preventDefault();show(b.dataset.view)});
  show('overview',{push:false,scroll:false});
  window.showView=show;
}
// run after the sheet's own script has rendered its sections
// wait until the sheet has rendered every section (some sheets build asynchronously), then take over the tab bar
function whenReady(){const t0=Date.now();const ids=$$('.lh-sheet-body > section[id]').map(s=>s.id);
  const tick=()=>{const done=ids.every(id=>$('#'+id+' .sec-head'))&&$('#mtabs .seg');if(done||Date.now()-t0>4000){init();if(window.lhLiquid)window.lhLiquid()}else setTimeout(tick,40)};tick()}
whenReady();
}
