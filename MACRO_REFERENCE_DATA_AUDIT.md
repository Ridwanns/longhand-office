# Macro content review and Longhand adaptation

Coverage reviewed 19 October 2026, Asia/Jakarta.

## What was actually inspected

This inventory records macro coverage and the independently sourced Office implementation. Institutional sources, units, frequencies and availability are checked separately from interface behavior. No account settings, trades or private records are changed.

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

This exposes existing data that was previously fragmented between annual history, advanced tables, rate references and liquidity views. Source and analytical gaps remain explicit.

## Preservation

No providers, collectors, financial formulas, saved-model hashes, database schemas, local storage keys or investment records changed. Pure presentation adapters read the existing validated context, releases and additional-coverage snapshots. Source arrays remain unchanged through country, group, indicator and history changes.

## Verification

- Node tests cover source and period preservation, exact annual units, unavailable versus genuine zero, no US data leakage into Indonesia, and later missing annual observations.
- A fresh browser context checks Economic data across Indonesia, US, euro area, Malaysia, Brazil and World; every displayed group and actual indicator selection; source links or honest no-history state; payroll units; reserve definition; responsive widths 1440, 768, 390 and 320; source-array preservation; and browser errors.
- Existing macro navigation, chart and source contracts remain unchanged. Exact run results are recorded separately in validation outputs.

## Remaining gaps

No nowcasting, consensus surprise feed, GDP sector/expenditure decomposition, Indonesia fiscal/credit/housing/PMI feed, comprehensive international release calendar or market-implied policy path was added. Adding those requires separately verified source acquisition, definitions, frequency alignment and, for models, independent validation. More source names or empty dashboard cards would not close those gaps.

## Detailed placement review, 19 October 2026

The reference Indonesia Overview and Economy pages were inspected visually from the header through the quad, sensitivity and external-balance sections. Its useful placement patterns are: a compact title/date row; stable subject navigation; related information in two columns; latest reading beside its chart; quad state, frequency counts and chronological path together; and definitions/backtest detail on demand. The reference itself contains substantial scrolling, so Office adopts its grouping rather than copying its entire page length or oversized headline values.

Applied to Office:
- One Macro title and one shared country filter on the same desktop header row.
- World map remains first, with four actual sourced readings adjacent on desktop rather than pushed below a full-width map. Mobile stacks the same content.
- Four named annual quadrants, a selected-year inspector, observed-state counts, and a selectable annual path are one analytical section. Counts describe the last twelve valid annual observations, not probabilities or quarterly forecasts. Exact zero changes remain unclassified on an axis.
- All previous sources, mathematical inputs, legacy routes and detailed views remain accessible. No projection, consensus, nowcast or forward signal was added.

Placement regression checks cover a single heading, aligned desktop header, map/readings adjacency, all four quad names, year-label clicks, state counts, responsive widths 1440/1180/1024/768/390/320, and browser errors. Existing economic-explorer, navigation, exact-source and cycle-value checks were rerun.

## Direct-view revision

User feedback: primary macro data must be visible immediately, rather than hidden inside panels. Economy now opens Monitor by default. The overview also shows the monitor directly below the first-position world map.

The direct view places four dated sourced readings above a two-column analysis layout: the existing observed annual quad on the left, GDP and CPI history on the right. Country headings update with the shared filter. Regular internal navigation is reduced to Monitor and Economic data; prior specialist views remain available in Other views. Method tables remain secondary. Missing coverage, old acquisition/period flags and separate historical sources stay explicit.

The palette now uses a neutral navy page, blue-grey data surfaces, restrained blue/teal chart accents and coral for negative bars. Headline text uses clear sans-serif hierarchy while the Office identity remains in its header/sidebar. Primary values remain 20 px and native chart axes retain the existing screen-size fitting.

Verification: the direct-view browser suite checks immediate visibility without opening disclosures, four readings, both historical charts and the annual quad, two desktop columns, country switching, legacy source selection, inline year interaction, detailed indicator access, seven responsive widths, both themes, unchanged source arrays, and an immediately visible overview monitor. Existing source, navigation, quad and advanced-access suites were rerun.
