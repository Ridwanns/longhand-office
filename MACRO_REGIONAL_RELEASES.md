# Quarterly and monthly macro releases

Verified on 18 October 2026. This extends the existing Office; it does not replace annual context, the original release monitor, model inputs or private records.

## What changed

Economy opens **Latest releases** first. GDP is quarterly; inflation is monthly. Annual WDI history remains a separate tab. The economy selector groups ASEAN, Asia, Europe and the United States, with other existing economies still available.

The headline identifies the latest **numeric observation among connected sources**, its original period, institution, acquisition or fixed review date, and published release date where known. Derived YoY rates and official advance estimates are labelled. A later source period without a value is explicitly disclosed. It is never filled with zero or presented as a reported release.

One selected historical chart appears at a time. History source and range can be changed. Different providers, seasonal adjustments, classifications and reviewed release observations are never joined into a synthetic continuous line. Exact values, source methods and fingerprints remain available on demand. Public regional data has a separate download; it is not a private-record backup.

The original GDP/inflation thesis-note workflow retains its original source contract and observation periods. Selecting another economy now disables that original region's note button. Matching notes explicitly identify the original periods they will include.

## Connected sources

| Source | Actual implementation | Basis |
| --- | --- | --- |
| World Bank Global Economic Monitor | 44 individual economies, quarterly real GDP and monthly CPI, requested from 1999 to establish year-earlier comparisons from 2000 | GDP uses seasonally adjusted constant-price levels; CPI uses unadjusted all-items indices. YoY is derived only against the exact year-earlier calendar period. GEM may lag national releases. |
| Eurostat | Euro area plus Germany, France, Italy, Spain, Netherlands, Switzerland, Sweden, Norway, Denmark and Poland | Reported quarterly chain-linked GDP YoY, seasonal/calendar adjustment. Current monthly all-items HICP uses `prc_hicp_minr`, `coicop18=TOTAL`, `unit=RCH_A`. The discontinued classification is not spliced into 2026 history. |
| UK Office for National Statistics | Quarterly IHYR and monthly D7G7 | Reported quarterly real GDP YoY and monthly all-items CPI annual rate. Annual IHYP, QoQ IHYQ and quarterly CPI aggregates are excluded. Source vintage uses London calendar dates. |
| Department of Statistics Malaysia | Quarterly real GDP CSV and monthly overall CPI CSV | Real `growth_yoy` rows only; overall CPI YoY is derived from exact year-earlier indices. Nominal GDP, QoQ rows and individual CPI divisions are excluded. |
| Singapore Department of Statistics | M015631 and M213751 | Reported chained-2015-dollar GDP YoY, excluding the nominal row. All-items CPI YoY is derived from the current 2024-base history. |
| IMF International Financial Statistics via FRED | India, Japan and South Korea real GDP | Unadjusted real levels compared against their exact year-earlier calendar quarter. IMF IFS attribution and original FRED series are retained. These are not IMF forecasts. |
| Reviewed official releases | Malaysia and Singapore advance Q3 GDP; Vietnam estimated Q3 GDP and September CPI; Philippines September headline CPI | Reviewed 18 October 2026. Review dates do not renew during automatic collection. Missing publication dates remain missing. These releases are separate from automatic historical sources. |
| Existing original monitor | BPS Indonesia, BEA/BLS via FRED for the US, Eurostat/ECB for euro area | Existing definitions, mathematics, note evidence and source contracts remain unchanged. |

Primary references:

- [World Bank GEM catalogue and licence](https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0037798/global-economic-monitor)
- [Eurostat quarterly national accounts](https://ec.europa.eu/eurostat/databrowser/view/namq_10_gdp/default/table)
- [Eurostat current HICP](https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_minr/default/table)
- [ONS quarterly GDP YoY](https://www.ons.gov.uk/economy/grossdomesticproductgdp/timeseries/ihyr/qna)
- [ONS monthly CPI annual rate](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23)
- [DOSM real quarterly GDP](https://data.gov.my/data-catalogue/gdp_qtr_real), [monthly CPI](https://data.gov.my/data-catalogue/cpi_headline)
- [SingStat GDP](https://tablebuilder.singstat.gov.sg/table/TS/M015631), [CPI](https://tablebuilder.singstat.gov.sg/table/TS/M213751)
- [IMF India](https://fred.stlouisfed.org/series/NGDPRNSAXDCINQ), [Japan](https://fred.stlouisfed.org/series/NGDPRNSAXDCJPQ), [Korea](https://fred.stlouisfed.org/series/NGDPRNSAXDCKRQ)
- [Malaysia Q3 advance release](https://www.dosm.gov.my/uploads/release-content/file_20261016103547.pdf)
- [Singapore Q3 advance release](https://www.singstat.gov.sg/news/advance-gdp-estimate-3q2026)
- [Vietnam Q3 and September release](https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2026/10/thong-cao-bao-chi-tinh-hinh-kinh-te-xa-hoi-quy-iii-va-9-thang-nam-2026/)
- [Philippines CPI release](https://psa.gov.ph/price-indices/cpi-ir)

## Actual coverage and limitations

The regional snapshot contains **124 series and 21,573 dated observations**. **116 series contain numeric values**; eight remain wholly unavailable. Including the retained original monitor, quarterly GDP has numeric coverage for 40 of the 46 existing economy choices and monthly inflation for 42. Coverage does not mean a current national release is available everywhere.

At verification:

- Indonesia: original BPS GDP Q2 2026, CPI September 2026.
- Malaysia: reviewed advance GDP Q3 2026; automatic monthly CPI through August 2026.
- Singapore: reviewed advance GDP Q3 2026; automatic monthly CPI through August 2026.
- Vietnam: reviewed estimated GDP Q3 2026 and CPI September 2026.
- Philippines: GEM GDP Q2 2026; reviewed headline CPI September 2026.
- Thailand: GEM GDP Q2 2026 and CPI July 2026. These are not claimed to be the newest national releases.
- China, Japan, Korea, India and Hong Kong: connected quarterly GDP through Q2 2026; the connected GEM CPI histories currently end in July 2026.
- Euro area and the ten individual European economies above: quarterly GDP Q2 2026, monthly HICP September 2026.
- United Kingdom: ONS GDP Q2 2026 and CPI August 2026. ONS lists its next CPI release as 21 October.
- United States: original BEA-based GDP YoY Q2 2026 and BLS-based CPI YoY September 2026. [BEA schedules the Q3 advance GDP release for 29 October](https://www.bea.gov/news/schedule); it is not invented before publication.
- Brunei, Cambodia, Laos, Myanmar and Timor-Leste have no numeric quarterly GDP in the connected GEM response. Myanmar and Timor-Leste monthly CPI is much older, from 2018, and triggers the older-period warning. Their annual WDI context remains separate.
- Australia, New Zealand and Argentina have no numeric monthly CPI in this GEM response. No quarterly CPI or annual inflation is substituted.

The new collector runs with the existing six-hour Pages publication schedule. Rereading the published file does not force each statistics agency to issue a new release. The local edition reads the most recently collected public file. Manually reviewed releases require another actual review before their review date can change. This is scheduled macro publication data, not real-time streaming, a comprehensive national-release service, or a point-in-time vintage archive.

The attempted direct OECD price endpoint returned HTTP 500 during research; obsolete FRED OECD CPI series ended in earlier years. They were not added as supposedly current feeds.

## Verification performed

- 520 existing and new Node tests passed; 19 cover the regional release contract, independent arithmetic, exact source selection, seasonal/cadence identity and missing-data behaviour.
- Six isolated local API integration tests passed.
- 419 isolated browser checks passed: releases 141, existing context/navigation 150, historical charts 42, map/density 60, existing source failures 14, asset versioning six, regional outage/recovery six.
- Seven viewport widths, keyboard chart inspection, light/dark themes and reduced motion were exercised. No page overflow or uncaught errors occurred in those checks.
- An independent audit refetched the automatic source responses and reconciled all 21,573 observations across all 124 regional series. The five manually reviewed series are reconciled against the retained review file; their facts were separately checked in the official releases cited above. The auditor uses separate arithmetic and indexing code rather than importing collector projections. No mismatches were found within the stated floating-point tolerance.
- A further 211 isolated browser checks passed: investment workflow and complete backup restoration 53, Quant navigation and representative calculations 59, and workspace shell including original macro-to-thesis evidence 99. Total browser checks run for this release: 630.
- An isolated local-edition mobile check verified Malaysia Q3, German September HICP, the note scope guard and no overflow.
- Sixteen financial, storage, backup and original macro contract files remain unchanged against `dd129f9` after newline normalization. Nine financial source/build modules are byte-identical. No schema changes, record migration, storage reset, saved-study input changes or private-data publication occurred.

Browser screenshots and raw audit results are under the ignored `validation/` directory. Generated public snapshots remain ignored under `.pages-data/` and the build under `dist/`.

## Files

New public modules: `macro-releases-contract.js`, `macro-releases-ui.js`.

Collection and independent audit: `scripts/macro-releases-data.mjs`, `scripts/audit-macro-releases.mjs`, `sources/macro-regional-reviewed.json`.

Integration: `macro-context-ui.js`, `macro-context.css`, `scripts/build-pages.mjs`, `scripts/serve.mjs`, `scripts/pages-asset-version.mjs`, `.github/workflows/pages.yml`.

Tests: `tests/macro-releases.test.mjs`, `tests/macro-releases-browser.mjs`, `tests/macro-releases-errors-browser.mjs`, plus explicit Annual history selection and expanded-source expectations in the existing macro browser regressions.
