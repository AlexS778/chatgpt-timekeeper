# Formatted-paste fix — version 0.1.3

Prepared and validated 2026-10-14. Intended GitHub preview: `v0.1.3-preview.2`; Release publication and AMO submission were authorized after local validation. The first tag, `v0.1.3-preview.1`, failed hosted CI on an immediate selection assertion in the literal-paste fixture (87/88 passed); no release was published. That assertion and the matching rich-selection assertion now wait for asynchronous restoration. `v0.1.3-preview.2` is the published replacement; runtime files are unchanged. Hosted CI and Mozilla submission are recorded below.

## Reproduction and change

The released `content.js` skipped rich inline nodes and any top-level block other than a plain paragraph. The user's Add Two Numbers example creates bold text, decorated links, lists, inline code and an empty code block. Both click Send and Enter reproduced an unstamped message in a real ProseMirror fixture using the released bundle. Read-only inspection of a freshly pasted sample in ChatGPT confirmed the richer DOM, including `span[text-link-href]` and inline icon widgets.

The adapter retains the plain-text pathway and adds a rich-document pathway for paragraphs, headings, lists, code blocks and blockquotes. It inserts a plain timestamp paragraph and a blank separator through native editing. Only the escaped generated clock text and fixed paragraph tags enter `insertHTML`; the original message HTML is never inserted or rewritten by the extension. The complete original body markup must match both immediately after editing and after framework reconciliation, before the single Send continuation. A separate existing prefix is refreshed with native text editing.

Selection bookmarks follow the original text. A rejected edit is undone only if it changed the draft. If undo cannot restore the original, the original send is stopped and the draft remains for manual review; no automatic continuation or retry occurs. The on/off setting, permission scope and privacy disclosures are unchanged.

## Automated evidence

- 21 unit/source checks passed, including deterministic assembled-source equality and privacy/security invariants.
- 88 browser fixtures passed (44 Firefox, 44 Chromium) with Playwright 1.64.0. The final full run used two workers and disposable browser profiles. Earlier runs exposed resource/timeouts and an immediate selection assertion; the selection assertion now waits for asynchronous restoration, matching the model checks.
- Rich tests compare every original ProseMirror document node, attribute and mark after removing the new prefix paragraphs. They cover the supplied example with click and Enter; headings, nested ordered/bullet lists, code blocks with exact whitespace, nested links, bold/italic/inline code, hard breaks, literal markup, selection, undo, explicit retries, legacy-prefix refresh, pending formatting changes, native mismatch and failed rollback.
- The fixture code-block schema uses `defining: true`, as in the [standard ProseMirror schema](https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts), so a single pasted code block stays a code block. The test asserts its initial node type before stamping.
- Native undo grouping is preserved. The undo-isolation test allows the previous paste history group to finish before checking that one undo removes only the timestamp. A send immediately after paste can place paste and stamping in one editor undo group; the extension does not alter private history state.
- Chromium/Firefox shipping allowlists, source equality and manifest validation passed. Mozilla Add-ons Linter reported 0 errors, 0 warnings and 0 notices. Repeat release builds produced identical checksums.

## Installed Firefox check

Firefox 157.0.1 on macOS: temporarily loaded the packaged 0.1.3 manifest under the permanent ID, then opened a fresh temporary ChatGPT chat. Pasted a formatted HTML rendition of the supplied example, plus a harmless instruction asking for the timestamp first line, and activated Send once with the pointer.

The read-only input check recorded one trusted native event, timestamp `[Local time: 2026-10-14 22:53:29 GMT+3]`, and **exact equality of the complete original rich body markup** after the prefix paragraphs. The page displayed one user turn with the timestamp, retained the formatted problem statement and cleared the composer. ChatGPT's response reproduced the timestamp's date, time and GMT offset; no byte-for-byte response-text guarantee is inferred from the model echo.

The temporary candidate was removed after testing. The debugging page returned to zero temporary extensions and restored the permanent Timekeeper installation; its manifest was opened and verified as **0.1.2**. The testing window was closed. No signature setting or store listing was changed.

## Artifact identity and limits

- `content.js` SHA-256: `e1f348b6b2cc73890b3126f0f3749ebcdf734be00652b0f9123cf5d06f9a3830`.
- Chromium ZIP SHA-256: `0b12c40569d2b497b6efa2b25258dace380e7b4ffcd43682fd7bde175a2ae959`.
- Firefox ZIP SHA-256: `62c76eef7ed27ab2119f897c0751c2017c64997c0c5f984318c6a259b06cf163`.

The initial checks above were local; hosted CI is recorded below. No signed 0.1.3 installation is claimed. The new rich pathway has a real-site Firefox pointer-send check; live Chrome rich-send, Firefox rich Enter and the wider IME/failure/undo matrix remain separate acceptance work. Unsupported top-level structures and older prefixes embedded inside a rich block remain unchanged rather than being rewritten or stacked. Active dictation remains unsupported. Native editing and ChatGPT markup can change; this fix does not establish 1.0 readiness.

## Hosted release and submission

The final tag `v0.1.3-preview.2` targets `c5f471c3d438266533ec9fe85d3b2c59249a5db0`. [Hosted CI](https://github.com/AlexS778/chatgpt-timekeeper/actions/runs/38635629762) passed both Node 22/24 unit jobs, all 88 browser fixtures, Mozilla lint (zero errors/warnings/notices), package verification, reproducibility and publication. The [public prerelease](https://github.com/AlexS778/chatgpt-timekeeper/releases/tag/v0.1.3-preview.2) contains the two versioned ZIPs and SHA256SUMS. Downloaded assets match the local artifacts and clean source-archive rebuilds byte for byte.

Mozilla accepted version 0.1.3 with the exact source archive, release notes and reviewer build instructions; its version page initially showed Awaiting Review and public distribution was verified shortly afterward. [Submission details](FIREFOX_SUBMISSION.md#version-013-update--2026-10-14). The Firefox listing now distributes 0.1.3.
