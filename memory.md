# Hunto.com — Memory & Decision Log

A running record of what we built, why we made certain decisions, what broke, and what we learned.
Read this before starting any new session to avoid repeating mistakes.

---

## Critical Incidents (Read First)

### 🔴 The Truncation Disaster (v14.9 → v15.0)
**What happened:** When removing the Best Sellers section, Python's `content.find()` returned `-1` (marker not found after prior edits). Code then did `content[-1:]` which in Python means "last character only" — destroying 1.1MB of JavaScript.

**Symptoms:** File went from ~8,800 lines to 1,644 lines. All JS gone. Site completely broken.

**Fix:** Git restore on local machine (`git checkout HEAD~1 -- index.html`), then user uploaded the restored file.

**Rule established:** ALWAYS `assert start > 0` and `assert end > start` before any slice operation. Never assume `find()` succeeded.

---

### 🔴 The Extra Div Bug (v15.x)
**What happened:** When removing Best Sellers section across multiple edits, a stray `</div>` was left behind in the page-home section. This broke DOM structure causing all click handlers / links to fail.

**Symptoms:** Buttons and nav links stopped working entirely on homepage.

**Fix:** Ran div balance check, found diff of -1, located and removed the extra `</div>`.

**Rule established:** Always run div balance check after any HTML section removal.

---

### 🔴 The Logo Recreation Disaster (v14.0–v14.2)
**What happened:** Instead of embedding the actual logo PNG, attempted to recreate it as an inline SVG. The SVG path recreation was wrong — produced a distorted, unrecognizable icon instead of the actual hunto.com wordmark.

**Lesson:** Never recreate logos or brand assets as SVG. Always embed the actual file as base64.

**Fix:** User uploaded the real `0.png` (1475×366px, 30kb). Embedded directly as base64.

---

### 🟡 The SS Activewear Hotlink Block
**What happened:** All homepage hero card images showed as broken. Used direct SS Activewear CDN URLs (`ssactivewear.com/Images/...`).

**Lesson:** SS Activewear blocks hotlinking from external domains. Their CDN URLs only work on their own site.

**Fix:** Route all product images through the Railway catalog API, which proxies images correctly. Homepage images now fetched via `loadHomepageImages()` using the `/catalog/products` endpoint.

---

### 🟡 Category API Encoding Bug
**What happened:** Homepage garment images not loading. Category names like `T-Shirts - Core` were being encoded with `encodeURIComponent()` which produces `T-Shirts%20-%20Core`. Server expected `T-Shirts+-+Core` (URLSearchParams format).

**Fix:** Switched all API calls from manual string concatenation to `URLSearchParams`.

---

### 🟡 Broken Image Icons on Category Cards
**What happened:** All 4 category grid cards showed browser broken image icons immediately on load.

**Cause:** `<img src="" style="display:block">` — empty src + display:block = broken icon.

**Fix:** Changed all category card images to `display:none` initially. The `showImg()` function sets `display:block` only after the image successfully loads.

---

### 🟡 Shirts Getting Cropped
**What happened:** Category grid images were using `object-fit:cover` which crops the image to fill the container, cutting off the shirt sleeves and bottom.

**Fix:** Changed to `object-fit:contain` with white (`#f4f4f6`) background so the full shirt is visible.

---

## Design Decisions

### Single-File Architecture
Everything in one `index.html`. Intentional — simplifies deployment (git push → Netlify auto-deploys), no build step, no bundler. Downside is file size (~1.4MB) but acceptable for now.

### Background Removal: Fal.ai NOT remove.bg
- remove.bg: ~$0.25 per image (too expensive for casual use)
- Fal.ai `fal-ai/imageutils/rembg`: ~$0.002 per image
- Decision: Fal.ai wins on cost by 125x
- Client resizes to max 1024px before sending to reduce processing time/cost

### No Login Gate Before Checkout
Originally had login modal firing when "Add to Cart" clicked. Removed — fires at the highest-intent moment and kills conversion. Now goes straight to Shopify checkout. Account creation happens post-purchase.

### Sliding Panels for Step 2 & 3 (not new pages)
Steps 2 (Qty/Sizes) and 3 (Review) slide in as overlay panels rather than navigating to new pages. Keeps studio context visible underneath, feels more native/app-like.

### Safety Category = hi-vis Search
S&S Activewear API has no "Safety" category. Using `search='hi-vis'` instead which returns the correct safety/high-visibility products.

### Password: "Fart"
User's choice. Site is in preview mode. Password stored in `sessionStorage` — persists per tab session but clears on tab close.

---

## Version History

| Version | Key Changes |
|---------|-------------|
| v12.x | CRO improvements: removed login gate, live pricing in studio, abandoned design recovery prompt |
| v13.x | Background removal (Fal.ai), Edit Artwork panel, canvas overlay toolbar |
| v14.0 | Real logo PNG embedded (after SVG recreation failure) |
| v14.1 | Fix: used actual favicon ICO asset |
| v14.2 | Real `0.png` logo embedded directly |
| v14.3 | New favicon: purple t-shirt + smiley |
| v14.4 | Competitor-matching homepage: value prop + 2×2 category grid + best sellers |
| v14.5 | Real Gildan product photos on homepage via catalog API |
| v14.6 | "YOUR DESIGN HERE" overlays on all homepage cards |
| v14.7 | Full shirts visible (object-fit:contain), vibrant color selection |
| v14.8 | 4-category 2×2 grid, removed hats/promotional (not yet sold) |
| v14.9 | 9-photo customer gallery added (real customer orders) |
| v15.0 | **TRUNCATION DISASTER** — Best Sellers removal went wrong. Site down. |
| v15.1 | Emergency git restore on local machine |
| v15.2 | Restored file: Best Sellers removed + gallery confirmed present |
| v15.3 | Fixed garment images: URLSearchParams + display:none on empty img |
| v15.4 | Fixed broken links: stray div removed + URLSearchParams for API |
| v15.5 | Password gate added (password: Fart) |
| v15.6 | Full mobile layout matching RushOrderTees |
| v15.7–v15.9 | Mobile studio: fix topbar, hide undo/redo, Save+Next, ROTATE button |
| v16.0–v16.1 | Hide header/search in mobile studio, fit screen on any phone |
| v16.2 | Shirt fills screen, bigger icons, bigger X, clean layout |
| v16.3–v16.5 | Fix pills clickable, delete button, panel position:fixed, touch events |
| v16.6 | Mobile studio definitive fix: full-screen shirt, working panels |
| v16.7–v16.8 | Fix iconbar at bottom, full mobile audit across all resolutions |

---

## What We Tried That Didn't Work

### SVG Logo Recreation
Tried to draw the Hunto logo as inline SVG paths. Result: unrecognizable. The t-shirt shape, smiley face proportions, and "hunto.com" text weight are impossible to match perfectly by hand. Always embed the real asset.

### SS Activewear Direct Image URLs
Hardcoded SS CDN image URLs for the hero cards. All broke immediately due to hotlink protection. Wasted 2 iterations.

### Customer Photo Gallery as base64 in HTML
Added 9 customer photos (~413kb of base64) directly into the HTML. File ballooned to 1,444kb and caused scroll performance issues. Removed in v15.0 (the gallery was later re-added more carefully). Long-term solution is CDN hosting.

### `encodeURIComponent` for API Params
Used `encodeURIComponent` for category names in API URLs. Resulted in wrong encoding — server couldn't match category. Took 2 iterations to diagnose.

### Background Removal Provider Churn (v12.x)
Went through multiple iterations on the `/remove-bg` endpoint:
1. remove.bg with form-data → too expensive ($0.25/image)
2. remove.bg with JSON body → worked but still expensive
3. Fal.ai `fal-ai/imageutils/rembg` → final choice (~$0.002/image)

Also had issues with: dynamic `import()` vs `require()`, wrong env var names (`REMOVE_BG_KEY` vs `REMOVEBG_API_KEY` vs `FAL_API_KEY`). Lesson: pick one approach and stick with it.

### Clipart Provider Churn (v9.x–v10.0)
Tried OpenClipart (CORS issues), SVG Repo, corsproxy.io, allorigins.win, then finally Wikimedia Commons via Railway server proxy. The `/clipart` endpoint on the server solved all CORS issues.

### Best Sellers Section on Homepage
Added a tabbed best sellers grid to the homepage. Looked good but the API calls were slow to load and "No products found" appeared frequently. Removed at user request. The shop page handles this better.

### Hats & Caps / Promotional in Category Grid
Added as category cards. User pointed out: "We don't have hats or promotional right now." Removed immediately. Only show what you actually sell.

---

## What Users Have Said

> "You killed the logo. Don't kill the integrity. Don't edit our logo." — After SVG recreation attempt

> "A lot of broken images and you aren't using our logo." — After SS Activewear hotlink failure

> "You're cutting off all the shirts. Can you also make it look a bit more colorful." — After object-fit:cover was used

> "We don't have hats or promotional right now. Please remove and make the images larger." — After 2×3 category grid was added

> "Site crashed on homepage. Can't scroll and broken images." — After the truncation disaster

> "Links don't work still." — After the stray div issue

---

## Things to Know About the User

- Moves fast — wants visual results quickly, not long explanations
- Focused on matching RushOrderTees' quality and feel
- Has Claude Code terminal set up at `~/Documents/github/hunto-site`
- Deploy command pattern: "Copy /Users/hunto/Downloads/index.html to current directory, commit and push 'vX.X - description', then delete /Users/hunto/Downloads/index.html"
- Will call out when something looks wrong visually — trust their eye
- Only selling: T-Shirts, Long Sleeve, Hoodies, Jackets (no hats, no promo products yet)

---

## Current State (v16.8)

Site is password protected (pw: Fart) and fully functional at:
https://luxury-bienenstitch-8254ae.netlify.app

Homepage shows real Gildan product photos, customer gallery with 9 real order photos, proper "YOUR DESIGN HERE" overlays. Studio is fully functional with AI art, background removal, text, upload, names & numbers. Checkout goes straight to Shopify (no login gate).

Main gaps remaining: domain not yet connected, no real Shopify cart integration, no abandoned design email recovery.

### Mobile (v15.6–v16.8)
Mobile layout fully addressed. Studio uses full-screen shirt canvas, bottom iconbar with bigger icons, position:fixed sliding panels, touch events on pills, and hidden header/search bar. Homepage is responsive with hero, category grid, and customer gallery working on all phone sizes (iPhone SE through Android large).

### Mobile Lessons Learned
- `position:fixed` is essential for mobile panels — `absolute` gets lost in scroll
- Pills need `ontouchstart` not just `onclick` for responsive mobile taps
- Header and search bar must be explicitly hidden in studio mode on mobile
- Iconbar must be fixed at bottom with enough z-index to stay above canvas
- Took ~13 iterations (v15.6–v16.8) to get mobile studio right
