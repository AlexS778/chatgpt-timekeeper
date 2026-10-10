# Contributing

ChatGPT Timekeeper is an MIT-licensed development preview. Start with [README.md](README.md), [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md), [TODO.md](TODO.md) and the dated evidence in [docs/FEASIBILITY.md](docs/FEASIBILITY.md). The design describes targets; the feasibility record describes observations and remaining acceptance work.

Use Node 22 or later. Install pinned development dependencies with `npm ci`, then run:

```sh
npm run check:build
npm test
npx playwright install firefox chromium
npm run test:browser
npm run package
npm run verify:package
```

Edit `src/` and run `npm run build` when content-script behavior changes; commit the regenerated `content.js`. Runtime dependencies, network hooks, telemetry and prompt persistence are outside the design. Keep site selectors in the adapter, preserve original text and native undo, and verify the submitted framework model rather than only visible DOM. Changes to sending need regression fixtures proving text preservation and exactly one submission. Manual browser validation must use harmless prompts in a fresh test chat; follow [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md) and record browser version, date, scope and skips.

For a bug report, provide extension/browser version, signed-in or signed-out state, send gesture, expected/observed behavior and a minimal invented prompt. Remove conversation text, account details, URLs, authentication material and personal screenshots. Do not post real prompts or recordings to reproduce dictation reports. Use the repository's GitHub Issues once published. Security-sensitive reports should use GitHub private vulnerability reporting if enabled by the maintainer; do not disclose credentials or private content in a public issue.

Preview archives require Python 3.9+ in addition to Node. `npm run release` creates unsigned ZIPs and checksums locally; it does not create tags or publish anything. See [docs/RELEASING.md](docs/RELEASING.md).
