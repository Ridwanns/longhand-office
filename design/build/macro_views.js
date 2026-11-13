/* ---------- views: Macro opens on an overview; each deep analysis is its own view ---------- */
const VIEWS=[
  ['overview','Overview',null],
  ['cycle','Cycle & quad',()=>cycle()],
  ['pulse','Indonesia pulse',()=>pulse()],
  ['winds','External winds',()=>winds()],
  ['rates','Rates',()=>rates()],
  ['compare','Compare economies',()=>compare()],
  ['region','Southeast Asia',()=>region()],
  ['tools','Research tools',()=>tools()],
  ['sources','Sources',()=>sources()]];
let VIEW='overview';
const viewIds=VIEWS.map(v=>v[0]);
function tileFacts(){
  const P=M.pulse.priority,gd=P.find(r=>/GDP/.test(r.t)),cp=P.find(r=>/price|CPI|inflation/i.test(r.t));
  const by={1:0,2:0,3:0,4:0};let none=0;for(const i of Object.keys(CY)){const q=latestQuad(i);q?by[q]++:none++}
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  const dec=M.rates.decisions.at(-1),reg=M.region.slice().sort((a,b)=>b[3]-a[3]),fed=M.liquidity.fed.at(-1);
  return {
    cycle:{fig:`Quad ${top[0]}`,line:`${top[1]} of ${Object.keys(CY).length} economies sit here on their latest releases. ${QTXT[top[0]]}.`,glyph:+top[0],
      foot:`Q1 ${by[1]} · Q2 ${by[2]} · Q3 ${by[3]} · Q4 ${by[4]}${none?` · ${none} without enough data`:''}`},
    pulse:{fig:gd?`${gd.v}%`:'—',line:`Real GDP growth, ${gd?gd.per.split(' ·')[0]:''}${cp?`. Inflation ${cp.v}% in ${cp.per.split(' ·')[0]}`:''}.`,foot:M.pulse.summary},
    winds:{fig:M.winds.score.split(' tail')[0],line:'The broad US dollar, the US 10-year yield and the rupiah, each read against its own typical 30-day move.',foot:'Tailwind, calm or headwind, never a forecast'},
    rates:{fig:`${f2(dec[1])}%`,line:`BI rate after the ${dLabel(dec[0])} decision. Policy path, money-market rates and the US Treasury curve.`,foot:`${M.rates.decisions.length} decisions since ${dLabel(M.rates.decisions[0][0])}`},
    compare:{fig:`${Object.keys(C).length}`,line:'Economies side by side on growth, inflation, policy rate and 10-year yield, plus the Euro area and the World.',foot:'Each value keeps its own period and source'},
    region:{fig:`${f2(reg[0][3])}%`,line:`${reg[0][1]} grew fastest in Southeast Asia in ${reg[0][2]}; ${reg.at(-1)[1]} slowest at ${f2(reg.at(-1)[3])}%.`,foot:'World Bank WDI annual growth, 2002 onward'},
    tools:{fig:`${Math.round(fed[1]/1000).toLocaleString('en-GB')}k`,line:`Fed balance sheet, USD bn, week of ${dLabel(fed[0])}. US liquidity and the research toolkit.`,foot:`${M.researchTools.length} tools`},
    sources:{fig:`${M.ledger.length}`,line:'Connected series behind this sheet, each with its source link, retrieval time and period range.',foot:'Nothing is filled in or estimated'}};
}
function deep(){
  const el=$('#deep');if(!el)return;const T=tileFacts();
  el.innerHTML=`<div class="deep-head"><div><div class="kicker">Deep analysis</div><h2>Choose what to study next</h2></div><p>Each view opens on its own. Your country selection carries across, and the back button returns here.</p></div>
  <div class="tiles">${VIEWS.slice(1).map(([id,t],i)=>{const f=T[id];return `<button class="tile" type="button" data-view="${id}"><span class="tn">${String(i+1).padStart(2,'0')}</span><span class="tt">${t}</span>
    <span class="tf">${id==='cycle'?qglyph(f.glyph,22):''}<b>${esc(f.fig)}</b></span><span class="tl">${esc(f.line)}</span><span class="tfoot">${esc(f.foot)}</span><span class="go">Open →</span></button>`}).join('')}</div>`;
}
function showView(v,{push=true,scroll=true}={}){
  if(!viewIds.includes(v))v='overview';const prev=VIEW;VIEW=v;
  const ov=v==='overview';$('#top').hidden=!ov;$('#deep').hidden=!ov;
  for(const id of viewIds.slice(1)){const s=$('#'+id);if(s)s.hidden=id!==v}
  if(!ov){VIEWS.find(x=>x[0]===v)[2]();details()}
  const tgt=ov?$('#top'):$('#'+v);if(tgt){tgt.classList.remove('lh-enter');void tgt.offsetWidth;tgt.classList.add('lh-enter')}
  if(ov){const d=$('#deep');d.classList.remove('lh-enter');void d.offsetWidth;d.classList.add('lh-enter')}
  $$('#mtabs button[data-view]').forEach(b=>{const on=b.dataset.view===v;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  const back=$('#mtabs .back');if(back)back.hidden=ov;
  if(push&&prev!==v){try{history.pushState({view:v},'',ov?location.pathname+location.search:'#'+v)}catch(e){location.hash=ov?'':v}}
  if(scroll)window.scrollTo({top:0,behavior:'auto'});
  if(ov&&typeof window.redrawMap==='function')window.redrawMap();
}
window.showView=showView;
function tabs(){
  const nav=$('#mtabs');if(!nav)return;
  nav.innerHTML=`<button type="button" class="back" data-view="overview" hidden>← Overview</button><div class="seg" role="tablist" aria-label="Macro views">${VIEWS.map(([id,t])=>`<button role="tab" data-view="${id}" class="${id===VIEW?'on':''}">${t}</button>`).join('')}</div>`;
  deep();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;e.preventDefault();showView(b.dataset.view)});
addEventListener('popstate',()=>{const h=location.hash.slice(1);showView(viewIds.includes(h)?h:'overview',{push:false})});
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(viewIds.includes(h))showView(h,{push:false});else if(/^[A-Z]{3}$/.test(h))showView('overview',{push:false,scroll:false})});
