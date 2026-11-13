"""Overview: every date and figure comes from series.js (SERIES, YIELD, OVERVIEW); no typed-in values left."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
p = os.path.join(D, 'index.html'); s = open(p, encoding='utf-8').read()
def sw(a, b, count=1):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, count)
sw('<div class="kicker">Sheet 01 · Overview · close of 6 Nov 2026</div>', '<div class="kicker">Sheet 01 · Overview · <span data-ov="closeLabel">latest close</span></div>')
sw('<div class="asof">Daily closes · Yahoo Finance via the Office snapshot of 8 Nov 2026 · not real time</div>', '<div class="asof">Daily closes · Yahoo Finance via the Office snapshot of <span data-ov="snapLabel"></span> · completed sessions only, not real time</div>')
sw('<div><small>Data</small><strong class="num">Close 06·11·2026</strong></div>', '<div><small>Data</small><strong class="num" data-ov="closeDots">—</strong></div>')
sw('<div class="kicker">Rates · US Treasury par yields · 6 Nov 2026</div>\n    <h2>The curve is upward sloping beyond two years.</h2>\n    <div class="spread"><b class="num up">+35 bp</b><span class="sub">10-year minus 2-year</span></div>',
   '<div class="kicker">Rates · US Treasury par yields · <span data-ov="ustLabel"></span></div>\n    <h2 data-ov="ustHead">—</h2>\n    <div class="spread"><b class="num" data-ov="spread">—</b><span class="sub">10-year minus 2-year</span></div>')
sw('''<div class="kicker">Macro regime · Indonesia · Q3 2026</div>
    <h2>Quad 1: growth up, inflation easing.</h2>
    <div class="quad">
      <div><b>QUAD 3</b>growth down · inflation up</div><div><b>QUAD 2</b>growth up · inflation up</div>
      <div><b>QUAD 4</b>growth down · inflation down</div><div class="on"><b>QUAD 1 · ID</b>growth up · inflation down</div>
    </div>
    <div class="gdp">
      <div><small>GDP Q1 → Q2 → Q3</small><strong class="num">5.61 → 5.29 → <span class="up">5.47%</span></strong></div>
      <div><small>CPI Sep → Oct</small><strong class="num">3.28 → 3.23%</strong></div>
      <div><small>BI rate</small><strong class="num">5.75%</strong></div>
    </div>''', '''<div class="kicker">Macro regime · Indonesia · latest releases · <span data-ov="quadPer"></span></div>
    <h2 data-ov="quadHead">—</h2>
    <div class="quad">
      <div data-q="3"><b>QUAD 3</b>growth down · inflation up</div><div data-q="2"><b>QUAD 2</b>growth up · inflation up</div>
      <div data-q="4"><b>QUAD 4</b>growth down · inflation down</div><div data-q="1"><b>QUAD 1</b>growth up · inflation down</div>
    </div>
    <div class="gdp">
      <div><small data-ov="gdpLab">GDP</small><strong class="num" data-ov="gdpVals">—</strong></div>
      <div><small data-ov="cpiLab">CPI</small><strong class="num" data-ov="cpiVals">—</strong></div>
      <div><small>BI rate</small><strong class="num" data-ov="bi">—</strong></div>
    </div>''')
sw('<footer><span>Design preview — not the live app.</span><span>All figures from the Office snapshot (closes of 6 Nov 2026; BPS GDP release 5 Nov 2026).</span><span>Model rendered in Blender 5.3, Cycles, 13 orbit frames per theme.</span></footer>',
   '<footer><span>Design preview — not the live app.</span><span data-ov="footer">All figures from the Office snapshot.</span><span>Model rendered in Blender 5.3, Cycles: a 60-frame assembly per theme.</span></footer>')
sw("room:{h:'Records',p:'Encrypted backups and data sources. Market snapshot: 8 Nov 2026.',go:'Open Records'}}", "room:{h:'Records',p:'Encrypted backups and data sources. Market snapshot: '+OVLAB.snap+'.',go:'Open Records'}}")
sw("room:{h:'Markets',p:'US and IDX stocks, bonds, commodities and macro. The wall shows IHSG from Apr 2025 to 6 Nov 2026.',go:'Open Markets'}}", "room:{h:'Markets',p:'US and IDX stocks, bonds, commodities and macro. The wall screen is a rendered IHSG chart; live figures are in the market schedule.',go:'Open Markets'}}")
sw("$('#dek').innerHTML=`It closed at <b>${fmt(last,0)}</b> on 6 Nov, up ${((last/prev-1)*100).toFixed(2)}%,",
   "$('#dek').innerHTML=`It closed at <b>${fmt(last,0)}</b> on ${d(s.at(-1)[0])}, ${last>=prev?'up':'down'} ${Math.abs((last/prev-1)*100).toFixed(2)}%,")
sw("const p=YIELD.points,X=y=>44+Math.sqrt(y/30)*(W-70),mn=4.3,mx=5.4,Y=v=>160-(v-mn)/(mx-mn)*140;\n  let g='<g class=\"ax\">'+[4.4,4.8,5.2].map(",
   "const p=YIELD.points,vals=p.map(q=>q.value),mn=Math.floor((Math.min(...vals)-.15)*10)/10,mx=Math.ceil((Math.max(...vals)+.15)*10)/10,X=y=>44+Math.sqrt(y/30)*(W-70),Y=v=>160-(v-mn)/(mx-mn)*140;\n  const tk=[0,1,2].map(i=>Math.round((mn+(mx-mn)*(i+.5)/3)*10)/10);\n  let g='<g class=\"ax\">'+tk.map(")
# labels computed once from the data, before the page scripts use them
sw('<script src="series.js"></script>\n<script>', '''<script src="series.js"></script>
<script>
/* every date and figure on this sheet comes from series.js (built from the Office snapshot) */
const OVLAB=(()=>{const MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'],dl=x=>`${+x.slice(8,10)} ${MONS[+x.slice(5,7)-1]} ${x.slice(0,4)}`,
  j=SERIES['^JKSE'].at(-1)[0],us=SERIES['^GSPC'].at(-1)[0],snap=String(OVERVIEW.marketSnapshot).slice(0,10);
  return {dl,close:j,us,snap:dl(snap),closeLabel:j===us?`close of ${dl(j)}`:`IDX close ${dl(j)} · US close ${dl(us)}`,dots:j.slice(8,10)+'·'+j.slice(5,7)+'·'+j.slice(0,4)}})();
document.addEventListener('DOMContentLoaded',()=>{
  const set=(k,v,h)=>document.querySelectorAll(`[data-ov="${k}"]`).forEach(e=>h?e.innerHTML=v:e.textContent=v),O=OVERVIEW.idn,MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
  const qp=p=>/Q/.test(p)?p.replace(/(\\d{4})-Q(\\d)/,'Q$2'):MONS[+p.slice(5,7)-1];
  set('closeLabel',OVLAB.closeLabel);set('snapLabel',OVLAB.snap);set('closeDots',OVLAB.dots);
  const sp=YIELD.spreadBp,ten=YIELD.points.find(p=>p.years===10),two=YIELD.points.find(p=>p.years===2),thirty=YIELD.points.find(p=>p.years===30);
  set('ustLabel',OVLAB.dl(YIELD.date));set('spread',(sp>0?'+':sp<0?'−':'')+Math.abs(sp)+' bp');document.querySelector('[data-ov="spread"]').className='num '+(sp>=0?'up':'dn');
  set('ustHead',sp>0?(thirty&&thirty.value<YIELD.points.find(p=>p.years===20).value?'Upward sloping to 20 years, slightly lower at 30.':'The curve is upward sloping beyond two years.'):sp<0?'The 2-to-10-year curve is inverted.':'The 2-to-10-year curve is flat.');
  const QT={1:'Quad 1: growth up, inflation easing.',2:'Quad 2: growth up, inflation rising.',3:'Quad 3: growth down, inflation rising.',4:'Quad 4: growth down, inflation easing.'};
  set('quadHead',QT[O.quad]||'On an axis: one rate is unchanged.');set('quadPer',`GDP ${O.gdp.at(-1).period.replace(/(\\d{4})-Q(\\d)/,'Q$2 $1')} · CPI ${MONS[+O.cpi.at(-1).period.slice(5,7)-1]} ${O.cpi.at(-1).period.slice(0,4)}`);
  document.querySelectorAll('.quad [data-q]').forEach(e=>{const on=+e.dataset.q===O.quad;e.classList.toggle('on',on);e.querySelector('b').textContent='QUAD '+e.dataset.q+(on?' · ID':'')});
  set('gdpLab','GDP '+O.gdp.map(g=>qp(g.period)).join(' → '));set('gdpVals',O.gdp.map((g,i)=>i===O.gdp.length-1?`<span class="${g.value>=O.gdp.at(-2).value?'up':'dn'}">${g.value.toFixed(2)}%</span>`:g.value.toFixed(2)).join(' → '),true);
  set('cpiLab','CPI '+O.cpi.map(c=>qp(c.period)).join(' → '));set('cpiVals',O.cpi.map((c,i)=>c.value.toFixed(2)+(i===O.cpi.length-1?'%':'')).join(' → '));
  set('bi',O.bi.value.toFixed(2)+'%');
  set('footer',`All figures from the Office snapshot: market closes to ${OVLAB.dl(OVLAB.close)} (completed sessions), US Treasury ${OVLAB.dl(YIELD.date)}, BPS GDP release ${O.gdpReleased?OVLAB.dl(O.gdpReleased):'—'}.`);
});
</script>
<script>''')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
