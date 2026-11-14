// Sheet 02 Macro: release calendar card. Ported from design/preview/office-ui.js; today is the real date.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function calendar(host){
  if(!host||!window.CALENDAR)return;
  const EV=window.CALENDAR,TODAY=new Date().toISOString().slice(0,10);let Y=+TODAY.slice(0,4),M=+TODAY.slice(5,7)-1,SEL=TODAY;
  // months reachable with the arrows: the span the published calendar covers
  const first=EV.length?EV[0][0]:TODAY,last=EV.length?EV.at(-1)[0]:TODAY,lo=+first.slice(0,4)*12+ +first.slice(5,7)-1,hi=+last.slice(0,4)*12+ +last.slice(5,7)-1;
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
      <div class="cal-list">${SEL===TODAY&&!selEv.length?`<div class="kicker" data-css="margin-bottom:4px">Nothing today · next up</div>${next.map(evHtml).join('')}`:selEv.length?selEv.map(evHtml).join(''):`<div class="src">No release recorded on ${SEL}.</div>`}</div>
      <div class="cal-key"><span><i data-css="background:#4f7f96"></i>US · BLS schedule</span><span><i data-css="background:var(--focus)"></i>Indonesia · BPS / BI releases in the snapshot</span></div>`;
    host.querySelectorAll('.d').forEach(b=>b.onclick=()=>{SEL=b.dataset.k;draw()});
    host.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{const k=Math.min(hi,Math.max(lo,Y*12+M+ +b.dataset.m));Y=Math.floor(k/12);M=k%12;draw()});
  }
  draw();
}
