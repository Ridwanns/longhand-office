import {writeFile,readFile} from 'node:fs/promises';
const P=(u,v,z=0)=>[450+(u-v)*.86,130+(u+v)*.40-z];
const points=a=>a.map(p=>P(...p).join(',')).join(' ');
const poly=(a,fill,extra='')=>`<polygon points="${points(a)}" fill="${fill}" ${extra}/>`;
let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" role="img" aria-labelledby="office-title"><title id="office-title">Longhand Office — a stone and glass courtyard building. Choose a labelled room to enter.</title><defs><filter id="shadow"><feGaussianBlur stdDeviation="14"/></filter><pattern id="stone" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#d5cebc"/><circle cx="2" cy="3" r=".45" fill="#bcb5a3"/></pattern></defs>`;
s+=poly([[-35,-35,-8],[395,-35,-8],[395,395,-8],[-35,395,-8]],'#aea48c','opacity=".19" filter="url(#shadow)"');
s+=poly([[-30,-30,-4],[390,-30,-4],[390,390,-4],[-30,390,-4]],'#e7e2d3');
// A low garden wall and a sunken central court.
s+=poly([[95,95,1],[265,95,1],[265,265,1],[95,265,1]],'#b6b6a0');
s+=poly([[107,107,2],[253,107,2],[253,253,2],[107,253,2]],'#ded8c8');
for(let n=120;n<250;n+=26)s+=`<path d="M${P(n,107,3)} L${P(n,253,3)} M${P(107,n,3)} L${P(253,n,3)}" stroke="#c5beab" stroke-width=".8"/>`;
s+=poly([[153,153,4],[210,153,4],[210,210,4],[153,210,4]],'#7a8877');
s+=poly([[161,161,5],[202,161,5],[202,202,5],[161,202,5]],'#a9b7ab');
const rooms=[{u:0,v:0,w:180,d:95,z:76,name:'Library',route:'library',desc:'Published Longhand Research',color:'#e1daca'}, {u:180,v:0,w:180,d:95,z:76,name:'Governance',route:null,desc:'Family policies and approvals · Planned',color:'#ded8c9'}, {u:265,v:95,w:95,d:265,z:76,name:'Treasury',route:null,desc:'Assets, liabilities and liquidity · Planned',color:'#d9d3c3'}, {u:0,v:95,w:95,d:265,z:76,name:'Investment Lab',route:'portfolios',desc:'Paper portfolios and investment theses',color:'#e9e1cf'}, {u:95,v:265,w:170,d:95,z:76,name:'Decision Room',route:'decisions',desc:'Investment journal and outcome reviews',color:'#e6deca'}];
for(const r of rooms){const {u,v,w,d,z}=r;s+=`<g class="office-room ${r.route?'available':'planned'}" data-purpose="${r.name} — ${r.desc}" ${r.route?'':`tabindex="0" aria-label="${r.name}: ${r.desc}"`}>${r.route?`<a href="#${r.route}" aria-label="${r.name}: ${r.desc}">`:''}<title>${r.desc}</title>`;
s+=poly([[u+w,v,0],[u+w,v+d,0],[u+w,v+d,z],[u+w,v,z]],'#b8ad96');
s+=poly([[u,v+d,0],[u+w,v+d,0],[u+w,v+d,z],[u,v+d,z]],'url(#stone)');
// Recessed glazing, stone piers and bronze mullions.
for(let x=u+9;x<u+w-8;x+=24){s+=poly([[x,v+d+.2,17],[Math.min(x+16,u+w-6),v+d+.2,17],[Math.min(x+16,u+w-6),v+d+.2,58],[x,v+d+.2,58]],'#56645e','class="window"');s+=poly([[x+2,v+d+.3,20],[x+6,v+d+.3,20],[x+6,v+d+.3,55],[x+2,v+d+.3,55]],'#a9b6a6','opacity=".42"');}
for(let y=v+9;y<v+d-8;y+=24)s+=poly([[u+w+.2,y,17],[u+w+.2,Math.min(y+16,v+d-6),17],[u+w+.2,Math.min(y+16,v+d-6),58],[u+w+.2,y,58]],'#626e65','class="window"');
s+=poly([[u,v,z],[u+w,v,z],[u+w,v+d,z],[u,v+d,z]],r.color,'class="roof" stroke="#c3baa5" stroke-width="1"');
s+=poly([[u+6,v+6,z+1],[u+w-6,v+6,z+1],[u+w-6,v+d-6,z+1],[u+6,v+d-6,z+1]],'none','stroke="#c8bfaa" stroke-width="1"');
if(r.route)s+='</a>';s+='</g>';}
// Olive trees in the courtyard and along the approach.
for(const [u,v] of [[125,125],[235,235],[-8,275],[375,145],[-8,335]]){let [x,y]=P(u,v,0);s+=`<path d="M${x},${y} v-34" stroke="#756e55" stroke-width="3"/><ellipse cx="${x}" cy="${y-39}" rx="19" ry="23" fill="#87917a"/><ellipse cx="${x-7}" cy="${y-44}" rx="12" ry="17" fill="#9aa38a"/><ellipse cx="${x+8}" cy="${y-34}" rx="12" ry="16" fill="#758269"/>`;}
const labels=[['Library','Published research',174,75,'library',275,134],['Governance','Planned',641,73,null,595,122],['Treasury','Planned',820,410,null,720,350],['Investment Lab','Portfolios & theses',125,363,'portfolios',227,322],['Decision Room','Journal & reviews',513,498,'decisions',470,399]];
for(const [name,sub,x,y,route,px,py] of labels){s+=`<g class="room-label" data-purpose="${name} — ${rooms.find(r=>r.name===name).desc}">${route?`<a href="#${route}" aria-label="Open ${name}">`:''}<path d="M${x},${y+15} L${px},${py}" fill="none" stroke="#a79d86"/><circle cx="${px}" cy="${py}" r="3" fill="#8d7955"/><text x="${x}" y="${y}" text-anchor="middle" fill="#393e33" font-family="Georgia, serif" font-size="19">${name}</text><text x="${x}" y="${y+20}" text-anchor="middle" fill="#727464" font-family="Arial,sans-serif" font-size="11" letter-spacing="1">${sub}</text>${route?'</a>':''}</g>`;}
s+=await readFile(new URL('../architecture-details.svg',import.meta.url),'utf8');
s+='</svg>';s=s.replace(/&(?!#\d+;|#x[0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9]+;)/g,'&amp;');await writeFile('building.svg',s);
