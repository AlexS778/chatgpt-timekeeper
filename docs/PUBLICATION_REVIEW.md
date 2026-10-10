# First preview publication review

Prepared on **2026-10-10** for annotated tag **`v0.1.0-preview.1`**, extension/package version **`0.1.0`**. This review supports an open-source development preview. The production acceptance gate in `SYSTEM_DESIGN.md` remains incomplete.

## Reviewed scope

Read `SYSTEM_DESIGN.md`, `README.md`, `TODO.md` and `docs/FEASIBILITY.md`, then inspected shipping source, popup, manifest, build/packaging scripts, tests, fixtures, development lockfile and manual-test documentation. Existing feasibility evidence was preserved as dated history. No active dictation work or new real-ChatGPT interactions were performed. Runtime source, popup and base manifest are unchanged; only release tooling, CI and publication documentation were added or adjusted.

The MIT license was already present and is included in each shipping archive. Runtime has no third-party dependencies. Development dependencies are pinned directly, with transitive versions and registry integrity hashes in the lockfile. There are no vendored private assets or recordings. Historical console probes remain in source as feasibility evidence, clearly marked as non-production, and are excluded from shipping packages.

The source/documentation scan found no credential literals, private keys, account identifiers or personal home-directory paths. Documentation contains only public references, browser/site selectors, harmless test examples and disposable `/private/tmp` paths. This is a publication scan, not a formal security audit. `node_modules/`, `dist/`, Playwright screenshots/reports and test results are ignored; `.env` files, logs and local agent/cloud configuration are excluded as well. Only reviewed project files are committed.

The generated browser packages contain exactly eight files: `LICENSE`, `content.js`, `manifest.json`, `popup.css`, `popup.html`, `popup.js`, `src/settings.js`, `src/time.js`. Each shipping source file equals its repository counterpart. Chromium uses the base manifest; Firefox adds only the documented Gecko ID, minimum-version and no-data declaration. That minimum version is not a compatibility claim. The extension is limited to `https://chatgpt.com/*` and the `storage` permission. The timestamp still travels to ChatGPT as visible user-message text.

CI uses full commit pins verified against the official [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node](https://github.com/actions/setup-node/releases/tag/v6.5.0) and [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v6.0.0) releases. Repository permissions are read-only, checkout does not retain credentials, and no automatic publishing workflow is present. Monthly Dependabot updates cover npm and GitHub Actions.

## Local verification

- Clean lockfile installation succeeded with Node **22.21.1**, npm **10.9.4**; npm reported **0 known vulnerabilities** at that time. No dependency versions were changed.
- **20 unit/source checks passed**, including deterministic checked-in content output and privacy/permission invariants.
- **64 Playwright fixtures passed: 32 Firefox + 32 Chromium**, using the existing Playwright 1.64.0 browser binaries and disposable profiles. Sandboxed browser launches failed before tests; the successful run used execution outside the macOS process sandbox, as in the prior evidence. No personal browser profiles were used.
- Browser fixture execution covered exact submitted model text, pointer/composer/focused-button send paths, one submission, prefix refresh, selection/undo, failures, live settings, unsupported editor handling, navigation and popup behavior within fixture scope.
- Both package file lists, source bytes, versions and manifests passed verification. A temporary unexpected file was deliberately added: verification rejected it; repackaging removed it.
- Two archive builds produced identical checksums. Python ZIP CRC/content checks and independent `unzip -t` checks passed. Archive entries use fixed metadata and contain no development dependencies or local test data.
- Workflow/Dependabot YAML parsed successfully; full action pins and read-only permissions were checked locally. **Hosted GitHub Actions has not run yet**. Ubuntu/Node 24 CI behavior must be confirmed after pushing.

The unchanged generated content script SHA-256 is `ff66f4fb4e92069bc40936de5d5b2ebc9c0ddc990e8eae06ace44f808696f7b0`, matching the latest recorded installed-browser validation.

## Preview assets

Generated locally in `dist/release/`, excluded from source Git history and intended as GitHub prerelease attachments:

| Asset | SHA-256 |
| --- | --- |
| `chatgpt-timekeeper-v0.1.0-preview.1-chromium.zip` | `4f18234afc20135f680e43a51db72b084c62f14f9946f005f4b259c7bdc17047` |
| `chatgpt-timekeeper-v0.1.0-preview.1-firefox.zip` | `cabc08761eaca8fc9e7c99212758dd87b726754b6594951d44d147d013547974` |

`SHA256SUMS` lists both archives. They are unsigned local testing packages, not signed XPI/store installs. See [release notes](releases/v0.1.0-preview.1.md) and [release procedure](RELEASING.md).

## Remaining publication and acceptance work

No remote or GitHub destination is configured during local preparation. The initial placeholder attribution was replaced before publication with the user-provided GitHub identity, **AlexS778 `<98418121+AlexS778@users.noreply.github.com>`**, for both the local commit and annotated preview tag. This repository uses that identity in its local Git configuration; no global Git identity is changed. The preview tag remains unpublished.

Ask the user for the GitHub destination before creating a repository, adding a remote, pushing or publishing a prerelease. Confirm hosted CI passes and compare its artifact checksums before making the release visible. The repository and release are intended to be public, but no publication has happened during this local preparation.

Active dictation remains unsupported and its TODO is unchanged. Real-site IME, attachment-only, long-draft, failure/retry and undo acceptance remains incomplete. Unknown rich/editor/localized controls, changing ChatGPT markup and deprecated native editing remain compatibility limits. Other Chromium browsers are untested; Safari, mobile and native apps remain outside scope. Firefox signing/ID review and all store distribution remain separate work. Do not describe this preview as production-ready.
