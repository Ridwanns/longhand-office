"""Replace the wall of indicator cards with ruled schedule rows; region cards with one bar comparison."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
p = os.path.join(D, 'macro-sections.js'); s = open(p, encoding='utf-8').read()

old = """      ${P.groups.map(g=>`<div class="sub">${esc(g.g)}</div><div class="cards">${g.items.map(r=>card({...r,g:g.g},true)).join('')}</div>`).join('')}
      <div class="sub">Coverage still missing</div><div class="missing">${P.missing.map(m=>`<div><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div>`).join('')}</div>"""
new = """      <div class="recs" role="table" aria-label="More indicators and separate source records">
        <div class="rec head" role="row"><span>Indicator</span><span>Latest</span><span>Change</span><span>History</span></div>
        ${P.groups.map(g=>`<div class="rgrp" role="rowgroup"><div class="sub">${esc(g.g)}</div>${g.items.map(r=>rec({...r,g:g.g})).join('')}</div>`).join('')}
      </div>
      <div class="sub">Coverage still missing</div><ul class="missing">${P.missing.map(m=>`<li><b>${esc(m[0])}</b><span>${esc(m[1])}</span></li>`).join('')}</ul>"""
assert old in s; s = s.replace(old, new)

anchor = "/* ---------- 1. Economic pulse ---------- */"
rec = r'''function rec(r){
  const na=!/\d/.test(r.v);
  return `<div class="rec ${na?'na':''}" role="row" data-q="${esc((r.t+' '+r.u+' '+(r.g||'')).toLowerCase())}">
    <span class="rt"><b>${esc(r.t)}</b><small>${esc(r.per)}${r.src?` · ${esc(r.src.id)}${r.src.url?` · <a href="${esc(r.src.url)}" target="_blank" rel="noopener noreferrer">source</a>`:''}`:''}</small>${(r.flags||[]).map(f=>`<span class="flag">${esc(f)}</span>`).join('')}</span>
    <span class="rv"><b class="num">${esc(r.v)}</b><small>${esc(r.u)}</small></span>
    <span class="rc ch">${glyph(r.ch)}${esc(r.ch)}${r.note?`<small>${esc(r.note)}</small>`:''}</span>
    <span class="rs">${spark(r)}${r.range?`<small><span>${esc(r.range[0])}</span><span>${esc(r.range[1])}</span></small>`:''}</span>
  </div>`;
}
'''
if 'function rec(r)' not in s: s = s.replace(anchor, rec + anchor, 1)

a = "$$('#pulse .ic').forEach(c=>c.hidden=!!q&&!c.dataset.q.includes(q));"
assert a in s; s = s.replace(a, "$$('#pulse .ic,#pulse .rec:not(.head)').forEach(c=>c.hidden=!!q&&!c.dataset.q.includes(q));")
a = "    $$('#pulse .sub').forEach(s=>{const g=s.nextElementSibling;if(g?.classList.contains('cards'))s.hidden=g.querySelectorAll('.ic:not([hidden])').length===0})};"
assert a in s; s = s.replace(a, "    $$('#pulse .rgrp').forEach(g=>g.hidden=g.querySelectorAll('.rec:not([hidden])').length===0)};")

old_r = """    <div class="region">${M.region.map(([iso,n,y,v])=>card({t:n,per:`${y} · Annual`,v:f2(v),u:'% YoY',ch:'',hist:(M.regionHist[iso]||[]).map(p=>[String(p[0]),p[1]]),range:M.regionHist[iso]?.length?[String(M.regionHist[iso][0][0]),String(M.regionHist[iso].at(-1)[0])]:null},true)).join('')}</div>"""
new_r = """    <div class="rbars">${M.region.slice().sort((a,b)=>b[3]-a[3]).map(([iso,n,y,v])=>{const mx=Math.max(...M.region.map(r=>r[3])),h=(M.regionHist[iso]||[]).map(p=>[String(p[0]),p[1]]);
      return `<div class="rbar"><span class="rn">${esc(n)}<small>${y}</small></span><span class="rtrack"><i style="width:${(v/mx*100).toFixed(1)}%"></i></span><b class="num">${f2(v)}%</b><span class="rs">${spark({hist:h})}<small><span>${h[0]?.[0]||''}</span><span>${h.at(-1)?.[0]||''}</span></small></span></div>`}).join('')}</div>"""
assert old_r in s; s = s.replace(old_r, new_r)
open(p, 'w', encoding='utf-8').write(s); print('js ok')

p = os.path.join(D, 'macro-sections.css'); c = open(p, encoding='utf-8').read()
if '/* ruled schedule rows' not in c:
    c += '''
/* ruled schedule rows instead of a wall of cards */
.recs{margin-top:4px}
.rec{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(110px,.8fr) minmax(0,1.5fr) 170px;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule)}
.rec.head{padding:4px 0 6px;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.rgrp .sub{margin:16px 0 0;padding:0 0 6px;border-top:0;border-bottom:1px solid var(--ink3)}
.rec .rt b{display:block;font:500 13.5px/1.3 var(--body)}
.rec small{display:block;font:11.5px var(--cond);color:var(--ink3);letter-spacing:.02em}
.rec .rt small a{color:var(--ink2)}
.rec .rv b{font:500 18px var(--mono);letter-spacing:-.02em}
.rec .rc{font-size:12.5px}
.rec .rs svg{width:100%;height:30px;display:block;overflow:visible}
.rec .rs svg .l{fill:none;stroke:var(--ink);stroke-width:1.3;vector-effect:non-scaling-stroke}
.rec .rs svg circle{fill:var(--paper);stroke:var(--ink);stroke-width:1.2}.rec .rs svg circle.last{fill:var(--focus);stroke:var(--focus)}
.rec .rs small{display:flex;justify-content:space-between;font:10px var(--mono)}
.rec.na .rv b{font:400 14px var(--body);color:var(--ink3)}
.rec[hidden],.rgrp[hidden]{display:none}
ul.missing{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;column-gap:24px}
ul.missing li{padding:8px 0;border-bottom:1px solid var(--rule);font-size:13px}
ul.missing b{font-weight:500;margin-right:8px}ul.missing span{color:var(--ink3)}
.rbars{border-top:1px solid var(--ink3)}
.rbar{display:grid;grid-template-columns:150px minmax(0,1fr) 70px 170px;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid var(--rule)}
.rbar .rn{font:500 14px var(--body)}.rbar .rn small{font:11px var(--cond);color:var(--ink3);margin-left:6px}
.rtrack{height:10px;background:var(--rule);border-radius:1px;overflow:hidden}.rtrack i{display:block;height:100%;background:var(--ink)}
.rbar b{font:500 15px var(--mono);text-align:right}
.rbar .rs svg{width:100%;height:28px;display:block;overflow:visible}
.rbar .rs svg .l{fill:none;stroke:var(--ink2);stroke-width:1.2;vector-effect:non-scaling-stroke}.rbar .rs svg circle.last{fill:var(--focus);stroke:var(--focus)}
.rbar .rs small{display:flex;justify-content:space-between;font:10px var(--mono);color:var(--ink3)}
@media (max-width:720px){.rec{grid-template-columns:1fr auto;gap:6px 12px}.rec.head{display:none}.rec .rc{grid-column:1/-1}.rec .rs{grid-column:1/-1}ul.missing{grid-template-columns:1fr}.rbar{grid-template-columns:1fr auto;gap:6px 12px}.rbar .rtrack,.rbar .rs{grid-column:1/-1}}
'''
    open(p, 'w', encoding='utf-8').write(c)
print('css ok')
