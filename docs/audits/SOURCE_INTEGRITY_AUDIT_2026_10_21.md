# Primary IDX evidence and source-vintage integrity — 21 October 2026

## Delivered scope

The valuation view now has an independently dated issuer-filing reference for **10 companies**: BBCA, BBRI, BMRI, BBNI, TLKM, ASII, INDF, ICBP, ADRO and ANTM. The committed registry contains **19 official financial reports and 121 individually located facts**, with fiscal start/end, consolidated scope, currency, printed scale and rounding, PDF/printed page, original URL, review time and SHA256. The source locations and exact values are in `idx-primary-reviews.json`. This covers 10 of the 49 selected core IDX research companies; it does not certify all IDX listings. Unreviewed core tickers are listed explicitly in Data Sources.

All 19 basic EPS observations independently reconcile to reported owner profit and matching weighted-average shares within the reports' own rounding. A rounded million-share denominator is treated as a range, not as an exact integer denominator. Book value requires same-report owner equity and explicit issued **and** treasury shares; missing treasury shares are never assumed zero. Annual/YTD facts are not relabelled TTM and do not change the inputs or results in existing valuation archives. ADRO's USD statements are retained in USD, separately from IDR listing prices.

The publication pipeline reacquires the **known reviewed document URLs** and compares exact PDF bytes. A matching fingerprint confirms that reviewed file at the recorded check time; it is not certification of every financial assertion. Failed retrievals and changed bytes withhold the main reference cards. Previously reviewed evidence and its original review date remain inspectable. Finding a newer statement published under another URL still requires discovery and a new review; this is not a completed automatic filing-discovery service.

## Material source findings

- BBNI filings contain incompatible issued-share counts between the face statements and capital note. The review retains EPS, profit, equity and weighted shares, while withholding the point-in-time book-value denominator.
- BMRI's H1 2026 report changes consolidation scope after BSI deconsolidation from 1 February 2026. The qualification is retained rather than presenting growth as automatically like-for-like.
- Telkom FY2025 restates 2024 comparatives. Consolidated CFO, debt and reinvestment for a group with non-controlling interests are not automatically parent-owner FCFE.
- ADRO's reporting currency and discontinued-operation comparatives must retain their definitions. No USD-to-IDR EPS or cash-flow conversion is inferred.
- ANTM's exchange-hosted PDF is rewritten per request. Repeated research downloads had identical substantive decoded objects, page texts, drawing streams and rendered fact pages, but different modification dates/encryption material/PDF IDs. Its raw fingerprint is deliberately not relaxed or replaced with a random newer hash. Reacquisition may therefore be marked changed or unavailable, and the primary cards remain withheld until a reproducible content-verification policy is separately implemented.

Research copies, source-page checks, download/redirect receipts and the ANTM investigation remain in ignored `validation/idx-primary-banks/` and `validation/idx-primary-industry/`. Only factual public review records and derived source-status JSON are published; source PDFs, account data, sessions and credentials are not included. Pluang was read as an additional public-data comparator during research; its unspecified TTM/basis fields were not promoted to issuer-file matches or embedded as a new public browser API.

## Automated source-vintage checks

A bounded reader retains public JSON from the preceding verified Pages artifact, without extracting archive paths or copying private files. New stock/ETF and long-market histories are compared over their union of identities. Every exact raw/OHLC/volume or adjusted difference is counted, with capped sample evidence; no tolerance silently erases adjusted-price changes. Historical backfills, ordinary new sessions, completed dates withdrawn by the source, rolling-window expiries and unfinished sessions are distinguished. Baseline-only histories remain visible as unavailable. Retained long-history refresh failures preserve the failure reason and original acquisition time.

Source-provided exchange timezones remain distinct from the adapter's fallback formatting calendar. A missing source calendar is unverified, not promoted to confirmed New York time. A missing baseline, unchanged retained acquisition or older acquisition does not become a fresh comparison result. Saved model results retain their own original source vintage.

The local check against the previous public artifact surfaced withdrawn 20 October bars for multiple futures and historical backfills for CT/PL. These observations are reported, not replaced to make the audit pass. Counts can change after another provider acquisition.

Data Sources shows the actual comparison time, comparable/retained/unverified counts, raw versus adjusted changes, dated issuer acquisitions and older quote observations. Quote ages use the full market publication and are explicitly separate from the five-minute native-price feed. More than three calendar days is a descriptive age flag, not a declaration that an exchange release is late. The existing coverage download now also includes exact source-integrity evidence. Rechecking coverage fetches both reports, with a request-generation guard against stale responses.

## Validation

727 unit tests passed, including primary period/unit/page/fingerprint checks, all 19 EPS reconciliations, conservative book-value handling, backfills, missing histories, retained refresh failures and timezone provenance. The public snapshot/baseline Python suite passed seven tests, including archive traversal/private-file exclusion and exact macro bytes; four independent Python retention tests also passed. Browser checks cover issuer period selection, USD/IDR separation, in-page evidence, unchanged saved valuations, source failures, source-integrity export/recheck, private-record preservation and widths 320–1440 px. The existing automatic valuation, IDX quant, reading-details and analytics flows also passed their targeted regression suites.

## Source maintenance during publication

The first publication attempt stopped when FRED returned HTTP 200 HTML titled “Site Maintenance” at its CSV addresses, independently confirmed with Node and Python HTTPS clients. No malformed response was parsed into numeric data. Failed series in the four macro feeds now retain exact validated observations from the preceding successful full Pages artifact when available. Original source hashes, retrieval times, periods, flags, units and notes remain unchanged; only the failure, attempt time and prior assembly time are added. Missing/invalid/newer baselines cannot invent a replacement. Successful new series remain new; repeated failures never renew the original acquisition date.

The extended-source Python audit separately verifies each retained record against its exact prior artifact record, excluding only the three explicit retention annotations. Such checks are reported as continuity, never fresh source agreement. The local maintenance check independently reconciled 115 extended source/review reconciliations (including fixed reviewed records) and eight exact retained series; the separate forecast arithmetic audit passed 32,770 checks over 12 source cases. Source checks displays retained/unavailable macro counts and original acquisition dates. A new publication time does not establish source freshness.

The work strengthens source evidence and failure visibility. It does not establish licensed real-time prices, complete primary coverage of every company, perfect provider histories, or proven future forecasting accuracy.
