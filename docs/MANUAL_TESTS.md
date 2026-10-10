# Browser manual acceptance checks

Use a new temporary ChatGPT chat with no personal content. Record browser/version, date, extension version, site asset/build identifier if observable, and the editor/send-control attributes. Validate the **sent user message** and ask ChatGPT to echo the first line as a second check that the model received it. Do not inspect private editor internals or hook requests.

| Check | Harmless draft / action | Expected result |
| --- | --- | --- |
| Send click | `Timekeeper extension test (click). Echo my first line.` | One message, one current local prefix, first-line echo includes time |
| Focused Send button | Type a single-line draft; Tab to Send, then Space; repeat with a fresh draft and focused Enter | First activation sends one message with one prefix; original text preserved and composer clears |
| Accessibility Send activation | Activate Send through its accessibility action with a fresh draft | One message and one prefix on the first activation |
| Enter | `Timekeeper extension test (Enter). Echo my first line.` | One message, one prefix |
| Shift+Enter | Type `Line one`, Shift+Enter, `Line two` | No prefix until Send/Enter; both lines preserved |
| Unicode/paste | Paste `Привет 👋` and several lines of text | Characters and line order preserved |
| Code fences | Paste a fenced block with `<`, `>`, quotes and blank lines | Plain message content preserved, or unsupported rich editor left unchanged |
| Undo/selection | Keep a draft after a prevented send; undo once | Original draft returns; caret/selected text follows the same original text |
| Failed send/retry | In an approved local fixture prevent the first send, advance clock, retry | Fresh prefix, no stacked prefix, no automatic retry |
| Edited stamped draft | Edit the text after a failed send and retry | Edits preserved; anchored prefix refreshed |
| Off/on | Toggle off, send text; toggle on in an already open tab, send again | Off sends unchanged; on stamps immediately |
| Navigation | Start another temporary chat or navigate to another chat | Recreated composer works without page-level reinjection |
| Composition | Use an IME; press Enter to commit composition | No premature stamping/sending |
| Dictation stopped before send | Dictate a harmless test sentence, Stop, then Send | Transcript preserved, one prefix, one message; user reported working in Firefox |
| Send during active dictation | Dictate a harmless test sentence and Send while recording | Known unsupported Firefox path: message is unstamped; fix tracked in [TODO.md](../TODO.md) |
| Attachment only | Add a harmless local test attachment without text | No prefix or editor mutation |
| Unrelated fields | Search field, popup controls, other buttons | No composer edit |
| Privacy/permissions | Review package source, manifest, storage and extension debugging | Only `enabled` is stored; no extension-originated network calls |

The automated fixture can simulate a failed send without changing real browser networking. Never trigger an automatic second send after an uncertain result. Document skips honestly. Release requires zero observed message loss/double sends, exact original text, and actual ChatGPT receipt across the claimed compatibility matrix.
