"""Markets, Research Lab, Portfolio, Records: overview first, every other section as its own view (sheet-views.js)."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
SPY = "addEventListener('scroll',()=>requestAnimationFrame(spy),{passive:true});spy();"
for js in ['markets.js', 'research.js', 'portfolio.js', 'records.js']:
    p = os.path.join(D, js); s = open(p, encoding='utf-8').read()
    s = s.replace(SPY, '/* scroll spy replaced by sheet-views.js */')
    open(p, 'w', encoding='utf-8').write(s)
for html in ['markets.html', 'research.html', 'portfolio.html', 'records.html']:
    p = os.path.join(D, html); s = open(p, encoding='utf-8').read()
    if 'sheet-views.js' not in s:
        s = s.replace('<script src="office-ui.js"></script>', '<script src="sheet-views.js"></script>\n<script src="office-ui.js"></script>', 1)
    open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(D, 'sheet-views.js'); s = open(p, encoding='utf-8').read()
s = s.replace("document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0)):setTimeout(init,0);",
              "document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();")
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(D, 'identity.css'); c = open(p, encoding='utf-8').read()
CSS = '''
/* sheet views: hidden views stay laid out at full width (charts keep their size) but take no space */
main>section.view-off{position:absolute!important;left:0;right:0;top:0;height:0!important;min-height:0!important;padding-top:0!important;padding-bottom:0!important;overflow:hidden!important;visibility:hidden;pointer-events:none}
.tile .tf small{font:12px var(--cond);color:var(--ink3);align-self:flex-end;padding-bottom:3px}
'''
if '/* sheet views:' not in c:
    open(p, 'w', encoding='utf-8').write(c + CSS)
print('ok')
