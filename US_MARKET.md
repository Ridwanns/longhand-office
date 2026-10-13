# US lookup — repository trial and working source

Verified on 13 October 2026 (Asia/Jakarta). In **Data Pasar → US**, enter AAPL, MSFT, NVDA or BRK-B, and press **Lihat data** or Enter. No transaction or account is needed for the implemented snapshot lookup.

## Repository trials

The actual NOFX source files `provider/alpaca/kline.go`, `provider/twelvedata/kline.go`, and `config/config.go` were inspected from the dev branch. Its Alpaca reader requires `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` and requests `feed=iex`, `adjustment=raw`. A read-only HTTP trial against the corresponding stock bars endpoint without keys returned **401**. The expected key variable names were absent from the local environment inspected. The user confirmed they do not have an Alpaca account. Twelve Data's reader also requires its own API key. Neither NOFX provider is configured or connected to Office.

StockSharp's [Yahoo Finance connector](https://stocksharp.com/en/store/yahoo-finance/) documents a free historical-data connector. Its [source description](https://stocksharp.com/en/store/yahoo-finance-%D0%B8%D1%81%D1%85%D0%BE%D0%B4%D0%BD%D0%B8%D0%BA%D0%B8/) identifies Yahoo's `/v8/finance/chart/{symbol}` route. This source responded successfully without credentials for AAPL, MSFT, NVDA and BRK-B in actual read-only trials.

Office therefore uses **an independently written HTTP adapter to that same Yahoo source**, not copied StockSharp code or the StockSharp/NOFX runtime. This distinction is explicit: the repository's data source was tried, but its trading engine and compiled connector were not installed or executed. StockSharp.Yahoo describes historical candles; Office additionally reads the regular-session snapshot metadata in the same response, not a historical daily close. No assumption that a current daily candle is a completed closing price is made.

## Price meaning and privacy

The displayed value is `regularMarketPrice`, paired with `regularMarketTime` from the source. It is a **regular-session snapshot**, not a streaming quote, not an after-hours quote, and not a guaranteed consolidated real-time price. Source time is shown in New York time with an ET label. Retrieval time is separate in the API response. Unknown delay is displayed as unknown, not zero. Snapshots older than 24 hours receive a visible age note; weekends/holidays can legitimately leave an older snapshot.

The backend requests a fixed HTTPS provider URL and accepts normalized US ticker symbols only. The response must identify that ticker, a supported US venue, USD, and an equity or ETF instrument. Invalid/missing prices or source timestamps are rejected instead of substituting zero or a daily candle. Rate limits, network errors and invalid provider responses are reported without automatic retries or hidden fallback. Only the ticker is sent to Yahoo; holdings, quantities, cash, theses and decisions are not sent.

No lookup is saved to localStorage or appended to valuation history. Portfolio exports and restore formats remain unchanged. Manual US portfolio valuation is still available separately. IDX continues to use the existing Flowless daily-close source. Choosing another market or typing another ticker clears the previous result, and an obsolete asynchronous response cannot overwrite the current selection.

Yahoo's chart endpoint is not a supported API contract for this app, so it can change or rate-limit requests. This release stays local. A dependable licensed real-time feed would still require an authorized provider/account. Alpaca's free IEX feed covers one exchange rather than consolidated US coverage; see [Alpaca data sources](https://docs.alpaca.markets/us/docs/historical-stock-data-1).

## Verification

- `npm test`: **83 passing tests**, including 13 new US adapter tests for symbol handling, provenance, source time, delay, missing/invalid prices, US venue/currency constraints, fixed upstream requests and provider failures.
- **16 browser checks passed**: actual AAPL, MSFT, NVDA and BRK.B reads, Enter submission, no transaction required, no record writes, switching back to IDX, invalid US input, simulated provider failure without a stale price, and widths 320/390/768/1440. No uncaught browser errors. Ordinary workspace records were compared before and after and unchanged.
- Browser receipt: `validation/us-browser-results.json`. Desktop/mobile screenshots: `validation/us-lookup-desktop.png`, `validation/us-lookup-mobile.png`.

The observed numbers in the receipt are dated source observations from the test run and will change. They are not seeded sample prices, future predictions or performance results.
