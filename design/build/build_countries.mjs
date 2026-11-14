// Build preview/countries.js: per-country latest values (from the Office atlas) + history series (from .pages-data).
// usage: node build_countries.mjs <repo> <scratchpad>
import fs from 'fs'; import path from 'path'; import vm from 'vm';
const [repo, S] = process.argv.slice(2);
const D = f => JSON.parse(fs.readFileSync(path.join(repo, '.pages-data', f + '.json'), 'utf8'));
const files = ['macro', 'macro-context', 'macro-releases', 'macro-extended'];
const series = {}; for (const f of files) for (const s of D(f).series) series[s.id] = { ...s, file: f };
const OUT = process.env.LH_SHEET_OUT; // optional: a folder for every generated sheet file (the Pages build uses it)
const outFile = n => OUT ? path.join(OUT, n) : path.join(S, 'preview', n);
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(outFile('atlas.js'), 'utf8'), ctx);
const A = ctx.window.ATLAS, rates = JSON.parse(fs.readFileSync(OUT ? path.join(OUT, 'atlas-rates.json') : path.join(repo, 'design', 'build', 'atlas-rates.json'), 'utf8'));
const { MAP_COUNTRIES } = await import('file:///' + path.join(repo, 'macro-map-data.js').replace(/\\/g, '/'));
const names = Object.fromEntries(MAP_COUNTRIES.map(c => [c.id, c.name])); names.SGP = 'Singapore';
for (const r of [...A.gdp, ...A.cpi]) names[r[0]] = r[1];   // the app's own names win (Türkiye, Timor-Leste, Lao PDR…)
const SINCE = '2016-01-01';
const EMU = new Set(['FRA', 'DEU', 'NLD', 'ESP', 'ITA']);

const toDate = o => o.date || (o.period && (/^\d{4}-Q[1-4]$/.test(o.period) ? `${o.period.slice(0, 4)}-${String((+o.period[6] - 1) * 3 + 1).padStart(2, '0')}-01` : /^\d{4}-\d{2}$/.test(o.period) ? o.period + '-01' : /^\d{4}$/.test(o.period) ? o.period + '-01-01' : null));
function hist(id, monthlyFromDaily = false) {
  const s = series[id]; if (!s) return null;
  let pts = (s.observations || []).map(o => [toDate(o), o.value]).filter(([d, v]) => d && Number.isFinite(v) && d >= SINCE).sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (monthlyFromDaily) { const m = new Map(); for (const [d, v] of pts) m.set(d.slice(0, 7), [d.slice(0, 7) + '-01', v]); pts = [...m.values()]; }
  return pts.length ? { id, pts: pts.map(([d, v]) => [d.slice(0, 7), Math.round(v * 100) / 100]), freq: s.frequency || '', unit: s.unit || s.spec?.unit || '' } : null;
}
const SRC = { euro: 'Eurostat', gem: 'World Bank GEM', imf: 'IMF IFS via FRED', ons: 'UK ONS', dosm: 'DOSM', singstat: 'SingStat', bis: 'BIS', oecd: 'OECD MEI via FRED', rba: 'ABS via RBA', us: 'FRED', id: 'BPS', wdi: 'World Bank WDI' };
const label = id => SRC[id.split('-')[0]] || id;
const first = (...ids) => { for (const id of ids) { if (!id) continue; const h = Array.isArray(id) ? hist(...id) : hist(id); if (h && h.pts.length > 3) return h; } return null; };

function gdpHist(iso, src) {
  const map = { 'Eurostat': `euro-${iso}-gdp`, 'IMF IFS via FRED': `imf-${iso}-gdp`, 'UK ONS': `ons-${iso}-gdp`, 'DOSM': `dosm-${iso}-gdp`, 'SingStat': `singstat-${iso}-gdp`, 'BEA via FRED': 'us-gdp' };
  return first(map[src], `gem-${iso}-gdp`, `euro-${iso}-gdp`, `imf-${iso}-gdp`);
}
function cpiHist(iso, src) {
  const map = { 'Eurostat': `euro-${iso}-inflation`, 'UK ONS': `ons-${iso}-inflation`, 'DOSM': `dosm-${iso}-inflation`, 'SingStat': `singstat-${iso}-inflation`, 'ABS via RBA': 'rba-AUS-inflation', 'BLS via FRED': 'us-cpi', 'World Bank GEM': `gem-${iso}-inflation` };
  return first(map[src], `bis-${iso}-inflation`, `gem-${iso}-inflation`);
}
const policyHist = iso => first(`bis-${EMU.has(iso) ? 'EMU' : iso}-policy-M`);
const yieldHist = iso => iso === 'USA' ? first(['us-10y', true]) : first(`euro-${iso}-yield`, `oecd-${iso}-yield`);

const out = {}, log = [];
const latest = {
  gdp: Object.fromEntries(A.gdp.map(r => [r[0], { v: r[2], per: r[3], f: r[4], src: r[5], stale: r[6] }])),
  cpi: Object.fromEntries(A.cpi.map(r => [r[0], { v: r[2], per: r[3], f: r[4], src: r[5], stale: r[6] }])),
  policy: Object.fromEntries(rates.policy.map(r => [r[0], { v: r[1], per: r[2], f: r[3], src: r[4], stale: r[5] }])),
  yield: Object.fromEntries(rates.yield.map(r => [r[0], { v: r[1], per: r[2], f: r[3], src: r[4], stale: r[5] }])),
};
const isos = new Set([...Object.keys(latest.gdp), ...Object.keys(latest.cpi), ...Object.keys(latest.policy), ...Object.keys(latest.yield)]);
for (const iso of isos) {
  const c = { name: names[iso] || iso };
  for (const [ind, fn] of [['gdp', gdpHist], ['cpi', cpiHist], ['policy', policyHist], ['yield', yieldHist]]) {
    const L = latest[ind][iso]; const h = fn(iso, L?.src);
    if (!L && !h) continue;
    c[ind] = { ...(L || {}), hist: h ? h.pts : [], histSrc: h ? label(h.id) : '', histId: h?.id || '' };
    if (L && h) {
      const lp = h.pts.at(-1), gap = Math.abs(lp[1] - L.v);
      if (gap > 0.15) log.push(`${iso} ${ind}: latest ${L.v} (${L.per}, ${L.src}) vs history end ${lp[1]} (${lp[0]}, ${h.id})`);
    }
  }
  const wdi = {};
  for (const k of ['unemployment', 'currentAccount', 'reserves']) {
    const s = series[`wdi-${iso}-${k}`]; if (!s) continue;
    const o = (s.observations || []).filter(o => Number.isFinite(o.value)).at(-1);
    if (o) wdi[k] = { v: Math.round(o.value * 100) / 100, year: (toDate(o) || '').slice(0, 4), unit: s.unit || s.spec?.unit || '' };
  }
  if (Object.keys(wdi).length) c.wdi = wdi;
  out[iso] = c;
}
fs.writeFileSync(outFile('countries.js'), '// Built from the Office snapshot (.pages-data) and the atlas computed with the app code.\nwindow.COUNTRIES=' + JSON.stringify(out) + ';\n');
console.log('countries', Object.keys(out).length, 'bytes', fs.statSync(outFile('countries.js')).size);
console.log('history coverage', ['gdp', 'cpi', 'policy', 'yield'].map(k => k + ':' + Object.values(out).filter(c => c[k]?.hist?.length).length).join(' '));
console.log('MISMATCHES (latest vs history end, >0.15pp):\n' + log.join('\n'));
const u = id => series[id] && (series[id].unit || series[id].spec?.unit);
console.log('units:', ['gem-IDN-gdp', 'bis-IDN-inflation', 'bis-IDN-policy-M', 'euro-DEU-yield', 'us-gdp', 'us-cpi', 'wdi-IDN-reserves', 'wdi-IDN-currentAccount', 'imf-IND-gdp', 'rba-AUS-inflation'].map(id => id + '=' + u(id)).join(' | '));
