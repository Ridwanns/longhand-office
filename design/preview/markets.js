// Sheet 03 Markets — every desk of the original Office Markets page, rendered from window.MARKETS.
(function(){
const K=window.MARKETS;if(!K)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
const dl=d=>`${+d.slice(8,10)} ${MON[+d.slice(5,7)-1]} ${d.slice(0,4)}`;
const nf=(v,dec)=>v==null||!Number.isFinite(v)?'—':v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const dec=v=>Math.abs(v)>=1000?0:Math.abs(v)>=100?2:Math.abs(v)>=1?2:4;
const pc=v=>v==null?'—':(v>=0?'+':'−')+Math.abs(v).toFixed(2)+'%';
const cache={};
async function load(file){if(!cache[file])cache[file]=fetch(file).then(r=>r.json());return cache[file]}

/* ---------- shared chart: line + optional volume, crosshair readout ---------- */
function chart(svg,pts,o={}){
  const W=Math.max(260,svg.clientWidth||svg.parentElement.clientWidth),H=o.h||300,L=4,R=W-58,T=12,VB=o.vol?H-64:H-22,B=VB;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  pts=(pts||[]).filter(p=>Number.isFinite(p[1]));
  if(pts.length<2){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle" class="t">${pts.length?'Only one observation is published for this series':'No observations in this range'}</text>`;return}
  const v=pts.map(p=>p[1]).filter(Number.isFinite),mn=Math.min(...v),mx=Math.max(...v),pad=(mx-mn)*.08||Math.abs(mx)*.02||1,lo=mn-pad,hi=mx+pad;
  const X=i=>L+(R-L)*(pts.length===1?.5:i/(pts.length-1)),Y=x=>B-(B-T)*(x-lo)/(hi-lo);
  let s='';for(let k=0;k<=4;k++){const y=lo+(hi-lo)*k/4;s+=`<line class="g" x1="${L}" x2="${R}" y1="${Y(y)}" y2="${Y(y)}"/><text x="${R+8}" y="${Y(y)+3}">${nf(y,dec(y))}</text>`}
  const step=Math.max(1,Math.round(pts.length/7));pts.forEach((p,i)=>{if(i%step===0)s+=`<text x="${X(i)}" y="${H-4}" text-anchor="${i===0?'start':'middle'}">${o.span>400?p[0].slice(0,4):MON[+p[0].slice(5,7)-1]+' '+p[0].slice(2,4)}</text>`});
  const up=v.at(-1)>=v[0],d=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');
  s+=`<path class="a ${up?'up':'dn'}" d="${d} L${X(pts.length-1)} ${B} L${X(0)} ${B}Z"/><path class="l ${up?'up':'dn'}" d="${d}"/>`;
  if(o.ref)for(const r of o.ref)s+=`<line class="ref" x1="${L}" x2="${R}" y1="${Y(r[1])}" y2="${Y(r[1])}"/><text class="reft" x="${L+4}" y="${Y(r[1])-4}">${esc(r[0])} ${nf(r[1],dec(r[1]))}</text>`;
  if(o.vol){const vv=pts.map(p=>p[3]||0),vm=Math.max(...vv)||1,bw=Math.max(1,(R-L)/pts.length*.7);
    s+=`<line class="g" x1="${L}" x2="${R}" y1="${H-22}" y2="${H-22}"/>`+pts.map((p,i)=>p[3]?`<rect class="vol" x="${X(i)-bw/2}" y="${H-22-(p[3]/vm)*36}" width="${bw}" height="${(p[3]/vm)*36}"/>`:'').join('')+`<text x="${R+8}" y="${H-52}">vol</text>`}
  s+=`<circle class="last" cx="${X(pts.length-1)}" cy="${Y(v.at(-1))}" r="3.6"/><line class="xh" y1="${T}" y2="${H-22}"/><circle class="xd" r="4"/>`;
  svg.innerHTML=s;
  const xh=svg.querySelector('.xh'),xd=svg.querySelector('.xd'),ro=o.ro&&$(o.ro);
  svg.onpointermove=e=>{const r=svg.getBoundingClientRect(),i=Math.round(Math.min(1,Math.max(0,((e.clientX-r.left)/r.width*W-L)/(R-L)))*(pts.length-1)),p=pts[i];
    xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.style.opacity=.5;xd.setAttribute('cx',X(i));xd.setAttribute('cy',Y(p[1]));xd.style.opacity=1;
    if(ro)ro.innerHTML=`<b>${dl(p[0])}</b> · close <b>${nf(p[1],dec(p[1]))}</b>${p[2]!=null&&o.raw?` · raw <b>${nf(p[2],dec(p[2]))}</b>`:''}${p[3]?` · volume <b>${nf(p[3],0)}</b>`:''} · vs first in range <b>${pc((p[1]/pts[0][1]-1)*100)}</b>`};
  svg.onpointerleave=()=>{xh.style.opacity=0;xd.style.opacity=0;if(ro)ro.textContent=''};
}
const RANGES=[['1M',31],['3M',92],['6M',183],['1Y',366],['3Y',1096],['5Y',1827],['10Y',3653],['20Y',7305],['All',1e6]];
function pick(data,range,freq){
  const days=RANGES.find(r=>r[0]===range)[1],useDaily=freq==='Daily'&&days<=1096&&data.d?.length;
  let pts=useDaily?data.d:data.w;
  if(freq==='Monthly'){if(data.m?.length)pts=data.m;else{const m=new Map();for(const p of data.w)m.set(p[0].slice(0,7),p);pts=[...m.values()]}}
  if(days<1e6&&pts.length){const cut=new Date(new Date(pts.at(-1)[0]+'T00:00:00Z')-days*864e5).toISOString().slice(0,10);pts=pts.filter(p=>p[0]>=cut)}
  return {pts,days,note:freq==='Daily'&&days>1096?'Daily view beyond 3 years uses weekly points in this preview.':''};
}
function spark(vals){if(!vals||vals.length<2)return '<span class="src">1 obs.</span>';const W=120,H=28,mn=Math.min(...vals),mx=Math.max(...vals),sp=mx-mn||1,X=i=>2+(W-4)*i/(vals.length-1),Y=v=>H-3-(H-6)*(v-mn)/sp;
  return `<svg class="spk ${vals.at(-1)>=vals[0]?'up':'dn'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('')}"/></svg>`}
const rangeBar=x=>{const p=x.hi52>x.lo52?(x.last-x.lo52)/(x.hi52-x.lo52)*100:50;return `<span class="r52"><span class="trk"><i style="left:calc(${p.toFixed(1)}% - 1px)"></i></span><small><span>${nf(x.lo52,dec(x.lo52))}</span><span>${nf(x.hi52,dec(x.hi52))}</span></small></span>`};

/* ---------- desk: watchlist + instrument panel ---------- */
function desk(id,cfg){
  const host=$('#'+id+' .panel');if(!host)return;
  let list=cfg.items.slice(),sel=list[0]?.sym,range='1Y',freq='Daily',basis='adj',group='All';
  const S=JSON.parse(localStorage.getItem('lh-watch-'+id)||'null');if(S&&Array.isArray(S))list=cfg.items.filter(x=>S.includes(x.sym));if(!list.length)list=cfg.items.slice();sel=list[0]?.sym;
  const save=()=>{try{localStorage.setItem('lh-watch-'+id,JSON.stringify(list.map(x=>x.sym)))}catch(e){}};
  host.innerHTML=`<div class="sec-head"><div><div class="kicker">${esc(cfg.kicker)}</div><h2>${esc(cfg.title)}</h2><p>${esc(cfg.lede)}</p></div>
    <div class="tools-r">${cfg.groups?`<div class="seg" data-g>${['All',...cfg.groups].map(g=>`<button data-v="${g}" class="${g==='All'?'on':''}">${g==='All'?'All groups':g}</button>`).join('')}</div>`:''}</div></div>
    <div class="desk"><aside class="wl"><div class="wl-head"><span class="kicker">Watchlist · <span data-n></span></span>${cfg.addable?`<form class="add" data-add><input placeholder="Add ticker" aria-label="Add ticker" list="${id}-dl"><datalist id="${id}-dl">${cfg.universe.map(x=>`<option value="${esc(x.sym)}">${esc(x.name)}</option>`).join('')}</datalist><button>Add</button></form>`:''}</div>
      <div class="wl-rows" data-rows></div>${cfg.addable?`<div class="wl-foot"><button class="link" data-reset>Reset list</button><span class="src">${esc(cfg.addNote)}</span></div>`:''}</aside>
      <section class="inst" data-inst aria-live="polite"></section></div>`;
  const rows=host.querySelector('[data-rows]');
  function drawList(){
    const shown=list.filter(x=>group==='All'||x.group===group);host.querySelector('[data-n]').textContent=`${shown.length} instrument${shown.length===1?'':'s'}`;
    rows.innerHTML=shown.map(x=>`<div class="wr ${x.sym===sel?'sel':''}" data-s="${esc(x.sym)}" tabindex="0" role="button" aria-pressed="${x.sym===sel}">
      <span class="wn"><b>${esc(x.name)}</b><small>${esc(x.sym)}${x.group?' · '+esc(x.group):''}</small></span>${spark(x.spark)}
      <span class="wv"><b class="num">${nf(x.last,dec(x.last))}</b><small class="${x.d1>=0?'up':'dn'}">${pc(x.d1)}</small></span>${cfg.addable?`<button class="x" data-x="${esc(x.sym)}" aria-label="Remove ${esc(x.sym)}">×</button>`:''}</div>`).join('')||`<div class="src" style="padding:12px 0">No instruments in this group.</div>`;
    rows.querySelectorAll('.wr').forEach(r=>{r.onclick=e=>{if(e.target.closest('.x'))return;sel=r.dataset.s;drawList();drawInst()};r.onkeydown=e=>{if(e.key==='Enter')r.click()}});
    rows.querySelectorAll('.x').forEach(b=>b.onclick=()=>{list=list.filter(x=>x.sym!==b.dataset.x);if(sel===b.dataset.x)sel=list[0]?.sym;save();drawList();drawInst()});
  }
  async function drawInst(){
    const x=cfg.items.find(i=>i.sym===sel),el=host.querySelector('[data-inst]');if(!x){el.innerHTML='<p class="src">Select an instrument.</p>';return}
    el.innerHTML=`<div class="ih"><div><div class="kicker">${esc(x.sym)}${x.exchange?' · '+esc(x.exchange):''} · ${esc(x.unit||'')}</div><h3>${esc(x.name)}</h3></div>
        <div class="ip"><b class="num">${nf(x.last,dec(x.last))}</b><span class="${x.d1>=0?'up':'dn'}">${pc(x.d1)}</span><small>Close ${dl(x.date)} · not real time</small></div></div>
      <div class="stats">${[['1 month',pc(x.m1)],['3 months',pc(x.m3)],['1 year',pc(x.y1)],['52-week range',rangeBar(x)]].map(([k,v])=>`<div><small>${k}</small>${typeof v==='string'&&v.startsWith('<')?v:`<b class="num">${v}</b>`}</div>`).join('')}</div>
      ${cfg.actions?`<div class="acts"><a href="#" class="act">Research this instrument →</a><a href="#" class="act">Run models →</a><a href="#" class="act">Use for valuation →</a><span class="src">Open in Research Lab (Sheet 04, not yet designed)</span></div>`:''}
      <div class="cbar"><div class="seg" data-r>${RANGES.map(([r])=>`<button data-v="${r}" class="${r===range?'on':''}">${r}</button>`).join('')}</div>
        <div class="seg" data-f>${['Daily','Weekly','Monthly'].map(f=>`<button data-v="${f}" class="${f===freq?'on':''}">${f}</button>`).join('')}</div>
        ${cfg.stock?`<div class="seg" data-b><button data-v="adj" class="${basis==='adj'?'on':''}">Adjusted</button><button data-v="raw" class="${basis==='raw'?'on':''}">Raw close</button></div>`:''}</div>
      <svg class="pc" data-c></svg><div class="ro" data-ro><span class="src">Hover the chart to inspect an observation.</span></div><div class="src" data-note></div>
      <details class="more"><summary>Exact chart values<small data-cnt></small></summary><div class="obswrap" data-obs></div></details>
      <details class="more"><summary>Data details · source and provenance</summary><div data-dd class="dd"></div></details>`;
    el.querySelectorAll('[data-r] button').forEach(b=>b.onclick=()=>{range=b.dataset.v;el.querySelectorAll('[data-r] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
    el.querySelectorAll('[data-f] button').forEach(b=>b.onclick=()=>{freq=b.dataset.v;el.querySelectorAll('[data-f] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
    el.querySelectorAll('[data-b] button').forEach(b=>b.onclick=()=>{basis=b.dataset.v;el.querySelectorAll('[data-b] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
    const data=await load(x.file);if(sel!==x.sym)return;
    function plot(){
      let {pts,days,note}=pick(data,range,freq);
      if(cfg.stock&&basis==='raw')pts=pts.map(p=>[p[0],p[2]??p[1],p[2],p[3]]);
      chart(el.querySelector('[data-c]'),pts,{ro:'#'+id+' [data-ro]',vol:cfg.stock&&pts.length&&pts[0].length>3,raw:cfg.stock,span:days,ref:[['52-wk high',x.hi52],['52-wk low',x.lo52]].filter(()=>days<=366)});
      el.querySelector('[data-note]').textContent=`${pts.length} ${freq.toLowerCase()} observations · ${pts.length?dl(pts[0][0])+' → '+dl(pts.at(-1)[0]):''}${cfg.stock?` · ${basis==='adj'?'adjusted close (splits and dividends, retrieval vintage)':'raw close (excludes dividends; may show split jumps)'}`:''}${note?' · '+note:''}`;
      el.querySelector('[data-cnt]').textContent=pts.length+' rows';
      el.querySelector('[data-obs]').innerHTML=`<table class="obs"><thead><tr><th>Date</th><th>Close</th>${cfg.stock?'<th>Raw close</th><th>Volume</th>':''}</tr></thead><tbody>${pts.slice().reverse().map(p=>`<tr><td>${p[0]}</td><td>${nf(p[1],dec(p[1]))}</td>${cfg.stock?`<td>${nf(p[2],dec(p[2]||0))}</td><td>${nf(p[3],0)}</td>`:''}</tr>`).join('')}</tbody></table>`;
    }
    plot();
    el.querySelector('[data-dd]').innerHTML=`<dl><dt>Provider</dt><dd>${esc(x.provider||'Yahoo Finance')}</dd><dt>Series</dt><dd>${esc(x.sym)} · ${esc(x.unit||'')}${x.currency?' · '+esc(x.currency):''}</dd>
      <dt>Coverage</dt><dd>${dl(x.first)} → ${dl(x.date)} · ${nf(x.n,0)} daily closes</dd>${x.retrieved?`<dt>Retrieved</dt><dd>${esc(x.retrieved.slice(0,16).replace('T',' '))} UTC</dd>`:''}
      ${x.snapshot?`<dt>Snapshot quote</dt><dd>${nf(x.snapshot.price,dec(x.snapshot.price))} · ${esc(x.snapshot.date)} · ${esc(x.snapshot.kind)}</dd>`:''}
      <dt>Quality</dt><dd>Best-effort public data. No guaranteed real-time entitlement. Adjusted closes are retrieval-vintage proxies.</dd></dl>
      <p class="src" style="margin-top:8px">Optional TradingView chart: loads a third-party widget on request in the live app; not embedded in this preview.</p>`;
  }
  host.querySelectorAll('[data-g] button').forEach(b=>b.onclick=()=>{group=b.dataset.v;host.querySelectorAll('[data-g] button').forEach(z=>z.classList.toggle('on',z===b));const vis=list.filter(x=>group==='All'||x.group===group);if(!vis.find(x=>x.sym===sel)){sel=vis[0]?.sym;drawInst()}drawList()});
  const form=host.querySelector('[data-add]');if(form)form.onsubmit=e=>{e.preventDefault();const v=form.querySelector('input').value.trim().toUpperCase();const it=cfg.items.find(x=>x.sym===v);const msg=host.querySelector('.wl-foot .src');
    if(!it){msg.textContent=`${v||'That ticker'} has no published history in this preview. Available: ${cfg.items.map(x=>x.sym).join(', ')}.`;return}
    if(!list.find(x=>x.sym===v))list.push(it);sel=v;save();form.querySelector('input').value='';msg.textContent=cfg.addNote;drawList();drawInst()};
  const rs=host.querySelector('[data-reset]');if(rs)rs.onclick=()=>{list=cfg.items.filter(x=>cfg.defaults.includes(x.sym));sel=list[0]?.sym;save();drawList();drawInst()};
  drawList();drawInst();
  return {select(sym){if(!list.find(x=>x.sym===sym)){const it=cfg.items.find(x=>x.sym===sym);if(it)list.push(it)}sel=sym;drawList();drawInst()}};
}

/* ---------- 1. indices strip ---------- */
function indices(){
  const host=$('#indices .panel');
  host.innerHTML=`<div class="sec-head"><div><div class="kicker">Global index context</div><h2>Five indices, one line each</h2><p>Daily closes from the Office market history (published ${dl(K.indices[0].date)}). Click a row for its full chart.</p></div></div>
    <div class="ix"><div class="ixr head"><span>Index</span><span>Last</span><span>1D</span><span>1M</span><span>1Y</span><span>52-week range</span><span>30 sessions</span></div>
    ${K.indices.map(x=>`<div class="ixr" data-s="${esc(x.sym)}" tabindex="0" role="button"><span class="wn"><b>${esc(x.name)}</b><small>${esc(x.sym)} · ${esc(x.unit||'')}</small></span><b class="num">${nf(x.last,dec(x.last))}</b><span class="num ${x.d1>=0?'up':'dn'}">${pc(x.d1)}</span><span class="num ${x.m1>=0?'up':'dn'}">${pc(x.m1)}</span><span class="num ${x.y1>=0?'up':'dn'}">${pc(x.y1)}</span>${rangeBar(x)}${spark(x.spark)}</div>`).join('')}</div>
    <div class="ixchart"><div class="ih"><div><div class="kicker" data-ixk></div><h3 data-ixn></h3></div><div class="seg" data-ixr>${RANGES.map(([r])=>`<button data-v="${r}" class="${r==='1Y'?'on':''}">${r}</button>`).join('')}</div></div><svg class="pc" id="ixc"></svg><div class="ro" id="ixro"></div></div>`;
  let cur=K.indices[0],range='1Y';
  const draw=async()=>{const d=await load(cur.file);host.querySelector('[data-ixk]').textContent=`${cur.sym} · ${dl(cur.first)} → ${dl(cur.date)}`;host.querySelector('[data-ixn]').textContent=cur.name;const {pts,days}=pick(d,range,'Daily');chart($('#ixc'),pts,{ro:'#ixro',span:days,h:260})};
  host.querySelectorAll('.ixr[data-s]').forEach(r=>{r.onclick=()=>{cur=K.indices.find(x=>x.sym===r.dataset.s);host.querySelectorAll('.ixr').forEach(z=>z.classList.toggle('sel',z===r));draw()};r.onkeydown=e=>{if(e.key==='Enter')r.click()}});
  host.querySelectorAll('[data-ixr] button').forEach(b=>b.onclick=()=>{range=b.dataset.v;host.querySelectorAll('[data-ixr] button').forEach(z=>z.classList.toggle('on',z===b));draw()});
  host.querySelector('.ixr[data-s]').classList.add('sel');draw();
}

/* ---------- 4a. Treasury curve + yield history ---------- */
async function treasury(){
  const host=$('#bonds .panel.ust'),U=K.ust;
  host.innerHTML=`<div class="sec-head"><div><div class="kicker">Official data · daily observations</div><h2>US Treasury yield curve</h2><p>Par yields by maturity, ${dl(U.date)}, compared with one month and one year earlier. Separate from bond ETF prices.</p></div></div>
    <div class="ustg"><div><svg class="pc" id="curve" style="height:300px"></svg><div class="leg"><span><i class="k0"></i>${dl(U.date)}</span><span><i class="k1"></i>${dl(U.m1.date)}</span><span><i class="k2"></i>${dl(U.y1.date)}</span><span class="src">maturity axis: square root of years</span></div></div>
      <table class="obs mt"><thead><tr><th>Maturity</th><th>${U.date}</th><th>1M ago</th><th>1Y ago</th><th>Δ 1Y (bp)</th></tr></thead><tbody>${U.latest.map(([m,,v])=>{const a=U.m1.pts.find(p=>p[0]===m)?.[2],b=U.y1.pts.find(p=>p[0]===m)?.[2];return `<tr><td>${m}</td><td><b>${v.toFixed(2)}</b></td><td>${a!=null?a.toFixed(2):'—'}</td><td>${b!=null?b.toFixed(2):'—'}</td><td class="${b!=null&&v-b>=0?'up':'dn'}">${b!=null?(Math.round((v-b)*100)===0?'0':(Math.round((v-b)*100)>0?'+':'−')+Math.abs(Math.round((v-b)*100))):'—'}</td></tr>`}).join('')}</tbody></table></div>
    <div class="sub">Yield history</div>
    <div class="cbar"><div class="seg" data-m>${K.mats.map(m=>`<button data-v="${m}" class="${m==='10 Yr'?'on':''}">${m.replace(' ','')}</button>`).join('')}</div></div>
    <div class="cbar"><div class="seg" data-r>${RANGES.map(([r])=>`<button data-v="${r}" class="${r==='1Y'?'on':''}">${r}</button>`).join('')}</div><div class="seg" data-f>${['Daily','Weekly','Monthly'].map(f=>`<button data-v="${f}" class="${f==='Daily'?'on':''}">${f}</button>`).join('')}</div></div>
    <svg class="pc" id="yh"></svg><div class="ro" id="yhro"></div><div class="src" id="yhn"></div>
    <details class="more"><summary>Source and recent observations</summary><p class="src" style="padding-bottom:10px">U.S. Department of the Treasury, daily par yield curve rates · <a href="${esc(U.source)}" target="_blank" rel="noopener noreferrer">source</a> · ${esc(U.unit)} · ${U.n.toLocaleString('en-US')} daily observations since ${U.first} · retrieved ${esc(U.retrieved.slice(0,10))}. Blank maturities were not published on that date.</p></details>`;
  // curve
  const svg=$('#curve'),W=Math.max(300,svg.clientWidth),H=300,L=40,R=W-14,T=14,B=H-26,all=[...U.latest,...U.m1.pts,...U.y1.pts].map(p=>p[2]),mn=Math.min(...all)-.1,mx=Math.max(...all)+.1,X=y=>L+Math.sqrt(y/30)*(R-L),Y=v=>B-(B-T)*(v-mn)/(mx-mn);
  let s='';for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4;s+=`<line class="g" x1="${L}" x2="${R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+3}" text-anchor="end">${v.toFixed(2)}</text>`}
  for(const m of ['3 Mo','1 Yr','2 Yr','5 Yr','10 Yr','20 Yr','30 Yr']){const p=U.latest.find(q=>q[0]===m);if(p)s+=`<text x="${X(p[1])}" y="${H-6}" text-anchor="middle">${m.replace(' ','')}</text>`}
  const line=(pts,c)=>`<path class="cv ${c}" d="${pts.map((p,i)=>(i?'L':'M')+X(p[1]).toFixed(1)+' '+Y(p[2]).toFixed(1)).join('')}"/>`;
  s+=line(U.y1.pts,'k2')+line(U.m1.pts,'k1')+line(U.latest,'k0')+U.latest.map(p=>`<circle class="cd" cx="${X(p[1])}" cy="${Y(p[2])}" r="3"><title>${p[0]}: ${p[2]}%</title></circle>`).join('');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=s;
  // history
  const H2=await load('mk/ust.json');let m='10 Yr',range='1Y',freq='Daily';
  const plot=()=>{const {pts,days,note}=pick(H2[m],range,freq);chart($('#yh'),pts,{ro:'#yhro',span:days,h:260});$('#yhn').textContent=`${m} · ${pts.length} ${freq.toLowerCase()} observations${note?' · '+note:''}`};
  host.querySelectorAll('[data-m] button').forEach(b=>b.onclick=()=>{m=b.dataset.v;host.querySelectorAll('[data-m] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
  host.querySelectorAll('[data-r] button').forEach(b=>b.onclick=()=>{range=b.dataset.v;host.querySelectorAll('[data-r] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
  host.querySelectorAll('[data-f] button').forEach(b=>b.onclick=()=>{freq=b.dataset.v;host.querySelectorAll('[data-f] button').forEach(z=>z.classList.toggle('on',z===b));plot()});
  plot();
}

/* ---------- 6. sources ---------- */
function sources(){
  const host=$('#msources .panel'),all=[...K.indices,...K.us,...K.idx,...K.bonds,...K.commodities];
  host.innerHTML=`<div class="sec-head"><div><div class="kicker">Sources and methods</div><h2>Snapshot provenance</h2><p>${all.length} instruments plus the Treasury curve. Every series is a dated public snapshot, not a live feed.</p></div></div>
    <div class="ledgerwrap"><table class="ledger"><thead><tr><th>Instrument</th><th>Symbol</th><th>Unit</th><th>Coverage</th><th>Closes</th><th>Last close</th></tr></thead><tbody>${all.map(x=>`<tr><td>${esc(x.name)}</td><td><code>${esc(x.sym)}</code></td><td>${esc(x.unit||'')}</td><td class="num">${x.first} → ${x.date}</td><td class="num">${nf(x.n,0)}</td><td class="num">${nf(x.last,dec(x.last))}</td></tr>`).join('')}
    <tr><td>US Treasury par yield curve</td><td><code>UST</code></td><td>${esc(K.ust.unit)}</td><td class="num">${K.ust.first} → ${K.ust.date}</td><td class="num">${nf(K.ust.n,0)}</td><td class="num">10Y ${K.ust.latest.find(p=>p[0]==='10 Yr')?.[2]}</td></tr></tbody></table></div>
    <p class="src" style="margin-top:8px">${esc(K.builtFrom)}. Quotes and eligible histories have different coverage. Adjusted closes are retrieval-vintage proxies; raw closes exclude dividends and can show split jumps.</p>`;
}

/* ---------- tabs + details ---------- */
function tabs(){
  const T=[['Indices','#indices'],['US stocks & ETFs','#us'],['Indonesia','#idx'],['Bonds','#bonds'],['Commodities','#commodities'],['Sources','#msources']];
  const nav=$('#mtabs');nav.innerHTML=`<span class="kicker">Sheet 03 — details 1–${T.length}</span><div class="seg" role="tablist">${T.map(([t,h],i)=>`<button role="tab" data-h="${h}" class="${i?'':'on'}"><span class="dn">${i+1}</span>${t}</button>`).join('')}</div>`;
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{const t=$(b.dataset.h);if(t)window.scrollTo({top:t.getBoundingClientRect().top+scrollY-118,behavior:'smooth'})});
  const secs=T.map(([,h])=>$(h));const spy=()=>{let cur=secs[0];for(const s of secs)if(s.getBoundingClientRect().top<170)cur=s;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.h==='#'+cur.id))};
  /* scroll spy replaced by sheet-views.js */
  T.forEach(([,h],i)=>{$$(h+' .sec-head>div:first-child').forEach((d,j)=>{if(d.querySelector('.dbub'))return;const inner=d.innerHTML;d.innerHTML=`<span class="dbub" aria-label="Detail ${i+1}${j?String.fromCharCode(97+j):''} of sheet 03"><b>${i+1}${j?String.fromCharCode(97+j):''}</b><i>03</i></span><div class="ttl">${inner}</div>`;const k=d.querySelector('.kicker');if(k)k.textContent=`Detail ${i+1}${j?String.fromCharCode(97+j):''} · `+k.textContent})});
}

const desks={};
function all(){
  indices();
  desks.us=desk('us',{kicker:'The research desk',title:'US stocks & ETFs',lede:'Watchlist, prices and research. Daily closes from Yahoo Finance history; adjusted and raw closes kept apart.',items:K.us,defaults:['AAPL','MSFT','NVDA','BRK-B'],addable:true,universe:K.us,addNote:'In the live app any listed ticker can be added.',stock:true,actions:true});
  desks.idx=desk('idx',{kicker:'The research desk',title:'Indonesian stocks',lede:'IDX watchlist and quick picks. Additional IDX source (Flowless) stays a separate, personal local read.',items:K.idx,defaults:K.idxWatch,addable:true,universe:K.idx,addNote:'Quick picks: '+K.idxPicks.join(' · '),stock:true,actions:true});
  treasury();
  desks.bonds=desk('bondetf',{kicker:'Bond ETFs · separate from Treasury yields',title:'Bond ETFs',lede:'Exchange-traded bond funds priced in USD. ETF prices are not yields.',items:K.bonds,actions:true});
  desks.cmd=desk('commodities',{kicker:'The research desk',title:'Commodities',lede:'Continuous futures and provider series, grouped as in the Office catalogue. Units differ by contract.',items:K.commodities,groups:['Energy','Metals','Agriculture','Livestock']});
  sources();tabs();
  const h=decodeURIComponent(location.hash.slice(1));if(h.startsWith('i=')){const s=h.slice(2);for(const [k,d] of Object.entries(desks)){const src={us:K.us,idx:K.idx,bonds:K.bonds,cmd:K.commodities}[k];if(src.find(x=>x.sym===s)){d.select(s);setTimeout(()=>document.getElementById({us:'us',idx:'idx',bonds:'bondetf',cmd:'commodities'}[k]).scrollIntoView({behavior:'smooth'}),300);break}}}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',all):all();
})();
