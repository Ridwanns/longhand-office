# Pluang MCP market-data trial

Tested locally on 16 October 2026, around 14:20 UTC / 21:20 WIB, using the connected Pluang MCP. This is a read-only connector trial, not an installed continuously refreshing Office feed. No orders, account balances, positions, or owner records were read or changed.

## Observed results

| Read | Result |
| --- | --- |
| Asset resolution | Apple resolved to US AAPL; Bank Central Asia resolved to Indonesian BBCA. |
| US quote | AAPL reference mid USD 345.25; previous regular close USD 342.00. Connector reported US regular market open. No quote event timestamp was returned. |
| IDX quote | BBCA last IDR 5,175 per share; previous close IDR 6,075. No quote event timestamp or market-session status was returned. Do not label this as a verified current live trade. |
| US daily OHLC | AAPL: 11 candles starting 1 October 2026, with the final candle starting 15 October and ending 16 October. Regular-session coverage only; volume absent, not zero. |
| IDX weekly OHLC | BBCA: 352 candles, starting 30 December 2019, although the request started 16 October 2016. Actual returned coverage must be displayed. |
| US fundamentals | AAPL valuation ratios, earnings, analyst estimates and compact financial summaries returned successfully. Currency USD. Period labels and actual/expected EPS must stay separate. |
| IDX fundamentals | BBCA ratios, corporate actions, annual and quarterly financials returned successfully in IDR. Earnings section explicitly says last updated 29 July 2026. |

Quotes above are historical receipts from this test, not continuously updated prices or trade offers. Price responses reported no failed or unrecognised symbols for these two resolved examples. This does not establish catalogue-wide coverage.

## Checks and defects in source interpretation

- All 352 BBCA weekly candles passed finite positive OHLC, high/low bounds, and strictly increasing candle-start checks. This does not verify split adjustments, dividends, completeness, or individual prints against exchange records.
- BBCA's final weekly candle has a future period-end boundary relative to the time of collection. A candle boundary is not an observation timestamp, and the current candle may be incomplete.
- BBCA annual cash-flow chart records contain `netCF: 0`, while their corresponding display tables contain nonzero figures. For 2025 the chart component values are operating 77,508,785,000,000; investing -33,690,926,000,000; financing -41,708,637,000,000 IDR. Their arithmetic sum is positive 2,109,222,000,000, while chart `netCF` is zero. Do not silently use this zero in valuation or overwrite it with an invented source value.
- Compact strings such as `Rp127.23T`, `13.02x`, and `48.65%` require explicit unit, scale, period, and missing-value parsing. A dash is unavailable, not zero. Underlying reports need reconciliation before model ingestion.
- US mid and extended-hours mid are the same reference field in this connector. They are not two independent prices. Daily OHLC excludes extended sessions.
- No IDX session status was inferred from the clock, indicative-auction fields, or metadata prose. The order-config endpoint was deliberately not called because the market-data trial does not need portfolio-scoped access.

## Office integration boundary

The connector is callable in this chat. The existing local Office server and static GitHub Pages build do not automatically inherit this connector connection or OAuth access. No documented standalone MCP endpoint or application authorization flow was supplied by the callable market tools. No credentials were extracted or put in frontend code, Git, or this report.

A future read-only local adapter can accept authenticated market results, validate symbol/asset class/currency/period, retain retrieval time separately from source time, and expose only sanitized market data to Office. It must fail explicitly on unavailable fields and keep US and IDX feeds separate. Scheduled collection also needs a supported independently authenticated connection; a one-time chat result must never masquerade as an automatic live feed. Public redistribution permissions remain unverified.

Conclusion: a promising additional source for US/IDX prices, history and fundamentals, with actual reads verified for AAPL and BBCA. Automatic Office integration, full-market coverage, source reconciliation and real-time freshness guarantees are not yet verified.
