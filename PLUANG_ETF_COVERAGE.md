# Pluang ETF catalogue verification

Checked 18 October 2026, Asia/Jakarta. This release expands listing discovery and navigation; it does not create a live Pluang market-data connection.

## Verified findings

The original ETF search was capped at 50 results. Filtering names for the word ETF also excluded funds named Trust, Fund or Shares. Further searches found products such as GLD, IBIT, SMH, SOXL, XLF and USIG. Exact ticker searches previously followed capitalization order, placing VT below unrelated stocks. The mobile watchlist's 365px scrolling panel clipped the embedded catalogue.

The reviewed snapshot contains 211 unique US fund candidates returned by 58 Pluang searches. Query names, returned counts, truncation flags, names, symbols and acquisition time are recorded in `pages/pluang-etf-catalogue.json`. Corporate shares, closed-end fund ACP, and explicitly labelled ETNs were excluded. Yahoo independently confirmed ETF instrument type, USD, exchange, ticker, price and observation time for all 211 in the local collection. AIPO now has valid prices and chart history but lacks the original 350-observation model minimum; it is retained without enabling models.

**Coverage limit:** Pluang search returns at most 50 rows and exposes neither catalogue pagination nor a total ETF count. These are all discovered and verified listings, not a certified exhaustive catalogue. The earlier assertion that 145 entries represented all Pluang ETFs was unsupported.

## Changes

- Preserve catalogue listings independently of price/history availability. Missing data remains visible and does not become zero or a substitute instrument.
- Keep the existing required research universe and all financial validation gates. Additional catalogue funds need not have 350 observations merely to appear in Markets.
- Add All stocks and ETFs, Verified ETFs, and Pluang fund catalogue filters. Exact ticker matches appear first; vendor names are searchable as well as the verified source name.
- Place the catalogue above the watchlist/chart layout, outside the constrained mobile watchlist. Preserve all existing control IDs and listeners.
- Show separate listing, price, chart and model coverage. Refresh rechecks the manifest. Initial loading no longer displays a misleading zero-instrument result.
- Keep prices attributed to Yahoo and dated. Pluang listing discovery is a reviewed snapshot; existing scheduled publication refreshes prices/history but does not autonomously refresh Pluang OAuth discovery.

## Validation actually run

- Existing Node suite plus catalogue tests: 453 passed, zero failed.
- ETF browser suite: 22 checks passed, including every one of the 211 tickers, exact-match ranking, five quote comparisons, keyboard access, reload, reduced motion, record preservation and catalogue geometry at 320, 390, 768 and 1440 pixels.
- Broad US/IDX browser suite: 40 checks passed, including PLTR and EMTK model execution and persistence. Updated stale test navigation and display text to the existing Research Lab and price units.
- Market availability/recovery browser suite: 20 checks passed, including invalid currency, missing manifest, unpublished watchlist entries and provider failure recovery.
- Complete published-universe replay: 6,072 model cases passed across raw/adjusted basis and 5/20-session horizons; zero model failures, missing required core histories, invalid supplied quotes or required quote failures. 8,737 quote records checked.
- Advanced publication verification: 16 cases passed.
- Valuation publication verification completed: 8,516 records checked; ineligible/undated/incompatible records remain withheld.
- Pages build completed with 1,547 histories. This local collection contains 211 Pluang listings, 211 valid prices, 211 chart histories and 210 model-ready histories.

All browser checks used fresh isolated contexts and synthetic private records. Source data collection writes only generated public market files. No storage schema, record migration, portfolio calculation, model mathematics, backup implementation, historical saved input or credential handling was changed. Local public-data receipts and desktop/mobile screenshots are in the ignored validation directory.

Deployment results and the final public coverage are verified after the Pages workflow completes; provider availability can differ between the local collection and the hosted build.
