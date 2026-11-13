"""Remove the last typed-in figures: Macro rates cards, Portfolio pricing date, Research brief price, footers."""
import os, re
D = os.path.join(os.path.dirname(__file__), '..', 'preview'); B = os.path.dirname(__file__)
def edit(f, pairs, base=D):
    p = os.path.join(base, f); s = open(p, encoding='utf-8').read()
    for a, b in pairs:
        assert a in s, (f, a[:60]); s = s.replace(a, b, 1)
    open(p, 'w', encoding='utf-8').write(s)
edit('macro-sections.js', [
 ("${card({t:'Bank Indonesia policy rate',per:'21 Oct 2026 · Decision dates',v:'5.75',u:'% per year',ch:'Unchanged vs 23 Sept 2026',range:[dLabel(R.decisions[0][0]),dLabel(R.decisions.at(-1)[0])],hist:R.decisions,src:R.sources.decisions})}",
  "${card({...REC('id-policy'),t:'Bank Indonesia policy rate',range:[dLabel(R.decisions[0][0]),dLabel(R.decisions.at(-1)[0])],hist:R.decisions,src:R.sources.decisions})}"),
 ("${card({t:'JISDOR, official Bank Indonesia fixing',per:'6 Nov 2026 · Daily',v:'18,130.0',u:'IDR per USD',ch:'Up 36.0 IDR per USD vs 5 Nov 2026',range:[dLabel(R.jisdor[0][0]),dLabel(R.jisdor.at(-1)[0])],hist:R.jisdor,src:R.sources.jisdor})}",
  "${card({...REC('id-jisdor'),t:'JISDOR, official Bank Indonesia fixing',range:[dLabel(R.jisdor[0][0]),dLabel(R.jisdor.at(-1)[0])],hist:R.jisdor,src:R.sources.jisdor})}"),
 ("const f2=v=>Number(v).toFixed(2);", "const f2=v=>Number(v).toFixed(2);\n// computed pulse records (built from the snapshot) reused wherever a card repeats a series\nconst REC=id=>[...M.pulse.priority,...M.pulse.groups.flatMap(g=>g.items)].find(r=>r.id===id)||{};")])
edit('macro.html', [("<span>Latest values: the Office atlas (test workspace), 13 Nov 2026. History: the Office snapshot series named under each chart.</span>",
  "<span>Latest values: computed with the app's own atlas code from the Office snapshot. History: the snapshot series named under each chart.</span>")])
edit('portfolio.js', [("const ASOF='2026-11-06';", "// priced at the latest completed close in the snapshot (each holding shows its own session date)\nconst ASOF=[...(window.MARKETS?.us||[]),...(window.MARKETS?.idx||[])].map(x=>x.date).filter(Boolean).sort().at(-1)||new Date().toISOString().slice(0,10);")])
for f, base in (('portfolio.html', D), ('make_sheet_pages.py', B)):
    edit(f, [("priced with the published closes of 6 Nov 2026; it is", "priced with the latest published closes in the snapshot; it is")], base)
print('ok')
