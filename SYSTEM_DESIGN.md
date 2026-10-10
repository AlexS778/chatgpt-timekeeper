# ChatGPT Timekeeper — System Design

**Status:** Proposed / ready for implementation spike\
**Date:** 2026-10-10\
**Artifact:** Codex-ready engineering specification\
**License target:** MIT\

## 1. Summary

Build a tiny, open-source WebExtension that prepends a browser-local timestamp to **outgoing text messages** sent through the ChatGPT website. It runs entirely inside the user's browser and requires no extension-operated server, cloud account, analytics service, network API, or browser-to-extension bridge.

The extension must not send messages itself to any third party. It modifies the draft in the ChatGPT composer so the timestamp becomes part of the normal user message submitted to ChatGPT. **That timestamp is consequently transmitted to ChatGPT with the user's message**; the extension itself performs no network transmission.

**MVP target:** desktop ChatGPT at `https://chatgpt.com/*`, on current Chromium-family browsers and Firefox. Keep source portable to Safari, but treat Safari installation and validation as a separate distribution track. Mobile browsers and native ChatGPT apps are out of MVP scope.

## 2. Product behavior

When enabled, and only when the user initiates a supported send action for a **nonempty text draft**:

1. Determine the current instant from the browser/device clock **at send attempt time**.
2. Convert it to the browser's local date, time, UTC offset, and named time zone.
3. Place one human-readable, machine-parsable timestamp at the beginning of the outgoing text.
4. Let ChatGPT's normal UI submit the message. Do not send API requests, intercept network traffic, or bypass site controls.

Example result:

```text
[Local time: 2026-10-10T20:02:00+03:00 | Europe/Riga]
Can you help me plan tomorrow?
```

The extension does **not** timestamp ChatGPT responses, modify history, change previously sent messages, manipulate clipboard contents, or operate on other sites.

### 2.1 User interface

A minimal browser action popup (no injected floating widgets):

```text
┌─────────────────────────────┐
│ ChatGPT Timekeeper          │
│                             │
│ Automatically add time [ON] │
│                             │
│ Browser time:               │
│ 2026-10-10 20:02:00 +03:00  │
│ Europe/Riga                 │
│                             │
│ Only runs on chatgpt.com    │
└─────────────────────────────┘
```

- One persisted boolean option: `enabled`, default `true` after installation.
- The popup previews the local clock when opened; no background polling is needed.
- A toggle change applies immediately to already open tabs via `storage.onChanged` where available.
- Keep styling minimal, keyboard accessible, and usable with browser zoom and dark mode.
- Do not include sign-in, settings pages, notifications, onboarding popups, telemetry, or error dashboards.

## 3. Scope, assumptions, and non-goals

| Included in MVP | Explicitly excluded / later |
| --- | --- |
| Text messages entered in ChatGPT web composer | ChatGPT mobile/desktop native apps |
| Standard Send button and Enter-to-send | Every possible site-specific shortcut before it is observed and tested |
| Shift+Enter as newline, not send | Altering message display without changing actual sent text |
| Chromium (Chrome, Edge, Brave, Opera) + Firefox desktop | Guaranteed support for every browser/version |
| Local time, UTC offset, IANA zone | NTP validation, GPS, geolocation, remote time APIs |
| Small popup, on/off toggle | Custom time-format settings, per-conversation settings |
| No network calls by the extension | Support for other AI chat websites |
| No duplicate timestamp; update stale auto-prefix on retry | Injecting into attachment-only or voice-only sends |

Assumptions to **validate in implementation**, not take on faith:
- The ChatGPT composer and send affordances are reachable by a browser content script in the normal page DOM.
- A trusted user send gesture can be detected before ChatGPT serializes the outgoing text.
- The editor can be updated through a supported editing path without breaking application state, focus, selection, or undo.

If any assumption fails, stop and report the specific limitation; do not ship a fragile workaround as if it were reliable.

## 4. Architecture

```text
Browser (local machine)
┌─────────────────────────────────────────────────────┐
│  ChatGPT tab (https://chatgpt.com)                   │
│                                                     │
│  ChatGPT composer / send button                     │
│           │                                         │
│           ▼                                         │
│  Content script (isolated world)                    │
│   ├─ Composer adapter: find active editor          │
│   ├─ Send detector: click / Enter                  │
│   ├─ Timestamp formatter: Date + Intl              │
│   ├─ Draft editor: safe text insert/replace        │
│   └─ Dedupe and submit verification                │
│           │                                         │
│           ▼                                         │
│  Original ChatGPT submission flow                   │
│                                                     │
│  Popup ↔ browser.storage.local: {enabled: boolean} │
└─────────────────────────────────────────────────────┘

No extension background worker, remote service, native host,
webRequest interception, or external API.
```

### 4.1 Components

**`time.ts` / `time.js` — pure functions.** `formatLocalTimestamp(now: Date, timeZone: string): string` builds ISO 8601 local datetime including seconds and offset. Obtain a single `Date` object per attempt (`new Date()`); use its local `getFullYear`, `getMonth`, `getDate`, `getHours`, `getMinutes`, `getSeconds`, and `getTimezoneOffset`. Get the IANA zone name from `Intl.DateTimeFormat().resolvedOptions().timeZone`. UTC offset must be evaluated for that **instant** (handles DST). Fallback to `UTC` or an explicit `UTC±HH:MM` zone label if the browser cannot provide a valid IANA zone. No `Temporal`, geolocation, NTP, or library required.

**`chatgpt-adapter.ts` / `chatgpt-adapter.js` — site-specific DOM code.** Find exactly one active ChatGPT message editor, discover its related form/send control, read plain text, update the draft via the site's supported editing behavior, and verify that the editor reflects the change. Support `textarea` and `contenteditable` as distinct branches. Encapsulate selectors here. Use semantic DOM relationships and attributes where possible; treat `#prompt-textarea` and other observed selectors as **candidates**, not guaranteed contracts. Do not select unrelated page search fields or editor instances. Check for SPA navigation and editors being recreated.

**`send-interceptor.ts` / `send-interceptor.js` — send gestures.** Register listeners in the capturing phase where needed, scoped to the active composer and its submit button. Distinguish Enter-to-send from Shift+Enter, IME composition, and the user's own keyboard behavior. Handle click and keyboard paths without double invocation. Avoid processing unrelated buttons and non-send Enter keystrokes. Where supported, handle form submission as a secondary signal. Use a small, per-editor guard against reentrancy.

**`settings.ts` / `settings.js` — local state.** Read/write only `enabled` via `browser.storage.local` or `chrome.storage.local` using a small compatibility wrapper. Do not persist prompts, timestamps, URLs, or message content. Default `enabled=true` when key absent.

**`popup.html`, `popup.js`, `popup.css` — only interface.** Display enabled state, one toggle, and time preview. No libraries or remote resources.

### 4.2 Timestamp format and idempotency

Canonical inserted prefix:

```text
[Local time: YYYY-MM-DDTHH:mm:ss±HH:MM | IANA/Zone]
```

Example: `[Local time: 2026-10-10T20:02:00+03:00 | Europe/Riga]`.

Rules:
- Insert exactly once at the very beginning, followed by one newline; preserve every original draft character after the prefix.
- Recognize and replace **only a matching Timekeeper-style prefix anchored at character 0** on a later send attempt, so a failed send followed by a retry gets a fresh time rather than another prefix.
- Never search-and-replace timestamp-looking text elsewhere in the user's message.
- Do not append a timestamp to empty/whitespace-only or attachment-only prompts in MVP.
- Keep seconds (not milliseconds) to reduce noise. No timezone configuration is required: the browser's current local zone is authoritative for the MVP.

### 4.3 Send transaction: safety-critical

The main technical risk is that updating the DOM is **not necessarily updating ChatGPT's editor model** (for example, a framework-managed `contenteditable`). It is not enough to set `innerText`, `textContent`, or `textarea.value` and hope the framework submits that state.

Preferred flow:

1. Observe a legitimate send gesture; verify the setting is on and a uniquely identified text composer is active.
2. Read the current draft and generate a fresh prefix **synchronously as close to the gesture as practical**.
3. Through a tested editor adapter, insert/update the prefix using the editor's native editing pathway; preserve text, focus, selection, and undo whenever possible.
4. Verify that both visible editor content and the editor's submit-facing state reflect the stamped text before allowing submission.
5. Permit the normal ChatGPT submission; avoid duplicated dispatch or accidental repeated sends.
6. Clear only ephemeral transaction state. Never retain message text.

**Important:** Different browsers and ChatGPT editor implementations may require different insertion techniques. A synthetic `input` event does not necessarily imply framework state was updated. `document.execCommand('insertText')` sometimes preserves undo but is deprecated and inconsistent; it is a candidate to test, **not a default guarantee**. Direct DOM replacement that can desynchronize the editor is prohibited. Do not patch ChatGPT's internal modules, `fetch`, WebSocket, or the page's global state.

If synchronous stamping is not reliably accepted before a submission handler runs, investigate a narrowly scoped defer-and-resume approach **only if** it can be proven not to drop, duplicate, or mis-send messages. Programmatic `.click()` is not equivalent to every trusted user activation; verify it in every target browser and ChatGPT build used in testing. Do not introduce retries or automatic second sends after an uncertain result.

**Fail-safe contract:** If a safe editor update or exactly-once submit cannot be established, leave the original message/draft intact and do not fabricate successful stamping. Prefer unstamped normal submission over data loss; report a discreet, non-blocking error only if the user can act on it. Do not block user submission indefinitely.

## 5. Manifest and browser packaging

Use WebExtensions **Manifest V3** with a static, isolated content script. Conceptual Chromium/Firefox manifest (exact browser-specific metadata may vary):

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Timekeeper",
  "version": "0.1.0",
  "description": "Adds your browser-local time to outgoing ChatGPT messages.",
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": ["https://chatgpt.com/*"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "ChatGPT Timekeeper"
  }
}
```

**Notes:**
- `document_start` is a starting choice to register early capture handlers, but implementation must handle absent/later-created composer nodes and SPA rerenders. Switch to an experimentally justified injection phase if necessary.
- No `background`, `host_permissions` beyond the declarative matched site, `tabs`, `scripting`, `webRequest`, `notifications`, `clipboardRead`, `clipboardWrite`, or `<all_urls>`.
- Only support `https://chatgpt.com/*` initially. Add the legacy `chat.openai.com` **only if current tests demonstrate a real need**.
- Avoid cross-browser runtime differences by avoiding background pages/service workers altogether. If a distribution platform needs metadata changes, generate a separate manifest from the same core source rather than branching behavior throughout application code.
- Chromium family: unpacked extension / browser store package.
- Firefox: temporary load for development; signed `.xpi` for normal distribution if required. Validate the required Firefox extension ID and permissions during packaging.
- Safari: same web-extension source can be packaged as a Safari web extension, but Apple uses an app-wrapper/package workflow and separate validation/distribution. **Code portability does not mean identical installation on every browser.** Mobile Safari support is a later milestone.

## 6. Security and privacy requirements

The extension necessarily has page content access on ChatGPT to edit a draft, so minimum permissions and transparent code matter.

**Required invariants:**

- All extension logic executes locally; **no** extension-initiated `fetch`, XHR, WebSocket, `sendBeacon`, remote scripts, telemetry, metrics, user IDs, or analytics SDKs.
- No capturing or storage of conversation history, prompt contents, attached files, URLs, authentication tokens, cookies, or input events beyond the composer interactions needed for stamping.
- Never scrape prior messages; read only the draft editor involved in the current gesture.
- No `eval`, dynamic code download, unsafe HTML insertion, or external fonts/icons.
- Do not override ChatGPT security controls, its network stack, or DOM outside the active composer, aside from the browser action popup.
- Isolated content-script world; use text editing APIs, not HTML interpolation with prompt data.
- `storage.local` contains only `enabled`. No cloud sync.
- Source released under MIT, built from reviewable source with a minimal dependency tree. No runtime third-party dependencies; preferably no build step for shipping files.
- Clear documentation: timestamp is visible in the outgoing message and therefore sent to ChatGPT in the normal course of using the site.
- If console diagnostics exist during development, compile/remove or disable them for release; **never log prompt text**.

**Threat model:** malicious extension updates, excessive host permissions, unwanted message mutation, and ChatGPT UI changes. Counter with source review, narrow match patterns, pinned reproducible packaging, least privilege, automated tests, and fail-safe behavior. This is not a way to hide information from ChatGPT, and the browser clock is not a cryptographically trusted time source.

## 7. Testing and acceptance criteria

### 7.1 Automated tests

**Pure formatter unit tests** (run under Node without loading a browser):
- Normal dates; month/year boundaries; leap day.
- UTC positive, negative, fractional offsets (e.g., `+05:30`, `-03:30`).
- Daylight-saving changes before and after transition.
- Prefix insertion, prefix refresh, and preservation of exact message bytes.
- Empty draft, whitespace-only draft, and text resembling a timestamp inside a quoted message.

**Fixture-driven integration tests** for a mock `textarea` and a framework-managed `contenteditable`:
- Click send; Enter send; Shift+Enter newline; IME composition; both input and button paths.
- One sent message and one prefix per gesture. No duplicate sends.
- React-like controlled model receives exact updated draft; not just changed DOM.
- Backspace, paste, multiline text, emoji and non-Latin scripts, code fences.
- Draft/selection/undo preserved; toggling off stops stamping immediately.
- Composer rerender and SPA route changes; multiple non-composer inputs on the page.
- Failed update does not corrupt, lose, or duplicate a message.

Use Playwright's Chromium, Firefox, and WebKit engines for fixture tests if helpful, while recognizing that **WebKit engine tests are not substitutes for actual Safari extension tests**.

### 7.2 Manual end-to-end compatibility matrix

Every supported **real browser**, with a real ChatGPT session and human-approved harmless test prompts:

| Browser | MVP criterion |
| --- | --- |
| Chrome desktop | Must pass |
| Firefox desktop | Must pass |
| Edge/Brave/Opera desktop | Smoke-test current versions before claiming support |
| Safari macOS | Separate porting/packaging milestone; no untested guarantee |
| Safari iOS / mobile Firefox / mobile Chromium | Not claimed for MVP |

For each browser, test: short prompt, long multiline prompt, Shift+Enter, Enter, send-button click, code block, emoji, paste, drafts edited after timestamp injection, failed/retried sends, toggled-off behavior, and editor after navigation to another chat.

**Release gate:** zero observed message loss, zero double sends, no extra network calls, no unauthorized permissions, and correctly formatted timestamp sent in the **actual chat message** (not merely displayed in the DOM). If this gate fails, do not call it production-ready.

### 7.3 Behavior acceptance criteria

1. Given a new text draft and enabled extension, when the user sends, the actual outgoing ChatGPT message begins with one timestamp matching the browser-local time at send, within one second of a controlled test clock.
2. The rest of the user's original text is identical in content and order.
3. Repeated send attempts never stack a second Timekeeper prefix; a retry may refresh the original prefix.
4. Disabled mode changes neither the draft nor the send behavior.
5. Shift+Enter, input composition, and typing do not add timestamps.
6. Unsupported editor variations fail safely rather than claiming successful stamping.
7. Extension has no runtime network requests, remote dependencies, or user-content persistence.

## 8. Suggested repository structure

```text
chatgpt-timekeeper/
├── README.md                 # What it does; privacy; browser install instructions
├── LICENSE                   # MIT
├── SYSTEM_DESIGN.md          # This design
├── manifest.json             # Base MV3 manifest
├── content.js                # Small assembled content script
├── popup.html
├── popup.css
├── popup.js
├── src/
│   ├── time.js               # Pure timestamp/prefix logic
│   ├── chatgpt-adapter.js    # Editor detection/read/write/verification
│   ├── send-interceptor.js   # Gesture handling / idempotency
│   └── settings.js           # storage.local and default
├── tests/
│   ├── time.test.js
│   ├── prefix.test.js
│   └── editor-fixtures.spec.js
└── scripts/
    └── package.mjs          # Optional: simple copying/concat to dist/
```

Minimize duplication: if modern module loading is cross-browser problematic for content scripts, a tiny **dev-only** bundling/concatenation step is acceptable. Output must remain self-contained and have no runtime package dependencies. Do not introduce React/Vue, a state library, a server, or a complex build system for the popup.

## 9. Implementation plan for Codex

**Phase 0 — feasibility spike (highest priority):** Inspect ChatGPT's current composer behavior in Chromium and Firefox. Prototype a content script that stamps a draft immediately before real submission, without double sending, and verify the text in a real sent message. Test both clicking Send and pressing Enter. Document tested date/browser/site build and failure modes. **Stop and report if safe, automatic pre-send insertion is not achievable.** This risk is more important than popup polish.

**Phase 1 — MVP:** Implement pure time formatting, prefix-dedupe, site adapter, send handlers, tiny popup, Manifest V3, local settings, README, and unit/fixture tests. No permissions beyond those in §5; no runtime third-party dependencies.

**Phase 2 — interoperability:** Real-browser tests for Firefox and Chromium variants. Resolve differences in editor events and browser-specific packaging while retaining one shared core.

**Phase 3 — Safari (optional separate release):** Package via Apple's Safari web extension tooling, test on macOS Safari, then assess whether iOS packaging is worthwhile. Document Apple-specific install/distribution steps honestly.

## 10. Deliberate trade-offs and future ideas

- **Visible timestamp vs hidden metadata:** We use visible plain text because there is no supported generic facility to inject invisible per-message metadata into ChatGPT's model context.
- **Local clock vs accurate time service:** `Date` + `Intl` meet the zero-network requirement and respect local time zones and DST, but they inherit errors in the device clock. A remote authoritative clock would violate the offline extension requirement.
- **No network hook:** Changing the composer is less invasive than tampering with ChatGPT requests, and it avoids coupling to undocumented backend APIs; it still needs careful browser/site testing.
- **Simple feature set:** One toggle is enough for v0.1. Possible future user-requested options: UTC-only timestamps, timestamp at end, per-site adapters, disable for temporary chats, or a keyboard-accessible *manual* “Stamp draft” fallback.
- **Compatibility:** Share WebExtension source widely, but only claim platforms that have actually passed their real-browser test matrix.

## 11. Open questions and default decisions

These questions do not block initial implementation because defaults are fixed here:

| Question | v0.1 default |
| --- | --- |
| Prefix or suffix? | Prefix |
| Include seconds? | Yes; omit milliseconds |
| Clock/time zone source? | Browser/device, automatic |
| Enabled on install? | Yes; clear popup toggle |
| Modify already-sent messages? | Never |
| If only an attachment is sent? | Do not modify |
| If editor behavior is unknown? | Fail safely and report unsupported |
| Multi-chat support? | Active ChatGPT composer only, for all tabs |
| What if a failed send leaves a timestamp in draft? | On retry, refresh anchored prefix; never duplicate |
| Store history? | No |
| Mobile browser support? | Not in v0.1 |
| Public distribution? | Source repository + unpacked instructions first; signed stores later |

## 12. Copy-paste instruction for Codex

> Implement the **ChatGPT Timekeeper** browser extension according to `SYSTEM_DESIGN.md`. Start with Phase 0: investigate and demonstrate safe, exactly-once timestamp insertion immediately before actual ChatGPT web message submission. Do not assume that direct contenteditable DOM edits propagate into ChatGPT's editor state. Once verified, build the smallest possible dependency-free Manifest V3 extension with the on/off popup, `Date`/`Intl` local timestamps, anchored prefix replacement, only `storage` permission, and only `https://chatgpt.com/*` site access. Add unit tests, fixture tests, manual browser test instructions, README, and MIT license. Do not add network requests, telemetry, background worker, or message-content storage. If pre-send interception cannot be made safe and consistent, clearly document the limitation rather than risking lost/duplicated user messages.

## 13. Primary technical references

- Chrome extensions — [Content scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- Mozilla — [Content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
- Mozilla — [Background configuration and browser differences](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
- MDN — [Input events](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event)
- MDN — [`execCommand()` caveats](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)
- Apple — [Safari web extensions](https://developer.apple.com/documentation/safariservices/safari-web-extensions)
- Apple — [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari)
