# Macro content review and Longhand adaptation

Reviewed 19 October 2026, Asia/Jakarta. Reference: https://www.arthara.id/macro.

## What was actually inspected

The reference was opened in the browser, using its existing accessible session. Indonesia Overview and Economy, and the US, Europe, ASEAN and Global landing sections were inspected. This is an inventory of visible product content, not an audit of Arthara's underlying data accuracy or methodology. No account settings, trades or private records were accessed or changed. No reference data, proprietary forecast output, source code or charts were copied into Office.

| Observed reference content | Longhand adaptation and honest limits |
| --- | --- |
| GDP and CPI readings; quarterly and monthly cycle summaries | Existing national/release histories retain their actual frequency. Economic data groups GDP and CPI together. The existing annual cycle remains annual; it is not relabelled as a monthly/quarterly quad or nowcast. |
| Quad map, forecasts, sensitivity, reported versus projected points | Office retains its interactive four-quadrant annual observation view. Selectable year, focused connecting segment and optional full history. No new forecasts, projected quads, probability or surprise estimates are introduced. |
| Policy, real rates, government yields, currencies | Existing policy-instrument and government-yield series are exposed together. The US 2-year benchmark and dollar reference, and Indonesia JISDOR, are available in their actual geographic scope. No DXY label is applied to the Fed broad trade-weighted dollar index. |
| US labour, activity and market context | US unemployment, payroll employment, production, retail sales and weekly initial claims now have directly selectable native historical charts. Units remain percent, thousands, index levels or nominal USD billions as originally defined. |
| External balance, FDI, reserves | Current account, FDI net inflows and total reserves including gold are exposed through External accounts. These Office WDI series are ANNUAL, not monthly trade data or current monthly reserve releases. |
| Liquidity and credit | Existing US Fed assets, Treasury cash and reverse repo histories are exposed individually. The existing aligned-date liquidity proxy remains unchanged in its original workspace. No Indonesia M2, bank-credit or SRBI feed is fabricated. |
| Release calendar, consensus, surprise scores | Existing US BLS calendar is preserved. It is not presented as a complete multi-country consensus calendar. No economic surprise index or release forecast is fabricated. |
| GDP expenditure/sector decomposition; budget; housing; PMI/confidence | Not connected in the existing Office feeds. These are gaps, not values to infer from aggregate GDP or copy from the reference. |
| ASEAN country comparisons and Europe country/cycle views | Shared Office economy filter retains all 46 scopes and original source definitions. No ASEAN aggregate, cross-country quad forecast or sector recommendation is invented. |

## Concrete interface changes

Economy now includes **Economic data**. Choose a data group, select an actual connected indicator, and inspect ONE native chart alongside its latest reading and source. Groups are Growth and prices, Policy and yields, Annual context, Labour and activity, External accounts, Currency references, and US liquidity where applicable.

National headline readings and separate historical sources remain visibly distinguished. Annual data are explicitly marked annual in names, periods and chart captions. Source links, methods, acquisition dates, old-data flags and unavailable observations remain accessible. A missing numeric series displays Not reported; no zero substitutes or cross-country data fallback is used.

This exposes existing data that was previously fragmented between annual history, advanced tables, rate references and liquidity views. It does not claim to add all of Arthara's analytical capabilities.

## Preservation

No providers, collectors, financial formulas, saved-model hashes, database schemas, local storage keys or investment records changed. Pure presentation adapters read the existing validated context, releases and additional-coverage snapshots. Source arrays remain unchanged through country, group, indicator and history changes.

## Verification

- Node tests cover source and period preservation, exact annual units, unavailable versus genuine zero, no US data leakage into Indonesia, and later missing annual observations.
- A fresh browser context checks Economic data across Indonesia, US, euro area, Malaysia, Brazil and World; every displayed group and actual indicator selection; source links or honest no-history state; payroll units; reserve definition; responsive widths 1440, 768, 390 and 320; source-array preservation; and browser errors.
- Existing macro navigation, chart and source contracts remain unchanged. Exact run results are recorded separately in validation outputs.

## Remaining gaps

No nowcasting, consensus surprise feed, GDP sector/expenditure decomposition, Indonesia fiscal/credit/housing/PMI feed, comprehensive international release calendar or market-implied policy path was added. Adding those requires separately verified source acquisition, definitions, frequency alignment and, for models, independent validation. More source names or empty dashboard cards would not close those gaps.
