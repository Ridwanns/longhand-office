// Build design/preview/atlas.js with the app's own atlas selection code (release → extended → feed → context),
// run on a data snapshot. Source labels keep the short names the app shows on the map.
// usage: node build_atlas.mjs <repo> [dataDir] [now ISO] [--check]
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { pathToFileURL } from 'url';
const repo = path.resolve(process.argv[2] || '.'), data = path.resolve(repo, process.argv[3] || '.pages-data');
const nowIso = process.argv[4] || new Date().toISOString(), now = Date.parse(nowIso), check = process.argv.includes('--check');
const J = f => JSON.parse(fs.readFileSync(path.join(data, f), 'utf8'));
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const { releaseAtlasDatum } = await imp('macro-releases-ui.js');
const { extendedAtlasDatum } = await imp('macro-extended-ui.js');
const { atlasObservation } = await imp('macro-atlas-data.js');
const { contextAtlasDatum } = await imp('macro-context-math.js');
const feed = J('macro.json'), releases = J('macro-releases.json'), extended = J('macro-extended.json'), context = J('macro-context.json'), rates = J('official-rates.json');
const pick = (c, i) => { const r = releaseAtlasDatum(releases, feed, c, i, now, extended); if (r) return r; const a = extendedAtlasDatum(extended, context, c, i); if (a) return a; const e = atlasObservation(feed, c, i, rates); return e.series || e.available ? e : contextAtlasDatum(context, c, i) || e };
// the current extract gives the country list, names and the app's short source labels
const OUT = process.env.LH_SHEET_OUT; // optional: a folder for every generated sheet file (the Pages build uses it)
const atlasFile = OUT ? path.join(OUT, 'atlas.js') : path.join(repo, 'design', 'preview', 'atlas.js');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(atlasFile, 'utf8'), ctx); const OLD = ctx.window.ATLAS;
const SHORT = { 'World Bank, Global Economic Monitor': 'World Bank GEM', 'National sources; BIS long consumer prices database': 'BIS long CPI' };
const shortSrc = s => SHORT[s] || s;
const out = {}; let same = 0, diff = 0;
for (const ind of ['gdp', 'cpi', 'policy', 'yield']) {
  out[ind] = [];
  const countries = [...new Set((OLD[ind] || []).map(r => r[0]))];
  for (const iso of countries) {
    const name = OLD[ind].find(r => r[0] === iso)[1], o = pick(iso, ind);
    if (!o || !o.available || !Number.isFinite(o.value)) continue;
    const row = [iso, name, Math.round(o.value * 100) / 100, o.period, o.frequency, shortSrc(o.source), o.outdated ? 1 : 0];
    out[ind].push(row);
    if (check) { const was = OLD[ind].find(r => r[0] === iso); const a = JSON.stringify(was.slice(0, 5)), b = JSON.stringify(row.slice(0, 5)); if (a === b && was[6] === row[6]) same++; else { diff++; console.log('DIFF', ind, JSON.stringify(was), '->', JSON.stringify(row)) } }
  }
}
if (check) { console.log('check: same', same, 'diff', diff); process.exit(0) }
const head = `// Computed with the app's atlas code (macro-releases-ui, macro-extended-ui, macro-atlas-data, macro-context-math) on ${path.basename(data)}, ${nowIso.slice(0, 10)}.\n// [iso, name, value % YoY, period, frequency, source, stale]  stale = app flagged "outdated observation or acquisition"\n`;
fs.writeFileSync(atlasFile, head + 'window.ATLAS=' + JSON.stringify(out).replace(/\],\[/g, '],\n[') + ';\n');
console.log('atlas', Object.entries(out).map(([k, v]) => k + ':' + v.length).join(' '));
