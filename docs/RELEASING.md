# Preview release preparation

The current GitHub preview release is `v0.1.3-preview.2` (numeric extension version `0.1.3`); reproduce it from that tag. The older `v0.1.0-preview.2` release remains unchanged. Firefox `0.1.3` is publicly available on [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/chatgpt-timekeeper/), verified on 2026-10-14; its submitted source is commit `c5f471c3d438266533ec9fe85d3b2c59249a5db0` (see [artifact verification](FIREFOX_SUBMISSION.md#version-013-update--2026-10-14)). The earlier 0.1.2 GitHub preview added documentation and release automation without changing its runtime. Current source builds the **0.1.3** formatted-paste fix, with `package.json` setting `previewTag` to `v0.1.3-preview.2`. [Release notes](releases/v0.1.3-preview.2.md), [validation](FORMATTED_PASTE.md) and [Mozilla submission record](FIREFOX_SUBMISSION.md#version-013-update--2026-10-14) describe this release. The release script checks this identifier against the numeric version. Change the identifier and notes deliberately for later previews; never move an already published tag.

## Local checks

Use Node 22+ and Python 3.9+. Begin with a clean checkout and install dependencies:

```sh
npm ci
npm run check:build
npm test
npx playwright install firefox chromium
npm run test:browser
npm run package
npm run verify:package
npm run lint:firefox
npm run release
```

Run `check:build` before commands that regenerate `content.js`, so stale checked-in output fails review. Linux CI installs browser OS dependencies with `npx playwright install --with-deps firefox chromium`. The README describes the macOS Firefox app-data workaround. Fixture tests use disposable profiles and invented prompts; do not use a personal browser profile.

`npm run package` replaces generated browser directories using the shipping file list. `npm run verify:package` verifies versions, manifest constraints, file lists and source equality. `npm run release` runs both, then uses Python's standard library to create ZIPs with sorted entries, fixed timestamps/permissions and uncompressed bytes. ZIP CRC and byte-for-byte content are checked. Two builds from identical source must produce identical `SHA256SUMS` on all hosts, independent of file mtimes and compression-library versions.

To verify downloaded/local assets on macOS:

```sh
cd dist/release
shasum -a 256 -c SHA256SUMS
```

On Linux use `sha256sum -c SHA256SUMS`. ZIPs have `manifest.json` at their root. They contain no tests, dependencies, screenshots, console probes or local paths.

Review the MIT license, source, documentation links, dependency lockfile, ignored files and [publication review](PUBLICATION_REVIEW.md). Keep limitations in README and release notes aligned with TODO and feasibility evidence. `SYSTEM_DESIGN.md` is the original proposal, not completed acceptance. Source includes historical console probes as documented evidence; those probes are not part of shipping assets and must not be used as the production adapter.

After checks pass, review and commit source, prepare matching release notes, then create an annotated tag using the candidate identifier in `package.json`. Check the clean worktree, tag target and generated checksums. Building packages does not create a tag or publish a release. GitHub Actions test jobs have read-only permissions. A preview-tag push runs the release job only after both unit-test matrix jobs and the browser/package job pass. It validates the tag against `previewTag`, checks release notes exist, rebuilds without installing dependencies, compares both ZIPs and checksums with the tested CI artifact, then creates a draft GitHub prerelease with those three assets and makes it public. Only that tag-gated job has `contents: write`; Actions never pushes tags.

## Publication boundary

The user approved the public destination `AlexS778/chatgpt-timekeeper`. For future publication to another destination, obtain its explicit approval first. Review existing remote state before pushing; do not overwrite an existing repository or release. Use a new reviewed tag and matching release notes (the published [preview .2 notes](releases/v0.1.0-preview.2.md) are historical), mark the GitHub release **prerelease**, and attach only the two versioned ZIPs and `SHA256SUMS`.

For publication, push the reviewed main commit, then its new annotated preview tag. The tag-triggered CI run publishes the prerelease automatically after the checks above pass. Observe the actual run and verify the public release assets against local checksums. If a check fails before publication, resolve it in a new reviewed commit and use a new preview tag; do not claim that local passes prove hosted CI passed. Firefox store distribution and permanent ID registration are recorded in [FIREFOX_SUBMISSION.md](FIREFOX_SUBMISSION.md). Signed installation consent, other stores, Safari packaging and production readiness require separate acceptance work.

## Store submission

Follow [STORE.md](../STORE.md) and [CHROMEWEBSTORE.md](../CHROMEWEBSTORE.md). The Mozilla validator is a local package check, not signing or policy approval. Submit reviewable source separately because `content.js` is assembled by the build script. From the final reviewed commit, `git archive --format=zip --output=/private/tmp/timekeeper-source-<commit>.zip <commit>` produces a source archive excluding local profiles, installed skills, dependencies and generated packages. Rebuild from an extracted source archive and compare both browser ZIPs before uploading; do not reuse an older temporary source ZIP. Include the recorded Node/Python versions and build instructions from STORE.md.

As of 2026-10-11, the publisher authorizes Firefox submission and has selected permanent ID `chatgpt-timekeeper@alexs778.github.io`. Preserve this ID after first signing. Chrome submission is deferred. Account credential setup and legal agreements must be completed at their actual dashboard gates; acceptance checks remain required. See [FIREFOX_SUBMISSION.md](FIREFOX_SUBMISSION.md) for the preparation record. No tag or GitHub release is created by store preparation.
