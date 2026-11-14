// The Overview's architectural model: a Blender render of the office with four rooms, each linked to its workspace.
// The 60-frame assembly plays once per browser session (Replay assembly plays it again), and never under reduced
// motion. Positions are set through the CSSOM (element.style), which the Pages CSP allows; no inline style markup.
const ROOMS=[
 {key:'research',no:'03',title:'Library',route:'#quant',left:0,top:.06,side:'l'},
 {key:'records',no:'04',title:'Archive',route:'#records',left:.8,top:.1,side:'r'},
 {key:'screen',no:'01',title:'Trading floor',route:'#markets',left:0,top:.72,side:'l'},
 {key:'portfolio',no:'02',title:'Vault',route:'#portfolios',left:.8,top:.8,side:'r'}];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=name=>new URL('./model/'+name,import.meta.url).href;
const manifests={};
const theme=()=>document.documentElement.dataset.theme==='dark'?'dark':'light';
async function manifest(mode){
 if(!manifests[mode])manifests[mode]=fetch(asset('build-'+mode+'.json'),{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Model unavailable');return r.json();}).then(m=>{
  const ok=Array.isArray(m.files)&&m.files.length>0&&m.files.length<=120&&m.files.every(f=>/^build-(light|dark)-\d{2}\.webp$/.test(f))&&/^build-(light|dark)-final\.webp$/.test(m.final)&&Number.isFinite(m.fps)&&m.fps>0&&m.fps<=120&&m.anchors&&ROOMS.every(r=>Array.isArray(m.anchors[r.key]));
  if(!ok)throw Error('Invalid model manifest');m.images=null;return m;});
 return manifests[mode];
}
export function deskModelMarkup(subtitles){
 return `<div class="desk-viewer" data-desk-viewer><img class="desk-model-image" alt="Architectural model of Longhand Office with four rooms: trading floor, vault, library and archive"><canvas class="desk-model-build" aria-hidden="true"></canvas><svg class="desk-leaders" viewBox="0 0 1000 667" preserveAspectRatio="none" aria-hidden="true"></svg>${ROOMS.map(r=>`<a class="desk-callout${r.side==='r'?' right':''}" href="${r.route}" data-room="${r.key}"><span class="desk-callout-no">${r.no}</span><b>${r.title}</b><span class="desk-callout-sub" data-room-sub="${r.key}">${esc(subtitles[r.key]||'')}</span></a>`).join('')}</div><div class="desk-modelbar"><span class="desk-kicker">Model · front elevation · Blender, Cycles</span><button type="button" class="desk-replay" data-desk-replay>Replay assembly</button></div>`;
}
export function mountDeskModel(root){
 const viewer=root.querySelector('[data-desk-viewer]');if(!viewer)return ()=>{};
 const img=viewer.querySelector('.desk-model-image'),canvas=viewer.querySelector('.desk-model-build'),svg=viewer.querySelector('.desk-leaders'),replay=root.querySelector('[data-desk-replay]'),callouts=[...viewer.querySelectorAll('.desk-callout')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let current=null,playing=false,drawn=false,stopped=false;
 callouts.forEach(el=>{const r=ROOMS.find(x=>x.key===el.dataset.room);if(r.side==='r')el.style.right='0';else el.style.left=(r.left*100)+'%';el.style.top=(r.top*100)+'%';
  el.addEventListener('pointerenter',()=>highlight(r.key,true));el.addEventListener('pointerleave',()=>highlight(r.key,false));el.addEventListener('focus',()=>highlight(r.key,true));el.addEventListener('blur',()=>highlight(r.key,false));});
 function highlight(key,on){svg.querySelectorAll('g').forEach(g=>g.classList.toggle('hi',on&&g.dataset.room===key));callouts.forEach(c=>c.classList.toggle('hi',on&&c.dataset.room===key));}
 function leaders(){
  if(!current||!viewer.isConnected)return;const w=viewer.clientWidth,h=viewer.clientHeight;if(!w||!h)return;
  svg.innerHTML=callouts.map(el=>{const r=ROOMS.find(x=>x.key===el.dataset.room),a=current.anchors[r.key],ax=a[0]*1000,ay=a[1]*667,small=el.offsetWidth<40;
   const ex=(small?el.offsetLeft+el.offsetWidth/2:r.side==='l'?el.offsetLeft+el.offsetWidth:el.offsetLeft)/w*1000,ey=(small?el.offsetTop+el.offsetHeight/2:el.offsetTop+el.offsetHeight)/h*667;
   return `<g data-room="${r.key}"><line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="4.5"/></g>`;}).join('');
  svg.querySelectorAll('line').forEach(line=>{const len=Math.hypot((line.x2.baseVal.value-line.x1.baseVal.value)*w/1000,(line.y2.baseVal.value-line.y1.baseVal.value)*h/667)+20;line.style.setProperty('--len',String(Math.round(len)));});
  svg.classList.toggle('drawn',drawn);
 }
 function showFinal(){const src=asset(current.final);if(img.src!==src)img.src=src;img.classList.add('ready');leaders();}
 const within=(promise,ms,fallback)=>Promise.race([promise,new Promise(r=>setTimeout(()=>r(fallback),ms))]);
 const ready=im=>within((im.complete&&im.naturalWidth?Promise.resolve(true):new Promise(r=>{im.addEventListener('load',()=>r(true),{once:true});im.addEventListener('error',()=>r(false),{once:true});})).then(ok=>ok&&within(im.decode().then(()=>true,()=>true),400,true)),8000,false);
 // Playback waits for every frame, is timed by the clock (a slow device drops frames rather than stuttering) and always
 // ends on the finished model.
 async function assemble(){
  if(playing||!current||document.hidden)return;playing=true;replay.disabled=true;callouts.forEach(c=>c.classList.remove('show'));svg.classList.add('fade');
  try{
   const m=current,images=m.images||(m.images=m.files.map(f=>{const im=new Image();im.decoding='async';im.src=asset(f);return im;})),n=images.length,ctx=canvas.getContext('2d'),box=viewer.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
   canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);ctx.imageSmoothingQuality='high';
   const draw=i=>{const im=images[i];if(!im.naturalWidth)return;const s=Math.min(canvas.width/im.naturalWidth,canvas.height/im.naturalHeight),w=im.naturalWidth*s,h=im.naturalHeight*s;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(im,(canvas.width-w)/2,(canvas.height-h)/2,w,h);};
   if(await ready(images[0])){draw(0);canvas.classList.add('on');img.classList.remove('ready');}
   if(await within(Promise.all(images.map(ready)).then(x=>x.every(Boolean)),8000,false)&&!stopped){
    const ms=1000/m.fps*n;await new Promise(done=>{let last=-1,finished=false;const t0=performance.now(),end=()=>{if(finished)return;finished=true;draw(n-1);done();};
     const tick=()=>{if(finished)return;const i=Math.min(n-1,Math.floor((performance.now()-t0)/ms*n));if(i!==last){draw(i);last=i;}if(i>=n-1){clearInterval(timer);end();}};
     const loop=()=>{tick();if(!finished)requestAnimationFrame(loop);},timer=setInterval(tick,16);requestAnimationFrame(loop);setTimeout(()=>{clearInterval(timer);end();},ms+800);});
   }
  }finally{
   showFinal();await new Promise(r=>setTimeout(r,60));canvas.classList.remove('on');playing=false;replay.disabled=false;svg.classList.remove('fade');
   drawn=true;leaders();callouts.forEach((c,i)=>setTimeout(()=>c.classList.add('show'),reduce?0:120+i*100));
  }
 }
 async function load(){
  try{current=await manifest(theme());}catch{viewer.classList.add('unavailable');replay.hidden=true;callouts.forEach(c=>c.classList.add('show'));return;}
  if(stopped)return;
  let seen=false;try{seen=sessionStorage.getItem('longhand-model-assembled')==='1';}catch{}
  if(reduce||seen){showFinal();drawn=true;leaders();callouts.forEach(c=>c.classList.add('show'));return;}
  try{sessionStorage.setItem('longhand-model-assembled','1');}catch{}
  await assemble();
 }
 replay.addEventListener('click',()=>assemble());
 const sizing=new ResizeObserver(()=>leaders());sizing.observe(viewer);
 const themeWatch=new MutationObserver(async()=>{if(playing)return;try{current=await manifest(theme());if(!stopped)showFinal();}catch{}});themeWatch.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 load();
 return ()=>{stopped=true;sizing.disconnect();themeWatch.disconnect();};
}
export function setRoomSubtitle(root,key,text){const el=root.querySelector(`[data-room-sub="${key}"]`);if(el)el.textContent=text;}
