// Navigation-only UI. No portfolio data or account credentials are accessed here.
const paths={office:'M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7M9 9h.01M15 9h.01',market:'M4 19V5M4 19h16M7 14l4-4 4 2 5-7',macro:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18',bonds:'M5 4h14v16H5zM8 8h8M8 12h5M8 16h8',commodity:'M5 7l7-4 7 4v10l-7 4-7-4zM5 7l7 4 7-4M12 11v10',portfolio:'M3 8h18v12H3zM8 8V4h8v4M3 13h18M10 13v3h4v-3',real:'M4 20h16M6 20V9h4v11M14 20V4h4v16',thesis:'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6',journal:'M4 4h16v17H4zM8 4v17M11 9h6M11 13h5',quant:'M4 19V5M4 19h16M7 15l3-4 4 2 6-8M7 7h.01',library:'M3 5h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 7v15',records:'M4 5h16v4H4zM6 9v12h12V9M10 13h4'};
const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]||paths.office}"/></svg>`;
export const WORKSPACE_PAGES=[
 {group:'Workspace',label:'The Office',route:'#overview',icon:'office'},
 {group:'Market data',label:'US stocks',route:'#market/us',icon:'market'},
 {group:'Market data',label:'Indonesian stocks',route:'#market/idx',icon:'market'},
 {group:'Market data',label:'Macro monitor',route:'#market/macro',icon:'macro'},
 {group:'Market data',label:'Bonds',route:'#market/bonds',icon:'bonds'},
 {group:'Market data',label:'Commodities',route:'#market/commodities',icon:'commodity'},
 {group:'Investment',label:'Paper portfolios',route:'#portfolios',icon:'portfolio'},
 {group:'Investment',label:'Real portfolios',route:'#portfolios/real',icon:'real'},
 {group:'Investment',label:'Investment theses',route:'#theses',icon:'thesis'},
 {group:'Investment',label:'Decision journal',route:'#decisions',icon:'journal'},
 {group:'Research',label:'Quant Lab',route:'#quant',icon:'quant'},
 {group:'Research',label:'Research Library',route:'#library',icon:'library'},
 {group:'Your workspace',label:'Records & backups',route:'#records',icon:'records'}
];
const sidebar=document.querySelector('#office-sidebar'),menu=document.querySelector('#office-menu'),finder=document.querySelector('#page-finder'),input=document.querySelector('#page-finder-input'),results=document.querySelector('#page-finder-results'),mobile=matchMedia('(max-width: 1000px)');
const nav=document.querySelector('#office-navigation');
if(nav){let last='';nav.innerHTML=WORKSPACE_PAGES.map(p=>{const heading=p.group!==last?`<p class="office-nav-group">${p.group}</p>`:'';last=p.group;return heading+`<a href="${p.route}" title="${p.label}">${icon(p.icon)}<span>${p.label}</span></a>`;}).join('');}
function currentPage(route,portfolioMode){if(route==='market')return WORKSPACE_PAGES.find(p=>p.route==='#market/us');if(route.startsWith('portfolio/'))return WORKSPACE_PAGES.find(p=>p.route===(portfolioMode==='real'?'#portfolios/real':'#portfolios'));const hash='#'+route;return WORKSPACE_PAGES.find(p=>p.route===hash)||WORKSPACE_PAGES.find(p=>p.route==='#market/'+route.split('/')[1]&&route.startsWith('market/'))||WORKSPACE_PAGES.find(p=>p.route==='#quant'&&route.startsWith('quant/'))||WORKSPACE_PAGES.find(p=>p.route==='#portfolios'&&route.startsWith('portfolio/'))||WORKSPACE_PAGES[0];}
export function syncWorkspaceShell(route=location.hash.slice(1)||'overview',portfolioMode=null){
 const page=currentPage(route,portfolioMode);document.querySelectorAll('#office-navigation a').forEach(a=>{if(a.hash===page.route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const label=document.querySelector('#office-location');if(label)label.textContent=page.label;const group=document.querySelector('#office-location-group');if(group)group.textContent=page.group;
}
function setMenu(open,restoreFocus=true){if(!sidebar||!menu)return;const expanded=mobile.matches&&open;document.body.classList.toggle('office-menu-open',expanded);menu.setAttribute('aria-expanded',String(expanded));sidebar.inert=mobile.matches&&!expanded;if(expanded){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.querySelector('a[aria-current]')?.focus();}else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(restoreFocus&&mobile.matches)menu.focus();}}
function renderResults(){const q=input.value.trim().toLowerCase(),pages=WORKSPACE_PAGES.filter(p=>(p.group+' '+p.label).toLowerCase().includes(q));results.innerHTML=pages.map(p=>`<a href="${p.route}">${icon(p.icon)}<span>${p.label}<small>${p.group}</small></span><b aria-hidden="true">↗</b></a>`).join('')||'<p>No matching page. Try “Macro”, “Paper” or “Journal”.</p>';document.querySelector('#page-finder-status').textContent=pages.length+' destinations';}
function openFinder(){if(!finder||finder.open||document.querySelector('dialog[open]:not(#page-finder)'))return;setMenu(false,false);input.value='';renderResults();finder.showModal();input.focus();}
document.addEventListener('click',e=>{if(e.target.closest('#office-menu'))setMenu(!document.body.classList.contains('office-menu-open'));if(e.target.closest('[data-office-menu-close]'))setMenu(false);if(e.target.closest('#office-search'))openFinder();if(e.target.closest('#page-finder-close'))finder.close();if(e.target.closest('#page-finder-results a'))finder.close();const destination=e.target.closest('#office-sidebar a');if(destination){setMenu(false,false);if(mobile.matches&&destination.hash===location.hash)document.querySelector('#main')?.focus({preventScroll:true});}});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openFinder();}
 if(e.key==='Escape'&&finder?.open){e.preventDefault();finder.close();return;}
 if(e.key==='Escape'&&document.body.classList.contains('office-menu-open')){e.preventDefault();setMenu(false);}
 if(e.key==='Tab'&&document.body.classList.contains('office-menu-open')){const items=[...sidebar.querySelectorAll('a,button')].filter(e=>e.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.key==='Tab'&&finder?.open){const items=[...finder.querySelectorAll('input,a,button')].filter(e=>e.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.key==='ArrowDown'&&finder?.open&&document.activeElement===input){e.preventDefault();results.querySelector('a')?.focus();}
 if(e.key==='Enter'&&finder?.open&&document.activeElement===input){const links=results.querySelectorAll('a');if(links.length===1){e.preventDefault();links[0].click();}}
});
input?.addEventListener('input',renderResults);finder?.addEventListener('close',()=>document.querySelector('#office-search')?.focus());
mobile.addEventListener('change',()=>setMenu(false,false));window.addEventListener('hashchange',()=>{setMenu(false,false);syncWorkspaceShell();});setMenu(false,false);syncWorkspaceShell();
