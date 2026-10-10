# Firefox submission preparation

Prepared 2026-10-11. Version **0.1.1**, permanent Firefox ID **`chatgpt-timekeeper@alexs778.github.io`**, selected by the publisher before first signing. Monitored listing contact: **`probe-mumble7g@icloud.com`**. Runtime remains small and dependency-free. No sending-module changes; `content.js` SHA-256 remains `292c3147a1a3898865d894db88f081fca7e700f7912b61ef1bb5e150d387c92b`.

## Verified preparation

- Read README, original system design, TODO, feasibility, store listing/privacy/release/review notes, and readable-timestamp provenance. Historical acceptance evidence remains distinct from this run.
- Checked current official [AMO submission steps](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/), [source requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/), [data taxonomy/consent](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/), [policies](https://extensionworkshop.com/documentation/publish/add-on-policies/) and [permission testing](https://extensionworkshop.com/documentation/develop/test-permission-requests/). Keep required `personalCommunications` and `locationInfo`: the draft is a chat message, and the sent GMT offset can suggest a broad region. This interpretation still awaits AMO review; there is no developer collection or GPS lookup.
- Public privacy URL returned HTTP 200 without authentication and contained the title and GMT-offset disclosure. Recheck the contact update after pushing the final candidate.
- Prepared and visually inspected a 1280×800 composition of unchanged real Firefox captures. [Graphics provenance](images/store/README.md). No private chats, identities, fixture UI or generated UI appear.
- Fresh pinned development dependency installation succeeded. Node 22.21.1, npm 10.9.4, Python 3.11.5. `check:build` and 21 unit/source checks passed; 64 source fixtures passed (32 Firefox, 32 Chromium).
- Exact extracted Firefox ZIP passed all 32 existing Firefox fixtures in a disposable harness. These exercise the ZIP's shipping scripts, popup and policy with controlled editor/storage models; they are not real ChatGPT or extension-origin installation checks.
- Browser package allowlists/source equality and ZIP CRC checks passed. Mozilla Add-ons Linter 10.14.0 reported **0 errors, 0 warnings, 0 notices**. Repeat builds produced identical browser ZIP checksums.
- Independently verified all three jobs in the earlier [hosted run 38085643626](https://github.com/AlexS778/chatgpt-timekeeper/actions/runs/38085643626) succeeded. That run is evidence for the earlier commit, not this candidate.

## Dashboard access and actual outcomes

Signed-in AMO Developer Hub showed “Submit Your First Add-on.” Entering that flow led to required Mozilla account confirmation and two-step authentication setup. Credential setup must be completed by the publisher; no credentials or recovery material are recorded here.

**No package upload, submission, signing, review decision, approval, rejection or public AMO listing has occurred in this preparation run.** ID availability is unverified. Firefox submission is authorized, but account/legal and acceptance gates are unfinished. Select **desktop only** and **experimental**, using STORE.md copy and reviewer notes. Check the real dashboard's disclosure fields before submitting. Provide disposable reviewer credentials privately if signed-out access does not allow review.

Chrome is deferred at the publisher's request after the first-registration dashboard showed an agreement and $5 fee. No fee paid or agreement accepted by the agent. Chrome graphics and draft metadata are retained for future use.

## Remaining acceptance

The exact final ZIP has not yet been loaded for live-site acceptance. Live IME, attachment-only, long-draft and failure/undo acceptance remain incomplete. Do not test active dictation: stop dictation before Send. Use harmless invented drafts and disposable chats only. Unknown editors can send unstamped; deprecated native editing and ChatGPT interface changes remain risks. No mobile, Safari, other-browser or Firefox-minimum-version support claim is made.

Temporary loading grants installation permissions silently. It cannot establish the actual consent prompt. Verify consent with a signed installation when available; do not weaken signature enforcement on the publisher's browser to simulate signing.

Before upload, use the final commit's fresh source ZIP, rebuild in a separate extracted checkout and compare artifact bytes. Record the exact commit, source and browser hashes, hosted CI URL, selected dashboard fields, submission identifier/time and actual signing/review result. Preserve `v0.1.0-preview.2` and its assets; `v0.1.1-preview.1` remains an intended future tag, not a created release.
