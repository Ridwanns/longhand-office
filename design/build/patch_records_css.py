import os
D = os.path.join(os.path.dirname(__file__), '..', 'preview')
p = os.path.join(D, 'records.js'); s = open(p, encoding='utf-8').read()
s = s.replace('<span class="cbar" title=', '<span class="cen" title=')
open(p, 'w', encoding='utf-8').write(s)
p = os.path.join(D, 'research.css'); c = open(p, encoding='utf-8').read()
CSS = r'''
/* Sheet 06 records & data sources */
.tally{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--ink3);border-left:1px solid var(--rule)}
.tally>div{padding:14px 16px;border-right:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.tally small{display:block;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.tally b{display:block;font:500 24px var(--mono);letter-spacing:-.03em;margin:4px 0 2px}.tally span{font-size:12.5px;color:var(--ink2)}
.census{border-top:1px solid var(--ink3)}
.crow{display:grid;grid-template-columns:minmax(150px,1.1fr) 80px minmax(0,3fr) 150px;gap:16px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--rule);cursor:pointer;transition:background .15s}
.crow:not(.head):hover{background:rgba(127,127,127,.06)}
.crow.head{cursor:default;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);padding:6px 4px}
.crow>.num{font:500 13.5px var(--mono);text-align:right}.crow>.num small{display:block;font:11px var(--cond);color:var(--loss)}
.cen{display:flex;height:12px;border-radius:2px;overflow:hidden;background:var(--rule)}
.cen i,.ckey i{display:block;height:100%}.cen i.ok,.ckey i.ok{background:var(--ink2)}.cen i.at,.ckey i.at{background:#b98b2e}.cen i.un,.ckey i.un{background:var(--loss)}
.ckey{display:flex;gap:16px;flex-wrap:wrap;font:12px var(--cond);color:var(--ink2);margin-top:8px}.ckey span{display:flex;align-items:center;gap:6px}.ckey i{width:14px;height:9px;border-radius:2px}
.ruler2{border-top:1px solid var(--ink3);padding-top:30px;position:relative}
.ruler2 .axis{position:absolute;left:276px;right:96px;top:0;height:22px;border-bottom:1px solid var(--ink3)}
.ruler2 .axis i{position:absolute;bottom:0;width:1px;height:5px;background:var(--ink3)}.ruler2 .axis i.maj{height:11px;background:var(--ink2)}
.ruler2 .axis i span{position:absolute;bottom:13px;left:-16px;font:10px var(--mono);color:var(--ink3);white-space:nowrap}
.pubrow{display:grid;grid-template-columns:260px minmax(0,1fr) 80px;gap:16px;align-items:center;padding:6px 0;border-bottom:1px solid var(--rule)}
.pubrow .pl{font-size:13px}.pubrow .pd{font:12px var(--mono);text-align:right;color:var(--ink2)}
.pubrow .pt{position:relative;height:14px}
.pubrow .pt::before{content:"";position:absolute;left:0;right:0;top:7px;border-top:1px dotted var(--rule)}
.pubrow .pt b{position:absolute;top:2px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:var(--ink)}
.pubrow.gen .pl{font-weight:500}.pubrow.gen .pt b{background:var(--focus);border-radius:1px;transform:rotate(45deg)}
.lfilters{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.lfilters label{display:flex;flex-direction:column;gap:4px;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.lfilters input,.lfilters select{height:34px;border:1px solid var(--rule);border-radius:4px;background:transparent;padding:0 10px;font:13.5px var(--body);color:var(--ink);text-transform:none;letter-spacing:0;min-width:200px}
.lfilters select option,.tgrid select option{color:#1c1f1b}
.dl{border-top:1px solid var(--ink3)}
.dr{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr);gap:16px;padding:11px 0 11px 8px;border-bottom:1px solid var(--rule);font-size:13px}
.dr small{display:block;font:11.5px var(--cond);color:var(--ink3);letter-spacing:.02em;line-height:1.35}
.dr .dn2 b{display:block;font:500 13px var(--mono);text-transform:uppercase;letter-spacing:.02em}
.dr .da b{font:500 12.5px var(--body)}.dr.na{box-shadow:inset 3px 0 0 var(--loss)}
.dr .ds a{display:block;font-size:12px;color:var(--ink2);margin-top:2px}
.pager{display:flex;gap:12px;align-items:center;justify-content:center;margin:14px 0 8px}
.prov{border-top:1px solid var(--ink3)}
.pr{display:grid;grid-template-columns:170px repeat(3,minmax(0,1fr));gap:18px;padding:14px 0;border-bottom:1px solid var(--rule);font-size:13px}
.pr small{display:block;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:3px}
.pr .pn b{display:block;font:400 20px var(--display)}.pr .pn small{text-transform:none;letter-spacing:0;font:12px var(--cond)}
.pr .st{display:block;font-weight:500;margin-bottom:2px}.pr em{display:block;font:normal 11.5px var(--cond);color:var(--ink3);margin-top:4px}
.colist{display:flex;flex-wrap:wrap;gap:4px}.colist code{font:11.5px var(--mono);border:1px solid var(--rule);border-radius:3px;padding:2px 6px}
.drop{display:flex;flex-direction:column;gap:6px;align-items:flex-start;border:1px dashed var(--ink3);border-radius:6px;padding:22px;cursor:pointer;transition:background .15s,border-color .15s}
.drop:hover,.drop.over{background:rgba(127,127,127,.06);border-color:var(--ink)}.drop input{font:12.5px var(--body);color:var(--ink2);max-width:100%}
.irep{margin-top:12px;border-top:1px solid var(--ink3)}.ir{display:grid;grid-template-columns:22px 1fr;gap:6px;padding:6px 0;border-bottom:1px solid var(--rule);font-size:13px}
.ir span{font:600 13px var(--mono)}.ir.ok span{color:var(--gain)}.ir.bad span,.ir.bad{color:var(--loss)}.ir.na span{color:var(--ink3)}
.off{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--ink3)}
.or{padding:14px 16px 14px 0;border-bottom:1px solid var(--rule)}
.or small{font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}.or b{display:block;font:400 20px var(--display);margin:3px 0}
.or p{font-size:13px;color:var(--ink2)}.or span{display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;font:500 12.5px var(--body)}.or a{border-bottom:1px solid var(--rule)}
.three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.bk{border-top:2px solid var(--ink);padding-top:12px}.bk>b{display:block;font:400 20px var(--display);margin:4px 0 6px}.bk p{font-size:13px;margin-bottom:8px}
.bkb{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.pw{display:grid;gap:8px}.pw label{display:flex;flex-direction:column;gap:4px;font:500 10.5px var(--cond);letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.pw input{height:34px;border:1px solid var(--rule);border-radius:4px;background:transparent;padding:0 10px;color:var(--ink);font:14px var(--body)}
.counts{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:10px 0}.counts b{font:500 22px var(--mono);margin-right:4px}
.statusline{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--rule);margin-bottom:10px}
.statusline .dot{width:9px;height:9px;border-radius:50%;background:var(--ink3)}
ul.rules{padding-left:18px;margin-top:6px;font-size:13.5px}ul.rules li{margin:5px 0}
@media (max-width:1100px){.tally{grid-template-columns:1fr 1fr}.dr{grid-template-columns:1fr 1fr}.pr{grid-template-columns:1fr 1fr}.off,.three{grid-template-columns:1fr 1fr}}
@media (max-width:720px){.crow{grid-template-columns:1fr 70px}.crow .cen{grid-column:1/-1}.crow>.num:last-child{display:none}.crow.head{display:none}
 .ruler2 .axis{display:none}.ruler2{padding-top:6px}.pubrow{grid-template-columns:1fr 70px}.pubrow .pt{display:none}
 .dr,.pr,.off,.three{grid-template-columns:1fr}.lfilters input,.lfilters select{min-width:0;width:100%}.lfilters label{flex:1 1 100%}.tally{grid-template-columns:1fr}}
'''
if '/* Sheet 06' not in c:
    c += CSS
    open(p, 'w', encoding='utf-8').write(c)
print('ok')
