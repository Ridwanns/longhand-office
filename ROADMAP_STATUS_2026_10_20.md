# Continuing priorities 1–6

This preserves the six priorities accepted in the conversation. A completed interface release does not complete every research, provider or infrastructure requirement.

| Priority | Scope | Evidence and current limit |
| --- | --- | --- |
| 1 | Important data gaps | Source inventory and official Australia monthly CPI added; TTF source classification retained. Unavailable provider connections remain explicit. Macro supporting indicators reuse acquired country-specific observations with dates, units and provenance. This is not a new current national release for annual WDI data. |
| 2 | Portfolio reconciliation | Sourced splits, dividends, fee/tax cash flows, execution FX evidence and manual statement comparison implemented and tested. Cash-in-lieu, multi-account transfer consolidation and automatic broker integration remain incomplete. |
| 3 | Prospective prediction validation | Frozen registrations, actual 5/20-session outcome review, baseline scores and revision quarantine implemented. Real future outcomes and sufficient samples must arrive; code tests do not establish forecasting accuracy. Advanced-model registration and independently certified timestamps remain future work. |
| 4 | UI across pages | Current release addresses the reported macro whitespace with additional economic evidence. Overview, Markets, Research and Portfolio still need continued page/state review; this macro change is not a claim of a completed site-wide redesign. |
| 5 | Macro nowcasting | Not implemented. Current quarter-aligned regime and mixed-period latest-release momentum are descriptive. A nowcast requires dated input vintages, predeclared targets, independent evaluation and uncertainty estimates. Never relabel the existing regime as a nowcast. |
| 6 | Private vault across devices | Encrypted backups and optional private-service client exist. User has GitHub Pages only and no private server. Automatic synchronization is not active; selecting and configuring private storage remains necessary. Never put private records in the public repository. |

## Macro layout release

The large empty area below GDP/CPI history now contains up to six additional connected, relevant indicators. Indonesia currently has five: annual modelled ILO unemployment, annual current account, annual FDI inflows, annual reserves including gold, and daily JISDOR. Other economies keep their own available series. Missing or failed series do not get substituted with another country's data, duplicated primary metrics, zeroes, or forecasts.

Small charts use independent scales, calendar spacing and explicit gap breaks. Expandable histories retain exact observations, original units, source links and acquisition timestamps. Annual and daily periods remain separate; selecting a history range changes display only. No economic formula, source snapshot, portfolio record or prediction is changed by the layout release.

Local verification passed: 63 macro/chart/regime unit tests, 68 new browser checks for source values, exact histories, country boundaries, unavailable observations, keyboard inspection, 320–1660 px layouts and source immutability, plus 33 existing direct-monitor checks and the annual cycle readability/interaction suite. Desktop column ends remain within 250 px with the default closed details; opened evidence expands naturally without fixed-height clipping. Light and dark screenshots were inspected.

Additional regression suites passed: economic indicator explorer 71, regional release explorer 142, map/source navigation 60, context source-failure/retry 14, and regional source-failure/recovery 6. The latter two older scripts were aligned with the existing direct Monitor default and the explicit GDP/CPI view; their source outage and integrity assertions remain active.
