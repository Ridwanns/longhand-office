// Build Sheet 03 Markets data: design/preview/markets-sheet.js (index) + design/preview/mk/<key>.json (per-instrument history).
// usage: node build_markets_sheet.mjs <repo>
import fs from 'fs'; import path from 'path';
const repo = process.argv[2]; const P = f => path.join(repo, '.pages-data', f);
const OUT = path.join(repo, 'design', 'preview'); fs.mkdirSync(path.join(OUT, 'mk'), { recursive: true });
const MH = JSON.parse(fs.readFileSync(P('market-history.json'), 'utf8'));
const QUOTES = JSON.parse(fs.readFileSync(P('market.json'), 'utf8')).quotes;
const RATES = JSON.parse(fs.readFileSync(P('official-rates.json'), 'utf8'));
const r4 = v => Math.round(v * 10000) / 10000;
const safe = s => s.replace(/[^A-Za-z0-9]/g, '_');
// Monday-to-Sunday weeks (epoch day 0 is a Thursday; 1970-01-05 is the first Monday), keeping each week's last session.
const weekly = pts => { const m = new Map(); for (const p of pts) { const k = Math.floor((new Date(p[0] + 'T00:00:00Z') - 4 * 864e5) / 6048e5); m.set(k, p) } return [...m.values()] };
// Calendar months, keeping each month's last session (a true month-end close).
const monthly = pts => { const m = new Map(); for (const p of pts) m.set(p[0].slice(0, 7), p); return [...m.values()] };
const since = (pts, days) => { if (!pts.length) return pts; const cut = new Date(new Date(pts.at(-1)[0] + 'T00:00:00Z') - days * 864e5).toISOString().slice(0, 10); return pts.filter(p => p[0] >= cut) };
function stats(pts) {
  const c = pts.map(p => p[1]), last = c.at(-1), at = n => c[Math.max(0, c.length - 1 - n)];
  const y = c.slice(-252), hi = Math.max(...y), lo = Math.min(...y);
  const pct = (a, b) => b ? r4((a / b - 1) * 100) : null;
  return { last: r4(last), date: pts.at(-1)[0], d1: pct(last, at(1)), m1: pct(last, at(21)), m3: pct(last, at(63)), y1: c.length > 252 ? pct(last, at(252)) : null, hi52: r4(hi), lo52: r4(lo), n: c.length, first: pts[0][0], spark: c.slice(-30).map(r4) };
}
function writeSeries(key, pts, extra = {}) {
  const daily = since(pts, 3 * 365), w = weekly(pts), mo = monthly(pts);
  fs.writeFileSync(path.join(OUT, 'mk', safe(key) + '.json'), JSON.stringify({ key, d: daily.map(p => [p[0], ...p.slice(1).map(v => v == null ? null : r4(v))]), w: w.map(p => [p[0], r4(p[1])]), m: mo.map(p => [p[0], r4(p[1])]), ...extra }));
}
const mhEntry = s => MH.entries.find(e => e.symbol === s);
// Completed sessions only (the app's policy): a point dated on the retrieval day counts only once the exchange's
// local clock had passed 17:00 at retrieval (fallback for regular-session end + 15 minutes). Intraday prices are dropped.
function completed(pts, q) {
  if (!pts.length || !q.retrievedAt) return pts;
  const tz = q.exchangeTimezoneName || 'America/New_York', at = new Date(q.retrievedAt);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(at);
  return pts.at(-1)[0] === day && hour < 17 ? pts.slice(0, -1) : pts;
}
function fromMH(sym, extra = {}) {
  const e = mhEntry(sym); if (!e) return null; const q = e.quote || {};
  const pts = completed((q.history || []).filter(h => Number.isFinite(h.close)).map(h => [h.date, h.close]), q);
  if (!pts.length) return null;
  writeSeries(sym, pts, { name: q.name, unit: q.unit, currency: q.currency, source: q.sourceUrl, retrieved: q.retrievedAt, provider: q.provider });
  return { sym, file: 'mk/' + safe(sym) + '.json', name: q.name || sym, unit: q.unit || '', currency: q.currency || '', exchange: q.sourceExchange || q.exchange || '', provider: q.provider || 'yahoo', retrieved: q.retrievedAt || '', ...stats(pts), ...extra };
}
function fromHistory(file, sym, market, extra = {}) {
  const fp = P(path.join('history', file)); if (!fs.existsSync(fp)) return null;
  const h = JSON.parse(fs.readFileSync(fp, 'utf8')); const rows = (h.rows || []).filter(r => r.complete !== false && Number.isFinite(r.adjustedClose ?? r.rawClose));
  const pts = rows.map(r => [r.date, r.adjustedClose ?? r.rawClose, r.rawClose ?? null, r.volume ?? null]);
  const q = QUOTES[`${market}:${sym}`]?.quote || {};
  writeSeries(market + ':' + sym, pts, { name: q.name || sym, cols: ['date', 'adjusted close', 'raw close', 'volume'], meta: h.metadata || {} });
  return { sym, file: 'mk/' + safe(market + ':' + sym) + '.json', name: q.name || sym, exchange: q.exchange || (market === 'idx' ? 'IDX' : ''), currency: q.currency || (market === 'idx' ? 'IDR' : 'USD'),
    unit: market === 'idx' ? 'IDR per share' : 'USD per share', snapshot: q.price ? { price: r4(q.price), date: q.marketDate, kind: q.priceKind || '' } : null, provider: 'Yahoo Finance history', ...stats(pts), ...extra };
}

const US = ['AAPL', 'MSFT', 'NVDA', 'BRK-B'].map(s => fromHistory(`US-${s}.json`, s, 'us')).filter(Boolean);
const IDX_WATCH = ['BBCA', 'BBRI', 'TLKM', 'ASII'];
const IDX_PICKS = ['BBCA', 'BBRI', 'BMRI', 'ADRO', 'TLKM', 'ASII', 'ANTM', 'ICBP'];
const IDX = [...new Set([...IDX_WATCH, ...IDX_PICKS])].map(s => fromHistory(`IDX-${s}.json`, s, 'idx')).filter(Boolean);
const INDICES = ['^JKSE', '^GSPC', '^IXIC', '^DJI', '^VIX'].map(s => fromMH(s)).filter(Boolean);
const BOND_ETFS = MH.entries.filter(e => e.category === 'bonds').map(e => fromMH(e.symbol)).filter(Boolean);
// commodity groups exactly as the Office catalogue
const catSrc = fs.readFileSync(path.join(repo, 'market-catalogue.js'), 'utf8');
const GROUP = {}; for (const m of catSrc.matchAll(/symbol:'([A-Z]+=F)',name:'[^']*',group:'(\w+)'/g)) GROUP[m[1]] = m[2];
for (const m of catSrc.matchAll(/\['([A-Z]+=F)', '[^']*', '(\w+)'/g)) GROUP[m[1]] = m[2];
const COMMODITIES = MH.entries.filter(e => e.category === 'commodities').map(e => fromMH(e.symbol, { group: GROUP[e.symbol] || 'Other' })).filter(Boolean);

// US Treasury curve: latest, one month and one year earlier, plus weekly history per maturity
const MATS = ['1 Mo', '1.5 Mo', '2 Mo', '3 Mo', '4 Mo', '6 Mo', '1 Yr', '2 Yr', '3 Yr', '5 Yr', '7 Yr', '10 Yr', '20 Yr', '30 Yr'];
const YRS = { '1 Mo': 1 / 12, '1.5 Mo': 1.5 / 12, '2 Mo': 2 / 12, '3 Mo': .25, '4 Mo': 4 / 12, '6 Mo': .5, '1 Yr': 1, '2 Yr': 2, '3 Yr': 3, '5 Yr': 5, '7 Yr': 7, '10 Yr': 10, '20 Yr': 20, '30 Yr': 30 };
const obs = RATES.observations.filter(o => o.rates);
const nearest = d => { let best = obs[0]; for (const o of obs) if (o.date <= d) best = o; return best };
const last = obs.at(-1), back = (days) => nearest(new Date(new Date(last.date + 'T00:00:00Z') - days * 864e5).toISOString().slice(0, 10));
const curve = o => MATS.filter(m => Number.isFinite(o.rates[m])).map(m => [m, YRS[m], o.rates[m]]);
const ust = { date: last.date, latest: curve(last), m1: { date: back(30).date, pts: curve(back(30)) }, y1: { date: back(365).date, pts: curve(back(365)) },
  source: RATES.sourceUrl, retrieved: RATES.retrievedAt, unit: RATES.unit, first: obs[0].date, n: obs.length };
const ustHist = {}; for (const m of MATS) { const pts = obs.filter(o => Number.isFinite(o.rates[m])).map(o => [o.date, o.rates[m]]); ustHist[m] = { d: since(pts, 3 * 365), w: weekly(pts), m: monthly(pts) } }
fs.writeFileSync(path.join(OUT, 'mk', 'ust.json'), JSON.stringify(ustHist));

const sheet = { builtFrom: `.pages-data market-history (${MH.publishedAt}), market.json, history/*.json, official-rates (${RATES.retrievedAt})`, indices: INDICES, us: US, idx: IDX, idxWatch: IDX_WATCH, idxPicks: IDX_PICKS, bonds: BOND_ETFS, commodities: COMMODITIES, ust, mats: MATS };
fs.writeFileSync(path.join(OUT, 'markets-sheet.js'), '// Generated by design/build/build_markets_sheet.mjs — do not edit by hand.\nwindow.MARKETS=' + JSON.stringify(sheet) + ';\n');
const size = fs.readdirSync(path.join(OUT, 'mk')).reduce((a, f) => a + fs.statSync(path.join(OUT, 'mk', f)).size, 0);
console.log('indices', INDICES.length, 'us', US.length, 'idx', IDX.length, 'bonds', BOND_ETFS.length, 'commodities', COMMODITIES.length, 'groups', [...new Set(COMMODITIES.map(c => c.group))].join('/'));
console.log('index bytes', fs.statSync(path.join(OUT, 'markets-sheet.js')).size, '| per-instrument files', fs.readdirSync(path.join(OUT, 'mk')).length, 'total', size);
console.log('UST', ust.date, ust.latest.map(p => p[0] + '=' + p[2]).join(' '), '| 1M', ust.m1.date, '| 1Y', ust.y1.date);
console.log('sample', US.map(u => `${u.sym} ${u.last} ${u.date} d1 ${u.d1}`).join(' | '));
console.log('idx', IDX.map(u => `${u.sym} ${u.last} ${u.date}`).join(' | '));
