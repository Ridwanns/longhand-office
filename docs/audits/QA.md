# Prototype verification — 12 October 2026

Latest verification is in [AUDIT_2026-10-13.md](AUDIT_2026-10-13.md): 152 automated tests, 4 local API tests, 34 independent numerical checks and the full isolated workflow, safety, responsive, motion and failure-recovery suites. Counts and limitations below describe earlier releases.

This checklist is superseded by [VALIDATION.md](VALIDATION.md), which records the complete workflow, independent arithmetic, screenshots, fixes and remaining limitations. `npm test` now passes 26 model tests. The two isolated browser suites pass 34 workflow and 11 record-safety assertions.

The manual valuation extension is documented in [VALUATION.md](../releases/VALUATION.md): the combined model suite now has **52 passing tests**, with **35 additional browser assertions** for valuation, currencies, persistence and isolated restore. Earlier counts below remain historical.

All current browser tests run in fresh contexts at **http://127.0.0.1:4174**. The existing browser's port 4173 record value was compared before and after and stayed unchanged. The earlier prototype checks below are historical; no current test creates or restores records in the ordinary browser profile.

Earlier prototype verification:

- Created a temporary paper portfolio, recorded a supplied-price buy, reloaded and verified persistence.
- Attempted an oversized sell and verified rejection without saving it.
- Created a thesis with a real catalogue report, linked a decision, recorded an outcome and verified persistence after reload.
- Downloaded a JSON backup, restored through file selection and replacement confirmation, and verified all three record types.
- Supplied an unsupported backup version; verified an error and disabled replacement.
- Activated the Library building room using focus and Enter; confirmed purpose text changes on focus.
- Searched the public catalogue and refreshed it.
- Checked Escape closes the native editor dialog.
- Inspected desktop and mobile renders at 1440px and 390px. Mobile page and editor have no horizontal overflow.
- Emulated reduced motion and confirmed building animation is `none`.
- Removed only the temporary QA records afterward. Initial records are empty.

This is focused prototype verification, not a full accessibility audit or hosted security review. The public Research repository was not changed. Authentication and a server-side private store remain prerequisites for any hosted private release.
