// Sheet 03 Markets: the opening paragraph, written from the data (plain facts). Ported from design/preview/markets-lead.js.
// Sheet 03 headline written from the data: plain facts, no adjectives the numbers do not support.
export function mountMarketsLead(){
const K=window.MARKETS;if(!K)return;
const ix=s=>K.indices.find(x=>x.sym===s),pc=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2)+'%',nf=(v,d=0)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const j=ix('^JKSE'),s=ix('^GSPC'),y10=K.ust.latest.find(p=>p[0]==='10 Yr'),y10y=K.ust.y1.pts.find(p=>p[0]==='10 Yr');
const mov=K.commodities.filter(c=>c.m1!=null&&c.n>60).sort((a,b)=>Math.abs(b.m1)-Math.abs(a.m1))[0];
const opening=`IHSG ${j.d1>=0?'rose':'fell'} ${Math.abs(j.d1).toFixed(2)}% to ${nf(j.last)} on its last session.`;
document.getElementById('mk-dek').innerHTML=opening+' '+`That leaves it <b>${pc(j.y1)}</b> over a year, inside a 52-week range of ${nf(j.lo52)}–${nf(j.hi52)}. The S&amp;P 500 closed at ${nf(s.last)} (${pc(s.d1)} on the day). The US 10-year Treasury yield was ${y10[2].toFixed(2)}% on ${K.ust.date}, ${Math.round((y10[2]-y10y[2])*100)>=0?'up':'down'} ${Math.abs(Math.round((y10[2]-y10y[2])*100))} bp from a year earlier. Largest one-month move among futures: ${mov.name.replace(' · futures','')} ${pc(mov.m1)}.`;
}
