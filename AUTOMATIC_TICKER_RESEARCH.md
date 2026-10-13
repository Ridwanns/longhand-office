# Automatic ticker research

Implemented and tested 13 October 2026. **Quant Lab → Start with a ticker** is the default entry point. Type a complete US or IDX symbol and pause for 1.1 seconds, or press Enter. The application does not analyse a default demonstration instrument on page load.

## What happens automatically

- Resolve the exact symbol against the full published instrument directory. `BBCA` and `ADRO.JK` detect IDX; `BRK.B` normalizes to `BRK-B`. `US:` and `IDX:` provide an explicit market. Symbols listed in both markets require a choice; unknown symbols never substitute another stock.
- Fetch a dated, validated Yahoo quote and its actual recorded change reference. Show currency, observation date and publication time. Missing prices remain unavailable. Observations/publications older than 24 hours are flagged, including market closures.
- Retrieve up to 253 actual adjusted daily prices through the latest model-eligible cutoff where available. Compute sample simple-return annualized volatility, adjusted-price cumulative return and maximum drawdown. Missing/newer ineligible rows are not filled. Risk-free ratios remain unavailable without a supplied rate.
- Start the existing core models when the publication has at least 350 eligible completed observations. Defaults: adjusted basis, 20-session scenario horizon, seed `20261013`, published eligible cutoff. Models, progress and results remain below the ticker desk on the same page. AR(1), Ridge, zero/mean baselines, chronological evaluation and seeded scenarios retain the existing calculation contract. Price coverage and model coverage remain independent.
- Save the descriptive study automatically in a separate, path-scoped IndexedDB ticker archive. Core models continue to save in the existing browser archive (Pages) or SQLite (Node edition). Reload shows the latest retained study without creating a duplicate run. Custom model controls are collapsed but keyboard accessible.

Changing the ticker invalidates pending callbacks and hides previous model output until the new instrument is ready. Concurrent requests cannot put an earlier stock's result under a later stock's name. Selecting a saved source study does not fetch new data or start a new model run. Refresh explicitly reads the current public publication and creates a new saved study/run.

## Backup and privacy

**Export ticker archive** retains source quotes, adjusted prices, descriptive outcomes, formula versions and core-run references. Restore recomputes outcomes, rejects malformed/altered studies and conflicting IDs, and adds records atomically. It never replaces portfolios, theses, decisions or existing studies. Restored attribution is user supplied and unverified; arithmetic reconciliation is not source authentication.

Ticker backup is separate from the existing Office record backup. It does not import or embed core-run datasets/results: export the corresponding core analysis or the Office backup containing linked analyses before changing devices. Core references on another device require those separately retained runs. Manual Atlas/options/bonds/multi-instrument studies retain their existing standalone export workflow.

The ticker archive is currently capped at 200 studies; it never silently deletes earlier studies. A full archive or failed browser save reports the limitation. **Export this ticker study** remains available for the visible current result even if automatic storage fails. Browser clearing removes this archive. No cross-device/account synchronization is provided.

Only generated public `data/manifest.json`, `data/market.json` and allowlisted US/IDX history JSON paths are served by the local server. Personal databases/backups are excluded. Public data reads send no portfolios or investment notes. The local edition needs generated `.pages-data` files for the ticker overview; local core acquisition still uses its established Yahoo/Flowless adapters, with its own displayed provenance.

## What a stock ticker cannot supply here

This release does not connect licensed institutional SDKs, real-time streaming, financial statements/DCF assumptions, option contracts/rates or individual bond coupon/maturity terms. Frozen Market Atlas advanced studies are not silently relabelled as newly fitted models. Prices never update recorded portfolio valuations or create transactions automatically. No FX rates are invented.

The existing GitHub publication workflow runs every six hours on a best-effort basis; a browser request reads the latest successfully published vintage. Provider availability, publication delay and sufficient history remain explicit constraints.

## Verification

- **209 Node application checks**, including seven new ticker-resolution, independent arithmetic, backup/currency/identity and missing-data tests.
- **21 independent Python numerical checks** for the existing research engine and **4 local API checks**.
- **33 automatic ticker browser checks**: AAPL/NVDA/BBCA/ADRO/BRK-B, ambiguity, unknown and price-only symbols, independent volatility/return/drawdown arithmetic, stable defaults, reload without duplicate jobs, source-request races, fresh-context additive restore, atomic conflict/tamper rejection, four widths (1440/768/390/320), keyboard, reduced motion, unchanged Office record keys and GET-only public reads, explicit storage-failure reporting and standalone export/restore of an unsaved study.
- Existing **22 inline Quant checks**, **22 complete Investment Lab/linked-backup checks** and **38 research-toolkit checks** pass. Older controls tests explicitly open the now-collapsed optional controls.

Browser scripts: `tests/ticker-browser.mjs`, `tests/inline-quant-browser.mjs`, `tests/web-office-browser.mjs`, `tests/research-browser.mjs`. Screenshots and exported test archives remain ignored in `validation/`; they contain only isolated test/source records and are not published.
