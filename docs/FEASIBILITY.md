# Feasibility and compatibility record

## 2026-10-10 — Firefox desktop spike

Environment: macOS, Firefox **157.0.1** (version observed in Firefox's built-in add-on support URL), logged-in ChatGPT web, fresh temporary chat. One observed site asset: `399565.1a430977f4.js`; this identifies an asset, not a guaranteed stable site build ID.

Observed editor: `form .ProseMirror[contenteditable="true"][role="textbox"]`, with no `id` on the editable element. Observed send control after entering text: `button[type="submit"][aria-label="Send"]`. `#prompt-textarea` was not present in this observed contenteditable composer.

The one-attempt [console probe](../scripts/feasibility-spike.js) listened in window capture, selected the beginning of the first paragraph, and used native `execCommand('insertText')`. It never blocked the gesture, invoked `.click()`, patched private framework state, or hooked a network API. The probe runs only on drafts beginning `Timekeeper feasibility test` and removes its listeners after one attempt.

| Real ChatGPT check | Observed result |
| --- | --- |
| Click Send | One user message beginning `[Local time: 2026-10-10T20:32:43+03:00 | Europe/Moscow]`, followed by the original test sentence |
| Click edit diagnostics | Command accepted, trusted native input event observed, visible text exactly equaled prefix plus original |
| Enter on multiline pasted Unicode draft | One additional user message beginning `[Local time: 2026-10-10T20:33:13+03:00 | Europe/Moscow]`; emoji, Cyrillic and line order preserved |
| Shift+Enter before Enter test | Draft remained unstamped; newline inserted |
| Model receipt | ChatGPT echoed the timestamp first line of the Enter test |

This establishes feasibility for those specific console-probe paths. It does **not** establish isolated content-script behavior, complete undo/retry/failure behavior, or a compatibility guarantee for arbitrary ChatGPT builds.

## Extension validation

Implementation uses one shared core with Firefox-specific manifest metadata generated during packaging. Native input plus exact visible text is a necessary adapter check; it is not a general framework-state proof. The controlled-model fixtures and real extension sends must both pass. Unknown editor schemas are left untouched.

The real ProseMirror fixture exposed a stale-model failure when a synchronous click handler read the editor state immediately after native insertion. Restoring focus synchronously also postponed model reconciliation. The implementation therefore keeps editor focus through the mutation-observer checkpoint, restores selection/focus afterward, and continues the original gesture once via the normal Send button. It never automatically retries a failed or uncertain submission.

The [deferred console probe](../scripts/feasibility-deferred-spike.js) also passed real ChatGPT tests in Firefox:

| Deferred check | Observed result |
| --- | --- |
| Click Send | One additional message with prefix `2026-10-10T20:46:17+03:00`, unchanged original test sentence, timestamp echoed by ChatGPT |
| Enter | One additional message with prefix `2026-10-10T20:49:24+03:00`, preserving the multiline Cyrillic/emoji draft; ChatGPT echoed the timestamp |

Automated checks: **20 unit/source checks and 40 browser fixtures passed** after the paste and signed-out composer fixes below: **20 Firefox + 20 Chromium**. Fixtures use Playwright 1.64.0 / Firefox 157.0 / Chromium 156.0.8078.4, real ProseMirror state/view/history, and controlled textarea models. They cover click/Enter exactly once, model text equality, retry refresh, selection, undo, failed-command and mismatched-edit rollback, disabled/blank/composition/modified Enter, unrelated fields, ambiguous and rich editors, recreated composers, native typing/backspace/framework paste, ChatGPT literal-paste spans, the signed-out composer controls, and popup keyboard/dark-mode/narrow-width behavior. Firefox popup rendering was visually inspected.

The default headless launch failed before tests because of the reported [macOS Firefox app-data issue](https://github.com/microsoft/playwright/issues/42768). Passing `CFFIXED_USER_HOME=/private/tmp/timekeeper-firefox-home` isolated test app data and allowed all fixtures to run. The real Firefox profile and OS permissions were not changed.

## 2026-10-10 — Installed Firefox extension tests

Version **0.1.0** was packaged with `npm run package` and loaded through Firefox's **Load Temporary Add-on** control from `dist/firefox/manifest.json`, after explicit user confirmation. Firefox's debugging page listed ChatGPT Timekeeper under Temporary Extensions. ChatGPT was loaded afresh for isolated content-script injection; no console stamping probe was installed during these tests.

The first pasted-click test sent the original text unstamped. DOM inspection of only the active test composer revealed `P > SPAN[data-prompt-literal-paste=""] > #text`. The strict adapter skipped that previously unknown wrapper. A typed Enter test succeeded at `21:06:11+03:00`, confirming that the installed content script worked for plain text.

The adapter was extended to recognize only that exact paste wrapper, with text nodes and plain native `BR` line breaks. Other attributes/nested rich nodes remain unsupported. The new ProseMirror regression test initially exposed the native insertion of a `BR` inside the paste span; support for that structure made exact multiline model text, selection, undo and retry checks pass. The package was rebuilt, the add-on reloaded, and ChatGPT reloaded before the following checks.

| Installed-extension check | Observed result |
| --- | --- |
| Pasted text, Send click | One message with prefix `2026-10-10T21:08:55+03:00`, original test sentence retained; ChatGPT echoed the timestamp |
| Multiline paste, Shift+Enter, then Enter | Draft remained unstamped before sending; one message with prefix `2026-10-10T21:09:27+03:00`, Cyrillic, emoji, blank line and fenced code retained; ChatGPT echoed the timestamp |
| Sent code source inspection | Opened Edit on our own test message without changing/submitting it, verified code fences and original text, then cancelled |
| Popup off in already-open tab | Keyboard-operated switch changed to off; one original, unstamped test message; ChatGPT replied OK |
| Popup reopened, then on | Off setting persisted across popup reopen; switching on required no page reload; next click sent one message with prefix `2026-10-10T21:10:40+03:00`; ChatGPT echoed the timestamp |
| SPA New chat, then Temporary chat | Recreated composer found without page reload; typed Shift+Enter left draft unstamped; Enter sent one message with prefix `2026-10-10T21:11:13+03:00`; both lines retained and ChatGPT echoed the timestamp |

All successful prefixes used `Europe/Moscow` and `+03:00`, matching the popup clock. No message loss or duplicate sends were observed in these checks. Exact character preservation, undo, and failed-send/retry behavior were verified in controlled fixtures; the visible real-site checks do not prove every possible editor/model state.

Tested packaged `content.js` SHA-256: `26d671ff2b526003951a0b1ab7f29243433e439b85ae86c9e15f2eccf513e506`.

The updated temporary add-on is left loaded and enabled for user testing; Firefox removes it on restart. Real-site IME, attachment-only, long-draft and failure/undo matrix checks remain pending. Full release acceptance is incomplete.

## 2026-10-10 — User dictation report

The user reported that **Send while dictating** submits without a timestamp. **Stop dictation → Send** adds the timestamp after the transcript appears in the ordinary composer. The supplied screenshot showed an unstamped dictated message after a stamped text message. The active-dictation editor/send path has not been inspected; its cause is not established. This is a known unsupported path tracked in [TODO.md](../TODO.md), with separate manual test cases.

## 2026-10-10 — Installed Chrome extension tests, signed out

Environment: Google Chrome **153.0.8010.36 (Official Build, arm64)** on macOS **27.0.1**, observed in `chrome://version`. Version **0.1.0** loaded unpacked from `dist/chromium/`, after the user granted Chrome access and explicitly confirmed Developer mode/local extension loading. Chrome listed ChatGPT Timekeeper as loaded and enabled. The user requested testing without an account, so these checks used signed-out ChatGPT; the temporary-chat query did not provide the signed-in temporary-chat interface.

The initial click test sent the original draft unstamped. Read-only DOM metadata inspection of the active composer showed `form textarea#mobile-composer-prompt` and a related `button[type="submit"][aria-label="Send message"]`, without a send-button data-testid. The adapter was extended to recognize that exact textarea and its related submit control. The name of the textarea ID is not evidence of mobile support. Five controlled-model regression checks were added for the signed-out controls; all 20 Firefox fixtures passed. The package and Chrome add-on were rebuilt/reloaded, then the ChatGPT test tab reloaded. No console stamping probe was used.

| Installed-extension check | Observed result |
| --- | --- |
| Typed Send click | One message with prefix `2026-10-10T22:22:14+03:00`, original sentence preserved. The generic first-line echo returned the sentence rather than the timestamp; explicit receipt checks followed |
| Multiline paste, Shift+Enter, then Enter | Draft stayed unstamped until send; one message with prefix `2026-10-10T22:22:56+03:00`; Cyrillic, emoji, blank line, code fences and code text preserved in the visible user message. ChatGPT explicitly echoed the complete timestamp line |
| Popup off in already-open tab | Mouse-operated switch changed to off; Enter sent one original, unstamped message; ChatGPT replied OK |
| Popup reopen, then on | Off persisted across popup reopen; on applied without page reload; Send click produced one message with prefix `2026-10-10T22:23:55+03:00`; ChatGPT echoed the complete timestamp line |
| New chat | Chrome's signed-out page presented a discard-current-chat confirmation. It was cancelled, preserving the test conversation; no real-site navigation send is claimed |

All prefixes used `Europe/Moscow` and `+03:00`, matching the popup. No lost or duplicate messages were observed. The updated Chrome extension is left installed and enabled, with an empty composer. Tested packaged `content.js` SHA-256: `229c3db89fbafbca7532bdeca465f25bfea4f67acf2b10d7eb9e638dd396fcc2`.

The full fixture matrix also passed in Chromium 156.0.8078.4 (official Playwright download, separate disposable profiles). Its first run exposed a test-only assumption: native newline insertion emits two input events in Chromium, rather than one. Exact model text and one submitted message already passed. The test now checks one native insertion command per gesture and at least one input event; both engines passed all 40 fixtures after that correction. These engine fixtures do not establish signed-in Chrome site compatibility.

Signed-in Chrome and real-site navigation were checked subsequently, below. Real-site IME, attachment-only and failure/undo checks remain pending. Edge/Brave/Opera are untested. Safari/macOS packaging and all mobile/native-app support remain separate milestones. The active-dictation send TODO remains unchanged.

## 2026-10-10 — Installed Chrome extension tests, signed in

The user signed in and requested further testing. The same installed Chrome 153.0.8010.36 extension/package was tested in fresh temporary chats, without a source change or a stamping probe. Read-only metadata inspection of the active test composer showed a `DIV.ProseMirror[contenteditable="true"][role="textbox"]` inside a form and `button[type="submit"][aria-label="Send"]`, matching the relevant editor/send attributes observed in signed-in Firefox. The earlier Chrome guest layout therefore does not establish a browser-specific HTML difference; authentication/site variants remain possible explanations.

| Installed-extension check | Observed result |
| --- | --- |
| Accessibility activation of Send, typed single-line draft | First activation added prefix `22:33:03+03:00` but left the draft unsent. Explicit second activation refreshed it to `22:34:02+03:00` and sent one message; ChatGPT echoed the timestamp |
| Multiline paste, Shift+Enter, composer Enter | Draft remained unstamped before send; one message with prefix `22:34:39+03:00`, Cyrillic, emoji, blank line and code preserved visibly; ChatGPT echoed the timestamp |
| Popup off | Composer Enter sent the original unstamped message; ChatGPT replied OK |
| Popup reopen, then on | Off persisted; on applied without reload. Accessibility Send activation stamped at `22:36:00+03:00` but retained the draft again. Explicit composer-Enter retry sent once with refreshed prefix `22:36:28+03:00`; ChatGPT echoed it |
| SPA New chat → Temporary chat | Without page reload, composer Enter sent a fresh single-line draft once with prefix `22:37:06+03:00`; ChatGPT echoed it |
| Pointer Send click | A coordinate-based pointer click sent a fresh pasted single-line draft once with prefix `22:37:38+03:00`; ChatGPT echoed it |
| Native keyboard activation of focused Send | Tab from the composer through controls to Send, then Space, reproduced the unsent stamped draft at `22:38:17+03:00`. Explicit composer-Enter retry sent once with refreshed prefix `22:38:32+03:00` |

All prefixes included `2026-10-10`, `Europe/Moscow` and `+03:00`. No original text loss, stacked prefixes or duplicate submissions were observed. A temporary page-context observer recorded event types/trust/default-prevention and draft lengths during an explicit retry; it did not alter drafts or submit messages, and was removed afterward. No private framework state or network APIs were inspected. The focused-button cause is not established; focus restoration/reconciliation is an investigation lead, not a proven diagnosis. Pointer clicking and Enter from the composer passed, while the focused-button path remains a compatibility bug tracked in [TODO.md](../TODO.md).

Tested packaged `content.js` SHA-256 remains `229c3db89fbafbca7532bdeca465f25bfea4f67acf2b10d7eb9e638dd396fcc2`. The extension is left enabled. Automated fixtures were not rerun for these documentation-only changes; the previous 20 unit/source and 40 fixture passes remain evidence for their existing scope, which did not expose this real-site focused-button failure.

Known limits: send-label localization without the candidate data-testid is unsupported; rich inline/block editor structures are skipped; browser-native editing APIs are deprecated and version-dependent. A native change whose undo cannot restore the original is a release-blocking failure, not successful stamping. No production-readiness claim is made while the manual release gate remains incomplete.

## 2026-10-10 — Focused Send-button fix

The focused-button failure above is fixed in the shared interceptor. The adapter's native insertion, exact-text verification, selection restoration and undo behavior are unchanged. The single Send-button continuation now runs with `setTimeout(..., 0)` in the next event-loop task instead of `queueMicrotask`. The per-editor guard remains held until the continuation finishes; a second supported gesture while it is pending is suppressed. Composer identity, button availability and exact draft text are checked before the one continuation. Changed drafts are retained and failed sends are never retried automatically.

Investigation distinguished activation timing from editor reconciliation. A new fixture uses native **Tab → Send → Space**, rather than pointer click or synthetic event dispatch. Before the fix, it failed in all three Chromium variants (controlled textarea, signed-out textarea and real ProseMirror): no framework-model message was submitted. The same tests passed in Firefox. After moving continuation to a task, all six passed. This also reproduces the issue without ProseMirror, so focus/framework reconciliation alone does not explain it.

The diagnosis is Chromium's simulated-click reentry suppression: a microtask inside native keyboard/accessibility activation can run before the original simulated click has returned, and the resumed `.click()` is suppressed. Chromium's [event dispatcher implementation](https://chromium.googlesource.com/chromium/src/%2B/abb1a367321240a7568efbc2e2ee5c9e87b76d89/third_party/blink/renderer/core/dom/events/event_dispatcher.cc) keeps a per-node simulated-click guard until dispatch returns. The source and cross-editor before/after results support this diagnosis; no ChatGPT private framework state or network APIs were inspected or patched. The earlier mutation-observer requirement still applies, and a task also runs after that checkpoint.

### Automated evidence

**20 unit/source checks and 64 browser fixtures passed: 32 Firefox + 32 Chromium.** The added checks cover native focused Space and Enter for all three editor candidates, exact Unicode/multiline/code text from the actual controlled model, one prefix/one submission, suppression of a second pending gesture, one failed attempt with no automatic retry, explicit retry with a fresh prefix, and cancellation when the user changes the draft before continuation. Existing selection/undo, pointer/composer Enter, settings, paste, schema rejection, SPA and privacy checks remain passing. Tests now wait for asynchronous submission; failed-send checks count submission attempts even when no message is accepted.

The regression failed before the source change and passed afterward. Engines remain Playwright 1.64.0 / Firefox 157.0 / Chromium 156.0.8078.4. Disposable browser binaries were already available in `/private/tmp/timekeeper-playwright`. The full run used:

```sh
npm test
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/timekeeper-playwright \
  CFFIXED_USER_HOME=/private/tmp/timekeeper-firefox-home npm run test:browser
npm run package
node scripts/build.mjs --check
```

Browser launches required execution outside the macOS process sandbox; the normal sandbox could not launch either engine. Test app data/profiles remain separate from the user's installed profiles.

### Installed-extension evidence

Rebuilt version **0.1.0**, reloaded the already-installed Chrome extension and Firefox temporary add-on, then opened fresh signed-in temporary ChatGPT chats. No console stamping probe or diagnostic observer was installed for these checks. Chrome **153.0.8010.36 (Official Build, arm64)** and macOS **27.0.1** were reconfirmed in `chrome://version`; Firefox **157.0.1** was reconfirmed in its debugging page.

| Browser / action | Observed result (all on 2026-10-10, +03:00, Europe/Moscow) |
| --- | --- |
| Chrome: native Tab → Send → Space, single-line draft | First activation sent one message, prefix `22:53:06`; composer cleared and ChatGPT echoed the timestamp |
| Chrome: native Tab → Send → Enter, single-line draft | First activation sent one message, prefix `22:54:00`; composer cleared and ChatGPT echoed the timestamp |
| Chrome: actual coordinate pointer click, multiline paste | One message, prefix `22:54:27`; Cyrillic, emoji, blank-line layout and code visible; ChatGPT echoed the timestamp. Opened our own message's Edit control to inspect code fences/quotes, then cancelled without changing or resubmitting it |
| Chrome: accessibility Send activation | First activation sent one message, prefix `22:55:28`; composer cleared and ChatGPT echoed the timestamp |
| Chrome: Shift+Enter, then composer Enter | Newline left draft unstamped; Enter sent one message, prefix `22:56:23`; both lines/Unicode retained and ChatGPT echoed the timestamp |
| Firefox: native Tab → Send → Space | First activation sent one message, prefix `22:56:55`; composer cleared and ChatGPT echoed the timestamp |
| Firefox: multiline/code paste, Shift+Enter, then composer Enter | Draft remained unstamped before send; one message, prefix `22:57:37`; Unicode, code and tail text visible; ChatGPT echoed the timestamp |
| Firefox: actual coordinate pointer click | One message, prefix `22:58:09`; composer cleared and ChatGPT echoed the timestamp |

Final visible state: five new user messages in the Chrome test chat and three in the Firefox test chat, one prefix per message, no lost/duplicate submissions observed, both composers empty. Exact character preservation and failure/undo behavior are established by controlled-model fixtures; accessibility/rendered real-site views do not establish every whitespace/model state. Both updated extensions are left enabled; Firefox's temporary add-on is removed on browser restart.

Tested `content.js` SHA-256, identical in source and both packages: `ff66f4fb4e92069bc40936de5d5b2ebc9c0ddc990e8eae06ace44f808696f7b0`.

Active dictation remains a separate unsupported path in [TODO.md](../TODO.md). Real-site IME, attachment-only and failure/undo release checks remain pending; this fix does not complete the full production acceptance gate.
