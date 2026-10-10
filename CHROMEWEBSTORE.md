# Chrome Web Store listing — ChatGPT Timekeeper

Last updated: 2026-10-10. **Draft, not submitted.** Version: 0.1.1.

## Store listing

**Extension name:** ChatGPT Timekeeper (matches manifest).

**Short description:** Adds your browser-local time to outgoing ChatGPT messages.

**Detailed description:** Use the plain-text copy in [STORE.md](STORE.md#listing), including preview and dictation limitations.

**Category:** Productivity. **Primary language:** English.

**Single purpose:** Add the user's browser-local timestamp to text they choose to send on chatgpt.com.

## Graphics and assets

| Asset | Dimensions | Status | File |
| --- | --- | --- | --- |
| Extension/store icon | 128×128 PNG | Created; original clock with transparent padding | `icons/icon-128.png` |
| Browser icons | 16/32/48 PNG | Created | `icons/icon-16.png`, `icon-32.png`, `icon-48.png` |
| Screenshot | 1280×800 preferred; 640×400 also documented | Actual README demo captured; store-size asset still pending | `docs/images/timekeeper-in-action.png` (860×280) |
| Small promo tile | 440×280 PNG/JPEG | Pending; **required**, despite installed template marking it recommended | — |
| Marquee promo tile | 1400×560 PNG/JPEG | Optional; not created | — |

Show a harmless sent prompt with the visible timestamp plus the current popup; omit account identifiers and private conversations. Fixture screenshots are only test evidence. Final assets must reflect the submission version. [Official graphics requirements](https://developer.chrome.com/docs/webstore/images) take precedence over the skill template.

## Permissions justification

| Permission/access | Purpose |
| --- | --- |
| `storage` | Save only the on/off preference locally and apply changes to open ChatGPT tabs. |
| Declarative content-script match `https://chatgpt.com/*` | Read/edit the current draft and recognize normal Send to add the visible timestamp. |

No separate `host_permissions`, background process, clipboard/history access or additional permissions for links. All executable code is packaged locally. Extension pages explicitly restrict resources to the package and disallow script-initiated connections, object embedding and form submission; this does not change ChatGPT's page CSP or disable its normal sending.

## Privacy and data use

Use the handling table in [STORE.md](STORE.md#privacy-and-data-use) when completing the current dashboard. Disclose **personal communications / website content** for the temporary chat draft and **location** for the broad time-zone information suggested by the GMT offset in sent messages. Explain that no GPS location is accessed. Interaction recognition is transient, without event collection or reporting. Other sensitive content may exist in a user-written prompt; it is neither extracted nor separately stored.

Do not declare that no user data is handled merely because no developer server or extension network API is involved. The user's message and timestamp go to ChatGPT through its normal send flow, with no additional recipient. Final dashboard choices must be checked against the actual form and code before submission.

- [x] Data is not sold to third parties.
- [x] Data is not used for purposes unrelated to the single timestamp feature.
- [x] Data is not used for creditworthiness or lending purposes.

**Privacy policy:** [PRIVACY.md](PRIVACY.md); offline copy in `privacy.html`.

**Intended public URL:** `https://github.com/AlexS778/chatgpt-timekeeper/blob/main/PRIVACY.md`. Publish the policy and verify the URL before submission.

## Distribution and developer info

Proposed visibility: public. Regions: confirm in the dashboard. No automatic submission is configured.

Publisher account/name: **pending confirmation**. Public GitHub owner: AlexS778.

Contact email: **pending monitored address**; do not use the GitHub noreply author address.

Support: `https://github.com/AlexS778/chatgpt-timekeeper/issues`.

Homepage: `https://github.com/AlexS778/chatgpt-timekeeper`.

## Version history

| Version | Changes | Store status |
| --- | --- | --- |
| 0.1.1 | Readable timestamps, icons, popup links/version, offline privacy, security restrictions and updated Firefox disclosures | Draft |
| 0.1.0 | Initial unsigned GitHub preview | Never submitted |

## Review notes

Use [STORE.md](STORE.md#reviewer-notes) for test/build steps and [its submission gate](STORE.md#submission-gate) for remaining work. No store review or rejection has occurred. Store approval is not established by passing local lint.

Active dictation is unsupported. Stop dictation before Send. Real-site IME, attachment-only, long-draft and failure/undo acceptance is incomplete. Unknown editor structures may remain unstamped; changing ChatGPT controls and deprecated native editing are compatibility risks. Safari, mobile and other Chromium browsers are unvalidated/out of scope. Keep these limits in the listing until the evidence changes.
