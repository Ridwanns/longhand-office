"""Overview: replace the orbit turntable with a fixed front view that assembles itself once (Blender build sequence)."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
p = os.path.join(D, 'index.html'); s = open(p, encoding='utf-8').read()

def swap(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)

swap('<div class="viewer" id="viewer" aria-label="Model of the office. Drag to orbit.">',
     '<div class="viewer" id="viewer" aria-label="Model of the office with four rooms.">')
swap('<img id="frame2" alt="" aria-hidden="true">', '<canvas id="build" aria-hidden="true"></canvas>')
a = s.index('<div class="orbit">'); b = s.index('<div class="titleblock glass">')
s = s[:a] + '<div class="modelbar"><span class="kicker">Model · front elevation · Blender 5.3</span><button type="button" class="replay" id="replay">Replay assembly</button></div>\n    ' + s[b:]
swap('.viewer{position:relative;aspect-ratio:3/2;cursor:grab;touch-action:pan-y;user-select:none}',
     '.viewer{position:relative;aspect-ratio:3/2;user-select:none}\n#build{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .35s}\n#build.on{opacity:1;transition:none}\n.modelbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:6px 6px 0}\n.modelbar .replay{height:28px;padding:0 12px;border:1px solid var(--rule);border-radius:4px;background:transparent;font:500 12px var(--body);color:var(--ink2);cursor:pointer;transition:border-color .2s,color .2s}\n.modelbar .replay:hover{border-color:var(--ink2);color:var(--ink)}\n.modelbar .replay:disabled{opacity:.45;cursor:default}')
swap('#frame2{transition:none;opacity:0}', '')

a = s.index("const viewer=$('#viewer'),img=$('#frame')"); b = s.index("function open(c){")
s = s[:a] + r'''const viewer=$('#viewer'),img=$('#frame'),svg=$('#leaders'),room=$('#room'),cv=$('#build'),ctx=cv.getContext('2d');
let theme,FR={light:null,dark:null},BU={},drawn=false,playing=false;
const FRONT=6; // the front camera of the model set
CALL.forEach(c=>{const el=document.createElement('div');el.className='callout glass';el.dataset.k=c.k;
  el.innerHTML=`<div class="no">${c.no}</div><b>${c.t}</b><span>${c.s}</span>`;
  if(c.side==='r')el.style.right='0';else el.style.left=(c.lx*100)+'%';el.style.top=(c.ly*100)+'%';viewer.appendChild(el);c.el=el;
  el.onmouseenter=()=>hi(c.k,true);el.onmouseleave=()=>hi(c.k,false);el.onclick=()=>open(c)});
function hi(k,on){$$('.leaders g').forEach(g=>g.classList.toggle('hi',on&&g.dataset.k===k));$$('.callout').forEach(e=>e.classList.toggle('hi',on&&e.dataset.k===k))}
const anchors=()=>FR[theme].frames[FRONT].anchors;
function leaders(){
  if(!FR[theme])return;const a=anchors(),vw=viewer.clientWidth,vh=viewer.clientHeight;
  svg.innerHTML=CALL.map(c=>{const el=c.el,ax=a[c.k][0]*1000,ay=a[c.k][1]*667;
    const ex=(c.side==='l'?(el.offsetLeft+el.offsetWidth):el.offsetLeft)/vw*1000,ey=(el.offsetTop+el.offsetHeight/2)/vh*667;
    const len=Math.hypot((ax-ex)*vw/1000,(ay-ey)*vh/667)+20;
    return `<g data-k="${c.k}"><line style="--len:${len}" x1="${ex}" y1="${ey}" x2="${ax}" y2="${ay}"/><circle cx="${ax}" cy="${ay}" r="4.5"/></g>`}).join('');
  if(drawn){svg.classList.add('drawn');svg.querySelectorAll('line').forEach(l=>l.style.strokeDashoffset=0);svg.querySelectorAll('circle').forEach(c=>c.style.opacity=1)}
}
function vaultCrop(){const v=$('#vaultimg'),f=FR[theme].frames[FRONT],a=f.anchors.portfolio,box=v.parentElement.clientWidth,w=box*4,h=w*2/3;
  v.src='frames/'+f.file;v.style.left=(box/2-(a[0]+.035)*w)+'px';v.style.top=(box/2-(a[1]-.075)*h)+'px'}
function show(){const f='frames/'+FR[theme].frames[FRONT].file;if(!img.src.endsWith(f))img.src=f;vaultCrop();leaders()}
async function load(t){if(!FR[t])FR[t]=await (await fetch('frames/'+t+'.json')).json()}
async function loadBuild(t){
  if(!BU[t]){try{const j=await (await fetch('frames/build-'+t+'.json')).json();BU[t]={j,imgs:j.files.map(f=>{const im=new Image();im.src='frames/'+f;return im})}}catch(e){BU[t]=null}}
  return BU[t];
}
// the assembly: every frame decoded first, then drawn by elapsed time so a slow device skips frames instead of stalling
async function assemble(){
  if(playing)return;const b=await loadBuild(theme);if(!b)return;
  const ok=await Promise.race([Promise.all(b.imgs.map(i=>i.decode().then(()=>true,()=>false))).then(r=>r.every(Boolean)),new Promise(r=>setTimeout(()=>r(false),4000))]);
  if(!ok)return;playing=true;$('#replay').disabled=true;
  const r=viewer.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);
  const draw=i=>{const im=b.imgs[i],s=Math.min(cv.width/im.naturalWidth,cv.height/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(im,(cv.width-w)/2,(cv.height-h)/2,w,h)};
  draw(0);cv.classList.add('on');img.classList.remove('ready');
  const n=b.imgs.length,ms=1000/b.j.fps*n,t0=performance.now();
  await new Promise(done=>{let last=-1;const tick=()=>{const i=Math.min(n-1,Math.floor((performance.now()-t0)/ms*n));if(i!==last){draw(i);last=i}
      if(i>=n-1){clearInterval(iv);done()}};const iv=setInterval(tick,16);});
  img.classList.add('ready');await new Promise(r=>setTimeout(r,60));cv.classList.remove('on');playing=false;$('#replay').disabled=false;
}
async function setTheme(t){
  theme=t;document.documentElement.dataset.theme=t;
  $('#ticon').innerHTML=t==='dark'?'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>':'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>';
  try{localStorage.setItem('lh-theme',t)}catch(e){}
  await load(t);show();render();feature();
}
addEventListener('resize',()=>{leaders();curve();feature();if(FR[theme])vaultCrop()});
$('#replay').onclick=async()=>{CALL.forEach(c=>c.el.classList.remove('show'));svg.classList.add('fade');await assemble();svg.classList.remove('fade');CALL.forEach((c,i)=>setTimeout(()=>c.el.classList.add('show'),120+i*90))};
''' + s[b:]
a = s.index("addEventListener('keydown',e=>{if(e.key==='Escape')room.classList.remove('show');if(e.key==='ArrowLeft')")
b = s.index('\n', a)
s = s[:a] + "addEventListener('keydown',e=>{if(e.key==='Escape')room.classList.remove('show')});" + s[b:]
a = s.index('// intro: one orbit sweep'); b = s.index('})();', a) + len('})();')
s = s[:a] + r'''// intro: the model assembles once (board, ground floor, columns, upper floor, trees), then leaders draw, then callouts
(async()=>{
  let t='light';try{t=localStorage.getItem('lh-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}
  curve();feature();await setTheme(t);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce)await assemble();
  img.classList.add('ready');
  drawn=true;svg.classList.add('drawn');leaders();
  CALL.forEach((c,i)=>setTimeout(()=>c.el.classList.add('show'),reduce?0:200+i*110));
})();''' + s[b:]
s = s.replace('.viewer.drag{cursor:grabbing}\n', '')
open(p, 'w', encoding='utf-8').write(s)
print('ok', 'orbit' in s.split('<script')[0][-3000:])
