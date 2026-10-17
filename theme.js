const restoredThemeScope=new URLSearchParams(location.search).get('restored-workspace')||'';
const themeKey='longhand-office.theme'+(restoredThemeScope?'.'+restoredThemeScope:''),media=matchMedia('(prefers-color-scheme: dark)');
let preference;try{preference=localStorage.getItem(themeKey);}catch{}
function applyTheme(value){document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;const button=document.querySelector('#theme-toggle');if(button){button.textContent=value==='dark'?'☼ Light mode':'◐ Dark mode';button.setAttribute('aria-pressed',String(value==='dark'));button.setAttribute('aria-label',value==='dark'?'Switch to light mode':'Switch to dark mode');}document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='dark'?'#161c20':'#f4f3ef');}
applyTheme(['light','dark'].includes(preference)?preference:media.matches?'dark':'light');
document.addEventListener('DOMContentLoaded',()=>applyTheme(document.documentElement.dataset.theme));
document.addEventListener('click',event=>{if(!event.target.closest('#theme-toggle'))return;preference=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(themeKey,preference);}catch{}applyTheme(preference);});
media.addEventListener('change',event=>{if(!['light','dark'].includes(preference))applyTheme(event.matches?'dark':'light');});
window.addEventListener('storage',event=>{if(event.key===themeKey){preference=event.newValue;applyTheme(['light','dark'].includes(preference)?preference:media.matches?'dark':'light');}});

document.addEventListener('office:preferences-restored',e=>{preference=e.detail.theme;applyTheme(preference|| (media.matches?'dark':'light'));});
