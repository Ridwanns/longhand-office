// Longhand Office — shared tactile components. Plain script, no build step.
(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- lamp switch: wraps the page's #theme button, the page keeps owning setTheme ---------- */
function lamp(){
  const b=$('#theme');if(!b||b.classList.contains('lamp'))return;
  b.classList.remove('iconbtn');b.classList.add('lamp');
  b.innerHTML=`<span class="bulb"><svg viewBox="0 0 22 28" aria-hidden="true"><circle class="halo" cx="11" cy="17" r="9"/>
    <path class="shade" d="M4 11 L18 11 L15 4.5 L7 4.5 Z"/><rect class="shade" x="10.4" y="0" width="1.2" height="5"/>
    <circle class="glass-b" cx="11" cy="14.6" r="3.6"/><line class="cord" x1="16" y1="11" x2="16" y2="22"/><circle class="knob" cx="16" cy="23" r="1.6"/></svg></span>
    <span class="state"></span><svg id="ticon"></svg>`;
  const sync=()=>{const dark=document.documentElement.dataset.theme==='dark';b.querySelector('.state').textContent=dark?'Off':'On';
    b.setAttribute('aria-label',dark?'Desk lamp off (dark mode). Turn on for light mode':'Desk lamp on (light mode). Turn off for dark mode');b.setAttribute('aria-pressed',String(!dark))};
  sync();new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  b.addEventListener('click',()=>{b.classList.add('pull');setTimeout(()=>b.classList.remove('pull'),220)});
}

/* ---------- liquid tabs: a sliding pill under every .seg ---------- */
function liquid(){
  for(const seg of $$('.seg')){
    if(seg.querySelector('.liquid'))continue;
    const pill=document.createElement('span');pill.className='liquid';seg.prepend(pill);seg.classList.add('liquid-on');
    const place=()=>{const on=seg.querySelector('button.on');if(!on)return;pill.style.left=on.offsetLeft+'px';pill.style.width=on.offsetWidth+'px'};
    pill.style.transition='none';place();pill.getBoundingClientRect();setTimeout(()=>{place();pill.style.transition=''},60); // first paint in place, animate afterwards
    new MutationObserver(place).observe(seg,{subtree:true,attributes:true,attributeFilter:['class']});
    if(window.ResizeObserver)new ResizeObserver(place).observe(seg); // re-measure once layout and fonts settle
    addEventListener('resize',place);document.fonts?.ready.then(place);
  }
}

window.lhLiquid=liquid;
/* ---------- finder (Ctrl K) ---------- */
const PAGES=[
 ['Overview','Sheet 01 · market schedule, office model, featured chart','index.html','01'],
 ['Featured chart','Overview · daily closes with peak and drawdown','index.html#feature','01'],
 ['US Treasury yield curve','Overview · par yields by tenor','index.html#rates','01'],
 ['Macro','Sheet 02 · world map and country dossiers','macro.html','02'],
 ['Release calendar','Macro · US BLS schedule and Indonesian releases','macro.html#calendar','02'],
 ['Markets','Sheet 03 · indices, US and IDX stocks, bonds, commodities','markets.html','03'],
 ['US Treasury yield curve (all maturities)','Markets · curve vs 1M and 1Y ago, yield history','markets.html#bonds','03'],
 ['Commodities','Markets · 27 futures by group','markets.html#commodities','03'],
 ['Research Lab','Sheet 04 · brief, quant models, valuation, thesis, library, tools','research.html','04'],
 ['Quantitative models','Research Lab · forecasts, Monte Carlo, volatility, tail risk','research.html#models','04'],
 ['Valuation sensitivity','Research Lab · your assumptions with a stress grid','research.html#valuation','04'],
 ['Options & bond calculators','Research Lab · Black–Scholes, yield, duration','research.html#tools','04'],
 ['Research library','Research Lab · 14 published Longhand reports','research.html#library','04'],
 ['Portfolio','Sheet 05 · Paper and Real, holdings, journal, performance','portfolio.html','05'],
 ['Decision journal','Portfolio · reviews and the reasoning behind decisions','portfolio.html#decisions','05'],
 ['Records & Data Sources','Sheet 06 · coverage, dataset ledger, providers, backups','records.html','06'],
 ['Data coverage ledger','Records · 362 series needing attention, filters','records.html#ledger','06'],
 ['Backup & recovery','Records · workspace backup, encrypted backup, restore','records.html#backup','06'],
 ['Inspect a market data file','Records · CSV/JSON check against the template','records.html#inspect','06'],
];
const MARKETS=[['^JKSE','IHSG','IDX Composite'],['^GSPC','S&P 500','US large caps'],['TLT','Long Treasury ETF','iShares 20+ Year'],['GC=F','Gold futures','USD per troy ounce']];
let F=null,items=[],act=0;
function loadAtlas(){return new Promise(r=>{if(window.ATLAS||window.COUNTRIES)return r();const s=document.createElement('script');s.src='atlas.js';s.onload=r;s.onerror=r;document.head.appendChild(s)})}
function countries(){
  if(window.COUNTRIES)return Object.entries(window.COUNTRIES).map(([i,c])=>[i,c.name,c.gdp?.v]);
  if(window.ATLAS)return window.ATLAS.gdp.map(r=>[r[0],r[1],r[2]]);return[]}
function build(){
  F=document.createElement('div');F.className='finder';F.setAttribute('role','dialog');F.setAttribute('aria-label','Find in Longhand Office');
  F.innerHTML=`<div class="box glass"><div class="in"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="fq" placeholder="Pages, markets or countries…" autocomplete="off" aria-controls="fres"><kbd>ESC</kbd></div><div class="res" id="fres" role="listbox"></div><div class="foot"><span>↑↓ move</span><span>↵ open</span><span>Esc close</span></div></div>`;
  document.body.appendChild(F);
  F.addEventListener('click',e=>{if(e.target===F)close()});
  const q=F.querySelector('#fq');q.addEventListener('input',()=>{act=0;list(q.value)});
  q.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){act=Math.min(items.length-1,act+1);mark();e.preventDefault()}if(e.key==='ArrowUp'){act=Math.max(0,act-1);mark();e.preventDefault()}if(e.key==='Enter'&&items[act]){go(items[act].href)}if(e.key==='Escape')close()});
}
function list(q){
  q=q.trim().toLowerCase();const m=s=>!q||s.toLowerCase().includes(q);
  const P=PAGES.filter(p=>m(p[0]+' '+p[1])).map(p=>({g:'Pages',ic:p[3],t:p[0],s:p[1],href:p[2]}));
  const M=MARKETS.filter(x=>m(x[1]+' '+x[2]+' '+x[0])).map(x=>({g:'Markets',ic:'MK',t:x[1],s:x[2],v:window.SERIES?.[x[0]]?Number(window.SERIES[x[0]].at(-1)[1]).toLocaleString('en-US',{maximumFractionDigits:2}):'',href:(x[0]==='^JKSE'||x[0]==='^GSPC'?'markets.html#indices':'markets.html#i='+encodeURIComponent(x[0]))}));
  const C=countries().filter(c=>m(c[1]+' '+c[0])).sort((a,b)=>a[1].localeCompare(b[1])).slice(0,q?20:8).map(c=>({g:'Economies',ic:c[0],t:c[1],s:'Macro dossier · GDP, inflation, policy rate, 10Y yield',v:Number.isFinite(c[2])?c[2].toFixed(2)+'% GDP':'',href:'macro.html#'+c[0]}));
  items=[...P,...M,...C];const res=F.querySelector('#fres');
  if(!items.length){res.innerHTML=`<div class="none">Nothing matches “${esc(q)}”.</div>`;return}
  let g='',h='';items.forEach((it,i)=>{if(it.g!==g){g=it.g;h+=`<div class="grp">${g}</div>`}h+=`<div class="it" role="option" data-i="${i}"><span class="ic">${esc(it.ic)}</span><span><b>${esc(it.t)}</b><small>${esc(it.s)}</small></span><span class="v">${esc(it.v||'')}</span></div>`});
  res.innerHTML=h;res.querySelectorAll('.it').forEach(el=>{el.onmouseenter=()=>{act=+el.dataset.i;mark()};el.onclick=()=>go(items[+el.dataset.i].href)});mark();
}
function mark(){F.querySelectorAll('.it').forEach(el=>el.classList.toggle('act',+el.dataset.i===act));F.querySelector('.it.act')?.scrollIntoView({block:'nearest'})}
function go(href){close();const [path,hash]=href.split('#');const here=location.pathname.split('/').pop()||'index.html';
  if((path||'index.html')===here){location.hash=hash||'';dispatchEvent(new HashChangeEvent('hashchange'))}else location.href=href}
async function open(){if(!F)build();await loadAtlas();F.classList.add('open');const q=F.querySelector('#fq');q.value='';act=0;list('');setTimeout(()=>q.focus(),30)}
function close(){F?.classList.remove('open')}
function finder(){
  addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();F?.classList.contains('open')?close():open()}if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();open()}});
  for(const el of $$('.find:not(input)')){el.setAttribute('role','button');el.tabIndex=0;el.onclick=open;el.onkeydown=e=>{if(e.key==='Enter')open()}}
}

/* ---------- release calendar card ---------- */
function calendar(host){
  if(!host||!window.CALENDAR)return;
  const EV=window.CALENDAR,TODAY='2026-11-13';let Y=2026,M=10,SEL=TODAY; // month index 10 = November
  const ymd=(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  function draw(){
    const first=new Date(Date.UTC(Y,M,1)),start=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(Y,M+1,0)).getUTCDate();
    const title=first.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
    let g='';['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>g+=`<div class="dow">${d}</div>`);
    for(let i=0;i<start;i++)g+='<div></div>';
    for(let d=1;d<=days;d++){const k=ymd(Y,M,d),ev=EV.filter(e=>e[0]===k),us=ev.some(e=>e[1]==='US'),id=ev.some(e=>e[1]==='ID');
      g+=`<button class="d ${k<TODAY?'past':''} ${k===TODAY?'today':''} ${k===SEL?'sel':''}" data-k="${k}" aria-label="${k}: ${ev.length} release${ev.length===1?'':'s'}">${d}<span class="dots">${us?'<i class="us"></i>':''}${id?'<i class="id"></i>':''}</span></button>`}
    const selEv=EV.filter(e=>e[0]===SEL),next=EV.filter(e=>e[0]>TODAY).slice(0,3);
    const evHtml=e=>`<div class="ev"><span class="tag ${e[1].toLowerCase()}">${e[1]}</span><span>${esc(e[2])}<small>${new Date(e[0]+'T00:00:00Z').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})} · ${esc(e[3])}${e[0]<TODAY?' · released':e[0]===TODAY?' · today':' · scheduled'}</small></span></div>`;
    host.innerHTML=`<div class="cal-head"><div><div class="kicker">Release calendar</div><h3>${title}</h3></div><div class="nav"><button data-m="-1" aria-label="Previous month">‹</button><button data-m="1" aria-label="Next month">›</button></div></div>
      <div class="cal-grid">${g}</div>
      <div class="cal-list">${SEL===TODAY&&!selEv.length?`<div class="kicker" style="margin-bottom:4px">Nothing today · next up</div>${next.map(evHtml).join('')}`:selEv.length?selEv.map(evHtml).join(''):`<div class="src">No release recorded on ${SEL}.</div>`}</div>
      <div class="cal-key"><span><i style="background:#4f7f96"></i>US · BLS schedule</span><span><i style="background:var(--focus)"></i>Indonesia · BPS / BI releases in the snapshot</span></div>`;
    host.querySelectorAll('.d').forEach(b=>b.onclick=()=>{SEL=b.dataset.k;draw()});
    host.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{M+=+b.dataset.m;if(M<8){M=8}if(M>11){M=11}draw()});
  }
  draw();
}


/* ---------- phone page bar: the header links move to a bar at the bottom of the screen ---------- */
function tabbar(){
  if($('.tabbar'))return;const links=$$('header nav a');if(!links.length)return;
  const short={'Research Lab':'Research'};
  const bar=document.createElement('nav');bar.className='tabbar';bar.setAttribute('aria-label','Pages');
  bar.innerHTML=links.map(a=>`<a href="${a.getAttribute('href')}" class="${a.classList.contains('on')?'on':''}"${a.classList.contains('on')?' aria-current="page"':''}>${short[a.textContent.trim()]||a.textContent.trim()}</a>`).join('');
  document.body.appendChild(bar);
}
function init(){lamp();liquid();finder();calendar($('#calendar'));tabbar()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
window.OfficeUI={open,close};
})();
