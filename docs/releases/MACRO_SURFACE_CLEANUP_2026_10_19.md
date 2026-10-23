# Macro working-page cleanup — 19 October 2026

Local preview: http://127.0.0.1:4175/office/?preview=clean-macro-b7fa1bc7#market/macro/us/overview

## Changes corresponding to the supplied screenshots

1. Legacy GDP release/status tables are in More → Reference archive, with exact observations collapsed initially.
2. The legacy oversized GDP trend now uses the existing responsive native chart renderer with the original observations.
3. Original monitor note and refresh tools remain functional in Reference archive, outside the main working page.
4. Repeated monitor and map source stacks are removed from the working page. Source identities remain accessible through More → Sources and methods.
5. A duplicate instrument-chart instance in Cross market was removed. Indices, bonds and commodities now use the native chart renderer, with one chart title and compact controls. US and Indonesia stock renderers are retained.
6. Chart source explanations and the optional TradingView action are in Chart details. Rates definitions and alternate histories are in More → Instrument reference.

Cross market separates Instruments, US liquidity and Release calendar instead of stacking these workspaces. Existing destinations, original tools, source tables and exports remain accessible. These are organization and rendering changes, not a deletion of analytical capabilities.

## Validation actually completed

- Node tests: 554 passed, 0 failed, 0 skipped.
- Local API integration tests: 7 passed, 0 failed, 0 skipped.
- Seven isolated browser suites: 533 checks, no reported page errors. Breakdown: clean surface 40; visual audit 194; rates refinement 71; extended rates 134; compact navigation 19; historical charts 42; direct monitor 33.
- Browser checks cover dark/light layouts at 320, 390, 768, 1024 and 1440 pixels, keyboard access and dialog focus, responsive chart labels, legacy controls, source-value preservation, and synthetic storage preservation.
- GitHub Pages artifact built successfully with asset version b7fa1bc78c72ffaf. Build excludes private records, backend code and validation artifacts.
- Desktop and mobile screenshots were captured in fresh isolated browser contexts and visually inspected. Evidence: validation/clean-macro-desktop.png, validation/clean-market-desktop.png, validation/clean-market-mobile.png.

## Files changed for this cleanup

macro-ui.js; macro-context-ui.js; macro-atlas.js; macro-extended-ui.js; market-terminal.js; market-view.js; market-data.css; macro-context.css; tests/macro-clean-surface-browser.mjs; tests/macro-visual-audit-browser.mjs; tests/rates-refinement-browser.mjs; tests/macro-extended-browser.mjs; tests/macro-compact-browser.mjs.

Earlier uncommitted data and interface work is also present in the working tree and is documented separately in MACRO_REFINEMENT_AUDIT_2026_10_19.md and RATES_CURRENCY_AUDIT_2026_10_19.md.

## Preservation and limits

No database or browser-storage migration, storage reset, model hash change or financial mathematics change was introduced by this cleanup. Browser tests used isolated contexts and synthetic sentinel records, not owner investment records. Source observations and missing-data semantics are retained; sampled display does not replace exact source rows.

This is a local preview, not a deployment. Published snapshots are not a real-time stream. Missing sources remain unavailable. Passing checks do not establish absence of every possible bug. No commit, push, merge or deployment was performed.
