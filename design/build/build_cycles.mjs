// Build design/preview/cycles.js: the growth/inflation quad for every economy on Sheet 02.
// Same rules as the app's macro-cycle.js:
//   quad = growthChange>0 ? (inflationChange<0 ? 1 : 2) : (inflationChange>0 ? 3 : 4); a zero change is "on an axis".
//   Latest releases: each rate against its own preceding consecutive period from the same series (never spliced).
//   Quarter-aligned: GDP quarter vs prior quarter, CPI YoY in the last month of each of those quarters.
//   Annual archive: World Bank WDI annual rates, change = year minus preceding year, last 12 valid points.
// Usage: node design/build/build_cycles.mjs <repo>
import fs from 'fs'; import path from 'path';
const repo = process.argv[2];
const ctx = JSON.parse(fs.readFileSync(path.join(repo, '.pages-data', 'macro-context.json'), 'utf8'));
const win = {}; new Function('window', fs.readFileSync(path.join(repo, 'design', 'preview', 'countries.js'), 'utf8'))(win);
const C = win.COUNTRIES;
const quad = (g, i) => ![g, i].every(Number.isFinite) || g === 0 || i === 0 ? null : g > 0 ? (i < 0 ? 1 : 2) : (i > 0 ? 3 : 4);
const r2 = x => Math.round(x * 1000) / 1000;
const mIdx = d => +d.slice(0, 4) * 12 + (+d.slice(5, 7) - 1);
const qLab = d => `Q${(+d.slice(5, 7) + 2) / 3} ${d.slice(0, 4)}`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mLab = d => `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
const ser = id => ctx.series.find(s => s.id === id);
const out = {};
for (const [iso, c] of Object.entries(C)) {
  const o = { name: c.name };
  // ---- annual archive (WDI) ----
  const g = ser(`wdi-${iso}-gdp`), inf = ser(`wdi-${iso}-inflation`);
  if (g && inf) {
    const gy = new Map(g.observations.filter(x => Number.isFinite(x.value)).map(x => [+x.date.slice(0, 4), x.value]));
    const iy = new Map(inf.observations.filter(x => Number.isFinite(x.value)).map(x => [+x.date.slice(0, 4), x.value]));
    const pts = [];
    for (const y of [...gy.keys()].sort()) if (gy.has(y - 1) && iy.has(y) && iy.has(y - 1)) {
      const dg = r2(gy.get(y) - gy.get(y - 1)), di = r2(iy.get(y) - iy.get(y - 1)); pts.push([y, dg, di, quad(dg, di)]);
    }
    o.annual = pts.filter(p => p[3]).slice(-12);
    o.annualSrc = { gdp: g.id, cpi: inf.id, gdpUrl: g.sourceUrl, cpiUrl: inf.sourceUrl, retrieved: g.retrievedAt };
  }
  // ---- latest releases (one series each, consecutive periods) ----
  const step = f => f === 'Q' ? 3 : f === 'M' ? 1 : 0;
  const pair = (ind, key) => {
    if (!ind || !['Q', 'M'].includes(ind.f) || !(ind.hist || []).length) return { missing: `No connected monthly or quarterly ${key} release` };
    const h = ind.hist, fr = key === 'GDP' ? 'Q' : (ind.hist.length > 1 && mIdx(h.at(-1)[0]) - mIdx(h.at(-2)[0]) === 3 ? 'Q' : 'M');
    const a = h.at(-2), b = h.at(-1);
    if (!a || mIdx(b[0]) - mIdx(a[0]) !== step(fr)) return { missing: `Consecutive ${key} observations are unavailable` };
    const lab = fr === 'Q' ? qLab : mLab;
    return { ch: r2(b[1] - a[1]), v: b[1], from: a[1], per: lab(b[0]), prior: lab(a[0]), date: b[0], fr, src: ind.histSrc, id: ind.histId,
      newer: ind.per && ind.v != null && mIdx(ind.per.replace(/-Q(\d)/, (m, q) => '-' + String((q - 1) * 3 + 1).padStart(2, '0'))) > mIdx(b[0]) ?`${ind.src} has a newer reading (${ind.per}: ${ind.v}%); it is a different source and is not mixed in.` : '' };
  };
  const lg = pair(c.gdp, 'GDP'), lc = pair(c.cpi, 'CPI');
  if (lg.missing || lc.missing) o.latest = { missing: [lg.missing, lc.missing].filter(Boolean).join('. ') };
  else { const q = quad(lg.ch, lc.ch); o.latest = { quad: q, gdp: lg, cpi: lc, mixed: lg.fr !== lc.fr || lg.date !== lc.date }; }
  // ---- quarter-aligned regime ----
  if (!lg.missing && c.cpi && c.cpi.hist) {
    const h = c.gdp.hist, b = h.at(-1), a = h.at(-2);
    const cm = new Map(c.cpi.hist.map(x => [mIdx(x[0]), x[1]]));
    const endOf = d => mIdx(d) + 2, qOnly = !lc.missing && lc.fr === 'Q';
    const cb = qOnly ? cm.get(mIdx(b[0])) : cm.get(endOf(b[0])), ca = qOnly ? cm.get(mIdx(a[0])) : cm.get(endOf(a[0]));
    if (Number.isFinite(cb) && Number.isFinite(ca)) {
      const dg = r2(b[1] - a[1]), di = r2(cb - ca);
      const em = d => { const k = endOf(d); return `${MON[k % 12]} ${Math.floor(k / 12)}` };
      o.regime = { quad: quad(dg, di), label: qLab(b[0]), gdp: { ch: dg, detail: `${qLab(b[0])}: ${b[1]}% · ${qLab(a[0])}: ${a[1]}%` },
        cpi: { ch: di, detail: qOnly ? `${qLab(b[0])}: ${cb}% · ${qLab(a[0])}: ${ca}%` : `${em(b[0])}: ${cb}% · ${em(a[0])}: ${ca}%` } };
    } else o.regime = { missing: `CPI is not available for the last month of ${qLab(b[0])} and ${qLab(a[0])}` };
  } else o.regime = { missing: lg.missing || 'No connected CPI history' };
  o.gdpHist = c.gdp && c.gdp.f !== 'A' ? c.gdp.hist : null; o.cpiHist = c.cpi ? c.cpi.hist : null;
  o.gdpSrc = c.gdp ? `${c.gdp.histSrc || c.gdp.src} (${c.gdp.histId || ''})` : ''; o.cpiSrc = c.cpi ? `${c.cpi.histSrc || c.cpi.src} (${c.cpi.histId || ''})` : '';
  out[iso] = o;
}
const file = path.join(repo, 'design', 'preview', 'cycles.js');
fs.writeFileSync(file, '// Generated by design/build/build_cycles.mjs — do not edit by hand.\nwindow.CYCLES=' + JSON.stringify(out) + ';\n');
const q = Object.entries(out).map(([k, v]) => `${k}:${v.latest.quad ?? '-'}/${v.regime.quad ?? '-'}/${v.annual?.length ?? 0}`);
console.log(Object.keys(out).length, 'economies', fs.statSync(file).size, 'bytes'); console.log(q.join(' '));
console.log('IDN check', JSON.stringify(out.IDN.annual.at(-1)), JSON.stringify(out.IDN.regime));
