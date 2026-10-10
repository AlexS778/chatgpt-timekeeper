# ChatGPT Timekeeper

A small, local WebExtension that adds your browser's date, time, UTC offset, and time zone to text you send on **chatgpt.com**:

```text
[Local time: 2026-10-10T20:02:00+03:00 | Europe/Moscow]
Can you help me plan tomorrow?
```

**Development preview, tested in desktop Firefox and Chrome.** On 2026-10-10, the packaged extension passed real ChatGPT pointer Send-click, composer Enter, multiline Unicode/code, Shift+Enter and live off/on toggle checks in Firefox 157.0.1 (signed in) and Chrome 153.0.8010.36 (signed out and signed in). Signed-in Firefox and Chrome also passed new-chat navigation checks. The Chrome focused Send-button bug was subsequently fixed and verified with the installed extension in both browsers; the remaining acceptance matrix is pending. Test evidence is in [docs/FEASIBILITY.md](docs/FEASIBILITY.md). Safari and mobile are outside this preview. This is not a production compatibility guarantee.

## Preview release

The first open-source preview is tagged **`v0.1.0-preview.1`**; the WebExtension manifest and package version remain **`0.1.0`** because extension versions use numeric components. Release notes: [docs/releases/v0.1.0-preview.1.md](docs/releases/v0.1.0-preview.1.md). This project is independent and is not affiliated with or endorsed by OpenAI.

The unsigned Chromium and Firefox ZIPs contain the extension files with `manifest.json` at the archive root. Extract the matching ZIP into its own directory, then load that directory using the browser instructions below (Firefox selects its `manifest.json`). They are local testing packages, not signed store installs. To build them yourself, run `npm run release` with Node 22+ and Python 3.9+; output and SHA-256 checksums are in `dist/release/`. [Release preparation](docs/RELEASING.md) explains verification and publication.

### Known limitations

- **Active dictation is unsupported.** Stop dictation before Send so the transcript enters the ordinary composer. The reported Firefox behavior and investigation TODO remain open.
- **Production acceptance is incomplete.** Real-site IME, attachment-only, long-draft, failure/retry and undo checks remain pending across the claimed browsers; fixture coverage does not establish real-site acceptance.
- **ChatGPT page changes can break stamping.** Unknown rich structures, ambiguous composers and unrecognized/localized Send labels are skipped. The native editing API is deprecated and browser-dependent. A changed draft before continuation remains for manual review/send; there are no automatic retries.
- **Compatibility evidence is dated 2026-10-10.** Chrome and Firefox versions and exact test scope are recorded below and in the feasibility log. Edge, Brave and Opera are untested. Safari packaging, mobile browsers and native apps are outside this preview. Firefox's generated minimum version is packaging metadata, not evidence that Firefox 140 was tested.
- **No signed browser-store distribution.** Firefox temporary loading ends on restart; the provisional extension ID must be reviewed before signing/store submission. The device clock determines the timestamp and may be inaccurate.

## Install for Firefox testing

1. Run `npm run package` (Node 22 or later; building needs no dependencies).
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Choose **Load Temporary Add-on…**, then select `dist/firefox/manifest.json`.
4. Reload the ChatGPT test tab. Open the extension popup to check the toggle.
5. Use a fresh temporary chat and the harmless prompts in [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md).

Temporary add-ons disappear when Firefox restarts. Regular distribution requires Mozilla signing; this project does not contain a signed XPI. Firefox packaging adds an extension ID and a declaration that the extension collects no data. See [Mozilla's manifest documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings). The ID must be checked for availability before a store submission.

## Install for Chrome testing

1. Run `npm run package`.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Choose **Load unpacked**, then select the `dist/chromium/` directory.
4. Reload the ChatGPT test tab and check the extension popup toggle.
5. Use a fresh temporary chat and the harmless prompts in [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md).

This package is for local development testing. Chrome 153.0.8010.36 passed pointer-click and composer-Enter checks signed out and signed in, plus focused Space/Enter and accessibility Send activation signed in after the fix. Other Chromium browsers remain unvalidated.

## Behavior and privacy

The popup has one persisted on/off setting (on by default) and a clock preview taken when it opens. Changes apply to open tabs. When enabled, the extension stamps ordinary Send-button clicks and Enter-to-send. Shift+Enter, IME composition, modified Enter, empty drafts, attachments without text, and unrelated controls do not trigger stamping. A retry refreshes only an exact prefix at the start; timestamp-like text elsewhere is preserved.

**Dictation limitation:** Sending while dictation is still active does not add a timestamp, according to the user's Firefox test on 2026-10-10. **Stop dictation → Send** works once the transcription enters the ordinary composer. Support for the active-dictation send path is tracked in [TODO.md](TODO.md).

**Focused Send-button fix:** Tab → Send → Space/Enter and accessibility Send activation now continue once in the next event-loop task. This avoids Chromium suppressing a simulated click while the original activation is still in progress. The installed signed-in Chrome extension passed these paths on 2026-10-10; Firefox focused Space, pointer click and composer Enter also passed. See [the regression and real-browser evidence](docs/FEASIBILITY.md#2026-10-10--focused-send-button-fix).

**The timestamp is visible in the message and is sent to ChatGPT through the site's usual send flow.** The extension makes no network requests and saves only `enabled` in local extension storage. It has only the `storage` permission and a declarative content script limited to `https://chatgpt.com/*`. There is no background worker, analytics, prompt storage, clipboard access, history reader, or remote dependency.

**Current sending integration (2026-10-10):** The extension uses ChatGPT's HTML/DOM controls as its integration surface for sending messages. It identifies the composer and related Send button by CSS selectors and element attributes, inserts the timestamp through the browser's native editing pathway, then invokes the normal Send button once so ChatGPT's own JavaScript handles submission. It does not call or reverse-engineer ChatGPT's private backend API. These page controls are not a documented, stable public API: changes to their markup, labels, or editor behavior can break compatibility. Unrecognized controls are skipped, and compatibility requires testing against the current ChatGPT page and browser; there is no permanent compatibility guarantee. See [the dated observations and validation status](docs/FEASIBILITY.md).

The adapter accepts the observed plain-paragraph ProseMirror composer, its exact `span[data-prompt-literal-paste=""]` wrapper containing text/plain line breaks, the observed signed-out desktop `textarea#mobile-composer-prompt` with a related `button[type="submit"][aria-label="Send message"]`, and a separately tested `textarea#prompt-textarea` candidate. The signed-out textarea's ID does not imply mobile-browser validation. Unknown rich editor structures, ambiguous composers, unrecognized send controls, or unavailable settings leave ordinary submission unstamped. Native editing must emit a trusted input event and produce the exact intended plain text; a failed change is undone through the editor's undo pathway. After a verified native edit, the original gesture is paused and continued once through the normal Send button in the next event-loop task, after framework reconciliation and completion of the original button activation. The per-editor guard stays active until continuation finishes. There are no automatic submission retries. If the composer changes or the resulting text differs before continuation, the draft is retained for the user to review and send again. Browser/site changes can invalidate this pathway; see the feasibility notes and release gate before distributing it.

The implementation uses the deprecated `execCommand('insertText')` API because it provides a native editing/undo path without assigning editor DOM or patching private editor state. [MDN documents its event and compatibility limitations](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand). Reading the DOM and seeing an input event cannot prove an arbitrary framework model is synchronized; actual sent-message tests are required for each supported site/browser build.

## Development

```sh
npm ci
npm test
npx playwright install firefox chromium
npm run test:browser
npm run package
```

Runtime code has no dependencies. Playwright and ProseMirror are pinned development dependencies and are excluded from shipping packages. Unit tests cover calendar boundaries, leap day, fractional offsets, DST, exact prefix handling, settings, and privacy invariants. Firefox and Chromium fixture projects exercise a real ProseMirror model/history stack and controlled textarea models, including the signed-out controls; they are not substitutes for real ChatGPT extension tests. Run one engine with `npm run test:browser -- --project=firefox` or `--project=chromium`.

On macOS 27, Playwright 1.64's Firefox can exit with `Could not find profile folder` because it tries to access the installed Firefox's protected app-data directory ([upstream report](https://github.com/microsoft/playwright/issues/42768)). To use separate disposable test app data:

```sh
mkdir -p /private/tmp/timekeeper-firefox-home
CFFIXED_USER_HOME=/private/tmp/timekeeper-firefox-home npm run test:browser
```

`src/` contains the reviewable modules. `npm run build` deterministically concatenates them into the checked-in isolated `content.js`; `npm run check:build` detects stale output. The popup uses local ES modules directly. Package directories contain only the shipping scripts, popup, manifest, and license; `npm run verify:package` checks their file list and source equality. `npm run package` replaces the generated `dist/chromium/` and `dist/firefox/` directories. `SYSTEM_DESIGN.md` remains the original specification, not a statement of completed acceptance.

GitHub Actions runs unit/source checks on Node 22 and 24, plus Chromium/Firefox fixtures, package verification and repeat-build archive checks on Ubuntu. Actions are pinned to reviewed commits and CI has read-only repository permissions; it uploads test packages but does not publish GitHub releases. The first hosted CI run will occur after repository publication. See [CONTRIBUTING.md](CONTRIBUTING.md) for changes and privacy-safe bug reports.

MIT licensed. No Safari wrapper or store publication is included.
