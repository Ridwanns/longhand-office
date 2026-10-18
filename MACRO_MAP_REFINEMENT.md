# Macro map, detail charts and information density

## Implemented

The map now uses the full workspace width. The selected-country summary sits below it instead of taking away 280–330 pixels from the geographic canvas. On a 1440 × 1050 desktop test viewport, the map measured 1174 × 672 pixels. Mobile keeps a compact map and the same working controls.

The map supports country selection, source-aware hover/focus tooltips, zoom, dragging while zoomed, focusing the selected geography, an expanded viewport, keyboard containment and Escape to close. Country boundaries and numerical colour bins are unchanged. Selection adds an outline/glow and a finite arrival treatment; it does not change data values or simulate live activity. Reduced-motion preferences disable the animation.

All macro atlas history plots now use the same native macro chart renderer as the economic observatory. Quarterly and monthly labels use real source periods; short histories no longer receive repeated synthetic month labels. Percentage and basis-point charts retain a zero reference. Source values, gaps, exact precision and separate observation frequencies remain intact.

## Reduced clutter

- Removed repeated five-economy shortcut tiles; the country selector and comparison table still reach those economies.
- Removed fixed four-country map label boxes that obscured other geographies; the selected-economy readout and hover/focus tooltips remain.
- Removed the disconnected capital-flow placeholder and repeated explanatory cards. Existing Markets & flows navigation remains.
- Moved history range controls beside the history plots; they remain reachable in chart-gallery mode.
- Folded the duplicated full comparison table by default. Table presentation still opens the complete comparison.
- Limited the initial chart gallery to six economies. Any selected economy is included; an explicit button opens every available economy.
- Rates now leads with the selected observation and one chart. Rate comparisons, the US yield spread, optional FX charts and the US Treasury curve remain available through disclosures.
- Folded the liquidity component ledger. The release calendar leads with six actual upcoming entries and offers the full source schedule below.
- Source ledgers start with the selected economy. “All economies” and the full public-context download preserve access to all 293 series.

## Preservation and verification

No financial model, market-data provider, private schema, record key, study input/cutoff, export format or backup format was changed. No owner records were used in browser tests. Long-run annual reference data is explicitly separate from the original quarterly/monthly release monitor.

- 501 Node tests passed.
- New map/density suite: 60 browser checks passed, including original 176 boundary paths, zoom/pan, selection/source identity, expanded viewport/focus/Escape, seven responsive widths, readable plot labels, compact/full galleries, zero exposed tables on the default Rates screen, source filters, reduced motion and TEST ONLY record preservation.
- Existing macro coverage/navigation/responsive suite: 150 checks passed.
- Historical chart suite: 42 checks passed.
- Source failure/retry/freshness suite: 14 checks passed. The test explicitly opens reference disclosures before checking their rows, reflecting the new on-demand UI.
- Shared asset/record-key suite: 6 checks passed.
- Thirteen financial/storage/legacy-contract modules match the baseline after platform newline normalization. Nine source/build financial module pairs are byte-identical.

The source dataset has the same verified coverage described in `MACRO_CHART_HISTORY_RELEASE.md`. No missing quarterly history, unavailable policy rate, flow estimate, forecast or regional country value has been manufactured to fill the design.

Screenshots and complete run logs are in the ignored `validation/` directory. Public deployment and final public checks are recorded separately after publication; local checks alone do not establish that the public site has updated.
