# Store metadata

Last updated: 2026-10-10. **Draft, not submitted.** Current candidate: extension version `0.1.1`, intended future GitHub preview `v0.1.1-preview.1`. The published `v0.1.0-preview.2` remains unchanged.

## Listing

Name: **ChatGPT Timekeeper**. Summary: **Adds your browser-local time to outgoing ChatGPT messages.** Language: English. Category: Productivity.

Suggested detailed description (plain text for dashboard forms):

```text
Add your local date, time and GMT offset to text messages you send on chatgpt.com.

Open the popup to preview your browser's time or turn automatic timestamps off. The timestamp becomes visible message text and goes to ChatGPT when you send. It uses your device clock, so an incorrect clock produces an incorrect timestamp.

This is an early desktop Chrome and Firefox preview. Ordinary text sending has been tested, but compatibility can change when ChatGPT changes its interface. Sending during active dictation is unsupported: stop dictation before sending. Safari, mobile browsers and native apps are outside this preview.

The extension saves only its on/off preference locally. It handles your current draft temporarily, keeps no prompt history and sends no data to its developer. There is no analytics or advertising.

Independent project; not affiliated with or endorsed by OpenAI.
Source and support: https://github.com/AlexS778/chatgpt-timekeeper
```

Use the same limitations in both stores. Do not describe the preview as guaranteed compatible or approved by OpenAI. The original clock artwork is ours, MIT licensed, and uses no OpenAI, Chrome or Firefox logos.

## Privacy and data use

Policy: [PRIVACY.md](PRIVACY.md), with matching offline [privacy.html](privacy.html).

Intended public policy URL after merge/publication: `https://github.com/AlexS778/chatgpt-timekeeper/blob/main/PRIVACY.md`. **Verify it is publicly reachable before submission.** It is not live merely because it exists locally.

| Data | Access/use | Storage or transmission |
| --- | --- | --- |
| Current chat draft | Read/edit only for timestamp insertion and send verification | Temporary in-memory snapshots; no prompt history. Message goes to ChatGPT on the user's Send gesture through the site. |
| Local date/time and GMT offset | Construct visible prefix and popup preview | Included in sent message. Offset can suggest a broad time-zone region; no GPS lookup. |
| Time-zone name | Display in the popup | Local display only; no longer included in the message. |
| Enabled preference | Apply user's choice | Local extension storage only; no extension-managed sync. |
| Send/input interactions | Recognize ordinary sending and preserve draft behavior | Transient handling only; no event logs or analytics. |
| Responses, cookies, authentication, browsing history | Not collected by the extension | No developer collection, retention or transmission. |

No sale, unrelated use or credit/lending use. No extension-initiated network requests. GitHub links are optional user navigation; they do not carry drafts, identifiers or telemetry. This differs from saying no user data is handled: the extension handles a current draft and facilitates its submission to ChatGPT.

## Chrome Web Store

### Single purpose

Add the user's browser-local timestamp to text they choose to send on chatgpt.com.

### Permissions justification

- `storage`: save the on/off preference locally and apply changes in open ChatGPT tabs.
- Content-script access to `https://chatgpt.com/*`: locate the draft and ordinary Send control, then add the visible timestamp. No broader site access is needed.
- Popup source, support and offline privacy links require no additional permissions.

Full dashboard copy and graphics checklist: [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).

## Firefox Add-ons

### Data collection declaration

Generated Firefox manifest uses `required: ["personalCommunications", "locationInfo"]`. This is a conservative interpretation of Mozilla's broad transmission definition: the extension facilitates sending a chat message containing a GMT offset that can suggest a broad time-zone region. It does **not** add developer collection or GPS access. Required categories are disclosed by Firefox before installation; users can cancel installation or stop stamping with the popup toggle.

Desktop minimum `140.0` and Android schema minimum `142.0` support built-in consent declarations. These numbers are not tested compatibility claims. **Select desktop-only distribution; do not advertise Android support.** Actual installed-browser evidence remains Firefox 157.0.1 and Chrome 153.0.8010.36. The previous preview's `none` declaration must not be reused for this candidate. Confirm categorization with AMO review; do not weaken disclosures just to remove a prompt.

The provisional ID `chatgpt-timekeeper@extensions.local` is stable within preview packages, but must be confirmed/finalized before the first signed submission. Once signed, preserve the registered ID on updates.

### Reviewer notes

The add-on changes text in the ordinary ChatGPT composer. It does not use private backend APIs, remote scripts, page-world injection, a background process or runtime third-party libraries.

1. Load the Firefox package and grant access to chatgpt.com. Open the popup; verify time/zone, version, the enabled switch, and offline privacy page.
2. On desktop chatgpt.com, use a fresh temporary chat and an invented draft such as “What time zone is in this message?” Send normally with the button or composer Enter. Verify one visible leading timestamp, original text preservation and one submission.
3. Switch stamping off, send another invented draft and verify no added timestamp. Switch on again. Shift+Enter should insert a line break without sending.
4. Try keyboard focus on Send (Space/Enter) and New chat navigation. Use the manual matrix in `docs/MANUAL_TESTS.md` for the full acceptance gate.
5. Active dictation is unsupported. Unknown editor structures can send without a stamp. The adapter uses deprecated native editing for undo preservation; ChatGPT interface changes can break it. IME, attachment-only, long-draft and failure/undo real-site acceptance is incomplete. Fixture results are not proof of every live-site path.

Signed-out access was validated only in Chrome; do not assume it suffices for Firefox review. **Before submission**, provide any required disposable test-account credentials privately through AMO's reviewer notes, never in this file. No personal credentials are included here.

Source build: Node 22+ and Python 3.9+. Supply a ZIP of the reviewed Git commit as described in `docs/RELEASING.md`. `npm ci`, `npm run check:build`, `npm run package`, `npm run verify:package`, `npm run lint:firefox`, and `npm run release` reproduce the packages. `scripts/build.mjs` concatenates the reviewable `src/` modules into `content.js`, without minification or obfuscation. PNGs are checked-in original artwork; `python3 scripts/icons.py` explains their construction and is not required for the package build. No external downloads at extension runtime.

### Release notes

Candidate 0.1.1 adds a readable date/time and GMT offset, original clock icons, source/support/privacy links and version in the popup, offline privacy information, explicit extension-page security restrictions and updated Firefox transmission disclosures. The sending mechanism and active-dictation support are unchanged.

## Submission gate

- [x] Minimal permissions, scoped content script, bundled readable code, MIT license.
- [x] Actual 16/32/48/128 PNG icons, matching manifest and package allowlist.
- [x] Draft listing, policy, permissions explanations, limitations and reviewer build steps.
- [x] Mozilla Add-ons Linter added to local checks and CI; warnings fail validation.
- [ ] Complete remaining real-site acceptance checks in TODO.md, then test the exact final installed packages, including the revised Firefox installation consent.
- [ ] Finalize Firefox ID, desktop-only platform selection, store accounts and publisher details; provide a monitored contact email. The GitHub noreply commit address is not a support email.
- [ ] Prepare store-size versions of the captured real-site README screenshots, the Chrome small promo tile and final icon review. Do not present fixture screenshots as real ChatGPT use.
- [ ] Publish source/policy, verify URLs, package source ZIP and final browser ZIPs, verify lockfile installation, artifact bytes and hosted CI for the exact submission commit.
- [ ] Match Chrome dashboard declarations to the handling table and Firefox declaration; confirm any reviewer categorization questions.
- [ ] Obtain store-submission authorization, submit and record signing/review outcomes. Local validation is not store approval.

## Version history

- 0.1.1: local store-readiness candidate; not tagged, signed or submitted.
- 0.1.0: unsigned GitHub preview `v0.1.0-preview.2`; no store submission or rejection history.

## References

Checked 2026-10-10: [Chrome user data guidance](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Chrome graphics](https://developer.chrome.com/docs/webstore/images), [Mozilla policies](https://extensionworkshop.com/documentation/publish/add-on-policies/), [Firefox data taxonomy and consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [Mozilla's validator](https://github.com/mozilla/addons-linter). Official requirements take precedence over skill templates.
