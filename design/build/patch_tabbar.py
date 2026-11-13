"""Phone page bar (bottom) on every sheet, plus the map land default."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
p = os.path.join(D, 'office-ui.js'); s = open(p, encoding='utf-8').read()
fn = r'''
/* ---------- phone page bar: the header links move to a bar at the bottom of the screen ---------- */
function tabbar(){
  if($('.tabbar'))return;const links=$$('header nav a');if(!links.length)return;
  const short={'Research Lab':'Research'};
  const bar=document.createElement('nav');bar.className='tabbar';bar.setAttribute('aria-label','Pages');
  bar.innerHTML=links.map(a=>`<a href="${a.getAttribute('href')}" class="${a.classList.contains('on')?'on':''}"${a.classList.contains('on')?' aria-current="page"':''}>${short[a.textContent.trim()]||a.textContent.trim()}</a>`).join('');
  document.body.appendChild(bar);
}
'''
old = "function init(){lamp();liquid();finder();calendar($('#calendar'))}"
if 'function tabbar()' not in s:
    assert old in s
    s = s.replace(old, fn + "function init(){lamp();liquid();finder();calendar($('#calendar'));tabbar()}")
    open(p, 'w', encoding='utf-8').write(s)
c = open(os.path.join(D, 'identity.css'), encoding='utf-8').read()
CSS = '''
.ctry{fill:var(--land)}
/* phone page bar */
.tabbar{display:none}
@media (max-width:720px){
  .tabbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));position:fixed;left:0;right:0;bottom:0;z-index:40;
    padding:0 max(4px,env(safe-area-inset-right,0px)) env(safe-area-inset-bottom,0px) max(4px,env(safe-area-inset-left,0px));
    background:color-mix(in srgb,var(--paper) 96%,transparent);border-top:1px solid var(--rule)}
  .tabbar a{position:relative;display:flex;align-items:center;justify-content:center;height:52px;font:500 11.5px var(--body);color:var(--ink2);text-align:center;letter-spacing:-.01em}
  .tabbar a.on{color:var(--ink);font-weight:600}
  .tabbar a.on::before{content:"";position:absolute;top:-1px;left:22%;right:22%;height:2px;background:var(--focus);border-radius:0 0 2px 2px}
  body{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))}
}
'''
if '/* phone page bar */' not in c:
    open(os.path.join(D, 'identity.css'), 'w', encoding='utf-8').write(c + CSS)
print('ok')
