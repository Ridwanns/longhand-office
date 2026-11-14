// Hosts a sheet ported from the design preview inside the Office.
// - Data: the sheet's published JSON (built from the Office snapshot by design/build) is fetched without caching
//   and exposed under the global name the sheet code expects (window.MACRO, window.COUNTRIES, ...).
// - Styles: the Pages CSP (style-src 'self') blocks inline style attributes. The sheet templates write their few
//   per-element styles (bar widths, swatch colours) as data-css instead, and inside the sheet root only these are
//   applied through the CSSOM, which the CSP allows. They come from the templates and escaped published values.
// - Listeners: window/document listeners registered by the sheet stop when the sheet leaves the page.
// - In-sheet links: a link to an element of the sheet scrolls to it instead of changing the Office route.
const SHEET_DATA={countries:'COUNTRIES','macro-sheet':'MACRO',cycles:'CYCLES',calendar:'CALENDAR','markets-sheet':'MARKETS'};
const loaded=new Map();
export function loadSheetData(names){
 return Promise.all(names.map(name=>{
  if(!Object.hasOwn(SHEET_DATA,name))return Promise.reject(Error('Unknown sheet data: '+name));
  if(!loaded.has(name))loaded.set(name,fetch(new URL('./sheet-data/'+name+'.json',import.meta.url),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)}).then(r=>{if(!r.ok)throw Error('Sheet data unavailable: '+name);return r.json();}).then(value=>{window[SHEET_DATA[name]]=value;return value;}).catch(error=>{loaded.delete(name);throw error;}));
  return loaded.get(name);
 }));
}
export function hostSheet(root){
 const stops=[];
 const restyle=node=>{if(node.nodeType!==1)return;if(node.dataset.css)node.style.cssText=node.dataset.css;node.querySelectorAll('[data-css]').forEach(el=>{el.style.cssText=el.dataset.css;});};
 restyle(root);
 const watcher=new MutationObserver(records=>{if(!root.isConnected){stop();return;}for(const r of records)r.addedNodes.forEach(restyle);});
 watcher.observe(root,{childList:true,subtree:true});
 const listen=(target,type,fn,options)=>{const handler=e=>{if(!root.isConnected){stop();return;}fn(e);};target.addEventListener(type,handler,options);stops.push(()=>target.removeEventListener(type,handler,options));};
 root.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||a.hasAttribute('data-view'))return;const id=a.getAttribute('href').slice(1),target=id&&root.querySelector('#'+CSS.escape(id));if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}});
 function stop(){watcher.disconnect();stops.splice(0).forEach(f=>f());}
 return {listen,stop};
}
