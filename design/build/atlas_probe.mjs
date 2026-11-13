// Probe: compute atlas values with the app's own selection code (no DOM), print one country.
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const repo = path.resolve(process.argv[2] || '.'), data = path.resolve(repo, process.argv[3] || '.pages-data');
const J = f => JSON.parse(fs.readFileSync(path.join(data, f), 'utf8'));
const imp = f => import(pathToFileURL(path.join(repo, f)).href);
const { releaseAtlasDatum } = await imp('macro-releases-ui.js');
const { extendedAtlasDatum } = await imp('macro-extended-ui.js');
const { atlasObservation } = await imp('macro-atlas-data.js');
const { contextAtlasDatum } = await imp('macro-context-math.js');
const feed = J('macro.json'), releases = J('macro-releases.json'), extended = J('macro-extended.json'), context = J('macro-context.json'), rates = J('official-rates.json');
const now = Date.parse(process.argv[4] || new Date().toISOString());
const obs = (c, i) => { const r = releaseAtlasDatum(releases, feed, c, i, now, extended); if (r) return r; const a = extendedAtlasDatum(extended, context, c, i); if (a) return a; const e = atlasObservation(feed, c, i, rates); return e.series || e.available ? e : contextAtlasDatum(context, c, i) || e };
for (const c of (process.argv[5] || 'IDN,USA,DEU').split(',')) for (const i of ['gdp', 'cpi', 'policy', 'yield']) { const o = obs(c, i); console.log(c, i, JSON.stringify(o, (k, v) => k === 'observations' || k === 'history' ? `[${v.length}]` : v).slice(0, 500)) }
