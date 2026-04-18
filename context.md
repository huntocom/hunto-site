# Hunto.com — Project Context

## What It Is
Hunto.com is a print-on-demand custom apparel e-commerce platform, similar to RushOrderTees.
Customers can browse products, design custom apparel using an AI-powered studio, and order.
Key differentiators: AI-generated art, in-house DTF printing, no minimums, 48hr ships.

---

## Infrastructure

| Service | URL / Location |
|---------|---------------|
| Frontend (live) | https://luxury-bienenstitch-8254ae.netlify.app |
| Frontend repo | https://github.com/huntocom/hunto-site (main branch) |
| Backend server | https://hunto-server-production.up.railway.app |
| Backend repo | https://github.com/huntocom/hunto-server |
| Deployment | Netlify auto-deploys on push to GitHub main |

### Deploy Command (run in Claude Code)
```
Copy /Users/hunto/Downloads/index.html to the current directory, commit and push with message "vX.X - description", then delete /Users/hunto/Downloads/index.html
```

---

## Codebase Structure

Everything lives in **one file: `index.html`** (~1,400–1,500kb, ~8,700 lines).

### Pages (shown/hidden via `.page` / `.page.active` CSS classes)
- `#page-home` — Homepage
- `#page-shop` — Product catalog / shop grid
- `#page-pdp` — Product detail page
- `#page-studio` — Design studio

### Key Functions
```js
showPage(id)          // switches active page
goHome()              // go to homepage
goShop(category)      // open shop with optional category filter
openStudio(id)        // open design studio
goPDP(id)             // open product detail page
loadHomepageImages()  // fetches real garment photos for homepage cards
```

---

## Backend Server (Railway / Node.js)

### Key Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /catalog/products?category=&brand=&limit=` | Product catalog (S&S Activewear) |
| `GET /catalog/brands?category=` | Brand list for sidebar filters |
| `POST /remove-bg` | Background removal via Fal.ai |
| `POST /save-design` | Save abandoned design for recovery email |
| `GET /clipart?query=` | Clipart search via Wikimedia |

### API Usage Pattern
Always use `URLSearchParams` — NOT `encodeURIComponent` directly:
```js
// CORRECT
const params = new URLSearchParams({limit: 20});
if(category) params.set('category', category);
fetch(SERVER + '/catalog/products?' + params)

// WRONG — breaks category names with spaces/dashes
url += '&category=' + encodeURIComponent(category)
```

### Background Removal
- Provider: **Fal.ai** `fal-ai/imageutils/rembg` (~$0.002/image)
- NOT remove.bg (too expensive at ~$0.25/image)
- Env var on Railway: `FAL_API_KEY`
- Client resizes image to max 1024px before sending

---

## Homepage Structure (page-home)

### Sections (top to bottom)
1. **Welcome bar** — "Pick up designing where you left off →"
2. **Main header** — Logo, search bar, Live Chat / (800) HUNTO / My Account / Cart / Start Designing →
3. **Mega nav** — T-Shirts, Sweatshirts, Polo Shirts, Outerwear, Kids, Safety, Brands, More, Best Sellers
4. **Secondary nav bar** — star rating, review count, version number
5. **Hero section** — Dark gradient bg, left: headline + CTAs + stats, right: 5 floating product cards
6. **Marquee** — Purple/pink scrolling strip: "DTF PRINTED IN-HOUSE — NO MINIMUMS — SHIPS IN 48 HOURS…"
7. **Value prop + 2×2 category grid** — Left: headline + Shop/Design CTAs + delivery dates, Right: T-Shirts / Long Sleeve / Hoodies / Jackets
8. **Customer gallery** — 9 real customer photos, masonry 3-column layout
9. **How It Works** — 4 steps: Pick garment → Generate design → We print → You wear
10. **Reviews** — 3 testimonials, 4.9★ rating, 28,000+ reviews
11. **CTA Band** — "Your idea is one prompt away"

### Homepage Dynamic Images (`loadHomepageImages`)
Called on page load. Fetches real Gildan product photos from catalog API.

**Hero floating cards** (5 cards, positioned absolutely, CSS float animations):
- Card 1: Black hoodie → `id="hcard-img-1"`
- Card 2: Royal blue tee → `id="hcard-img-2"`  
- Card 3: Safety green tee → `id="hcard-img-3"`
- Card 4: Red hoodie → `id="hcard-img-4"`
- Card 5: White tee → `id="hcard-img-5"`

**Category grid cards** (2×2):
- `catimg-tshirt` — T-Shirts (red/cardinal)
- `catimg-longsleeve` — Long Sleeve (kelly green)
- `catimg-hoodie` — Hoodies (purple/violet)
- `catimg-jacket` — Jackets (navy/black)

**"YOUR DESIGN HERE" overlays** — Impact font, white, italic, drop shadow, positioned at chest area on all cards.

---

## Design Studio

### Desktop Layout
- **Thin topbar**: Step indicator (1 DESIGN → 2 QUANTITY & SIZES → 3 REVIEW) + live price (`#s-price-each`, `#s-price-sub`)
- **Left iconbar**: 5 buttons — Products (blue), Add Text (purple), Upload Art (green), AI Art (red/orange), Names & #s (pink)
- **Center canvas**: Product mockup with draggable/resizable layers
- **Right panel** (100px): Front/Back thumbnails + Undo/Redo/Layers/Save
- **Bottom action bar**: ← Back, Save Design, Next Step →

### Mobile Layout (v15.6+)
- **Topbar**: Save + Next buttons, step indicator
- **Full-screen canvas**: Shirt fills available height, no thumbnail strip
- **Bottom iconbar**: Fixed at bottom, bigger icons, ROTATE button
- **Sliding panels**: position:fixed, slide up from bottom over canvas
- **Touch events**: Pills use ontouchstart for responsive taps
- **Header/search**: Hidden in studio mode on mobile

### Iconbar Panels
- **Products** (`sp-products`) — Color picker, garment switcher
- **Add Text** (`sp-text`) — Font, size, color controls
- **Upload Art** (`sp-upload`) — File upload → auto-places on shirt
- **AI Art** (`sp-ai`) — Text prompt → image generation
- **Names & Numbers** (`sp-names`) — Team roster entry

### Step Flow
1. `goStep2()` → slides `#qty-slide-panel` (size grid per product)
2. `goStep3()` → closes qty panel, slides `#review-slide-panel` (price + Apple Pay + ADD TO CART)
3. "ADD TO CART" → `proceedToCheckout()` — goes straight to Shopify, NO login gate

### Edit Artwork Panel (`sp-edit-artwork`)
Auto-opens when image layer selected. Contains:
- Filter thumbnails: Normal / Single Color / Black & White
- Remove Background toggle (AI-powered via Fal.ai)
- Size + Rotate sliders
- Bottom toolbar: Center, Flip, Duplicate, Layers, Delete

### Canvas Overlay Toolbar
Appears below selected layer. Shows: Remove BG, Edit, Forward, Backward, Delete.

### Image Placement
- `addImageLayer()` — places at 68% shirt width, centered horizontally, 22% from top
- Auto-selects layer → opens Edit Artwork panel
- `eaOriginalSrc[id]` stores original before bg removal

---

## Shop Page

### Category Names (exact strings used in API)
```
T-Shirts
T-Shirts - Core
T-Shirts - Long Sleeve
T-Shirts - Premium
Fleece
Fleece - Core - Hood
Fleece - Core - Crew
Fleece - Premium - Hood
Fleece - Premium - Crew
Outerwear
Polos
Bottoms
```

### Special Cases
- **Safety category**: Uses `search='hi-vis'` (S&S has no "Safety" category)
- **Gender filter**: `shopState.gender` = `ladies` / `mens` / `youth` / `toddler`

### shopState Object
```js
let shopState = {
  category: "", gender: "", brand: "", search: "", price: "", sort: "default",
  limit: 24, total: 0,
  allProducts: [], filtered: [], displayed: [],
  brands: [], categories: [], loading: false,
};
```

---

## Logo & Favicon

### Logo
- Real PNG `0.png` (1475×366px, ~30kb) embedded as base64 in `.hdr-logo` div
- `<img height="38px" width="auto">` — do NOT recreate as SVG, always use the actual PNG

### Favicon
- Purple t-shirt + yellow smiley icon
- Embedded as ICO (multi-size: 16×16 through 256×256) + PNG apple-touch-icon
- Stored at: `/home/claude/new_favicon_b64.txt` and `/home/claude/new_favicon_png_b64.txt`

### Logo base64
- Stored at: `/home/claude/full_logo_b64.txt`

---

## Password Gate (v15.5+)
Site is password protected with a dark overlay on page load.
- Password: **Fart**
- Uses `sessionStorage` — persists per tab, resets on close
- Located immediately after `<body>` tag as inline `<script>`

---

## Key Technical Rules

### CRITICAL — Never Do These
1. **Never truncate the file** — always validate file size/line count after edits
2. **Never use Python slice with unvalidated `-1` index** — always assert index > 0 before slicing
3. **Never recreate the logo as SVG** — always embed the actual PNG as base64
4. **Never use `object-fit: cover`** on category grid images (cuts off shirts) — use `contain`
5. **Never set `src=""` with `display:block`** on img tags (shows broken icon) — use `display:none` until loaded
6. **Never use `encodeURIComponent`** for API category params — use `URLSearchParams`

### Div Balance Check (run before every deploy)
```python
python3 -c "
with open('index.html') as f: html = f.read()
start = html.find('<div id=\"page-home\"')
end = html.find('<div id=\"page-studio\"')
section = html[start:end]
o = section.count('<div'); c = section.count('</div>')
print(f'Balance: {o} opens, {c} closes — {\"OK\" if o==c else \"BROKEN\"}')"
```

### Syntax Check (run before every deploy)
```python
import re, subprocess, tempfile, os
with open('index.html','r') as f: content = f.read()
scripts = re.findall(r'<script(?![^>]*type=["\']module["\'])[^>]*>([\s\S]*?)</script>', content)
with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False) as f:
    f.write('\n'.join(scripts)); fname = f.name
r = subprocess.run(['node','--check', fname], capture_output=True, text=True)
print("Syntax:", "✓ OK" if r.returncode==0 else r.stderr[:300])
os.unlink(fname)
```

---

## Versioning
- Version tracked in HTML comment `<!-- vX.X -->` and visible span `>vX.X<`
- Current version: **v16.8**
- Bump with: `sed -i "s/<!-- v[0-9]*\.[0-9]* -->/<!-- vX.X -->/" index.html`

---

## Stored Files on Claude Server
| File | Contents |
|------|----------|
| `/home/claude/full_logo_b64.txt` | Hunto logo PNG as base64 |
| `/home/claude/new_favicon_b64.txt` | Favicon ICO as base64 |
| `/home/claude/new_favicon_png_b64.txt` | Favicon PNG (apple touch) as base64 |
| `/home/claude/gallery_imgs.json` | 9 customer photos encoded as base64 JPEG |

---

## Pending / Next Steps
- [ ] Connect hunto.com domain to Netlify
- [ ] Shopify cart integration — wire "ADD TO CART" to real Shopify cart
- [ ] Abandoned design recovery emails — server `/save-design` needs DB + email trigger
- [x] Mobile layout — full responsive redesign (v15.6–v16.8)
- [ ] Customer photo gallery — currently base64 embedded; needs CDN hosting long-term
- [ ] Verify `hi-vis` search returns correct safety products with orange/green primary images

---

## Completed Features
- ✅ Design studio with layers, text, upload, AI art, names & numbers
- ✅ Background removal (Fal.ai, ~$0.002/image)
- ✅ Edit Artwork panel with filters, resize, rotate, flip, duplicate
- ✅ Canvas overlay toolbar
- ✅ Clean iconbar (5 SVG gradient icons)
- ✅ Sliding Step 2 (qty/sizes) and Step 3 (review/checkout) panels
- ✅ Live pricing in studio topbar
- ✅ No login gate before checkout
- ✅ Abandoned design save prompt (exit-intent)
- ✅ Homepage: hero + value prop + 2×2 category grid + customer gallery + how it works + reviews
- ✅ Real Gildan product photos on homepage via catalog API
- ✅ "YOUR DESIGN HERE" overlays on all product cards
- ✅ Real logo (hunto.com wordmark PNG) embedded
- ✅ Custom favicon (purple shirt + smiley) embedded
- ✅ Safety category fix (search=hi-vis)
- ✅ Password gate (password: Fart)
- ✅ Mega navigation with dropdown menus
- ✅ Search autocomplete
- ✅ Shop page with brand/category filters, pagination
- ✅ Product detail page
- ✅ Bulk discount pricing tiers
- ✅ Apple Pay button in review panel
- ✅ Mobile studio: full-screen shirt, bottom iconbar, sliding panels, Save+Next topbar
- ✅ Mobile homepage: responsive hero, category grid, customer gallery
- ✅ Mobile-specific: bigger icons, ROTATE button, touch events on pills, position:fixed panels
- ✅ Clipart search via Wikimedia Commons (server /clipart endpoint)
- ✅ CLAUDE.md, context.md, skills.md, memory.md project docs
