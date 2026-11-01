# retroverse.studio — Site Audit

Date: 2026-11-01 · Scope: `index.html`, `assets/js/app.js`, `assets/css/*`,
images, hosting (GitHub Pages). Live checks: every outbound product link
returns 200 (verified 2026-11-01). No build step; baseline is "works in
production today" — this audit is about truthfulness, accessibility,
performance, and robustness, not breakage.

Severity: **High** = user-facing wrongness · **Medium** = real friction or
risk · **Low** = polish. Calibrated for an intentionally playful static
site: the random boot/modes are the point, not a defect.

---

## High

### H1. Several product claims on the front door are stale or not true
The studio site is the one place claims should be airtight:
- **SwipeVerse** tags claim `Android / Windows / macOS` — there are no
  native apps; it's a web PWA ("Works offline (PWA)" is already listed).
- **Incident Zero** is described as playable "online with AI-generated
  attack chains" with a `Multiplayer` tag — the shipped thing is a
  printable tabletop card game + docs/print-pack site. No online play
  exists.
- **Karaoke Stage** tech tags say `Electron` — the desktop app is Tauri
  (same stale claim in `TOOLS` in `app.js`).
- README claims a "persistent … XP system" — XP is never saved
  (`rv_visits` persists; `state.xp` does not).
Fix: correct the copy in **both** places it lives (HTML cards and the
`GAMES`/`TOOLS` arrays in `app.js` used by terminal/BBS/forum), and either
persist XP (one `localStorage` key, matching the README) or fix the README.

## Medium

### M1. Content is duplicated in HTML and JS arrays — and already drifting
Games/tools exist as HTML cards (retro/forum/no-JS views) **and** as
`GAMES`/`TOOLS` JS data (terminal/BBS/forum renderers). Every product
update must be made twice (the ASTRON/NUMERON commits did), and details
already differ between the copies (tech strings, descriptions). H1's stale
claims live in both. Fix options: render the HTML cards from the JS data
(loses no-JS/SEO), or keep HTML canonical and have the renderers read the
DOM cards — at minimum sync now and add comments naming the other copy.

### M2. The boot gate punishes repeat visitors; a11y rough edges
- Every load runs the multi-second boot (line delays sum to ~6–10 s
  unskipped). First visit: delightful. Fifth: friction. No "seen it"
  memory. Suggest: remember `rv_booted` in localStorage and fast-forward
  (or skip straight to the mode) on repeat visits; instant for
  `prefers-reduced-motion` (currently just faster at 15 ms/line).
- `#boot-screen`, `#term-output`, `#bbs-output`, `#forum-output` are all
  `aria-live="polite"` — screen readers get every boot line and command
  echo read aloud. Boot screen should be `aria-hidden` with a
  visually-hidden "loading" text.
- Forum thread rows are clickable `<div>`s — not focusable, no keyboard
  path to expand a thread. Use `<button>` semantics (`aria-expanded`).
- Mode switcher buttons rely on `title` (`>_`, `BBS`, `8bit`, `FRM`) —
  add `aria-label`s ("Terminal mode", …).
- Terminal mode focuses the input on **any** document click — selecting
  output text to copy fights the focus steal. Only refocus when the click
  isn't a text selection / isn't on interactive chrome.

### M3. ~4.6 MB of images, 2.4 MB of it dead or oversized
- `assets/images/pixel-animation.png` (996 KB) is referenced nowhere.
- `assets/images/retroversestudioslogo-source.png` (1.46 MB) is a source
  file sitting in the served directory.
- `hero-bg.png` is 1.83 MB for a CSS background (retro mode only, but
  still); the logo PNG is 221 KB displayed at ≤40 px tall and used as
  og:image. WebP at display sizes would cut this by ~90%.
Header/footer `<img>`s also lack width/height (minor layout shift).

### M4. A localStorage exception kills the whole site
`DOMContentLoaded` runs `initVisitorCounter()` **before** `boot()`, and it
calls `localStorage` unguarded. In browsers/configs where storage access
throws (blocked cookies, some private modes), the exception aborts the
handler and the page is stuck on the boot screen forever (content is
`display:none` under `[data-mode="boot"]`). Fix: try/catch around storage
(visitor number falls back to 42000), same for the other storage read.

## Low

### L1. Listener accumulation in retro mode
`initRetro` re-adds click handlers to nav links on every entry (the toggle
uses `onclick`, the links don't) — N visits to retro mode = N identical
`scrollToSection` calls per click. Harmless but sloppy; guard with a
once-flag.

### L2. Hard-coded "4" games in hero stats and Doom HUD
`hud-games` and the hero stat are static HTML `4`s that happen to match
`GAMES.length` today. Set them from JS like the forum stats already do.

### L3. Third-party font, no CSP, no 404 page
Press Start 2P comes from Google Fonts (render-blocking, third-party
request; ~10 KB self-hosted woff2 would do). GitHub Pages can't set
headers, but a `<meta>` CSP could still pin `default-src 'self'` once the
font is local (the `<noscript>` inline style needs `'unsafe-inline'` for
styles). No `404.html` — Pages' default is off-brand; a tiny boot-styled
"reality not found" page is nearly free.

### L4. `window._bootTime` is set and never read
Dead global (leftover instrumentation?).

### L5. Mode CSS loads via stylesheet swap after boot
`<link id="mode-stylesheet">` has no initial `href`; first styled paint
waits on a fetch after boot completes. Preloading the four small mode
sheets would remove the occasional flash between boot fade and styled mode.

---

## Verified good (checked, no action)
- Every outbound product link returns 200 (landing subdomains included;
  `virtuallanes.retroverse.studio` correctly serves the landing, app is
  at virtuallanes.app).
- User input is printed via `textContent`; forum uses `esc()` for data
  interpolated into `innerHTML`; the one `style="color:…"` interpolation
  comes from static in-file data.
- Mode teardown is genuinely careful: `stopAnimations()` clears every
  interval/timeout, removes document listeners, resets chrome — repeated
  mode switching doesn't leak animations.
- `prefers-reduced-motion`: CSS kills animations/scanlines, boot speeds
  up, matrix rain defaults off. No-JS fallback reveals real content.
- Touch devices are steered to touch-friendly modes; deep links
  (`#mode-*`) pin a reality; random boots deliberately don't write the
  hash so reloads stay random.
- SEO basics present: canonical, OG/Twitter tags, sitemap, robots,
  semantic content in raw HTML.

## Suggested fix order
H1 copy sync (both data copies) → M4 storage guard (3 lines) →
M2 boot fast-forward + aria fixes → M3 image diet → M1 structural choice
(probably just sync + comments) → L-sweep.

---

## Resolution (2026-11-01)

Fixed in this pass (user approved: fix the lot; boot compromise below):

- **H1** Copy corrected in both data copies (HTML + `GAMES`/`TOOLS`):
  SwipeVerse is Web/PWA (no native apps claimed), Incident Zero is
  print-and-play tabletop (no online/AI-runtime claims), Karaoke Stage is
  Tauri. A fictional forum reply claiming an Android download was also
  corrected. XP now persists (`rv_xp`), matching the README.
- **M2 (boot)** Full boot at most once a day: same-day returns get a
  three-line warm boot; the ⏻ reboot button always replays the full
  sequence (the manual reset). Timestamp only advances on full boots, so
  the show comes back after a day away. Reduced-motion is near-instant.
- **M2 (a11y)** Boot screen `aria-hidden` + visually-hidden status text;
  forum output no longer a live region; forum threads are focusable
  buttons (`aria-expanded`, Enter/Space); mode switcher has aria-labels;
  terminal focus-steal no longer fights text selection or chrome clicks.
- **M3** Images: hero/game/about converted PNG→WebP and the logo
  palette-compressed — ~8.2 MB → ~425 KB total. Unreferenced
  `pixel-animation.png` and the 1.5 MB logo source removed (both remain
  in git history).
- **M4** All localStorage access wrapped (`storageGet`/`storageSet`);
  boot can no longer be killed by a storage exception.
- **L1** Retro nav handlers wired once. **L2** Games counts set from
  `GAMES.length`. **L3** Press Start 2P self-hosted woff2 (4.7 KB),
  meta CSP added, boot-styled `404.html`. **L4** dead `_bootTime`
  removed. **L5** Mode stylesheets preloaded.
- **M1** Structural duplication kept by design (HTML stays canonical for
  SEO/no-JS); copies re-synced in this pass.

Verification: `node --check` clean; local HTTP smoke (index, JS, CSS,
font, WebP images, 404 all 200; no Google Fonts references; no
Android/Electron claims remain).
