// Build design/preview/research-sheet.js for Sheet 04 Research Lab.
// Core model results are read READ-ONLY from the isolated TEST workspace database (port 4174).
// Advanced-model figures (GARCH, HMM, block bootstrap) are browser-retained in the app, so they are copied
// exactly as the app rendered them for run ccc89b32 on 13 Nov 2026.
import fs from 'fs'; import path from 'path'; import { DatabaseSync } from 'node:sqlite';
const repo = process.argv[2];
const db = new DatabaseSync(process.env.LOCALAPPDATA + '/LonghandOffice/test-data/office.sqlite', { readOnly: true });
const jobs = db.prepare('select id,status,created,config,body from jobs order by created').all().map(r => ({ id: r.id, status: r.status, created: r.created, config: JSON.parse(r.config), body: JSON.parse(r.body) }));
const r4 = v => Math.round(v * 1e6) / 1e6;
const pick = id => jobs.find(j => j.id === id);
const run5 = pick('ccc89b32-a133-405f-9517-3cd521e64311'), run20 = pick('55778584-04a1-4cf1-bf97-fd346ac31fbc');
function core(run) {
  const R = run.body.results, H = R.historical, obs = run.body.dataset.observations;
  const weekly = (arr, f) => arr.filter((_, i) => i % 5 === 0 || i === arr.length - 1).map(f);
  return {
    id: run.id, created: run.created, config: run.body.config, meta: { ...run.body.dataset.metadata, corporateActions: undefined },
    observations: R.observations, trainPeriod: R.trainPeriod, evaluationPeriods: R.evaluationPeriods, parameters: R.parameters,
    historical: { annualizedVolatility: H.annualizedVolatility, maxDrawdown: H.maxDrawdown, dailySigma: H.dailySigma, mean: H.mean, risk: H.risk,
      price: weekly(obs, (o) => [o.date, r4(o.price)]),
      drawdown: weekly(H.drawdowns.map((d, i) => [obs[i].date, d]), p => [p[0], r4(p[1])]),
      rolling: weekly(H.rolling.map((v, i) => [obs[i + 1]?.date, v]), p => [p[0], r4(p[1])]).filter(p => p[0]),
      ewma: weekly(H.ewma.map((v, i) => [obs[i + 1]?.date, v]), p => [p[0], r4(p[1])]).filter(p => p[0]) },
    forecasts: R.forecasts.map(f => ({ horizon: f.horizon, selection: f.selection, directionConvention: f.directionConvention, intervalConvention: f.intervalConvention, ranking: f.ranking,
      models: f.models.map(m => ({ name: m.name, prediction: m.prediction, priceReturn: m.priceReturn, rmse: m.rmse, mae: m.mae, directionAccuracy: m.directionAccuracy, count: m.count, interval: m.interval, parameters: m.parameters,
        scores: (m.scores || []).map(s => [s.origin, r4(s.prediction), r4(s.actual)]) })) })),
    simulation: R.simulation ? { seed: R.simulation.seed, paths: R.simulation.paths, horizon: R.simulation.horizon, process: R.simulation.process, interpretation: R.simulation.interpretation,
      bands: R.simulation.bands, selectedPaths: R.simulation.selectedPaths, terminal: R.simulation.terminal } : null,
  };
}
const advanced = { // as rendered by the app for run ccc89b32 (13 Nov 2026), browser-retained advanced study
  history: '2026-11-12', assessment: {
    quality: 'Only 13 twenty-session test windows. Evidence is limited.',
    risk: 'GARCH estimates 27.7868% annualized volatility. GARCH had the lowest historical variance loss on the same scored sessions. This compares risk estimates, not stock returns.',
    downside: 'Average loss in the worst observed 5% tail is 3.8233% over one session. The HMM higher-variance-state probability is 6.891%, filtered through 12 Nov 2026. Neither measure is a maximum-loss limit.' },
  garchVol: 27.7868, tailAvgLoss1d: 3.8233, hmmHighVar: 6.891,
  bootstrap: { process: 'Historical block bootstrap', paths: 5000, shown: 120, start: 354.880005, p05: [336.4031, -5.2065], p50: [357.1308, 0.6343], p95: [377.842, 6.4703], belowStart: 42.6,
    bins: { lo: 274.153889, width: 4.434271, counts: [5,0,0,4,0,0,0,5,0,14,18,28,57,114,256,351,468,631,730,811,580,412,213,124,96,16,22,23,15,0,0,7] },
    method: 'Five-session circular historical block bootstrap versus IID Gaussian zero-log-drift / last-60 sample volatility. xorshift32 and Box–Muller; not NumPy-identical draws. Pointwise bands are process assumptions, not calibrated market probabilities.' },
  methods: 'Core methods include AR(1), Ridge, Mean and Zero. Advanced methods cover return forecasts, volatility, market regimes, tail risk and scenarios. OLS, KNN, Boosting, GARCH, EWMA and HMM remain available. HAR and Kalman beta require matching source data. Unavailable analyses explain what is missing.',
  benchmark: 'Benchmark and factor exposure need a matching benchmark history on the same sessions and currency. Kalman beta and HAR require matching source data; unavailable analyses explain what is missing.',
};
// latest completed close from the Office snapshot history (the brief's risk figures below stay tied to the saved run)
const aaplRows = JSON.parse(fs.readFileSync(path.join(repo, '.pages-data', 'history', 'US-AAPL.json'), 'utf8')).rows.filter(r => r.complete && Number.isFinite(r.rawClose));
const aL = aaplRows.at(-1), aP = aaplRows.at(-2), aChg = (aL.rawClose / aP.rawClose - 1) * 100;
// One-year risk window of the saved run (last 252 adjusted daily returns): sample standard deviation × √252, peak-to-trough decline.
const rObs = run20.body.dataset.observations.filter(o => Number.isFinite(o.price)), yr = rObs.slice(-253);
const yrRet = yr.slice(1).map((o, i) => o.price / yr[i].price - 1), mean = yrRet.reduce((s, x) => s + x, 0) / yrRet.length;
const yrVol = Math.sqrt(yrRet.reduce((s, x) => s + (x - mean) ** 2, 0) / (yrRet.length - 1)) * Math.sqrt(252) * 100;
let peak = -Infinity, yrMdd = 0; for (const o of yr) { peak = Math.max(peak, o.price); yrMdd = Math.min(yrMdd, o.price / peak - 1) }
const yrWin = `${yr[0].date} → ${yr.at(-1).date}`, cutoff = run20.config.cutoff;
const brief = { // Investment brief for AAPL: price from the snapshot; volatility, drawdown and window computed from saved run 55778584
  ticker: 'AAPL', market: 'US', name: 'Apple Inc.', status: `Completed session, raw close · ${aL.date}`, price: `${aL.rawClose.toFixed(2)} USD`, priceNote: `${aL.date} · ${aChg >= 0 ? '+' : ''}${aChg.toFixed(3)}% vs ${aP.date} · risk figures below are from the saved run with cutoff ${cutoff}`,
  vol: `${yrVol.toFixed(3)}%`, volNote: 'Annualized from daily adjusted returns. This is risk, not expected return.', volWindow: yrWin,
  earningsYield: 'Unavailable', financials: 'Annual financials unavailable for this ticker.', sec: 'SEC evidence unavailable: SEC request HTTP 403. No replacement facts supplied. Attempted 2026-11-07T06:18:09.073Z.',
  valuation: 'Matching valuation is loading or unavailable. Another ticker’s valuation is not shown.',
  mdd: `${(yrMdd * 100).toFixed(3)}%`, mddNote: 'Adjusted price decline from peak to trough. This is not your portfolio loss.', returns: String(yrRet.length), window: yrWin, through: yr.at(-1).date,
  judgement: 'Write why the assumptions fit this business, what could invalidate them, and when you will review the evidence. A mechanical scenario does not establish an investment case.',
  caveat: 'Dated public snapshots, not live streaming. Fundamentals and DCF need financial statements and assumptions. Options need a contract and rates. Bonds need coupon and maturity terms. These are not inferred from a stock ticker. Your holdings and investment decisions are never generated automatically.' };
const catalogue = JSON.parse(fs.readFileSync(path.join(repo, 'catalogue.json'), 'utf8'));
const runs = jobs.map(j => ({ id: j.id, created: j.created, status: j.status, ticker: j.config.ticker, market: j.config.market, cutoff: j.config.cutoff, horizon: j.config.horizon, cachedFrom: j.body.cachedFrom || null, stage: j.body.stage }));
const out = { builtFrom: 'Isolated test workspace (port 4174) saved runs, read-only; app rendering of 13 Nov 2026; catalogue.json', brief, core5: core(run5), core20: core(run20), advanced, runs, catalogue };
const file = path.join(repo, 'design', 'preview', 'research-sheet.js');
fs.writeFileSync(file, '// Generated by design/build/build_research_sheet.mjs — do not edit by hand.\nwindow.RESEARCH=' + JSON.stringify(out) + ';\n');
const cat = Array.isArray(catalogue) ? catalogue : (catalogue.reports || catalogue.items || catalogue.entries || []);
console.log('bytes', fs.statSync(file).size, '| runs', runs.length, '| catalogue keys', Array.isArray(catalogue) ? 'array ' + catalogue.length : Object.keys(catalogue).join(','), 'items', cat.length);
console.log('h5 models', out.core5.forecasts.map(f => f.horizon + ':' + f.models.map(m => m.name + ' ' + (m.rmse * 100).toFixed(3)).join(', ')).join(' | '));
console.log('h20 models', out.core20.forecasts.map(f => f.horizon + ':' + f.models.map(m => m.name + ' ' + (m.rmse * 100).toFixed(3)).join(', ')).join(' | '));
console.log('sim5', JSON.stringify(out.core5.simulation.terminal).slice(0, 120));
