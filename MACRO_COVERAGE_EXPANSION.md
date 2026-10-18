# Official macro coverage expansion

18 October 2026. Baseline application commit `0e67c86`.

## Verified problem and scope

The regional GDP/CPI feed was already connected, but most country policy rates and sovereign ten-year yields were not. Refreshing a browser cannot fill those gaps. The owner's open tab also had an older interface; a release-specific reload addressed that separately, without reading or changing investment records.

This change adds an independent public dataset and integrates its readings into the existing macro map, releases desk, country rates and source ledger. It does not change the original macro, 124-series regional release, or 293-series context dataset contracts.

## Sources and definitions

| Addition | Coverage | Definition |
| --- | --- | --- |
| BIS central-bank policy instruments | 30 economies, separate daily and monthly series | Source-selected target/repo/discount instrument or target-band midpoint. Original instrument metadata and breaks retained. Daily history begins in 2025; monthly history begins in 2000 where available. Monthly observations are end-of-period. |
| BIS published CPI annual changes | 35 economies | Published year-on-year rate, SDMX unit 771; never an index level or a rate calculated from rounded indices. Australia and New Zealand's interpolated monthly BIS series are explicitly excluded. |
| ECB via Eurostat | 9 economies/aggregates | Monthly average central-government convergence yields, around ten years, gross of tax. Euro-area aggregate is not a national sovereign yield. |
| Eurostat other ten-year yields | Japan and Türkiye | Published monthly Y10 government yields. |
| OECD via FRED | 8 economies | Monthly ten-year benchmark government yields, percent per annum, not seasonally adjusted. |
| Reviewed national releases | 9 series | Official China, India, Korea, Thailand, Australia and New Zealand CPI; dated Indonesian, Malaysian and Singaporean sovereign yields. Fixed review dates; they do not refresh themselves. |

Sources: [BIS policy data](https://data.bis.org/topics/CBPOL), [BIS API](https://stats.bis.org/api-doc/v2/), [BIS CPI documentation](https://www.bis.org/statistics/cp/cp_long_documentation.pdf), [Eurostat yield metadata](https://webgate.ec.europa.eu/eurostat/cache/metadata/en/irt_lt_mcby_esms.htm), [OECD data explorer](https://data-explorer.oecd.org/).

National sources are recorded in `sources/macro-extended-reviewed.json` with observation periods, explicitly known publication dates, fixed review times and notes. The source ledger exposes original definitions, acquisition/review dates and hashes. The hash for a reviewed record identifies the checked record file; it does not claim to be a hash of the original government webpage.

## Actual snapshot coverage

The local 18 October snapshot contains **123 added series and 43,436 observations**, with no failed series. Among 46 existing selectable economies/aggregates:

| Indicator | Connected choices | Missing choices |
| --- | --- | --- |
| Policy instrument | 35 | Singapore, Vietnam, World, Egypt, Nigeria, UAE, Brunei, Cambodia, Laos, Myanmar, Timor-Leste |
| Ten-year government yield | 23 | China, Thailand, Philippines, Vietnam, World, Hong Kong, Brazil, Mexico, Argentina, Chile, Colombia, Peru, South Africa, Egypt, Nigeria, Saudi Arabia, UAE, Russia, Brunei, Cambodia, Laos, Myanmar, Timor-Leste |
| Quarterly GDP | 40 | World, Brunei, Cambodia, Laos, Myanmar, Timor-Leste |
| Inflation | 45 | World |

“Connected” means an actual numeric observation exists. It does not mean every series is current or has identical frequency, definition or history. These counts include existing data. The added dataset contains 60 policy, 35 BIS CPI, 19 automatic yield and 9 reviewed series.

Examples checked directly against official releases: Korea September headline CPI 2.9% YoY, not 0.3% MoM or 2.8% core; Malaysia conventional MGS ten-year close 3.83% on 16 October, not its 3.48% coupon or the Islamic benchmark; Indonesian ten-year yield 7.17% is dated 15 September and remains flagged as old. Australian August CPI 4.0% is a real complete monthly release; New Zealand Q2 CPI 4.1% remains quarterly, with Q3 scheduled for 22 October. Singapore's exchange-rate framework is explained; SORA is not substituted for a policy target. ECB policy for euro-area members is explicitly identified as shared authority policy.

## Reliability and preservation

- New source parsing validates identity, units, frequency, confidentiality, status, dates, finite values and provenance. Missing values remain null. Zero and negative rates remain valid numbers.
- A newer national CPI release stays separate from the longer alternative history when source or basis differs. No cross-provider splicing or invented monthly New Zealand observations.
- Old acquisitions, old observations, provisional releases and later missing observations remain visible. Rechecking a file does not renew a manually reviewed observation.
- A failed additional feed leaves independent GDP, CPI and direct BI/US/ECB references available. Failed refreshes retain the original dated readings and timestamps. Integrity failures reject the affected additional dataset.
- The existing scheduled Pages workflow collects the new public feed and independently reconciles it before publication. Reviewed national entries need a new explicit review; scheduled builds do not claim to update them.
- No private-record database/schema, migration, export/restore contract, portfolio calculation, Quant model, saved study input, provider credential or trading interface is modified. Existing Quant/records regression workflows use fresh isolated browser profiles and TEST ONLY synthetic data.

## Validation and limitations

Independent Python CSV/JSON projections reconcile all 123 source series and 43,436 observations in the local snapshot. Automatic feeds are re-fetched; the nine reviewed series are reconciled to the fixed, separately checked source record file. This is not an independent second human verification of every national release.

Browser verification covers all 46 country choices for policy/yields, all GDP/CPI choices, source failures and retry, original routes, chart interaction, keyboard navigation, mobile widths down to 320 px, dark/reduced-motion settings, backup/restore and representative Quant workflows. Exact executed results and release verification are recorded with the completion report.

Executed before publication: 536 Node tests passed; 6 local API tests passed; 801 browser assertions passed against the built Pages preview and 134 against the isolated local Node edition (935 in total). Suites: original context 150, map 60, regional releases 142, charts 42, module cache 6, context failures 14, regional failures 6, interaction 28, investment workflow/backup 53, Quant navigation 59, workspace shell 99, extended coverage 134, extended failures 8; local extended coverage 134. No uncaught browser exceptions in these runs. Two existing test expectations needed adjustment for the intentional country-rates default and enlarged source ledger; their full suites were rerun successfully. Screenshots are local validation artifacts, excluded from the public build.

Data are published observations, not a real-time economic feed. Historical data are current-vintage and may be revised; they are not a point-in-time backtesting archive. Several yields are monthly averages or a single dated observation. Missing series and stale latest periods remain limitations rather than being replaced with neighbouring economies, coupons, forecasts or fabricated numbers. Charts cannot supply history that a verified source has not supplied.
