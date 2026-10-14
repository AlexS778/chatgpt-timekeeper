# Firefox submission and release record

Public Firefox release **0.1.3** verified on **2026-10-14**: [Mozilla Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-timekeeper/). Signed installation consent remains untested.

Prepared 2026-10-11. Candidate version **0.1.2**, permanent Firefox ID **`chatgpt-timekeeper@alexs778.github.io`**, selected by the publisher before first signing. Monitored listing contact: **`probe-mumble7g@icloud.com`**. Runtime remains small and dependency-free. No sending-module changes; `content.js` SHA-256 remains `292c3147a1a3898865d894db88f081fca7e700f7912b61ef1bb5e150d387c92b`.

## Verified preparation

- Read README, original system design, TODO, feasibility, store listing/privacy/release/review notes, and readable-timestamp provenance. Historical acceptance evidence remains distinct from this run.
- Checked current official [AMO submission steps](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [source requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/), [data taxonomy/consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [policies](https://extensionworkshop.com/documentation/publish/add-on-policies/) and [permission testing](https://extensionworkshop.com/documentation/develop/test-permission-requests/). Keep required `personalCommunications` and `locationInfo`: the draft is a chat message, and the sent GMT offset can suggest a broad region. This interpretation still awaits AMO review; there is no developer collection or GPS lookup.
- Public privacy URL returned HTTP 200 without authentication and contained the title and GMT-offset disclosure. The pushed contact update also returned HTTP 200 and contained the support email.
- Prepared and visually inspected a 1280×800 composition of unchanged real Firefox captures. [Graphics provenance](images/store/README.md). No private chats, identities, fixture UI or generated UI appear.
- Fresh pinned development dependency installation succeeded. Node 22.21.1, npm 10.9.4, Python 3.11.5. `check:build` and 21 unit/source checks passed; 64 source fixtures passed (32 Firefox, 32 Chromium).
- Earlier 0.1.1 Firefox ZIP from preparation commit `fd975fb` passed all 32 existing Firefox fixtures in a disposable harness. These exercise the ZIP's shipping scripts, popup and policy with controlled editor/storage models; they are not real ChatGPT or extension-origin installation checks.
- Browser package allowlists/source equality and ZIP CRC checks passed. Mozilla Add-ons Linter 10.14.0 reported **0 errors, 0 warnings, 0 notices**. Repeat builds produced identical browser ZIP checksums.
- Independently verified all three jobs in the earlier [hosted run 38085643626](https://github.com/AlexS778/chatgpt-timekeeper/actions/runs/38085643626) succeeded. That run is evidence for the earlier commit, not this candidate.

## Dashboard access and actual outcomes

Signed-in AMO Developer Hub showed “Submit Your First Add-on.” Entering that flow led to required Mozilla account confirmation and two-step authentication setup. Credential setup must be completed by the publisher; no credentials or recovery material are recorded here.

The publisher completed account setup privately. Version 0.1.1 was uploaded and validated without errors/warnings, creating an incomplete draft and reserving the permanent ID. Its `gecko_android` manifest key forced Android distribution in the upload UI. A corrected ZIP could not replace it through the new-add-on flow (duplicate ID). The publisher expressly authorized “Cancel and Disable Version” and replacement with 0.1.2. Cancellation completed; AMO version 6562914 / file 5107052 shows disabled (the UI labels it “Disabled by Mozilla”, resulting from cancellation, not a review rejection). The add-on remains incomplete and offers “Upload a New Version”. The replacement omits `gecko_android`; minimum 142.0 accommodates the current validator’s inherited Android schema check. The corrected version 0.1.2 was submitted on 2026-10-11 at approximately 19:09 Europe/Moscow (16:09 UTC). AMO displayed “Version Submitted”; version ID **6565272**, file ID **5109410**. The version editor shows **Awaiting Review**, a source-code “View current” link, and only Firefox compatibility (minimum 142.0). No signing, approval, rejection or public availability is claimed; the UI states that it is not publicly available until review completes. Select **desktop only** and **experimental**, using STORE.md copy and reviewer notes. Check the real dashboard's disclosure fields before submitting. Provide disposable reviewer credentials privately if signed-out access does not allow review.

Chrome is deferred at the publisher's request after the first-registration dashboard showed an agreement and $5 fee. No fee paid or agreement accepted by the agent. Chrome graphics and draft metadata are retained for future use.

## Remaining acceptance

The exact 0.1.2 Firefox ZIP was extracted into a disposable directory and temporarily loaded in Firefox 157.0.1 under the permanent ID. On 2026-10-11, an invented click-send draft preserved Unicode, sent once with one prefix, cleared the composer, and received a first-line echo from ChatGPT. A 6,115-character invented draft sent with Enter, had one prefix, preserved all original text (verified through the message’s ordinary Copy control), and received an echo of its prefix and final marker. One harmless attachment-only text-file send produced no timestamp text and ChatGPT acknowledged the file. No active dictation was used.

Live IME and failure/undo acceptance remain incomplete; broad attachment/long-draft coverage is not claimed. Attempts to repeat the exact-package fixtures for 0.1.2 could not start the disposable Playwright Firefox process (“Could not find profile folder”); they produced no behavior verdict. The prior passing fixtures use identical shipping JavaScript, but are not a pass for the new manifest. [Hosted CI 38153948886](https://github.com/AlexS778/chatgpt-timekeeper/actions/runs/38153948886) passed all three jobs: 64 browser fixtures, 21 unit checks on Node 22/24 and Mozilla lint with zero errors/warnings/notices. Downloaded hosted browser ZIPs and SHA256SUMS matched local bytes. A separate extraction of the exact source archive reproduced both ZIPs without dependency installation. Do not test active dictation: stop dictation before Send. Use harmless invented drafts and disposable chats only. Unknown editors can send unstamped; deprecated native editing and ChatGPT interface changes remain risks. No mobile, Safari, other-browser or Firefox-minimum-version support claim is made.

Temporary loading grants installation permissions silently. It cannot establish the actual consent prompt. Verify consent with a signed installation when available; do not weaken signature enforcement on the publisher's browser to simulate signing.

The submitted source ZIP was freshly archived from the exact candidate commit and rebuilt in a separate extracted checkout; artifact bytes matched. Candidate hashes, hosted CI, dashboard selections and actual outcome are recorded below. Preserve `v0.1.0-preview.2` and its assets; `v0.1.1-preview.1` was never created; the replacement’s intended future tag is `v0.1.2-preview.1`, also uncreated.

## Submitted candidate identity

- Source commit: `a3465ce079dca52dc451da4efc53396d3e79a752`. Later documentation-only outcome records do not replace this submitted source identity.
- Firefox ZIP SHA-256: `bcc525ae925191012f1c29e32420b7e14c9536aff7a02c5236f25e95790b9816`.
- Source ZIP `timekeeper-source-a3465ce.zip` SHA-256: `4b56941d769db8c58f153bb45888a0aea23dcff6b5a53fabcf7f28da7426eacf`. It was freshly archived from the submitted commit, inspected for excluded credentials/profiles and attached through the source step.
- Local upload bundle: `dist/submission/firefox-0.1.2/` (ignored, contains matching archives, graphics, copy and checksums).
- Dashboard choices: listed on AMO, Firefox desktop checked, Android unchecked; experimental checked; Social & Communication category; MIT license; English (US); no paid add-on requirement; approved monitored support email and GitHub Issues URL. Privacy text matches PRIVACY.md and includes its public URL.
- Reviewer notes disclose required personalCommunications/locationInfo, no developer collection, preview limitations, exact build instructions, free ChatGPT-account requirement and lack of supplied reviewer credentials. Category interpretation remains subject to review.
- Listing media: original clock icon and 1280×800 real-screenshot composition uploaded and saved; visually verified in the product editor. Caption identifies the actual 0.1.1 captures and explains that 0.1.2 changes only desktop distribution metadata. No approval is inferred from media upload.
- Version editor: https://addons.mozilla.org/en-US/developers/addon/chatgpt-timekeeper/versions/6565272

## Public release verification — 2026-10-14

The publisher reported the Mozilla store release. Mozilla's [public add-on API](https://addons.mozilla.org/api/v5/addons/addon/chatgpt-timekeeper/) independently returned add-on **3092211**, status **public**, current version **0.1.2**, experimental **true**, disabled **false**, and file **5109410** with status **public**. Its last-updated field is `2026-10-14T16:10:26Z` (19:10:26 Europe/Moscow); this is listing metadata, not a separately established review-decision time.

Downloaded the [public XPI](https://addons.mozilla.org/firefox/downloads/file/5109410/chatgpt_timekeeper-0.1.2.xpi) without authentication:

- SHA-256: `f15548f1d54c78ca9a43477dcc6fc92522c85c0b665d186e79cf32874c6f456b`, matching Mozilla's API hash. Size: 23,898 bytes.
- ZIP CRC check passed. Manifest version, permanent ID, desktop-only minimum 142.0 and required `personalCommunications` / `locationInfo` declarations match the submitted Firefox manifest.
- All other shipping files match submitted source commit `a3465ce079dca52dc451da4efc53396d3e79a752` byte for byte.
- Mozilla signature files are present: `META-INF/cose.manifest`, `cose.sig`, `manifest.mf`, `mozilla.sf`, and `mozilla.rsa`. Their cryptographic verification and a real store installation/consent check were not performed in this run.

Public distribution is verified. The experimental status and existing compatibility limitations remain; publication does not complete the real-site acceptance matrix. Chrome remains deferred. No GitHub tag or release was created by this verification, and the historical submission record above remains unchanged.

## Version 0.1.3 update — 2026-10-14

The publisher explicitly authorized pushing the formatted-text fix and submitting a new Firefox version. Source commit **`c5f471c3d438266533ec9fe85d3b2c59249a5db0`**, tag **`v0.1.3-preview.2`**, targets numeric extension version **0.1.3**. Permanent ID, permissions, privacy policy, experimental status and desktop-only scope are unchanged.

The first tag `v0.1.3-preview.1` was preserved after hosted CI failed an immediate selection assertion in the literal-paste fixture (87/88 passed); it published no release. Selection checks now wait for asynchronous editor restoration. No runtime files changed in this follow-up. [The final release CI](https://github.com/AlexS778/chatgpt-timekeeper/actions/runs/38635629762) passed Node 22/24 unit jobs (21 checks each), all **88 browser fixtures**, Mozilla lint (**0 errors, 0 warnings, 0 notices**), package checks, reproducibility and publication. The main-branch CI also passed. The [public GitHub prerelease](https://github.com/AlexS778/chatgpt-timekeeper/releases/tag/v0.1.3-preview.2) has the two ZIPs and SHA256SUMS; downloaded assets match local builds byte for byte.

A fresh `git archive` from the final tag was extracted and built without installing dependencies; both browser ZIPs match the tested/published artifacts. Source archive `timekeeper-source-v0.1.3-preview.2.zip` SHA-256: `c4e72d02331728b8fdc811e97c484d7cd6dcf61ac20edca0f02eb27d32431b9b`. Firefox upload ZIP SHA-256: `62c76eef7ed27ab2119f897c0751c2017c64997c0c5f984318c6a259b06cf163`.

AMO validated the uploaded Firefox ZIP without errors or warnings. Firefox was checked, Firefox for Android unchecked. Source archive, user-facing release notes and reviewer build/test instructions were saved. The source-code question was answered Yes because the build concatenates modules; the same exact source archive was supplied in the required source-upload step. The final page displayed **Version Submitted** at approximately 20:56 UTC / 23:56 Europe/Moscow. Version ID **6578643**, file ID **5122776**. The [version editor](https://addons.mozilla.org/en-US/developers/addon/chatgpt-timekeeper/versions/6578643) initially showed Awaiting Review, the source-code View current link and the saved notes. No private credentials or legal/account changes were involved.

### Public distribution

At 20:56:57 UTC, Mozilla's [public API](https://addons.mozilla.org/api/v5/addons/addon/chatgpt-timekeeper/) returned current version **0.1.3**, file **5122776** with status **public**, and reviewed timestamp `2026-10-14T20:56:38Z`. The add-on remains public, enabled and experimental. Compatibility is Firefox desktop minimum 142.0 with the unchanged `personalCommunications` and `locationInfo` disclosures.

Downloaded the [0.1.3 XPI](https://addons.mozilla.org/firefox/downloads/file/5122776/chatgpt_timekeeper-0.1.3.xpi): size **25,233 bytes**, SHA-256 **`5d1cb8a9475f6f07721b84099df4a3b7d282c3c5169f31c159b33119409a8777`**, matching the API hash, with valid ZIP CRC. All shipping files other than manifest.json match the submitted Firefox build byte for byte. Mozilla removed the manifest's final newline; parsed manifest data is identical. Signature files `META-INF/cose.manifest`, `cose.sig`, `manifest.mf`, `mozilla.sf` and `mozilla.rsa` are present. Cryptographic signature verification and signed installation/consent testing are not claimed.

The refreshed developer dashboard independently showed **Approved**, file 5122776, listed version **0.1.3**, the saved notes and source View current link. Public distribution is verified. Remaining real-site acceptance and dictation limitations are unchanged; this remains an experimental desktop release, with no Chrome Web Store submission.
