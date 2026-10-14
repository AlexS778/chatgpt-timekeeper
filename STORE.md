# Store metadata

Last updated: 2026-10-14. **Firefox 0.1.2 publicly available on [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-timekeeper/).** See [the submission log](docs/FIREFOX_SUBMISSION.md). Chrome is deferred by the publisher because of its registration fee. Current Firefox store release: extension version `0.1.2`, GitHub preview `v0.1.2-preview.1` with ready-to-load browser ZIPs. The published `v0.1.0-preview.2` remains unchanged.

Local source/package candidate: **0.1.3**, intended preview tag `v0.1.3-preview.1` (not created). The formatted-paste fix is locally validated; [evidence and limits](docs/FORMATTED_PASTE.md). Neither the AMO listing nor the published 0.1.2 GitHub assets were updated.

## Listing

Name: **ChatGPT Timekeeper**. Summary: **Adds your browser-local time to outgoing ChatGPT messages.** Language: English. Chrome category: Productivity; AMO category: Social & Communication.

Suggested detailed description (plain text for dashboard forms):

```text
Add your local date, time and GMT offset to text messages you send on chatgpt.com.

Open the popup to preview your browser's time or turn automatic timestamps off. The timestamp becomes visible message text and goes to ChatGPT when you send. It uses your device clock, so an incorrect clock produces an incorrect timestamp.

This is an early desktop Chrome and Firefox preview. Ordinary text sending has been tested, but compatibility can change when ChatGPT changes its interface. Sending during active dictation is unsupported: stop dictation before sending. Safari, mobile browsers and native apps are outside this preview.

IME input and failure/undo behavior still need further live-site testing. A harmless attachment-only send and a 6,115-character text draft were checked in Firefox 157.0.1; these examples do not establish every attachment or draft path. Unsupported editor layouts may send without a timestamp. Check the visible message after sending.

The extension saves only its on/off preference locally. It handles your current draft temporarily, keeps no prompt history and sends no data to its developer. There is no analytics or advertising.

Independent project; not affiliated with or endorsed by OpenAI.
Source and support: https://github.com/AlexS778/chatgpt-timekeeper
Support email: probe-mumble7g@icloud.com
```

Use the same limitations in both stores. Do not describe the preview as guaranteed compatible or approved by OpenAI. The original clock artwork is ours, MIT licensed, and uses no OpenAI, Chrome or Firefox logos.

## Privacy and data use

Policy: [PRIVACY.md](PRIVACY.md), with matching offline [privacy.html](privacy.html).

Public policy URL: `https://github.com/AlexS778/chatgpt-timekeeper/blob/main/PRIVACY.md`. An unauthenticated request returned HTTP 200 with the policy title and GMT-offset disclosure on 2026-10-11. The pushed support-email update was also verified publicly.

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

Store submission remains deferred. Chrome users can download the **0.1.2** Chromium ZIP from [GitHub Releases](https://github.com/AlexS778/chatgpt-timekeeper/releases/tag/v0.1.2-preview.1), extract it, and load it through Developer mode. No user build step is required; [README instructions](README.md#install-in-chrome).

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

Minimum `142.0` keeps the built-in consent declaration valid in Mozilla's cross-platform schema checker; it is not a tested compatibility claim. Desktop consent itself begins at 140, but the linter inherits the desktop minimum for its Android schema check when `gecko_android` is absent. **Omit `gecko_android` for desktop-only distribution; do not advertise Android support.** AMO's upload UI forced the Android checkbox on when the earlier candidate included that key, so it was removed before submission. Actual installed-browser evidence remains Firefox 157.0.1 and Chrome 153.0.8010.36. The previous preview's `none` declaration must not be reused for this candidate. Confirm categorization with AMO review; do not weaken disclosures just to remove a prompt.

The publisher selected permanent ID `chatgpt-timekeeper@alexs778.github.io` on 2026-10-11, replacing the unsigned preview's provisional `chatgpt-timekeeper@extensions.local`. It is an identifier, not a support mailbox. AMO publicly distributes version 0.1.2 under this ID. Preserve the registered ID on updates.

Support email: `probe-mumble7g@icloud.com` (publisher supplied, monitored). Support website: `https://github.com/AlexS778/chatgpt-timekeeper/issues`. Homepage: `https://github.com/AlexS778/chatgpt-timekeeper`. License: MIT. Mark **experimental** and select **desktop Firefox only**, all desktop operating systems; exclude Android.

Listing screenshot: `docs/images/store/timekeeper-screenshot.png` (1280×800), composed from the two unchanged real Firefox captures. Caption: “A real ChatGPT message with a local timestamp, alongside the Timekeeper on/off popup. Desktop preview, version 0.1.1.” See `docs/images/store/README.md` for provenance. The small Chrome promo tile is prepared but Chrome submission is deferred.

Account access: the publisher completed Mozilla account confirmation/two-step authentication setup privately. Desktop-only version 0.1.2 and its source were submitted on 2026-10-11; public distribution was verified on 2026-10-14. See [the submission log](docs/FIREFOX_SUBMISSION.md).

### Reviewer notes

The add-on changes text in the ordinary ChatGPT composer. It does not use private backend APIs, remote scripts, page-world injection, a background process or runtime third-party libraries.

1. Load the Firefox package and grant access to chatgpt.com. Open the popup; verify time/zone, version, the enabled switch, and offline privacy page.
2. On desktop chatgpt.com, use a fresh temporary chat and an invented draft such as “What time zone is in this message?” Send normally with the button or composer Enter. Verify one visible leading timestamp, original text preservation and one submission.
3. Switch stamping off, send another invented draft and verify no added timestamp. Switch on again. Shift+Enter should insert a line break without sending.
4. Try keyboard focus on Send (Space/Enter) and New chat navigation. Use the manual matrix in `docs/MANUAL_TESTS.md` for the full acceptance gate.
5. Active dictation is unsupported. Unknown editor structures can send without a stamp. The adapter uses deprecated native editing for undo preservation; ChatGPT interface changes can break it. IME and failure/undo real-site acceptance is incomplete. One harmless attachment-only send and one 6,115-character draft passed in Firefox 157.0.1; broader acceptance remains limited. Fixture results are not proof of every live-site path.

Signed-out access was validated only in Chrome; do not assume it suffices for Firefox review. **Before submission**, provide any required disposable test-account credentials privately through AMO's reviewer notes, never in this file. No personal credentials are included here.

Source build: Node 22+ and Python 3.9+; local validation used Node 22.21.1, npm 10.9.4 and Python 3.11.5 on macOS. Supply a ZIP of the reviewed Git commit as described in `docs/RELEASING.md`. After extracting the source, `npm run check:build`, `npm run package`, `npm run verify:package`, and `npm run release` reproduce the Firefox package without installing dependencies. For the next 0.1.3 submission, compare `dist/release/chatgpt-timekeeper-v0.1.3-preview.1-firefox.zip` with the upload. The historical 0.1.2 uploaded artifact identity remains in the submission log. For automated tests/lint only, run `npm ci`, `npm test`, `npm run lint:firefox`, and the browser commands in README. `scripts/build.mjs` concatenates the reviewable `src/` modules into `content.js`, without minification or obfuscation. PNG icons are checked-in original artwork; `python3 scripts/icons.py` explains their construction and is not required for the package build. Listing graphics and their development-only renderer are excluded from browser ZIPs. No external downloads at extension runtime.

### Release notes

Candidate 0.1.3 fixes missing timestamps on supported formatted text, including bold text, links, headings, lists and code blocks. A new rich prefix appears as a plain timestamp paragraph followed by a blank line; original message text and formatting are preserved. Explicit retries refresh one prefix. A failed edit that cannot be undone is retained without automatic submission. Active dictation remains unsupported. [Prepared notes](docs/releases/v0.1.3-preview.1.md).

## Submission gate

- [x] Minimal permissions, scoped content script, bundled readable code, MIT license.
- [x] Actual 16/32/48/128 PNG icons, matching manifest and package allowlist.
- [x] Draft listing, policy, permissions explanations, limitations and reviewer build steps.
- [x] Mozilla Add-ons Linter added to local checks and CI; warnings fail validation.
- [ ] Complete remaining real-site acceptance checks in TODO.md, then test the exact final installed packages, including the revised Firefox installation consent.
- [x] Finalize Firefox ID, desktop-only platform selection, Mozilla account and monitored contact details. The GitHub noreply commit address remains only for commits.
- [x] Prepare store-size composition of the captured real-site README screenshots, the Chrome small promo tile and final icon review. Captures remain unchanged; no fixtures or invented UI are presented as real ChatGPT use.
- [x] Publish source/policy, verify URLs, package source ZIP and final browser ZIPs, verify lockfile installation, artifact bytes and hosted CI for the exact submission commit.
- [ ] Match Chrome dashboard declarations to the handling table and Firefox declaration; confirm any reviewer categorization questions.
- [x] Obtain Firefox submission authorization from the publisher; Chrome is deferred.
- [x] Complete Mozilla account gates and submit Firefox with source and listing media; record actual submission outcome.
- [x] Verify public Firefox 0.1.2 distribution and downloaded XPI contents on 2026-10-14; Mozilla signature files are present. See the submission log for artifact identity.
- [ ] Verify signed installation consent with an actual store installation.

## Version history

- 0.1.3: local formatted-paste fix candidate, prepared 2026-10-14. 21 unit checks, 88 browser fixtures, package verification, lint and repeat-build checks passed. Installed Firefox rich-paste click-send verified. No tag, GitHub publication or AMO submission.

- 0.1.1: uploaded as an incomplete AMO draft; cancellation authorized by the publisher because its manifest incorrectly enabled Android distribution. No public release or approval.
- 0.1.2: desktop-only replacement submitted to AMO on 2026-10-11; public experimental release verified on 2026-10-14. GitHub preview `v0.1.2-preview.1` provides unsigned Chrome/Firefox ZIPs through CI-gated release publication. Runtime sending behavior unchanged.
- 0.1.0: unsigned GitHub preview `v0.1.0-preview.2`; no store submission or rejection history.

## References

Checked 2026-10-10: [Chrome user data guidance](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [Chrome graphics](https://developer.chrome.com/docs/webstore/images), [Mozilla policies](https://extensionworkshop.com/documentation/publish/add-on-policies/), [Firefox data taxonomy and consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [Mozilla's validator](https://github.com/mozilla/addons-linter). Official requirements take precedence over skill templates.
