# Hunto.com — Handoff (v15.5 → v17.3)

Last updated: 2026-04-18

---

## Current state

- **Deployed version:** v17.3 (commit `7441b20`)
- **Live URL:** https://luxury-bienenstitch-8254ae.netlify.app
- **Password:** Fart (sessionStorage gate, resets on tab close)
- **Repo:** https://github.com/huntocom/hunto-site — Netlify auto-deploys on push to `main`
- **Backend:** https://hunto-server-production.up.railway.app (Railway, Node/Express)
- **Architecture:** Single `index.html` (~1.49MB, ~9000 lines). No build step.

---

## Version history since v15.5

| Version | Date | What changed | Problem solved |
|---------|------|--------------|----------------|
| v15.5 | 2026-04-15 | Password gate added (pw: Fart) | Restrict access during preview |
| v15.6 | 2026-04-18 | Full mobile layout matching RushOrderTees | No mobile responsiveness at all |
| v15.7 | 2026-04-18 | Studio mobile: fix topbar, hide undo/redo | Topbar clutter on mobile studio |
| v15.8 | 2026-04-18 | Studio opens to clean canvas, not Products panel | Panel auto-opening covered the shirt |
| v15.9 | 2026-04-18 | Save+Next topbar, ROTATE button, larger shirt | No way to save/advance or rotate on mobile |
| v16.0 | 2026-04-18 | Hide header/search bar in mobile studio | Header ate vertical space in studio |
| v16.1 | 2026-04-18 | Studio fits screen on any phone | Overflow on smaller devices |
| v16.2 | 2026-04-18 | Shirt fills screen, bigger icons, bigger X | Icons too small to tap, close button invisible |
| v16.3 | 2026-04-18 | Float pills clickable, delete button on mobile | Pills unresponsive to tap, no delete |
| v16.4 | 2026-04-18 | Pills work, hide bottombar, add SHARE button | Touch events still failing on some pills |
| v16.5 | 2026-04-18 | Panel position:fixed, touch events on pills | Panels lost behind scroll with position:absolute |
| v16.6 | 2026-04-18 | Mobile studio definitive fix | Full-screen shirt + working panels confirmed |
| v16.7 | 2026-04-18 | Fix iconbar at bottom, panel working | Iconbar overlapping canvas |
| v16.8 | 2026-04-18 | Full mobile audit across all resolutions | Edge cases on iPhone SE, Android large |
| v17.0 | 2026-04-18 | Print Shop rebrand: Space Grotesk + DM Sans, warm palette, scroll reveals | Visual refresh to compete with RushOrderTees |
| v17.1 | 2026-04-18 | RushOrderTees blue palette, cool neutral surfaces | User hated the orange palette from v17.0 |
| v17.2 | 2026-04-18 | Add missing CSS classes to inline HTML, fix SHIRT_PHOTOS hoisting | Mobile CSS targeted classes that didn't exist; `const` not hoisted |
| v17.3 | 2026-04-18 | Fix mobile PDP, gallery visibility, hero stats grid, null check | PDP inline styles overrode mobile CSS; gallery invisible due to ink-reveal |

---

## What's been fixed

### Mobile — Studio (v15.6–v16.8)
- Full-screen canvas using `100svh`/`100dvh`, flex column layout
- Bottom iconbar: `position:fixed`, `bottom:0`, bigger 44px icons, horizontal scroll
- Panels slide up from bottom with `position:fixed` (not absolute — absolute gets lost in scroll)
- Pills require `ontouchstart` not just `onclick` for responsive mobile taps
- Header and search bar hidden when studio is active (`display:none !important`)
- Save + Next buttons in topbar; ROTATE button in iconbar
- Thumbnail strip hidden on mobile; front/back toggle via ROTATE button
- Tested on iPhone SE (375×667), iPhone 14 (390×844), Android (412×915)

### Mobile — Homepage (v17.2–v17.3)
- Classes added to inline HTML: `.hp-hero`, `.hp-hero-grid`, `.hp-hero-cards`, `.hp-hero-text`, `.hp-hero-stats`, `.hp-hero-btns`, `.hp-how`, `.hp-steps`, `.hp-reviews`, `.hp-reviews-grid`, `.hp-gallery`
- Hero: single column, floating cards hidden, stats in 2×2 grid, full-width buttons
- Category grid: 2-column on mobile, delivery info stacks vertically
- Gallery: 2-column masonry, reduced padding
- How It Works: 2-col on tablet (768px), 1-col on phone (480px)
- Reviews: single column stack
- Breakpoints: `@media(max-width:768px)` and `@media(max-width:480px)`

### Mobile — PDP (v17.3)
- `.pdp-wrap{grid-template-columns:1fr !important}` — inline `grid-template-columns:80px 1fr 480px` was overriding CSS
- `.pdp-thumbs{flex-direction:row !important;position:static !important}` — thumbnails go horizontal above main image
- Fixed bottom CTA bar (`.pdp-fixed-cta`)

### Mobile — Shop (v17.2)
- Filter sidebar hidden, full-width product cards
- Horizontal card layout: `grid-template-columns:120px 1fr`
- Mobile filter button shown

### Gallery visibility fix (v17.3)
- IntersectionObserver ink-reveal animation was adding `opacity:0` to gallery items via `.ink-reveal` class
- Old selector `'h2, .hcard, [onclick], p, .footer-col-title, .gallery-item'` matched too broadly — `[onclick]` hit gallery items, `p` hit everything
- Narrowed to `':scope > div > h2, :scope > div > div > h2, .hcard'`

### JS bug fixes (v17.2–v17.3)
- `SHIRT_PHOTOS_8000`: changed from `const` to `var` — `const` is not hoisted, so `getShirtPhotoUrl()` called before declaration threw ReferenceError
- `getShirtPhotoUrl`: added null guard `&& SHIRT_PHOTOS_8000` to prevent crash if variable is somehow undefined
- Font-family quote breakage: `'DM Sans'` inside JS single-quoted strings broke syntax. Removed inner quotes in JS contexts

---

## Design system changes

### v17.0 — Print Shop rebrand
- Replaced Inter with **DM Sans** (body) and **Space Grotesk** (headlines)
- Original palette was orange (#ff5722) — replaced 247 hex instances and 44 rgba instances
- Added scroll-reveal ink-spread animation via IntersectionObserver

### v17.1 — RushOrderTees palette (current)
- User rejected orange: "I hate the colors"
- Switched to RushOrderTees-inspired blue: `#0071ce` primary, `#005baa` hover, `#004a8f` gradient end
- Hero background: dark navy `#0a1628`
- Surfaces: `#f5f7fa`, `#f0f2f5`, `#f0f7ff` (light blue tint)
- Text: `#111` primary, `#555`/`#888` secondary
- Buttons: `linear-gradient(135deg, #0071ce, #004a8f)`

---

## Current design direction

| Element | Value |
|---------|-------|
| Body font | `'DM Sans', sans-serif` |
| Headline font | `'Space Grotesk', sans-serif` (used on CTA band h2) |
| Primary blue | `#0071ce` |
| Primary hover | `#005baa` |
| Gradient | `linear-gradient(135deg, #0071ce, #004a8f)` |
| Hero bg | `#0a1628` (dark navy) |
| Marquee bg | `#0a1628` |
| Surface light | `#f5f7fa`, `#f0f2f5` |
| Accent surface | `#f0f7ff` (blue tint) |
| Text primary | `#111` |
| Text secondary | `#555`, `#888` |
| Footer bg | `#111` |
| Selected state | `border-color: #0071ce` |
| Aesthetic | Clean, professional, RushOrderTees-inspired — not flashy |
| Status | Active direction, user approved the blue palette |

---

## What's still broken or untested

### Confirmed issues (not yet fixed)
- **Text tool on mobile:** Not tested in current session. The text panel opens but input behavior on mobile keyboards is unknown.
- **Front/back toggle visibility:** On mobile, the ROTATE button exists in the iconbar but whether it reliably toggles the canvas view hasn't been regression-tested since v17.0 rebrand.
- **Studio JS crash on open:** Was caused by `const` hoisting — fixed in v17.2. Needs verification that studio opens cleanly now.

### Untested areas
- **AI Art panel on mobile:** Panel slides up but generation flow + image placement not tested on phone.
- **Names & Numbers panel on mobile:** Roster entry UX on small screens not tested.
- **Upload Art on mobile:** File picker + image placement not tested.
- **Checkout flow:** Step 2 (qty/sizes) and Step 3 (review) slide panels not tested on mobile since rebrand.
- **Shop page filters:** Mobile filter button exists but filter modal behavior not verified.
- **Search autocomplete on mobile:** Search bar is there but dropdown positioning not tested.
- **Landscape orientation:** No landscape-specific CSS exists. Likely broken on phones in landscape.

### Deferred decisions
- **Customer gallery photos** are base64-embedded in HTML (~413kb). Needs CDN hosting long-term.
- **Shopify cart integration** not wired up — "ADD TO CART" button exists but doesn't connect to real Shopify.
- **Abandoned design recovery emails** — server endpoint `/save-design` exists but no DB or email trigger.
- **Domain** hunto.com not connected to Netlify yet.

---

## Files changed beyond index.html

| File | Added | Purpose |
|------|-------|---------|
| `CLAUDE.md` | 2026-04-18 | Project instructions for Claude — points to context.md, skills.md, memory.md |
| `context.md` | 2026-04-18 | Full project context: infra, pages, API endpoints, studio structure |
| `skills.md` | 2026-04-18 | Code patterns: safe editing, API calls, image handling, deploy |
| `memory.md` | 2026-04-18 | Decision log, incidents, what broke, what users said |
| `deploy.sh` | 2026-04-18 | Script: copies Downloads/index.html, commits, pushes, deletes source |
| `.gitignore` | 2026-04-18 | Ignores .DS_Store, .env, node_modules, editor files, secrets |
| `.claude/` | 2026-04-18 | Claude Code project settings directory |

### Infrastructure changes
- `gh` (GitHub CLI) installed via Homebrew on user's machine
- `gh auth login` initiated but may not be complete — `git push origin main` returned "Everything up-to-date" (commit was already pushed via token URL earlier)
- Previous deploy method: `git push https://<token>@github.com/huntocom/hunto-site.git main`
- New deploy method (if gh auth completed): `git push origin main` or `./deploy.sh "message"`

---

## Open questions / decision points

1. **Is gh auth working?** The push said "Everything up-to-date" which could mean auth worked or the commit was already pushed. Next push will confirm.
2. **Mobile studio feature testing:** User said "fix them all and make it user friendly" — CSS layout is fixed but interactive features (text input, AI art generation, upload, names/numbers) haven't been functionally tested on mobile.
3. **Gallery performance:** 9 base64 photos in HTML add ~413kb. User hasn't complained about load time yet but it's a known scaling issue.
4. **Password gate:** Still "Fart". User hasn't said when to remove it or change it.
5. **Shirt photos (SHIRT_PHOTOS_8000):** Large object with front/back URLs for ~40 colors of Gildan 8000/64000. These are hardcoded in index.html. If S&S URLs change, they all break.
6. **v17.x direction:** User approved the blue palette but hasn't done a thorough visual review of the full rebrand. May have feedback on specific sections.
