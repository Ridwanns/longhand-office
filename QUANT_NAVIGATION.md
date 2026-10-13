# Connected Quant Lab navigation

Implemented 14 October 2026 (Asia/Jakarta). The mathematical engines, retained runs, hashes, Office records and backup formats are unchanged.

Desktop now has a sticky left-hand directory beside the working area. On screens at or below 1,000 px, a compact sticky **Navigate study** selector replaces it. Both use the same destinations:

- Ticker/source desk, with the ticker input focused ready for typing.
- Scenarios, return models, GARCH/HAR volatility, HMM regimes, VaR/ES and benchmark exposure.
- Original core model details, including their preserved charts, comparisons and audit.
- Automatic company valuation, manual decision calculators, options/bonds/portfolio toolkit and the dated Atlas reference explorer.
- Saved core runs, advanced models, valuations and ticker snapshots.
- Office overview, Markets, separate Paper/Real portfolios, theses, decisions, Library and records/backups through the existing same-tab routes.

Within Quant Lab, navigation opens the necessary disclosures, selects the actual model or Atlas view, focuses the content and positions it below the mobile toolbar. It does not alter the analysis URL, submit a model run, download an Atlas reference dataset, load demonstration inputs or change portfolio records. Calculator and toolkit draft fields survive navigation between panels on this page. Their existing export-before-leaving/reloading behavior remains in force.

Current model view is highlighted and follows the existing model selector. The directory identifies the current study's market/ticker. Model shortcuts are disabled until their results exist; core details can become available before advanced fitting completes. Leaving a scenario through navigation stops its playback. Explicit jumps are immediate and work with reduced motion; ordinary scrolling remains browser-controlled.

## Verification

- **58 isolated browser checks** passed for sticky positioning, every Quant destination, automatic disclosure opening, matched selection/highlight/focus, unchanged run URL and saved model ID, unsaved calculator/toolkit drafts, disabled empty-state controls, keyboard Enter, mobile/touch selection and viewport widths 1440/1024/1000/768/390/320.
- All **eight Office destination routes** were additionally checked from the mobile menu. A verified prefix-slicing error in an early draft was fixed before release.
- Visible advanced chart axis labels remain at least ten rendered pixels after layout changes. Resize checks wait for the existing 150 ms responsive redraw.
- Existing **79 advanced model**, **27 automatic valuation**, **34 ticker**, and **22 complete Investment Lab/linked-backup** browser checks passed again. No JavaScript errors occurred; record keys were unchanged.
- **233 application tests** and **four local API tests** passed. Local servers were restarted only after verifying no active jobs and exact Office process ownership; databases were preserved.

Tests use fresh isolated contexts. Screenshots remain ignored under `validation/quant-navigation-desktop.png` and `validation/quant-navigation-mobile.png`. Navigation does not add account sync, new quantitative families or a unified backup; the existing archive boundaries stay explicit.
