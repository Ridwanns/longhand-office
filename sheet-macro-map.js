// Sheet 02 Macro: world map, schedule and country dossier. Ported from design/preview/macro.html.
// Every value comes from the published sheet data (window.COUNTRIES), built from the Office snapshot.
import {MAP_COUNTRIES} from './macro-map-data.js';
export function mountMacroMap(listen){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const C=window.COUNTRIES;
const IND={
 gdp:{t:'Real GDP growth',u:'% YoY',bins:[[-1e9,0,'var(--m-gdp-0)','below 0%'],[0,2,'var(--m-gdp-1)','0–2%'],[2,4,'var(--m-gdp-2)','2–4%'],[4,1e9,'var(--m-gdp-3)','4% +']]},
 cpi:{t:'Inflation',u:'% YoY',bins:[[-1e9,2,'var(--m-cpi-0)','below 2%'],[2,4,'var(--m-cpi-1)','2–4%'],[4,8,'var(--m-cpi-2)','4–8%'],[8,1e9,'var(--m-cpi-3)','8% +']]},
 policy:{t:'Policy rate',u:'% per year',bins:[[-1e9,2,'var(--m-pol-0)','below 2%'],[2,4,'var(--m-pol-1)','2–4%'],[4,8,'var(--m-pol-2)','4–8%'],[8,1e9,'var(--m-pol-3)','8% +']]},
 yield:{t:'10-year yield',u:'% per year',bins:[[-1e9,2,'var(--m-yld-0)','below 2%'],[2,4,'var(--m-yld-1)','2–4%'],[4,8,'var(--m-yld-2)','4–8%'],[8,1e9,'var(--m-yld-3)','8% +']]}};
const colour=(k,v)=>IND[k].bins.find(b=>v>=b[0]&&v<b[1])[2];
const has=(iso,k)=>C[iso]?.[k]&&Number.isFinite(C[iso][k].v);
let K='gdp',SEL='IDN';
const names=Object.fromEntries(MAP_COUNTRIES.map(c=>[c.id,c.name]));names.SGP='Singapore';
for(const [i,c] of Object.entries(C))names[i]=c.name; // the app's own names win
const ranked=k=>Object.entries(C).filter(([i])=>has(i,k)).map(([i,c])=>({iso:i,name:c.name,...c[k]})).sort((a,b)=>b.v-a.v);
const median=a=>{const s=a.map(x=>x.v).sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const f2=v=>v.toFixed(2);

/* ---------- map ---------- */
const svg=$('#map'),world=$('#world');
let g='';for(let lon=-150;lon<=150;lon+=30)g+=`<line class="grat" x1="${(lon+180)/360*1000}" x2="${(lon+180)/360*1000}" y1="0" y2="500"/>`;
for(let lat=-60;lat<=60;lat+=30)g+=`<line class="grat" x1="0" x2="1000" y1="${(90-lat)/180*500}" y2="${(90-lat)/180*500}"/>`;
$('#grat').innerHTML=g;
$('#countries').innerHTML=MAP_COUNTRIES.map(c=>`<path class="ctry" data-iso="${c.id}" d="${c.d}"/>`).join('')+`<circle class="sgp ctry" data-iso="SGP" cx="${(103.82+180)/360*1000}" cy="${(90-1.35)/180*500}" r="2.6"/>`;
const paths=Object.fromEntries($$('#countries [data-iso]').map(p=>[p.dataset.iso,p]));
function paint(){
  for(const [iso,p] of Object.entries(paths)){if(has(iso,K)){p.style.fill=colour(K,C[iso][K].v);p.classList.remove('none')}else{p.style.fill='';p.classList.add('none')}}
  $('#hatches').innerHTML=Object.keys(paths).filter(i=>has(i,K)&&C[i][K].stale).map(i=>{const p=paths[i];return p.tagName==='circle'?`<circle class="hatch" cx="${p.getAttribute('cx')}" cy="${p.getAttribute('cy')}" r="2.6"/>`:`<path class="hatch" d="${p.getAttribute('d')}"/>`}).join('');
}
// zoom & pan: transform on <g>, eased by CSS
let Z={s:1,x:0,y:0};
const clampZ=z=>{const s=Math.min(8,Math.max(1,z.s));return{s,x:Math.min(0,Math.max(1000-1000*s,z.x)),y:Math.min(0,Math.max(500-500*s,z.y))}};
function setZ(z,anim=true){Z=clampZ(z);svg.classList.toggle('noanim',!anim);world.style.transform=`translate(${Z.x}px,${Z.y}px) scale(${Z.s})`;
  world.style.transform=`matrix(${Z.s},0,0,${Z.s},${Z.x},${Z.y})`}
const toMap=e=>{const r=svg.getBoundingClientRect();return[(e.clientX-r.left)/r.width*1000,(e.clientY-r.top)/r.height*500]};
function zoomAt(mx,my,f,anim=true){const s=Math.min(8,Math.max(1,Z.s*f));const k=s/Z.s;setZ({s,x:mx-(mx-Z.x)*k,y:my-(my-Z.y)*k},anim)}
svg.addEventListener('wheel',e=>{e.preventDefault();const[mx,my]=toMap(e);zoomAt(mx,my,Math.exp(-e.deltaY*0.0018),false)},{passive:false});
let drag=null,moved=0;
// remember the country under the pointer at press; capture the pointer only once a real drag starts,
// otherwise pointerup is retargeted to the <svg> and the click is lost
svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,z:{...Z},iso:e.target.closest?.('[data-iso]')?.dataset.iso,id:e.pointerId,cap:false};moved=0});
svg.addEventListener('pointermove',e=>{
  if(drag){const r=svg.getBoundingClientRect(),dx=(e.clientX-drag.x)/r.width*1000,dy=(e.clientY-drag.y)/r.height*500;moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));
    if(moved>3){if(!drag.cap){svg.setPointerCapture(drag.id);drag.cap=true}svg.classList.add('drag');setZ({s:drag.z.s,x:drag.z.x+dx,y:drag.z.y+dy},false)}}
  tipMove(e)});
svg.addEventListener('pointerup',e=>{svg.classList.remove('drag');const d=drag;drag=null;if(d&&moved<=3&&d.iso)select(d.iso,true)});
svg.addEventListener('pointercancel',()=>{svg.classList.remove('drag');drag=null});
svg.addEventListener('pointerleave',()=>{$('#tip').style.opacity=0});
$('#zin').onclick=()=>zoomAt(500,250,1.6);$('#zout').onclick=()=>zoomAt(500,250,1/1.6);$('#zreset').onclick=()=>setZ({s:1,x:0,y:0});
listen(window,'keydown',e=>{if(e.key==='Escape')setZ({s:1,x:0,y:0})});
function focusCountry(iso){const p=paths[iso];if(!p)return;let b=p.getBBox();
  if(b.width>500){setZ({s:1,x:0,y:0});return} // spans the antimeridian or very large: show the world
  const s=Math.min(5,Math.max(1.4,Math.min(1000/(b.width*2.6),500/(b.height*2.6))));
  setZ({s,x:500-(b.x+b.width/2)*s,y:250-(b.y+b.height/2)*s})}
// tooltip (rAF throttled)
let tipReq=null;
function tipMove(e){if(tipReq)return;tipReq=requestAnimationFrame(()=>{tipReq=null;const t=$('#tip'),iso=e.target.closest?.('[data-iso]')?.dataset.iso;
  if(!iso||drag&&moved>3){t.style.opacity=0;return}
  const c=C[iso],k=c?.[K];t.innerHTML=`<b>${names[iso]||iso}</b>`+(k&&Number.isFinite(k.v)?`<span class="v">${f2(k.v)}%</span> <span class="src">${IND[K].t.toLowerCase()} · ${k.per}${k.stale?' · outdated':''}</span>`:`<span class="src">no connected ${IND[K].t.toLowerCase()} series</span>`);
  const card=$('.mapcard').getBoundingClientRect();let x=e.clientX-card.left+14,y=e.clientY-card.top+14;if(x+t.offsetWidth>card.width-8)x-=t.offsetWidth+28;
  t.style.transform=`translate(${x}px,${y}px)`;t.style.opacity=1})}

/* ---------- headline, legend, schedule ---------- */
function headline(){
  const R=ranked(K),n=R.length,idn=R.find(r=>r.iso==='IDN'),rk=idn?R.indexOf(idn)+1:null;
  const top=R[0],low=R.at(-1),med=median(R);
  if(K==='gdp'){const neg=R.filter(r=>r.v<0);$('#headline').innerHTML=`${neg.length} of ${n} economies are <em>shrinking</em>.`;
    $('#dek').innerHTML=`Below zero: ${neg.map(r=>r.name).join(', ')}. Fastest: ${top.name} ${f2(top.v)}%. Median ${f2(med)}%. Indonesia <b>${f2(idn.v)}%</b> (${idn.per}), rank ${rk} of ${n}.`}
  if(K==='cpi'){const hot=R.filter(r=>r.v>=4);$('#headline').innerHTML=`Inflation is <em>4% or higher</em> in ${hot.length} of ${n} economies.`;
    $('#dek').innerHTML=`Highest: ${R.slice(0,3).map(r=>`${r.name} ${r.v.toFixed(1)}%`).join(', ')}. Lowest: ${low.name} ${f2(low.v)}%. Median ${f2(med)}%. Indonesia <b>${f2(idn.v)}%</b> (${idn.per}), rank ${rk} of ${n}.`}
  if(K==='policy'){$('#headline').innerHTML=`Policy rates run from <em>${f2(low.v)}%</em> to <em>${f2(top.v)}%</em>.`;
    $('#dek').innerHTML=`${low.name} lowest, ${top.name} highest, across ${n} central banks. Median ${f2(med)}%. Bank Indonesia <b>${f2(idn.v)}%</b> (decision ${idn.per}), rank ${rk} of ${n}.`}
  if(K==='yield'){$('#headline').innerHTML=`Ten-year yields: <em>${f2(low.v)}%</em> in ${low.name}, <em>${f2(top.v)}%</em> in ${top.name}.`;
    $('#dek').innerHTML=`${n} government bond markets connected. Median ${f2(med)}%. Indonesia <b>${f2(idn.v)}%</b> (${idn.per}${idn.stale?', flagged outdated':''}), rank ${rk} of ${n}.`}
  $('#legend').innerHTML=IND[K].bins.map(b=>`<span><i class="sw" data-css="background:${b[2]}"></i>${b[3]}</span>`).join('')+`<span><i class="sw hatch"></i>outdated (app flag)</span><span><i class="sw" data-css="background:var(--land)"></i>no connected series</span>`;
}
function schedule(){
  const R=ranked(K),q=$('#find').value.trim().toLowerCase(),lo=Math.min(0,...R.map(r=>r.v)),hi=Math.max(...R.map(r=>r.v));
  $('#schedk').textContent=`Schedule · ${R.length} economies · ${IND[K].t.toLowerCase()}`;
  $('#rows').innerHTML=R.map((r,i)=>q&&!r.name.toLowerCase().includes(q)?'':`<div class="row ${r.iso===SEL?'sel':''}" data-iso="${r.iso}"><span class="rk">${i+1}</span><span class="nm">${r.name}</span><span class="vl ${r.v<0?'dn':''}">${f2(r.v)}</span><span class="bar"><i class="${r.stale?'h':''}" data-css="left:${(Math.min(0,r.v)-lo)/(hi-lo)*100}%;width:${Math.max(1.5,Math.abs(r.v)/(hi-lo)*100)}%;background:${colour(K,r.v)}"></i></span></div>`).join('');
  $$('#rows .row').forEach(el=>el.onclick=()=>select(el.dataset.iso,true));
}

/* ---------- dossier ---------- */
const Q=s=>/^\d{4}-(01|04|07|10)$/.test(s);
function perLabel(d,freq){if(freq==='Q'||freq==='q')return `${d.slice(0,4)}-Q${(+d.slice(5,7)+2)/3}`;return d}
function chart(id,k,ind){
  const h=ind.hist||[];if(h.length<2)return `<div class="src">No history series in the snapshot.</div>`;
  return `<svg class="spark" id="sp-${id}" data-k="${k}"></svg><div class="ro" id="ro-${id}"></div><div class="src">History: ${ind.histSrc} (${ind.histId}) · ${h.length} observations since ${h[0][0]}${ind.v!=null&&ind.per?` · ● latest: ${ind.src}, ${ind.per}`:''}</div>`;
}
function drawChart(el,ind){
  const h=ind.hist,W=Math.max(240,el.clientWidth),H=88,L=2,R=W-44,T=8,B=H-16;el.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const latestNewer=ind.per&&Number.isFinite(ind.v)&&(ind.per.slice(0,7).replace(/-Q(\d)/,(m,q)=>'-'+String((q-1)*3+1).padStart(2,'0'))>h.at(-1)[0]);
  const vals=h.map(p=>p[1]).concat(latestNewer?[ind.v]:[]),mn=Math.min(...vals,0>Math.min(...vals)?0:Infinity),mx=Math.max(...vals),pad=(mx-mn)*.1||1,lo=mn-pad,hi=mx+pad;
  const n=h.length+(latestNewer?1:0),X=i=>L+(R-L)*i/(n-1),Y=v=>B-(B-T)*(v-lo)/(hi-lo);
  const d=h.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');
  let s=`<path class="a" d="${d} L${X(h.length-1)} ${B} L${X(0)} ${B}Z"/>`;
  if(lo<0&&hi>0)s+=`<line class="z" x1="${L}" x2="${R}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  s+=`<path class="l" d="${d}"/>`;
  s+=`<text x="${R+6}" y="${Y(mx)+3}">${f2(mx)}</text><text x="${R+6}" y="${Y(Math.min(...vals))+3}">${f2(Math.min(...vals))}</text>`;
  s+=`<text x="${L}" y="${H-2}">${h[0][0].slice(0,4)}</text><text x="${R}" y="${H-2}" text-anchor="end">${(latestNewer?ind.per:h.at(-1)[0]).slice(0,7)}</text>`;
  const lx=latestNewer?X(n-1):X(h.length-1),ly=Number.isFinite(ind.v)?Y(ind.v):Y(h.at(-1)[1]);
  if(latestNewer)s+=`<line class="j" x1="${X(h.length-1)}" y1="${Y(h.at(-1)[1])}" x2="${lx}" y2="${ly}"/>`;
  if(Number.isFinite(ind.v))s+=`<circle cx="${lx}" cy="${ly}" r="3.6" fill="var(--focus)"/>`;
  s+=`<line class="xh" y1="${T}" y2="${B}"/>`;el.innerHTML=s;
  const xh=el.querySelector('.xh'),ro=document.getElementById(el.id.replace('sp-','ro-'));
  el.onpointermove=e=>{const r=el.getBoundingClientRect(),i=Math.round(Math.min(1,Math.max(0,((e.clientX-r.left)/r.width*W-L)/(R-L)))*(n-1));
    xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.style.opacity=.45;
    ro.innerHTML=i<h.length?`${perLabel(h[i][0],ind.histFreq)} · <b>${f2(h[i][1])}%</b> · ${ind.histSrc}`:`${ind.per} · <b>${f2(ind.v)}%</b> · ${ind.src} (latest)`};
  el.onpointerleave=()=>{xh.style.opacity=0;ro.textContent=''};
}
function dossier(iso){
  const c=C[iso],nm=names[iso]||iso,el=$('#dossier');
  if(!c){el.innerHTML=`<div class="kicker">Dossier · ${iso}</div><h2>${nm}</h2><p class="empty">No connected macro series for ${nm} in the Office snapshot. The map shows it for geography only.</p>`;return}
  const avail=['gdp','cpi','policy','yield'].filter(k=>has(iso,k));
  const lines=[];
  if(has(iso,'gdp'))lines.push(`real GDP ${c.gdp.v>=0?'grew':'shrank'} ${f2(Math.abs(c.gdp.v))}% year on year (${c.gdp.per})`);
  if(has(iso,'cpi'))lines.push(`inflation ${f2(c.cpi.v)}% (${c.cpi.per})`);
  if(has(iso,'policy'))lines.push(`policy rate ${f2(c.policy.v)}%`);
  let html=`<div class="kicker">Dossier · ${iso} · ${avail.length} of 4 indicators connected</div><h2>${nm}</h2><p class="lead">${lines.length?lines.join(', ').replace(/^./,m=>m.toUpperCase())+'.':''}</p>`;
  for(const k of ['gdp','cpi','policy','yield']){
    const ind=c[k];
    if(!has(iso,k)){html+=`<div class="ind none"><div class="ind-head"><span class="t">${IND[k].t}</span></div><div class="ind-val"><b>No connected series</b></div></div>`;continue}
    const R=ranked(k),rk=R.findIndex(r=>r.iso===iso)+1,med=median(R),diff=ind.v-med;
    ind.histFreq=(k==='gdp'&&(ind.histId.includes('-gdp')))?'Q':'M';
    html+=`<div class="ind"><div class="ind-head"><span class="t">${IND[k].t}</span><span class="rank">rank ${rk} of ${R.length} · ${diff>=0?'+':'−'}${f2(Math.abs(diff))} pp vs median ${f2(med)}%</span></div>
      <div class="ind-val"><b class="num ${k==='gdp'&&ind.v<0?'dn':''}">${f2(ind.v)}%</b><span>${IND[k].u} · ${ind.per}${ind.f==='A'?' (annual)':''} · ${ind.src}${ind.stale?' · <span class="stale">outdated</span>':''}</span></div>${chart(iso+k,k,ind)}</div>`;
  }
  if(c.wdi){const W=c.wdi,cell=(t,o,u)=>o?`<div><small>${t}</small><strong>${o.v}${u}</strong> <em>${o.year}</em></div>`:'';
    html+=`<div class="wdi">${cell('Unemployment',W.unemployment,'%')}${cell('Current account',W.currentAccount,'% GDP')}${cell('Reserves',W.reserves,' bn USD')}</div><div class="src" data-css="margin-top:6px">Annual structure: World Bank WDI</div>`}
  if(window.cycleChip)html+=window.cycleChip(iso);
  el.innerHTML=html;
  for(const k of ['gdp','cpi','policy','yield']){const s=document.getElementById('sp-'+iso+k);if(s)drawChart(s,c[k])}
}

function select(iso,focus){
  SEL=iso;for(const [i,p] of Object.entries(paths))p.classList.toggle('sel',i===iso);
  svg.classList.add('dim');$$('#rows .row').forEach(r=>r.classList.toggle('sel',r.dataset.iso===iso));
  if(focus)focusCountry(iso);dossier(iso);if(window.setCycle)window.setCycle(iso);
  if(innerWidth<1100&&focus)$('#dossier').scrollIntoView({behavior:'smooth',block:'start'});
}
window.selectEconomy=select;
function setK(k){K=k;$$('#indseg button').forEach(b=>b.classList.toggle('on',b.dataset.i===k));paint();headline();schedule()}
$$('#indseg button').forEach(b=>b.onclick=()=>setK(b.dataset.i));
$('#find').oninput=schedule;
const themeWatch=new MutationObserver(()=>{if(!svg.isConnected){themeWatch.disconnect();return}if(SEL)dossier(SEL)});themeWatch.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
let rz;listen(window,'resize',()=>{clearTimeout(rz);rz=setTimeout(()=>dossier(SEL),150)});

setK('gdp');
// in the Office the URL hash is the route; a country is chosen on the map, the schedule or the comparison table
select('IDN',false);
}
