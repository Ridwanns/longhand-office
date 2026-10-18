# Macro interaction refinement

## Reference observed

Inspected the authenticated Arthara Macro interface directly in the browser on 18 October 2026. Tried Indonesia Economy, US Overview, US Economy, and keyboard inspection of the US manufacturing/services chart. The selected period and the series readings changed together when using the arrow key. Observed useful patterns: latest readings paired with period changes, consistent geographic navigation, chart-adjacent explanations, reference lines with a stated meaning, and expandable methods/secondary detail.

These are interface observations, not a verification of Arthara financial figures. Its proprietary nowcasts, consensus, scores, projections and assets have not been imported. Office continues to use its separately validated public-source observations. This release improves the existing Office macro interface; it does not claim feature parity with Arthara.

## Verified defects and changes

1. Native macro charts previously ignored touch pointer inspection. Tapping a plotted observation now selects it, aligns the cursor/point, and displays its original date/value. A tapped observation stays selected until another selection or Latest.
2. Hover hit testing omitted the bar-chart padding used by the actual plot. Selection now uses the same calendar geometry; browser tests independently compare the marker against an actual bar center.
3. The Overview atlas previously did not request the new regional release file, so its Malaysia GDP reading remained annual while Economy already had the quarterly advance release. Overview now reads the same validated release candidates and exposes their original quarterly/monthly periods, source and estimate status. Annual coverage remains a labelled fallback where no regional numeric release exists.
4. Every chart displays an automatic change from the preceding consecutive observation of that same source. Percentage-rate differences use percentage points. Missing values or calendar gaps withhold the comparison. A single reviewed advance release is not compared against a different provider.
5. Hover/tap tooltips, point markers, a Latest action and direct chart keyboard controls are available. Left/Right inspect consecutive source entries; Home/End reach the endpoints. The existing range control remains available and announces the selected value and comparison.
6. Historical source selection defaults to Automatic history. Advanced source choices remain in the folded History options disclosure. Returning to automatic history requires no navigation. Source boundaries and exact observations remain accessible.
7. The two Overview history plots align at their chart headers. Source-boundary notes follow the relevant plot rather than offsetting one plot above the other.

## Preservation

No financial model, Quant calculation, storage/database schema, backup format, saved study input, or original macro evidence contract changed. No owner records were opened, reset, migrated or restored. Browser verification uses newly created isolated contexts and TEST ONLY synthetic records.

Verified 16 model, contract, storage and backup source files unchanged against fbf6dab. Verified nine financial modules byte-for-byte identical between source and the Pages build. Source observations remain immutable through interaction tests. The original monitor-note scope guard continues to distinguish original evidence from newly selected regional/chart sources.

## Verification actually run

- 523 Node tests passed.
- 6 isolated local API tests passed.
- 448 isolated macro browser assertions passed: regional releases 142; context/navigation 150; chart histories 42; map/density 60; context error paths 14; cache 6; regional error paths 6; new interaction tests 28.
- 211 additional browser assertions passed: investment workflow/backup restoration 53; Quant navigation/representative results 59; workspace shell/evidence flow 99.
- The new 28 interaction assertions also passed on the local Node edition at port 4174.
- Layout coverage includes 1440, 1280, 1101, 1024, 768, 390 and 320 pixels. Exact bar selection and tooltip containment checked at 1440, 768, 390 and 320 pixels. Keyboard, dark mode, reduced motion, refresh, retained synthetic record bytes and public-source immutability checked.
- One context test initially observed scaled axes before the debounced responsive redraw completed under parallel browser load. The test now waits for the actual readable layout condition, retaining its size assertions and timeout. Its full 150 assertions then passed. No financial implementation was changed to accommodate this test.
- GitHub Pages artifact built successfully; no validation artifacts or private databases are included.

## Files

Application: macro-atlas.js, macro-chart.js, macro-context-ui.js, macro-context.css, macro-releases-ui.js.

Tests: tests/macro-chart.test.mjs, tests/macro-context-browser.mjs, tests/macro-map-browser.mjs, tests/macro-releases-browser.mjs, tests/macro-releases.test.mjs, tests/macro-interaction-browser.mjs.

Report: MACRO_INTERACTION_REFINEMENT.md.

## Limits

Macro data is published on institutional release schedules, not real time. Coverage and latest periods vary by country and provider. Reviewed national releases retain their fixed review dates. A long historical source can end earlier than a newer reviewed release; those observations are not spliced. Current-vintage history can be revised and is not a point-in-time release archive. Missing coverage remains explicit. No proprietary nowcast, consensus or causal narrative is synthesized.

Regional source definitions and the independently reconciled source arithmetic are documented in MACRO_REGIONAL_RELEASES.md. This interaction release changes presentation and source selection for the map, not acquired source arithmetic.
