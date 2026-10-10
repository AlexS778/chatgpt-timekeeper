# Local store-readiness review

Historical review of commit `7ab001e`, prepared 2026-10-10 on `store-readiness` for the **unreleased** 0.1.1 candidate. No new tag, release, store submission or signed XPI was created. Later readable-timestamp and README work is recorded in [READABLE_TIMESTAMPS.md](READABLE_TIMESTAMPS.md). The published 0.1.0 preview and its tags/assets are unchanged.

Applied the installed Chrome Extensions, modern web guidance accessibility, and cross-browser extension skills. Their framework-specific suggestions were adapted to the existing dependency-free runtime. Current official Chrome/Mozilla policies were checked; in particular, Chrome's small promo tile is required even though the installed template calls it recommended, and Mozilla's broad transmission definition prompted conservative chat-text/time-zone disclosures instead of `none`.

## Changes reviewed

- Original MIT clock artwork at 16/32/48/128px, PNG dimension verification, manifest icons and homepage.
- Popup version, source/support links, keyboard focus styling, region/transmission notice and an offline policy page; public Markdown policy with matching content.
- Explicit extension-page CSP permitting local resources and prohibiting script connections, objects and form submission. The host page's CSP and send flow are unaffected.
- Firefox required data categories `personalCommunications` and `locationInfo`; desktop/Android consent schema minimums. Desktop-only intended distribution; no Android compatibility claim.
- Allowlisted 13-file shipping packages and deterministic candidate archives. Numeric version bumped to 0.1.1; `previewTag` is validated explicitly rather than reusing a published filename.
- Store metadata/checklists and reviewer source-build instructions. Mozilla Add-ons Linter 10.14.0 is pinned as a development-only check and added to CI. Initially tried web-ext, then removed its unused vulnerable launcher dependencies in favor of the same standalone Mozilla validation engine.

`content.js` and all sending modules in `src/` are unchanged. Content SHA-256 remains `ff66f4fb4e92069bc40936de5d5b2ebc9c0ddc990e8eae06ace44f808696f7b0`. No real ChatGPT interaction or active dictation work was performed for this change.

## Verification

- 20 unit/source checks passed; all 64 Firefox/Chromium browser fixtures passed after the popup changes.
- Both updated popup checks passed with Chrome callback storage and Firefox promise storage mocks, local policy navigation by Enter, tab order, light/dark layouts and extension-page CSP applied as a response header in the fixture. They are not an actual store installation or consent-prompt test. PNGs and complete popup screenshots were visually inspected.
- Both generated packages passed source equality, manifest/version, PNG dimensions and strict file-list verification. Mozilla validation reported **0 errors, 0 warnings, 0 notices**, with warnings treated as errors.
- Clean `npm ci` succeeded; npm reported 0 known vulnerabilities for the resulting lockfile. Runtime remains free of third-party dependencies.
- Candidate archives passed repeat-build checksum comparison and ZIP content/CRC checks. Skills, test profiles, private config, dependencies and store working notes are excluded from browser ZIPs.

These are local checks. CI configuration was updated, but no hosted run for this branch is claimed here. Final installed-package tests, Firefox consent, ID registration, contact email, real-site graphics, live policy URL, source archive and store review/signing remain in [STORE.md](../STORE.md#submission-gate).

The privacy/disclosure categorization is a conservative preparation decision, not a determination by either store. Keep the declaration, policy and actual behavior aligned if review requests changes. Active dictation, unfinished real-site acceptance, changing ChatGPT controls and deprecated native editing remain explicit limitations.
