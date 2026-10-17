import {rememberMarketInstrument,RESEARCH_VIEWS} from './research-layout.js';
// Navigation-only UI. No portfolio data or account credentials are accessed here.
import {WORKSPACES,WORKSPACE_PAGES,navigationState,findDestinations,sectionDestination} from './workspace-navigation.js';
export {WORKSPACE_PAGES} from './workspace-navigation.js';
const paths={office:'M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7M9 9h.01M15 9h.01',market:'M4 19V5M4 19h16M7 14l4-4 4 2 5-7',macro:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18',bonds:'M5 4h14v16H5zM8 8h8M8 12h5M8 16h8',commodity:'M5 7l7-4 7 4v10l-7 4-7-4zM5 7l7 4 7-4M12 11v10',portfolio:'M3 8h18v12H3zM8 8V4h8v4M3 13h18M10 13v3h4v-3',real:'M4 20h16M6 20V9h4v11M14 20V4h4v16',thesis:'M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6',journal:'M4 4h16v17H4zM8 4v17M11 9h6M11 13h5',quant:'M4 19V5M4 19h16M7 15l3-4 4 2 6-8M7 7h.01',library:'M3 5h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 7v15',records:'M4 5h16v4H4zM6 9v12h12V9M10 13h4'};
const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]||paths.office}"/></svg>`;
const sidebar=document.querySelector('#office-sidebar'),menu=document.querySelector('#office-menu'),finder=document.querySelector('#page-finder'),input=document.querySelector('#page-finder-input'),results=document.querySelector('#page-finder-results'),mobile=matchMedia('(max-width: 1000px)');
const nav=document.querySelector('#office-navigation');
const destinationLink=p=>p.action?`<button type="button" data-office-destination="${p.id}">${icon(p.icon)}<span>${p.label}</span></button>`:`<a href="${p.route}" data-office-destination="${p.id}">${icon(p.icon)}<span>${p.label}</span></a>`;
let pendingDestination=null,jumpFrame,finderReturnFocus=true;
export function syncWorkspaceShell(route=location.hash.slice(1)||'overview',portfolioMode=null){
 const {page,workspace}=navigationState(route,portfolioMode);
 // Only replace the navigation when its destination changes; ordinary refreshes keep focus.
 const signature=(workspace?.id||'secondary')+':'+page.id;
 if(nav&&nav.dataset.destination!==signature){nav.dataset.destination=signature;nav.innerHTML='<p class="office-nav-group">WORKSPACES</p><div class="office-primary">'+WORKSPACES.map(w=>`<a href="${w.route}" data-workspace="${w.id}" ${w.id===workspace?.id?'aria-current="page"':''}>${icon(w.icon)}<span>${w.label}</span></a>`).join('')+'</div>'+(workspace&&workspace.id!=='overview'?'<div class="office-context" aria-label="'+workspace.label+' destinations"><p class="office-nav-group">'+workspace.label+'</p>'+WORKSPACE_PAGES.filter(p=>p.group===workspace.label&&!p.finderOnly).map(p=>destinationLink(p).replace('data-office-destination="'+p.id+'"','data-office-destination="'+p.id+'"'+(p.id===page.id?' aria-current="location"':''))).join('')+'</div>':'')+'<div class="office-secondary"><p class="office-nav-group">YOUR WORKSPACE</p>'+WORKSPACE_PAGES.filter(p=>p.group==='Workspace').map(p=>destinationLink(p).replace('data-office-destination="'+p.id+'"','data-office-destination="'+p.id+'"'+(p.id===page.id?' aria-current="location"':''))).join('')+'<details class="office-preferences"><summary>Preferences</summary>'+WORKSPACE_PAGES.filter(p=>p.group==='Preferences').map(destinationLink).join('')+'</details></div>';}
 const label=document.querySelector('#office-location');if(label)label.textContent=route.startsWith('quant')&&document.querySelector('.research-lab')?.dataset.labView?RESEARCH_VIEWS[document.querySelector('.research-lab').dataset.labView]:page.label;const group=document.querySelector('#office-location-group');if(group)group.textContent=workspace?.label||'Workspace';
}
// Uses the existing Quant navigator. No model request, storage write or replacement run.
export function mountWorkspaceDestination(route){
 cancelAnimationFrame(jumpFrame);
 const destination=pendingDestination?.route==='#'+route?pendingDestination:sectionDestination(route);pendingDestination=null;
 if(!destination)return;
 jumpFrame=requestAnimationFrame(()=>{
  if(location.hash.slice(1)!==route)return;
  if(destination.section)document.querySelector('[data-quant-jump="'+destination.section+'"]')?.click();
  if(destination.target){const target=document.querySelector(destination.target);if(target){if(!target.hasAttribute('tabindex'))target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'});}}
  syncWorkspaceShell(destination.route.slice(1));
 });
}
function setMenu(open,restoreFocus=true){if(!sidebar||!menu)return;const expanded=mobile.matches&&open;document.body.classList.toggle('office-menu-open',expanded);menu.setAttribute('aria-expanded',String(expanded));sidebar.inert=mobile.matches&&!expanded;if(expanded){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.querySelector('a[aria-current]')?.focus();}else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(restoreFocus&&mobile.matches)menu.focus();}}
function renderResults(){const pages=findDestinations(input.value);results.innerHTML=pages.map(p=>destinationLink(p).replace('</span>','<small>'+p.group+'</small></span>')).join('')||'<p>No matching page. Try “Valuation”, “Macro”, “Paper” or “Backup”.</p>';document.querySelector('#page-finder-status').textContent=pages.length+' destinations';}
function openFinder(){if(!finder||finder.open||document.querySelector('dialog[open]:not(#page-finder)'))return;setMenu(false,false);input.value='';renderResults();finder.showModal();input.focus();}
document.addEventListener('click',e=>{
 if(e.target.closest('#office-menu'))setMenu(!document.body.classList.contains('office-menu-open'));
 if(e.target.closest('[data-office-menu-close]'))setMenu(false);
 if(e.target.closest('#office-search'))openFinder();if(e.target.closest('#page-finder-close'))finder.close();
 const researchLink=e.target.closest('[data-workspace=research],[data-office-destination=instrument],[data-office-destination=quant],[data-market-research]');if(researchLink&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button<=0){const board=document.querySelector('#market-board');if(board&&['us','idx'].includes(board.dataset.category))rememberMarketInstrument(board.dataset.category==='idx'?'IDX':'US',board.dataset.selected,board._researchObservation);}
 const link=e.target.closest('[data-office-destination]'),destination=WORKSPACE_PAGES.find(p=>p.id===link?.dataset.officeDestination);
 if(destination){
  // Leave modifier-click / browser "open in new tab" to the anchor's real deep link.
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button>0)return;
  if(finder?.open){finderReturnFocus=false;finder.close();}setMenu(false,false);
  if(destination.action==='appearance'){e.preventDefault();document.querySelector('#theme-toggle')?.focus();return;}
  const quantHere=location.hash.startsWith('#quant')&&document.querySelector('.quant-room');
  if(destination.section&&quantHere){e.preventDefault();pendingDestination={...destination,route:location.hash};mountWorkspaceDestination(location.hash.slice(1));return;}
  if(destination.route===location.hash){e.preventDefault();pendingDestination=destination;mountWorkspaceDestination(location.hash.slice(1));if(!destination.target&&!destination.section)document.querySelector('#main')?.focus({preventScroll:true});return;}
  pendingDestination=destination;
 }
 const sidebarLink=e.target.closest('#office-sidebar a');if(sidebarLink){setMenu(false,false);if(mobile.matches&&sidebarLink.hash===location.hash&&!destination?.section&&!destination?.target)document.querySelector('#main')?.focus({preventScroll:true});}
});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openFinder();}
 if(e.key==='Escape'&&finder?.open){e.preventDefault();finder.close();return;}
 if(e.key==='Escape'&&document.body.classList.contains('office-menu-open')){e.preventDefault();setMenu(false);}
 if(e.key==='Tab'&&document.body.classList.contains('office-menu-open')){const items=[...sidebar.querySelectorAll('a,button,summary')].filter(e=>e.getClientRects().length&&e.checkVisibility()),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.key==='Tab'&&finder?.open){const items=[...finder.querySelectorAll('input,a,button')].filter(e=>e.getClientRects().length&&e.checkVisibility()),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.key==='ArrowDown'&&finder?.open&&document.activeElement===input){e.preventDefault();results.querySelector('a,button')?.focus();}
 if(e.key==='Enter'&&finder?.open&&document.activeElement===input){const links=results.querySelectorAll('a,button');if(links.length===1){e.preventDefault();links[0].click();}}
});
input?.addEventListener('input',renderResults);finder?.addEventListener('close',()=>{if(finderReturnFocus)document.querySelector('#office-search')?.focus();finderReturnFocus=true;});
mobile.addEventListener('change',()=>setMenu(false,false));window.addEventListener('hashchange',()=>{setMenu(false,false);syncWorkspaceShell();});setMenu(false,false);syncWorkspaceShell();
