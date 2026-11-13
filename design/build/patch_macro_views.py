"""Sheet 02: overview first, deep analyses as separate views."""
import os, re
B = os.path.dirname(__file__); D = os.path.join(B, '..', 'preview')
p = os.path.join(D, 'macro-sections.js'); s = open(p, encoding='utf-8').read()
v = open(os.path.join(B, 'macro_views.js'), encoding='utf-8').read()
v = v.replace("tools:{fig:`${Math.round(fed[1]/1000).toLocaleString('en-GB')}k`,line:`Fed balance sheet, USD bn, week of ${dLabel(fed[0])}. US liquidity and the research toolkit.`",
              "tools:{fig:`$${(fed[1]/1000).toFixed(2)}tn`,line:`Federal Reserve total assets in the week of ${dLabel(fed[0])}. US liquidity charts and the research toolkit.`")
a = s.index('function tabs(){'); b = s.index('function details(){')
s = s[:a] + v + '\n' + s[b:]
s = s.replace("function goCycle(iso){setCycle(iso,true);const t=$('#cycle');if(t)t.scrollIntoView({behavior:'smooth',block:'start'})}",
              "function goCycle(iso){setCycle(iso,true);if(window.showView)window.showView('cycle')}")
s = s.replace("const map={'Monitor':'#pulse','Economic data':'#sources','Research briefing':'#top','Annual history':'#annual','Growth and inflation':'#cycle','US liquidity':'#liquidity','Release calendar':'#calendar'};",
              "const map={'Monitor':'pulse','Economic data':'sources','Research briefing':'overview','Annual history':'cycle','Growth and inflation':'cycle','US liquidity':'tools','Release calendar':'overview'};")
s = s.replace("<a href=\"${map[t]||'#'}\">${esc(t)}</a>", "<a href=\"#${map[t]||'overview'}\" data-view=\"${map[t]||'overview'}\">${esc(t)}</a>")
old = "function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs()}"
assert old in s, 'all'
s = s.replace(old, "function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs();const h=location.hash.slice(1);showView(viewIds.includes(h)?h:'overview',{push:false,scroll:false})}")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(D, 'macro.html'); h = open(p, encoding='utf-8').read()
if 'id="deep"' not in h:
    h = h.replace('</main>\n<section class="msec" id="pulse">', '</main>\n<section class="msec deep" id="deep"></section>\n<section class="msec" id="pulse">', 1)
# order of the deep views follows the tiles
h = h.replace('<section class="msec" id="pulse"><div class="panel glass"></div></section>\n<section class="msec" id="cycle"><div class="panel glass"></div></section>',
              '<section class="msec" id="cycle"><div class="panel glass"></div></section>\n<section class="msec" id="pulse"><div class="panel glass"></div></section>')
open(p, 'w', encoding='utf-8').write(h)

p = os.path.join(D, 'macro-sections.css'); c = open(p, encoding='utf-8').read()
CSS = r'''
/* views: overview + deep analysis tiles */
.msec[hidden],.sheet[hidden]{display:none!important}
.mtabs{display:flex;align-items:center;gap:12px;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:color-mix(in srgb,var(--paper) 94%,transparent)}
.mtabs .back{flex:none;height:30px;padding:0 12px;border:1px solid var(--rule);border-radius:4px;background:transparent;font:500 12.5px var(--body);color:var(--ink);cursor:pointer;transition:border-color .2s}
.mtabs .back:hover{border-color:var(--ink2)}
.msec>.panel::before,.msec>.panel::after{display:none}
.deep{padding-top:8px}
.deep-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin:10px 0 14px}
.deep-head h2{font:600 28px/1.1 var(--display);letter-spacing:-.02em;margin-top:4px}
.deep-head p{max-width:52ch;color:var(--ink2);font-size:14px}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.tile{display:grid;grid-template-rows:auto auto auto 1fr auto;gap:6px;text-align:left;padding:16px 16px 14px;min-height:196px;border:1px solid var(--glass-edge);border-radius:4px;background:var(--glass);color:var(--ink);font:inherit;cursor:pointer;position:relative;transition:transform .25s var(--ease,ease),border-color .25s,box-shadow .25s}
.tile:hover{transform:translateY(-2px);border-color:var(--ink3);box-shadow:0 8px 22px -14px rgba(0,0,0,.35)}
.tile:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.tile .tn{font:500 11px var(--mono);color:var(--ink3)}
.tile .tt{font:600 17px/1.2 var(--display);letter-spacing:-.01em}
.tile .tf{display:flex;align-items:center;gap:8px}
.tile .tf b{font:500 26px/1.1 var(--mono);letter-spacing:-.03em}
.tile .tl{font-size:13px;line-height:1.45;color:var(--ink2)}
.tile .tfoot{font:12px var(--cond);color:var(--ink3);border-top:1px solid var(--rule);padding-top:8px}
.tile .go{position:absolute;right:16px;top:14px;font:500 12px var(--body);color:var(--ink3);transition:color .2s,transform .25s var(--ease,ease)}
.tile:hover .go{color:var(--ink);transform:translateX(2px)}
@media (max-width:1100px){.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.tiles{grid-template-columns:1fr}.tile{min-height:0}}
'''
if '/* views: overview' not in c:
    c += CSS; open(p, 'w', encoding='utf-8').write(c)
print('ok')
