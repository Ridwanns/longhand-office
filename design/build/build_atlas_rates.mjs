// Build design/build/atlas-rates.json (policy rates and 10-year yields per country) with the app's own atlas selection code.
// Short labels: learned from the app's on-screen extract by matching each long source name (see LABELS below).
// usage: node build_atlas_rates.mjs <repo> [dataDir] [now ISO] [--check]
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
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
const OUT = process.env.LH_SHEET_OUT; // optional: a folder for every generated sheet file (the Pages build uses it)
const file = OUT ? path.join(OUT, 'atlas-rates.json') : path.join(repo, 'design', 'build', 'atlas-rates.json'), OLD = JSON.parse(fs.readFileSync(file, 'utf8'));
const labelsFile = path.join(repo, 'design', 'build', 'atlas-source-labels.json');
const LABELS = fs.existsSync(labelsFile) ? JSON.parse(fs.readFileSync(labelsFile, 'utf8')) : {};
const out = { note: `Computed with the app's atlas code on ${path.basename(data)}, ${nowIso.slice(0, 10)}. [iso, value, period, frequency, source, stale]` };
let same = 0, diff = 0;
for (const ind of ['policy', 'yield']) {
  out[ind] = [];
  for (const was of OLD[ind]) {
    const iso = was[0], o = pick(iso, ind);
    if (!o || !o.available || !Number.isFinite(o.value)) { if (check) console.log('UNAVAILABLE', ind, iso); continue }
    if (check && !LABELS[o.source]) LABELS[o.source] = was[4];
    const row = [iso, Math.round(o.value * 100) / 100, o.period, o.frequency === 'E' ? 'Decision' : o.frequency, LABELS[o.source] || o.source, o.outdated ? 1 : 0];
    out[ind].push(row);
    if (check) { if (JSON.stringify(row) === JSON.stringify(was)) same++; else { diff++; console.log('DIFF', ind, JSON.stringify(was), '->', JSON.stringify(row)) } }
  }
}
if (check) { fs.writeFileSync(labelsFile, JSON.stringify(LABELS, null, 1)); console.log('check: same', same, 'diff', diff, '| labels', Object.keys(LABELS).length); process.exit(0) }
fs.writeFileSync(file, JSON.stringify(out).replace(/\],\[/g, '],\n['));
console.log('atlas-rates', 'policy', out.policy.length, 'yield', out.yield.length);
