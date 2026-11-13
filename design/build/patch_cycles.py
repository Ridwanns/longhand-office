"""Make Sheet 02's cycle analysis follow every economy (quad board, picker, dossier chip)."""
import os
B = os.path.dirname(__file__); D = os.path.join(B, '..', 'preview')
p = os.path.join(D, 'macro-sections.js'); s = open(p, encoding='utf-8').read()
a = s.index('const QTXT='); b = s.index('/* ---------- 3. External winds')
s = s[:a] + open(os.path.join(B, 'cycle_block.js'), encoding='utf-8').read() + '\n' + s[b:]
old = "function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs()}"
assert old in s
s = s.replace(old, "function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs();if(typeof SEL!=='undefined'&&typeof dossier==='function')dossier(SEL)}")
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(D, 'macro.html'); h = open(p, encoding='utf-8').read()
if 'cycles.js' not in h:
    h = h.replace('<script src="macro-sections.js"></script>', '<script src="cycles.js"></script>\n<script src="macro-sections.js"></script>')
old = "  el.innerHTML=html;\n  for(const k of ['gdp','cpi','policy','yield'])"
assert old in h
h = h.replace(old, "  if(window.cycleChip)html+=window.cycleChip(iso);\n  el.innerHTML=html;\n  for(const k of ['gdp','cpi','policy','yield'])")
old = "  if(focus)focusCountry(iso);dossier(iso);"
assert old in h
h = h.replace(old, "  if(focus)focusCountry(iso);dossier(iso);if(window.setCycle)window.setCycle(iso);")
open(p, 'w', encoding='utf-8').write(h)

p = os.path.join(D, 'macro-sections.css'); c = open(p, encoding='utf-8').read()
CSS = r'''
/* cycle: every economy */
.cyc-pick{display:flex;flex-direction:column;gap:4px;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.cyc-pick select{height:34px;min-width:230px;max-width:100%;border:1px solid var(--rule);border-radius:4px;background:transparent;padding:0 10px;font:13.5px var(--body);color:var(--ink);text-transform:none;letter-spacing:0}
.cyc-pick select option{color:#1c1f1b}
.qboard{display:grid;grid-template-columns:22px minmax(0,1fr);gap:0 8px;margin:6px 0 4px}
.qb-axis{font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.qb-axis.y{writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;align-self:center}
.qb-axis.x{grid-column:2;text-align:center;padding-top:6px}
.qb-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--ink3)}
.qb{padding:12px 14px 14px;min-width:0}
.qb.q3,.qb.q2{border-bottom:1px solid var(--ink3)}.qb.q3,.qb.q4{border-right:1px solid var(--ink3)}
.qb header{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:baseline;margin-bottom:8px}
.qb header b{font:500 13px var(--mono);letter-spacing:.02em}.qb header span{font:12px var(--cond);color:var(--ink3)}
.qb header strong{font:400 26px var(--display);line-height:1}
.qb>div,.qb-none{display:flex;flex-wrap:wrap;gap:4px}
.qboard button[data-cyc]{font:12.5px var(--body);color:var(--ink);background:transparent;border:1px solid var(--rule);border-radius:3px;padding:3px 8px;cursor:pointer;transition:border-color .15s,background .15s}
.qboard button[data-cyc]:hover{border-color:var(--ink2)}
.qboard button[data-cyc].on{background:var(--ink);color:var(--paper,#f4f3ee);border-color:var(--ink)}
.qb-none{grid-column:2;align-items:center;margin-top:10px}.qb-none small{font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-right:6px}
.qglyph rect{fill:none;stroke:var(--ink3);stroke-width:1}.qglyph rect.on{fill:var(--focus);stroke:var(--focus)}
.cychip{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;margin-top:14px;padding:12px 14px;border:1px solid var(--ink3);border-radius:4px;background:transparent;color:var(--ink);text-align:left;cursor:pointer;font:inherit;transition:background .15s}
.cychip:hover{background:rgba(127,127,127,.07)}
.cychip small{display:block;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.cychip b{display:block;font:500 14px var(--body);margin-top:2px}
.cychip em{font:normal 12.5px var(--body);color:var(--ink2);white-space:nowrap}
@media (max-width:720px){.qb-grid{grid-template-columns:1fr}.qb.q3,.qb.q4{border-right:0}.qb.q4{border-bottom:1px solid var(--ink3)}.qboard{grid-template-columns:minmax(0,1fr)}.qb-axis{display:none}.qb-none{grid-column:1}.cyc-pick select{min-width:0;width:100%}.cychip{grid-template-columns:auto minmax(0,1fr)}.cychip em{grid-column:2}}
'''
if '/* cycle: every economy */' not in c:
    c += CSS; open(p, 'w', encoding='utf-8').write(c)
print('ok')
