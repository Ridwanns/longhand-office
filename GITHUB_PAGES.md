# Longhand Office — working GitHub Pages edition

At the user's explicit request on 13 October 2026, [Ridwanns/longhand-office](https://github.com/Ridwanns/longhand-office) is now **public**. The Research repository and website remain public and separate. Pages is configured with GitHub Actions as its build source at [Longhand Office](https://ridwanns.github.io/longhand-office/).

The user requested working models and data rather than the earlier read-only design preview. The new browser edition retains the existing architectural UI and working Investment Lab. It runs the same quantitative mathematics inside browser Web Workers, stores runs/records locally and reads dated public market datasets prepared by GitHub Actions. It does not require a Node process on a visitor's device.

## Working features

- Paper and Real ledgers, supplied trade prices/fees, dated cash flows and manual valuations.
- Investment theses, published Research reports, linked decisions and append-only reviews.
- Source-labelled US/IDX snapshots, bond ETFs, commodity futures and indices.
- Historical risk, AR(1), Ridge, zero/mean comparisons, chronological evaluation and seeded scenarios for eligible equities/ETFs.
- Persistent immutable browser analyses, research attachments, complete export and validated atomic restoration into a browser IndexedDB vault.
- Existing architecture, light/dark themes, responsive tables, keyboard navigation and reduced-motion behavior.

## Data and computation

The default publication includes **12 US equity/ETF histories**, **8 IDX histories**, and **31 market-category quote entries**. These are real Yahoo chart observations with source timestamps, currency, adjustment definition and publication time. They are not invented prices or real-time streaming.

`scripts/pages-data.mjs` reads fixed Yahoo hosts without sending portfolio or journal data. The generated `.pages-data` directory is ignored by Git. The build packages only explicitly allowed client modules and these public market files into `dist/office`. Personal records, databases, backups, validation artifacts, credentials and backend scripts are excluded.

`Publish working Office` runs on `main` pushes, manually, and approximately every six hours at minute 17 UTC (about 01:17/07:17/13:17/19:17 WIB). GitHub can delay scheduled runs. Provider errors are preserved as unavailable, never substituted. A publication without any model-ready US or IDX history fails before deployment, leaving the preceding site in place.

The owner can add normalized tickers using the workflow's `us_tickers`/`idx_tickers` inputs. Additional inputs apply to that publication; subsequent scheduled runs use the documented defaults unless those defaults are edited. Unlisted symbols show an availability explanation rather than fabricated data.

Each run selects a ticker, cutoff, basis, horizon and seed and fits anew in a browser Worker. Web Crypto computes the same SHA-256 JSON hashes used by the Node edition. Config/history/analysis contracts are shared between both editions. There are two concurrent browser jobs with a bounded queue, cancellation, a 120-second worker limit, persisted events and leases for recovery when an owner tab closes. A lost owner can be recovered after its 20-second lease expires; no estimated progress percentages are invented.

The ticker buttons display an **explicit eligible cutoff**. The source currently has a missing IDX session on 12 October; the new 13 October row cannot be joined across that missing row. For BBCA, the displayed 9 October cutoff retains 361 eligible observations. Selecting a later inadequate cutoff fails honestly. It never silently changes a requested date or forward-fills a missing price. A model-ready cutoff searches the latest 60 eligible dates and requires at least 350 contiguous observations; it is a data-availability choice, not performance-based selection.

Yahoo-adjusted closes are retrieval-vintage proxies for splits/dividends. They differ from the owner-local Flowless split-like adjustment that excludes dividends. The local server's Flowless adapter is retained unchanged; the web edition uses explicit Yahoo provenance.

## Where personal records live

The website is public; **personal records are not published or synchronized to GitHub**. Initial records use a path-scoped browser key. Explicit **Back up & connect browser vault** retains the original browser record/recovery copy, downloads an export and moves active records into that browser profile's IndexedDB vault. Saves/restores use atomic transactions and revision checks; runs, original text and linked analyses remain recoverable after reload.

This is not an authenticated server account. There is no automatic sharing between your phone, laptop or another browser, and this app does not encrypt browser storage. Clearing site data removes that device's data. Keep complete exports. Other projects on the same GitHub Pages origin share the browser's origin boundary, so the path-scoped namespace is organizational separation, not an authentication boundary. For an authenticated synchronized family workspace, a server with authorization is still required.

The local port-4173 browser data and SQLite vault were not migrated, replaced or uploaded. To move your own records into the online edition, export locally, create a browser vault online and restore your export deliberately. No test performed this over the existing records.

## Verification and remaining limits

The application suite passes **157 tests**. The working browser Investment Lab passes the same **22-step full workflow** in fresh contexts, including export/restore with a linked completed analysis. AAPL and BBCA model results each pass **34 independent Python numerical checks**. All five market categories display actual source data. Additional browser storage/race/layout checks and live deployment receipts are recorded in `WEB_RELEASE_VALIDATION.md`.

Markets are published snapshots; refresh reloads the latest published file and does not open a streaming source. Model histories are limited to the published universe and retained five-year source window. Provider outages/rate limits can delay updates. Individual bonds/yields and a numerical macroeconomic indicator feed remain unconnected. Treasury/Governance remain planned. Forecasts/scenarios are statistical studies, not validated investment probabilities. No broker orders, automatic ledger corporate actions, FX conversion, tax lots or TWR/MWR were added.

## Build and publication

```powershell
npm run data:pages
npm run build:pages
```

Only `dist/office` is published by `.github/workflows/pages.yml`. The historical read-only entrance remains in `pages/preview.*` for reference and is not part of the working artifact. GitHub Pages remains static hosting; browser computation and dated public data make this edition functional without pretending it runs the Node/SQLite backend.
