# UI and public-data audit · 20 October 2026 WIB

Local Office: http://127.0.0.1:4173/#overview

## Interface changes

- Markets uses its existing sidebar on desktop; the repeated category bar remains available on mobile.
- Source information and Investment reviews remain in Ctrl+K search and their original destinations, without duplicate sidebar entries.
- Research opens directly onto ticker entry. An empty instrument-context panel and disabled ticker actions no longer displace the working form. Selected and retained studies retain their context, sources and actions.
- Overview has readable count cards, clearer spacing and three working room links. Unbuilt Treasury/Governance cards are removed from the working module list; the architectural illustration keeps its original room labels.
- Controls, labels, tables and notes are larger. Focus, hover, responsive layouts and both themes remain available; reduced-motion settings are respected.
- Data Sources now has a collapsible directory of BPS, BI, BLS, US Treasury, ECB and World Bank sources. Provider authorization details are secondary to the source-selection form.
- Library now contains 14 public reports, including publications dated 15 and 19 October. The old hardcoded 12 October snapshot label is replaced with the actual latest publication date. A session refresh keeps its separate refresh label.
- Updated workspace modules and styles share the browser artifact's cache version.

Design reference: [Tremor dashboard templates](https://blocks.tremor.so/templates) and [component categories](https://blocks.tremor.so/blocks). Card hierarchy, compact navigation and progressive disclosure informed the implementation. No template code, package or paid asset was copied.

## Data actually acquired and checked

Stock acquisition completed 20 October at **01:54 WIB**; annual cash-flow acquisition completed at **01:59 WIB**. These are retrieval times, not trading-session or financial-statement dates.

| Public data | Verified scope | Explicit limits |
| --- | --- | --- |
| Market quotes | 8,590 entries; 8,570 pass quote identity, currency, price and timestamp validation | 20 source entries have no compatible price; no values substituted |
| Stock/ETF histories | 1,552 histories; raw and adjusted normalization checked across 2,318,392 usable observations | 1,523 eligible histories; 29 histories explicitly have no eligible model cutoff |
| Fundamentals | 8,368 source records; 8,348 matched priced scenarios | 3,671 earnings-eligible; 23 FCFE-eligible; missing and incompatible currencies remain withheld |
| Detailed annual cash flows | 34 requested instruments, 23 usable annual packets | Banks/financials, incompatible currencies and incomplete statements remain ineligible |
| Macro context | 293 series; independent reconciliation of 68,987 observations | Three series contain no numeric observations |
| Regional releases | 124 series; independent reconciliation of 21,574 observations | Eight series contain no numeric observations |
| Extended macro | 123 series; independent reconciliation of 43,436 observations | Manually reviewed releases retain their original review dates |
| Treasury | 199 dated rows; last available source observation 16 October | Retrieval is not a new observation or a live yield |
| FX history | Two histories, 5,216 observations | Provider snapshots, separate from official BI fixing references |
| Cross-market history | 11 histories, 27,543 observations | Provider timestamps and instrument types retained |
| Research catalogue | 14 report metadata entries; all 12 prior IDs retained | Report links are authored research, not verified live prices |

No failures were found by the final read-only dataset-contract audit. This verifies the acquired datasets and their published contracts; it does not certify every provider price against an exchange feed or refit every numerical model. The independent macro audits compare source observations separately from the production collectors.

Eight SEC annual-evidence requests returned HTTP 403 on this run. The previous unavailable evidence was retained without fabricated statements. Automated BPS acquisition is also restricted; the reviewed Indonesian observations keep their 16 October review date. Blank series, source failures and missing financial facts are not filled with inferred values.

Source examples: [BPS September inflation release](https://www.bps.go.id/en/pressrelease/2026/10/01/2623/the-year-on-year--y-on-y--headline-inflation-in-september-2026-was-recorded-at-3-28-percent-.html), [BI policy history](https://www.bi.go.id/en/statistik/indikator/bi-rate.aspx), [BLS September CPI release](https://www.bls.gov/news.release/archives/cpi_10142026.htm), [Treasury rates](https://home.treasury.gov/resource-center-data-chart-center/interest-rates), and [public Research catalogue](https://raw.githubusercontent.com/LonghandResearch/longhandresearch.github.io/main/reports/reports.js).

## Verification and preservation

- 555 Node tests and seven isolated local-API tests passed.
- Five isolated browser suites passed **540 checks**, with no JavaScript page errors: workspace refinement 167, Macro visual audit 194, clean surface 40, workspace shell 99, and investment workflows 40.
- Browser coverage includes 15 main destinations, 320/390/768/1024/1440 pixel widths, light/dark modes, keyboard navigation, modal focus, current/retained study workflows, and synthetic record preservation. Selected screenshots were visually reviewed.
- Public browser artifact built successfully. New stock data was acquired in a separate staging directory and validated before replacing the public cache.
- No changes to financial-engine files, storage keys, owner investment records or model contracts. Browser tests use fresh contexts and synthetic records; local API tests use port 4174.
- No commit, push or deployment performed. The running local Office and generated browser artifact include the changes; the existing hosted site has not been updated by this task.

Evidence is in `validation/workspace-data-audit.json`, `validation/ui-browser-audit-2026-10-20.json`, independent source-audit reports, refresh logs and screenshots. Public data caches and these validation artifacts remain excluded from Git.

To repeat the read-only data check: `node scripts/audit-workspace-data.mjs`. It reads public cache files and writes its receipt to `validation/`; it does not open the private vault.
