// Build design/preview/macro-sheet.js for Sheet 02 Macro (Indonesia desk + world context).
// Every figure is computed from the Office snapshot (.pages-data); nothing is typed in by hand.
// Rules follow the app: latest reported value, change against the preceding consecutive period of the same series,
// freshness flags from coverageFreshness() (acquisition > 10 days; observation older than the cadence allows),
// quad = sign of growth change and inflation change.
// usage: node build_macro_sheet.mjs <repo> [dataDir=.pages-data] [now ISO]
import fs from 'fs'; import path from 'path';
const repo = process.argv[2];
const DATA = path.resolve(repo, process.argv[3] || '.pages-data');
const NOW = Date.parse(process.argv[4] || new Date().toISOString()), DAY = 864e5;
const D = f => JSON.parse(fs.readFileSync(path.join(DATA, f + '.json'), 'utf8'));
const S = {}; for (const f of ['macro', 'macro-context', 'macro-releases', 'macro-extended', 'macro-indicators']) for (const s of D(f).series) S[s.id] = { ...s, file: f };
const toDate = o => o.date || (o.period && (/^\d{4}-Q[1-4]$/.test(o.period) ? `${o.period.slice(0, 4)}-${String((+o.period[6] - 1) * 3 + 1).padStart(2, '0')}-01` : /^\d{4}-\d{2}$/.test(o.period) ? o.period + '-01' : /^\d{4}$/.test(o.period) ? o.period + '-01-01' : null));
const obs = id => (S[id]?.observations || []).map(o => ({ ...o, d: (toDate(o) || '').slice(0, 10) })).filter(o => o.d && Number.isFinite(o.value)).sort((a, b) => a.d < b.d ? -1 : 1);
const hist = (id, since = '0000', until = '9999') => obs(id).filter(o => o.d >= since && o.d <= until).map(o => [o.d, Math.round(o.value * 1000) / 1000]);
const weekly = pts => { const m = new Map(); for (const p of pts) { const k = Math.floor(new Date(p[0] + 'T00:00:00Z') / 6048e5); m.set(k, p) } return [...m.values()] };
const src = id => S[id] ? { id, url: S[id].sourceUrl || S[id].spec?.url || '', retrieved: S[id].retrievedAt || '', acquisition: S[id].acquisition || S[id].spec?.acquisition || '', unit: S[id].unit || S[id].spec?.unit || '', freq: S[id].frequency || S[id].spec?.frequency || '', retained: S[id].retainedFromGeneratedAt || null, refreshError: S[id].refreshError || null } : null;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const mIdx = d => +d.slice(0, 4) * 12 + (+d.slice(5, 7) - 1);
const label = (d, f) => f === 'Q' ? `Q${(+d.slice(5, 7) + 2) / 3} ${d.slice(0, 4)}` : f === 'M' ? `${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : f === 'A' ? d.slice(0, 4) : `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;
const cadence = { Q: 'Quarterly', M: 'Monthly', D: 'Daily', E: 'Decision dates', A: 'Annual · background', W: 'Weekly' };
// frequency: declared, or inferred from the spacing of the last two observations
function freqOf(id) {
  const f = S[id]?.frequency || S[id]?.spec?.frequency; if (f) return f;
  const o = obs(id); if (S[id]?.observations?.[0]?.period?.includes('Q')) return 'Q';
  if (o.length > 1) { const g = mIdx(o.at(-1).d) - mIdx(o.at(-2).d); return g === 3 ? 'Q' : g === 1 ? 'M' : g === 12 ? 'A' : 'D' }
  return 'M';
}
const consecutive = (a, b, f) => f === 'Q' ? mIdx(b) - mIdx(a) === 3 : f === 'M' ? mIdx(b) - mIdx(a) === 1 : f === 'A' ? +b.slice(0, 4) - +a.slice(0, 4) === 1 : true;
// same rule as the app's coverageFreshness()
const OBS_DAYS = { D: 10, W: 21, M: 75, Q: 210, A: 550, E: 120 };
function freshness(id) {
  const o = obs(id).at(-1), f = freqOf(id), s = S[id]; if (!o) return [];
  // the Macro desk dates a monthly or quarterly observation by its period start (matches the app's pulse flags)
  let end = o.d; if (f === 'A' && end.endsWith('-01-01')) end = end.slice(0, 4) + '-12-31';
  const out = []; if (NOW - Date.parse(end) > (OBS_DAYS[f] || 30) * DAY) out.push('Older observation');
  if (s.retrievedAt && NOW - Date.parse(s.retrievedAt) > 10 * DAY) out.push('Older acquisition');
  return out;
}
const unitWord = u => /%/.test(u || '') ? 'percentage points' : /Index/i.test(u || '') ? 'index points' : /Months/i.test(u || '') ? 'months' : (u || '');
const dp = v => { const s = String(v); const i = s.indexOf('.'); return i < 0 ? 0 : Math.min(2, s.length - i - 1) };
// the app formats figures with one or two decimals (18,130.0 · 1.1 · 3.43)
const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
// one pulse record, computed the way the app reads a series
function record(t, id, { u, since } = {}) {
  const o = obs(id), f = freqOf(id), unit = u || S[id]?.unit || S[id]?.spec?.unit || '';
  if (!S[id]) return null;
  if (!o.length) return { t, per: `Not reported · ${cadence[f] || ''}`, v: 'Not reported', u: unit, ch: 'No numeric observation', range: null, id, flags: [], note: 'No numeric observation supplied.', hist: [], src: src(id) };
  const last = o.at(-1), prev = o.at(-2), d = f === 'A' ? 2 : Math.max(dp(last.value), prev ? dp(prev.value) : 0);
  let ch = 'Previous consecutive observation unavailable', note;
  if (prev && consecutive(prev.d, last.d, f)) {
    const diff = Math.round((last.value - prev.value) * 100) / 100;
    ch = diff === 0 ? `Unchanged vs ${label(prev.d, f)}` : `${diff > 0 ? 'Up' : 'Down'} ${fmt(Math.abs(diff))} ${unitWord(unit)} vs ${label(prev.d, f)}`;
  } else if (o.length === 1) note = 'One reported observation · open source detail';
  const start = since || (f === 'A' ? '2002-01-01' : '2026-01-01');
  let h = hist(id, start); if (h.length < 3 && f === 'M') h = hist(id, '2024-07-01');
  const flags = freshness(id); if ((S[id].observations || []).some(x => !Number.isFinite(x.value) && (toDate(x) || '').slice(0, 10) > last.d)) flags.push('Later supplied period not reported'); if (S[id].refreshError) flags.push('Kept from the previous retrieval');
  return { t, per: `${label(last.d, f)} · ${cadence[f] || ''}`, v: fmt(last.value), u: unit, ch, range: h.length ? [label(h[0][0], f), label(h.at(-1)[0], f)] : null, id, flags, ...(note ? { note } : {}), hist: h, src: src(id), latest: last.d, releasedAt: last.releasedAt || null, sourceUrl: last.sourceUrl || S[id].sourceUrl || '' };
}

// ---- Economic pulse · Indonesia ----
const C = (() => { const win = {}; new Function('window', fs.readFileSync(path.join(repo, 'design', 'preview', 'countries.js'), 'utf8'))(win); return win.COUNTRIES })();
const idy = C.IDN?.yield;
const priority = [
  record('Real GDP growth', 'id-gdp', { u: '% YoY' }), record('Consumer price inflation', 'id-cpi', { u: '% YoY' }), record('Policy instrument rate', 'id-policy', { u: '% per year' }),
  record('Merchandise trade balance, official monthly release', 'id-trade-official'), record('Official reserve assets, month end', 'id-reserves-monthly'), record('Core consumer inflation', 'id-core', { u: '% YoY' })].filter(Boolean);
const groups = [
  { g: 'Policy and yields', items: [idy && Number.isFinite(idy.v) ? { t: 'Government bond yield', per: `${/^\d{4}-\d{2}-\d{2}$/.test(idy.per) ? label(idy.per, 'D') : idy.per} · ${cadence[idy.f] || 'Daily'}`, v: fmt(idy.v), u: '% per year', ch: 'Previous consecutive observation unavailable', range: null, id: null, flags: idy.stale ? ['Older observation or acquisition'] : [], note: `${idy.src} · one reported observation`, hist: [] } : null].filter(Boolean) },
  { g: 'Annual context', items: [record('Real GDP growth (annual)', 'wdi-IDN-gdp'), record('Consumer price inflation (annual)', 'wdi-IDN-inflation')] },
  { g: 'Labour and activity', items: [record('Unemployment, modelled ILO estimate (annual)', 'wdi-IDN-unemployment', { u: '% of labour force' })] },
  { g: 'External accounts', items: [record('Current account balance (annual)', 'wdi-IDN-currentAccount', { u: '% of GDP' }), record('Foreign direct investment, net inflows (annual)', 'wdi-IDN-fdi', { u: '% of GDP' }), record('Total reserves including gold (annual)', 'wdi-IDN-reserves', { u: 'USD bn' }),
    record('Reserve coverage of goods imports', 'id-import-cover'), record('Merchandise exports, customs FOB', 'id-exports', { since: '2024-07-01' }), record('Merchandise imports, customs CIF', 'id-imports', { since: '2024-07-01' }), record('Merchandise trade balance, matched customs months', 'id-trade-balance', { since: '2024-07-01' })] },
  { g: 'Currency references', items: [record('JISDOR, official Bank Indonesia fixing', 'id-jisdor', { since: (() => { const o = obs('id-jisdor'); return o.length > 10 ? o.at(-10).d : '2026-01-01' })() })] },
  { g: 'Activity and sentiment', items: [record('Consumer confidence', 'id-cci'), record('Consumer expectations', 'id-cei'), record('Current economic conditions', 'id-ceci'), record('Real retail sales growth', 'id-retail', { u: '% YoY' }),
    record('PMI-BI, quarterly manufacturing survey', 'id-pmi-bi'), record('Business activity, weighted net balance', 'id-business'), record('Production capacity utilisation', 'id-capacity'),
    record('Industrial production growth, seasonally adjusted', 'id-industrial', { since: '2024-04-01' }), record('Retail sales volume, GEM history', 'id-retail-gem')] },
  { g: 'Money and credit', items: [record('Broad money M2', 'id-m2'), record('Broad money growth', 'id-m2-growth', { u: '% YoY' }), record('Credit growth, BI monetary statistics', 'id-credit', { u: '% YoY' })] },
  { g: 'Inflation composition', items: [record('Volatile food inflation', 'id-food', { u: '% YoY' }), record('Administered prices inflation', 'id-admin', { u: '% YoY' })] },
].map(g => ({ ...g, items: g.items.filter(Boolean) }));
const missing = [
  ['S&P Global manufacturing PMI', 'Licensed monthly series not connected; quarterly PMI-BI stays separately labelled.'],
  ['Car and motorcycle sales', 'No validated association time series connected.'],
  ['Producer prices', 'No validated current national PPI time series connected.'],
  ['Foreign equity flows', 'No validated IDX exchange-wide net foreign-flow history connected.'],
  ['Indonesia CDS 5Y', 'No entitled CDS feed connected.'],
  ['Release consensus / surprise indices', 'No timestamped pre-release consensus archive connected. No surprises are inferred.'],
];
const all = [...priority, ...groups.flatMap(g => g.items)];
const numeric = all.filter(r => r.v !== 'Not reported').length;

// ---- Cycle analysis ----
const quad = (g, i) => ![g, i].every(Number.isFinite) || g === 0 || i === 0 ? null : g > 0 ? (i < 0 ? 1 : 2) : (i > 0 ? 3 : 4);
const QT = { 1: 'Growth accelerating, inflation easing', 2: 'Growth accelerating, inflation rising', 3: 'Growth slowing, inflation rising', 4: 'Growth slowing, inflation easing' };
const r2 = v => Math.round(v * 1000) / 1000;
const sgn = v => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(2);
const gdp = obs('id-gdp'), cpi = obs('id-cpi');
const lg = gdp.at(-1), pg = gdp.at(-2), lc = cpi.at(-1), pc = cpi.at(-2);
const latestQ = quad(lg.value - pg.value, lc.value - pc.value);
// quarter-aligned: GDP quarter vs prior quarter; CPI YoY in the last month of each quarter (BPS monthly series)
const qEnd = d => { const k = mIdx(d) + 2; return `${Math.floor(k / 12)}-${String(k % 12 + 1).padStart(2, '0')}-01` };
const cpiAt = d => (cpi.find(o => o.d === d) || obs('bis-IDN-inflation').find(o => o.d === d))?.value;
// the regime uses the latest quarter whose quarter-end CPI is already published
let rq = gdp.length - 1; while (rq > 0 && !Number.isFinite(cpiAt(qEnd(gdp[rq].d)))) rq--;
const RG = gdp[rq], RP = gdp[rq - 1], rc = cpiAt(qEnd(RG.d)), rcp = cpiAt(qEnd(RP.d)), rgq = quad(RG.value - RP.value, rc - rcp);
const ym = d => d.slice(0, 7);
// annual archive: WDI rates, change = year minus preceding year, last 12 valid points
const annual = (() => { const g = new Map(obs('wdi-IDN-gdp').map(o => [+o.d.slice(0, 4), o.value])), i = new Map(obs('wdi-IDN-inflation').map(o => [+o.d.slice(0, 4), o.value])), out = [];
  for (const y of [...g.keys()].sort()) if (g.has(y - 1) && i.has(y) && i.has(y - 1)) { const dg = r2(g.get(y) - g.get(y - 1)), di = r2(i.get(y) - i.get(y - 1)), q = quad(dg, di); if (q) out.push([y, dg, di, q]) } return out.slice(-12) })();
const cycle = {
  regime: { label: `${RG.d.slice(0, 4)} Q${(+RG.d.slice(5, 7) + 2) / 3}`, quad: rgq, text: (QT[rgq] || 'On an axis').replace(', ', ' · '),
    gdp: { ch: sgn(RG.value - RP.value) + ' pp', detail: `${ym(RG.d)}: ${RG.value}% · ${ym(RP.d)}: ${RP.value}%` }, cpi: { ch: sgn(rc - rcp) + ' pp', detail: `${ym(qEnd(RG.d))}: ${+rc.toFixed(2)}% · ${ym(qEnd(RP.d))}: ${+rcp.toFixed(2)}%` } },
  latest: { quad: latestQ, text: QT[latestQ] || 'On an axis', note: `GDP ${label(lg.d, 'Q')} · CPI ${label(lc.d, 'M')}${lg.d !== lc.d ? ' · Different reporting periods' : ''}`,
    gdp: { ch: r2(lg.value - pg.value), v: lg.value.toFixed(2) + '%', from: pg.value.toFixed(2) + '%', per: `${label(lg.d, 'Q')} vs ${label(pg.d, 'Q')}` },
    cpi: { ch: r2(lc.value - pc.value), v: lc.value.toFixed(2) + '%', from: pc.value.toFixed(2) + '%', per: `${label(lc.d, 'M')} vs ${label(pc.d, 'M')}` } },
  gdpHist: hist('gem-IDN-gdp', '2016-07-01').map(p => [p[0].slice(0, 7), p[1]]), cpiHist: hist('bis-IDN-inflation', '2016-09-01').map(p => [p[0].slice(0, 7), p[1]]),
  gdpLong: hist('gem-IDN-gdp').map(p => [p[0].slice(0, 7), p[1]]), cpiLong: hist('bis-IDN-inflation').map(p => [p[0].slice(0, 7), p[1]]),
  annual, method: "Each change is the reported annual rate minus the preceding year's rate. Both series must cover the same two years. Missing years break the path. The last twelve valid annual points are shown.",
  sources: { gdp: src('gem-IDN-gdp'), cpi: src('bis-IDN-inflation'), annualGdp: src('wdi-IDN-gdp'), annualCpi: src('wdi-IDN-inflation'), bpsGdp: src('id-gdp'), bpsCpi: src('id-cpi') },
  bps: { gdp: { v: lg.value, per: label(lg.d, 'Q'), released: lg.releasedAt || null, url: lg.sourceUrl || '' }, cpi: { v: lc.value, per: label(lc.d, 'M'), released: lc.releasedAt || null, url: lc.sourceUrl || '' } },
};

// ---- External winds · Indonesia (method as the app states it) ----
function swing(pts, mode) { // last 30-day move and its size in usual swings; weekly tape for a year
  const t = pts.map(([d, v]) => [Date.parse(d + 'T00:00:00Z'), v]);
  const prior = (i, days) => { const target = t[i][0] - days * DAY; let j = i; while (j > 0 && t[j][0] > target) j--; return Math.abs(t[j][0] - target) <= 7 * DAY ? j : -1 };
  const chg = i => { const j = prior(i, 30); return j < 0 ? null : mode === 'bp' ? (t[i][1] - t[j][1]) * 100 : (t[i][1] / t[j][1] - 1) * 100 };
  const ratio = i => { const c = chg(i); if (c == null) return null; const lo = t[i][0] - 3 * 365 * DAY, prev = []; for (let k = 0; k < i; k++) if (t[k][0] >= lo) { const ck = chg(k); if (ck != null) prev.push(ck) } if (prev.length < 250) return null; const rms = Math.sqrt(prev.reduce((a, b) => a + b * b, 0) / prev.length); return { c, r: c / rms } };
  const end = t.length - 1, now = ratio(end), wk = [];
  for (let i = end; i >= 0 && wk.length < 52; i--) if (!wk.length || t[wk.at(-1)][0] - t[i][0] >= 7 * DAY - 1) wk.push(i);
  const tape = wk.reverse().map(i => { const x = ratio(i); return x ? [new Date(t[i][0]).toISOString().slice(0, 10), Math.round(x.r * 100) / 100] : null }).filter(Boolean);
  return { date: pts.at(-1)[0], ...now, tape };
}
const state = r => { const a = Math.abs(r); return a < 0.5 ? 'Calm' : (r > 0 ? (a >= 1.5 ? 'Strong headwind' : 'Headwind') : (a >= 1.5 ? 'Strong tailwind' : 'Tailwind')) };
const fxAll = D('fx-history'), fx = fxAll.entries.find(e => e.symbol === 'IDR=X');
const fxPts = (fx.observations || fx.history || fx.points || []).map(o => Array.isArray(o) ? o : [o.date, o.close ?? o.value]).filter(p => Number.isFinite(p[1])).map(p => [String(p[0]).slice(0, 10), p[1]]);
const wd = swing(hist('broad-dollar', '2021-06-01'), 'pct'), wy = swing(hist('us-10y', '2021-06-01'), 'bp'), wr = swing(fxPts.filter(p => p[0] >= '2021-06-01'), 'pct');
const olderObs = (date, days) => NOW - Date.parse(date + 'T00:00:00Z') > days * DAY;
const cell = (t, w, unit, id) => ({ t, d: label(w.date, 'D'), v: unit === 'bp' ? `${w.c >= 0 ? '+' : '−'}${Math.abs(Math.round(w.c))} bp` : `${w.c >= 0 ? '+' : '−'}${Math.abs(w.c).toFixed(2)}%`, state: state(w.r), note: `30 days · ${Math.abs(w.r).toFixed(1)}× usual swing${olderObs(w.date, 10) ? ' · older observation' : ''}`, id, tape: w.tape, ratio: Math.round(w.r * 100) / 100 });
const pol = obs('id-policy').at(-1), usp = obs('us-policy').at(-1);
const cells = [cell('US dollar, broad', wd, 'pct', 'broad-dollar'), cell('US 10-year yield', wy, 'bp', 'us-10y'), cell('Rupiah per US dollar', wr, 'pct', 'usdidr'),
  { t: 'Policy-rate gap', d: '', v: `${pol.value - usp.value >= 0 ? '+' : '−'}${Math.abs(pol.value - usp.value).toFixed(2)} pp`, state: 'Not scored', note: `Bank Indonesia ${pol.value}% (${label(pol.d, 'D')}) less effective US federal funds ${usp.value}% (${label(usp.d, 'D')}). A fact, not a verdict.` }];
const tail = cells.slice(0, 3).filter(c => /tailwind/i.test(c.state)).length, head = cells.slice(0, 3).filter(c => /headwind/i.test(c.state)).length;
const winds = { summary: `${tail} of 3 external winds lean in Indonesia’s favour${head ? `, ${head} against` : ''}. Each 30-day move is read against that series’ own typical move over three years.`, score: `${tail} of 3 tailwind`, cells,
  method: 'A rising US dollar, rising US 10-year yield or a weaker rupiah are the directions that have conventionally weighed on Indonesian assets, so they are labelled headwinds. That convention is a reading aid, not a measured effect on any holding, and it can fail. Usual swing is the root-mean-square of every earlier 30-day change in the previous three years, with at least 250 comparisons required. Prior points must fall within seven days of the target date. Calm below 0.5, headwind or tailwind from 0.5, strong from 1.5 usual swings. Sources: Federal Reserve Board via FRED; Yahoo Finance daily close. Observation dates differ by series and are shown on each cell. This is not a forecast or a recommendation.' };

// ---- Rates and currency ----
const bisD = obs('bis-IDN-policy-D').at(-1), bisM = obs('bis-IDN-policy-M').at(-1);
const rates = { decisions: hist('id-policy'), bisDaily: weekly(hist('bis-IDN-policy-D', '2025-01-01')), bisMonthly: hist('bis-IDN-policy-M', '2016-01-01').map(p => [p[0].slice(0, 7), p[1]]),
  jisdor: hist('id-jisdor'), usdidr: weekly(fxPts.filter(p => p[0] >= '2016-01-01')),
  yield10: idy && Number.isFinite(idy.v) ? { v: fmt(idy.v), per: `${/^\d{4}-\d{2}-\d{2}$/.test(idy.per) ? label(idy.per, 'D') : idy.per} · Daily`, src: idy.src, flags: idy.stale ? ['Older observation or acquisition'] : [] } : null,
  alternatives: [bisD && `BIS policy instrument rate · ${label(bisD.d, 'D')}`, bisM && `BIS policy instrument rate, end of month · ${label(bisM.d, 'M')}`].filter(Boolean),
  sources: { decisions: src('id-policy'), bisDaily: src('bis-IDN-policy-D'), bisMonthly: src('bis-IDN-policy-M'), jisdor: src('id-jisdor'), usdidr: { id: fx.id || 'IDR=X', url: fx.sourceUrl, retrieved: fx.retrievedAt, unit: fx.unit } } };

// ---- Compare economies: regional rows ----
const lastOf = (id, f) => { const o = obs(id).at(-1); return o ? [Number.isInteger(o.value) ? o.value.toFixed(1) : String(Math.round(o.value * 100) / 100), `${f === 'Q' ? o.d.slice(0, 4) + '-Q' + ((+o.d.slice(5, 7) + 2) / 3) : f === 'M' ? o.d.slice(0, 7) : f === 'A' ? o.d.slice(0, 4) : o.d} · ${f === 'A' ? 'Annual' : cadence[f] || ''}${o.status === 'estimate' ? ' · estimate' : ''}`] : null };
const withT = (a, t) => a ? [...a, t] : null;
const compareRegional = [
  { name: 'Euro area', kind: 'Regional series', gdp: withT(lastOf('eu-gdp', 'Q'), 'Real GDP growth'), cpi: withT(lastOf('eu-cpi', 'M'), 'HICP inflation'), policy: withT(lastOf('eu-policy', 'D'), 'ECB deposit facility rate'), yield: withT(lastOf('euro-EMU-yield', 'M'), 'Long-term government bond yield, monthly average') },
  { name: 'World', kind: 'Regional series', gdp: withT(lastOf('wdi-WLD-gdp', 'A'), ''), cpi: withT(lastOf('wdi-WLD-inflation', 'A'), ''), policy: null, yield: null }];
const coverageNote = 'New annual country coverage is supplied separately by World Bank WDI when the public context file is available. Existing monthly and quarterly feeds retain their definitions. Connected official policy and sovereign-yield series retain their own definitions, dates and monthly or daily frequencies. Missing data stays unavailable; annual data does not become a current quarterly release, and regional values are not assigned to countries.';

// ---- Regional context: Southeast Asia (WDI annual) ----
const SEA = [['IDN', 'Indonesia'], ['MYS', 'Malaysia'], ['SGP', 'Singapore'], ['THA', 'Thailand'], ['PHL', 'Philippines'], ['VNM', 'Vietnam']];
const region = SEA.map(([iso, n]) => { const o = obs(`wdi-${iso}-gdp`).at(-1); return o ? [iso, n, +o.d.slice(0, 4), Math.round(o.value * 100) / 100] : null }).filter(Boolean);
const regionHist = Object.fromEntries(region.map(([iso]) => [iso, hist(`wdi-${iso}-gdp`, '2002-01-01').map(p => [+p[0].slice(0, 4), p[1]])]));

// ---- US liquidity ----
const liquidity = { fed: weekly(hist('fed-assets', '2019-01-01')), tga: weekly(hist('treasury-cash', '2019-01-01')), rrp: weekly(hist('reverse-repo', '2019-01-01')), sources: { fed: src('fed-assets'), tga: src('treasury-cash'), rrp: src('reverse-repo') } };
const researchTools = ['Monitor', 'Economic data', 'Research briefing', 'Annual history', 'Growth and inflation', 'US liquidity', 'Release calendar'];

// ---- Sources ledger ----
const ledgerIds = [...new Set(all.map(r => r.id).filter(Boolean).concat(['gem-IDN-gdp', 'bis-IDN-inflation', 'bis-IDN-policy-D', 'bis-IDN-policy-M', 'broad-dollar', 'us-10y', 'us-policy', 'fed-assets', 'treasury-cash', 'reverse-repo']))];
const ledger = ledgerIds.map(id => { const s = src(id); if (!s) return null; const o = obs(id); return { ...s, n: o.length, first: o[0]?.d || '', last: o.at(-1)?.d || '' } }).filter(Boolean);

const builtAt = new Date(NOW).toISOString();
const out = { builtFrom: `Office snapshot (${path.basename(DATA)}), computed ${builtAt.slice(0, 10)}`, builtAt, pulse: { country: 'IDN', summary: `${priority.length} priority indicators · ${numeric} of ${all.length} connected records have a number.`, priority, groups, missing }, cycle, winds, rates, compareRegional, coverageNote, region, regionHist, liquidity, researchTools, ledger };
const file = process.env.OUT_FILE || path.join(repo, 'design', 'preview', 'macro-sheet.js');
fs.writeFileSync(file, '// Generated by design/build/build_macro_sheet.mjs — do not edit by hand.\nwindow.MACRO=' + JSON.stringify(out) + ';\n');
console.log('pulse', priority.length, '+', all.length - priority.length, '| numeric', numeric, '| bytes', fs.statSync(file).size);
console.log('priority:', priority.map(r => `${r.t.split(',')[0]}=${r.v} (${r.per}) [${r.ch}] ${r.flags.join('/')}`).join(' | '));
console.log('cycle latest Q' + latestQ, JSON.stringify(cycle.latest.gdp), JSON.stringify(cycle.latest.cpi), '| regime', cycle.regime.label, 'Q' + rgq, JSON.stringify(cycle.regime.gdp), JSON.stringify(cycle.regime.cpi));
console.log('winds', cells.map(c => `${c.t}: ${c.v} ${c.state} (${c.note})`).join(' | '));
console.log('regional', JSON.stringify(compareRegional.map(r => [r.name, r.gdp, r.cpi, r.policy, r.yield])));
console.log('region', JSON.stringify(region));
