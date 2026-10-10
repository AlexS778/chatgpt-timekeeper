# Readable timestamps and README screenshots

Prepared 2026-10-10 for the unreleased 0.1.1 candidate on `store-readiness`.

The timestamp now reads `[Local time: 2026-10-10 23:38:30 GMT+3]`. It uses a space between date and time, omits zero minutes from whole-hour GMT offsets, and leaves the IANA zone name in the popup instead of sending it in each message. Fractional offsets remain explicit, for example `GMT+5:30`, `GMT+5:45` and `GMT-3:30`; UTC is `GMT+0`. Date/time still comes from the device clock, including its daylight-saving rules.

The existing marked first line and newline remain necessary for safe prefix refresh. Both the new format and the previous ISO-style preview format are recognized at the start of a draft. Bare user-written dates, quoted lines and timestamps elsewhere in a message are preserved. Send interception, native editing, rollback and continuation logic were not changed. Active dictation was not exercised or modified.

The README now starts with a short explanation, real screenshots, an example and installation instructions. Previous compatibility, privacy, development and release details are retained in the expandable section at the bottom. The public 0.1.0 preview still has the older format; the README makes this difference explicit. Policy and store disclosure text were updated to distinguish the sent GMT offset from the locally displayed time-zone name.

## Verification

- 21 unit/source checks passed, including exact readable output through calendar boundaries and both daylight-saving transitions, half/quarter-hour offsets, legacy-prefix migration and preservation of user-written dates.
- All 64 Firefox/Chromium fixtures passed, including retry freshness, one submission, model text/selection/undo and the updated popup.
- Browser package allowlists/source equality passed; Mozilla Add-ons Linter reported zero errors, warnings and notices.
- Generated `content.js` SHA-256: `292c3147a1a3898865d894db88f081fca7e700f7912b61ef1bb5e150d387c92b`.

## Real Firefox demo and image provenance

Firefox 157.0.1 on the existing macOS profile loaded the generated `dist/firefox/` package after extension reload. A fresh temporary chat was created, chat history hidden, and one harmless prompt sent by pointer click:

```text
What local time is shown in this message? Answer in one short sentence.
```

The sent user message contained exactly one prefix, `[Local time: 2026-10-10 23:48:01 GMT+3]`, with the original text intact and the composer cleared. ChatGPT replied: “The local time shown is 11:48:01 PM on October 10, 2026 (GMT+3).” No second send was performed.

- `images/timekeeper-in-action.png` (860×280) is a native Firefox screenshot selection of that actual message and reply. Browser chrome, private history, profile identity and the conversation URL are outside the captured region.
- `images/timekeeper-popup.png` (300×435) is a native Firefox screenshot selection of the actual installed extension's `popup.html`, opened in its extension origin with its real saved setting and runtime version. The visible clock is 23:49:13 GMT+3. It is not a simulated store image.

Files were copied without image generation, retouching or replacement of text. Capture selections were made inside Firefox; both PNGs were visually inspected. They illustrate the current README and are not claimed to satisfy final store screenshot dimensions.

This verifies one current real-site Firefox Send path and popup display. It does not complete the remaining acceptance matrix or establish installed Chrome compatibility for the new format. The historical feasibility record and the store-readiness review of commit `7ab001e` remain separate evidence.
