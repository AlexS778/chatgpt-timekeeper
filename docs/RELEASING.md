# Preview release preparation

The public preview release tag is `v0.1.0-preview.2`; package, lockfile and browser manifest versions are `0.1.0`. Numeric browser versions do not carry a SemVer prerelease suffix. `scripts/release.py` currently creates preview `.2` for the package version; update that release identifier and notes explicitly for a later preview. Never move an already published tag.

## Local checks

Use Node 22+ and Python 3.9+. Begin with a clean checkout and install dependencies:

```sh
npm ci
npm run check:build
npm test
npx playwright install firefox chromium
npm run test:browser
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

After checks pass, commit the reviewed source on `main` and create an annotated local tag with `git tag -a v0.1.0-preview.2 -m 'ChatGPT Timekeeper 0.1.0 preview 2: unsigned development preview; production acceptance incomplete'`. Check a clean worktree, tag target and generated asset checksums. GitHub Actions has read-only permissions and does not create releases or push tags.

## Publication boundary

The user approved the public destination `AlexS778/chatgpt-timekeeper`. For future publication to another destination, obtain its explicit approval first. Review existing remote state before pushing; do not overwrite an existing repository or release. Use the prepared tag and [release notes](releases/v0.1.0-preview.2.md), mark the GitHub release **prerelease**, and attach only the two versioned ZIPs and `SHA256SUMS`.

Wait for the first hosted CI run to pass before making the prerelease visible. Compare CI artifact checksums with local assets. If a check fails, resolve it in a new reviewed commit before publication; do not claim that local passes prove hosted CI passed. Signed stores, Firefox ID registration, Safari packaging and production readiness require separate acceptance work.
