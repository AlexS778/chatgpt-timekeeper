# Store graphics

Prepared 2026-10-11 for version 0.1.1. These are listing compositions, not new browser screenshots.

- `timekeeper-screenshot.png`: 1280×800, square corners and opaque full-bleed background. Embeds `../timekeeper-in-action.png` (860×280) and `../timekeeper-popup.png` (300×435) unchanged at native size. Both were captured from actual installed Firefox use on 2026-10-10; provenance is in [READABLE_TIMESTAMPS.md](../../READABLE_TIMESTAMPS.md). Headings and the footer identify the feature, preview version and Firefox capture source. No fixture, invented UI, retouched message, account identity or private conversation appears.
- `timekeeper-promo.png`: 440×280 opaque original clock branding for a future Chrome listing; no simulated application UI or affiliation claim. Chrome submission is deferred.
- Matching `.svg` files preserve the reviewable layouts and embed the source PNG bytes. Original PNG captures and extension icons are unchanged.

Rebuild using the pinned development renderer: `PLAYWRIGHT_BROWSERS_PATH=<installed-browser-directory> node scripts/store-assets.mjs`. The renderer uses a disposable headless Chromium page, local fonts and embedded images; it is excluded from extension packages. No image-generation service is used. Both PNGs were visually inspected at full size. The icon and screenshot composition were uploaded and saved in AMO for 0.1.2 on 2026-10-11, then visually verified. The caption preserves the actual 0.1.1 capture provenance. The listing is awaiting review; media upload is not store approval.
