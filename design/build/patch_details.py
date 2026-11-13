"""Drawing-set conventions for Sheet 02: detail bubbles, crop marks, drawing index on the tabs."""
import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')

p = os.path.join(D, 'macro-sections.css'); c = open(p, encoding='utf-8').read()
if '/* drawing-set conventions' not in c:
    c += '''
/* drawing-set conventions: detail bubbles, crop marks, drawing index */
.dbub{flex:none;width:46px;height:46px;border:1.4px solid var(--ink);border-radius:50%;display:grid;grid-template-rows:1fr 1fr;overflow:hidden;margin-right:14px;align-self:center}
.dbub b,.dbub i{display:grid;place-items:center;font:500 13px/1 var(--mono);font-style:normal}
.dbub b{border-bottom:1.4px solid var(--ink)}
.dbub i{font-size:10.5px;color:var(--ink2)}
.sec-head>div:first-child{display:flex;align-items:flex-start}
.sec-head .ttl{min-width:0}
.msec>.panel{position:relative;overflow:visible}
.msec>.panel::before,.msec>.panel::after{content:"";position:absolute;width:14px;height:14px;pointer-events:none;border-color:var(--ink3);border-style:solid}
.msec>.panel::before{left:-8px;top:-8px;border-width:1px 0 0 1px}
.msec>.panel::after{right:-8px;bottom:-8px;border-width:0 1px 1px 0}
.mtabs .seg button .dn{font:500 9.5px var(--mono);color:var(--ink3);margin-right:5px;letter-spacing:0}
.mtabs .seg button.on .dn{color:var(--paper);opacity:.7}
#indseg{overflow-x:auto;scrollbar-width:none}#indseg::-webkit-scrollbar{display:none}
'''
    open(p, 'w', encoding='utf-8').write(c)

p = os.path.join(D, 'macro-sections.js'); s = open(p, encoding='utf-8').read()
old = "function all(){pulse();cycle();winds();rates();compare();region();tools();sources();tabs()}"
new = """function details(){ // number every section like a detail on a drawing sheet
  ['pulse','cycle','winds','rates','compare','region','tools','sources'].forEach((id,i)=>{const h=document.querySelector('#'+id+' .sec-head>div:first-child');if(!h||h.querySelector('.dbub'))return;
    const inner=h.innerHTML;h.innerHTML=`<span class="dbub" aria-label="Detail ${i+2} of sheet 02"><b>${i+2}</b><i>02</i></span><div class="ttl">${inner}</div>`;
    const k=h.querySelector('.kicker');if(k)k.textContent=`Detail ${i+2} · `+k.textContent});
}
function all(){pulse();cycle();winds();rates();compare();region();tools();sources();details();tabs()}"""
assert old in s; s = s.replace(old, new)
old_t = "nav.innerHTML=`<span class=\"kicker\">Macro desk</span><div class=\"seg\" role=\"tablist\">${T.map(([t,h],i)=>`<button role=\"tab\" data-h=\"${h}\" class=\"${i?'':'on'}\">${t}</button>`).join('')}</div>`;"
new_t = "nav.innerHTML=`<span class=\"kicker\">Sheet 02 — details 1–${T.length}</span><div class=\"seg\" role=\"tablist\">${T.map(([t,h],i)=>`<button role=\"tab\" data-h=\"${h}\" class=\"${i?'':'on'}\"><span class=\"dn\">${i+1}</span>${t}</button>`).join('')}</div>`;"
assert old_t in s; s = s.replace(old_t, new_t)
# cycle/annual/resize re-renders must keep bubbles
s = s.replace("setTimeout(()=>{histCharts();annual();rates();tools()},180)", "setTimeout(()=>{histCharts();annual();rates();tools();details()},180)")
open(p, 'w', encoding='utf-8').write(s)
print('details ok')
