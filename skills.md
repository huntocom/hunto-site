# Hunto.com — Skills & How-To Guide

A practical reference for common tasks when working on `index.html`.

---

## 1. Safe File Editing Pattern

Always follow this order. Never skip steps.

```python
# Step 1 — Read
with open('/home/claude/index.html', 'r') as f:
    content = f.read()

# Step 2 — Find markers and VALIDATE before slicing
start = content.find('<!-- TARGET SECTION -->')
end   = content.find('<!-- NEXT SECTION -->')
assert start > 0, f"Start marker not found"
assert end > start, f"End marker not found or before start"

# Step 3 — Edit
content = content[:start] + new_html + content[end:]

# Step 4 — Write
with open('/home/claude/index.html', 'w') as f:
    f.write(content)

# Step 5 — Syntax check
import re, subprocess, tempfile, os
scripts = re.findall(r'<script(?![^>]*type=["\']module["\'])[^>]*>([\s\S]*?)</script>', content)
with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False) as f:
    f.write('\n'.join(scripts)); fname = f.name
r = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
print("Syntax:", "✓ OK" if r.returncode == 0 else r.stderr[:300])
os.unlink(fname)

# Step 6 — Div balance check
with open('/home/claude/index.html') as f: html = f.read()
start = html.find('<div id="page-home"')
end   = html.find('<div id="page-studio"')
section = html[start:end]
o = section.count('<div'); c = section.count('</div>')
print(f'Div balance: {o} opens, {c} closes — {"✓ OK" if o==c else "✗ BROKEN"}')

# Step 7 — Deploy
import shutil
shutil.copy('/home/claude/index.html', '/mnt/user-data/outputs/index.html')
```

---

## 2. Version Bump

Always bump version before copying to outputs.

```bash
sed -i "s/<!-- v[0-9]*\.[0-9]* -->/<!-- v15.6 -->/" /home/claude/index.html
sed -i "s/>v[0-9]*\.[0-9]*</>v15.6</" /home/claude/index.html
cp /home/claude/index.html /mnt/user-data/outputs/index.html
```

---

## 3. Adding a New Homepage Section

```python
with open('/home/claude/index.html', 'r') as f:
    content = f.read()

new_section = '''  <!-- MY NEW SECTION -->
  <div style="background:#fff;padding:60px 32px">
    <div style="max-width:1300px;margin:0 auto">
      ...
    </div>
  </div>

  '''

# Insert before an existing section
insert_before = '  <!-- REVIEWS -->'
assert insert_before in content, "Marker not found"
content = content.replace(insert_before, new_section + insert_before, 1)

with open('/home/claude/index.html', 'w') as f:
    f.write(content)
```

---

## 4. Fetching Catalog Products (API)

Always use `URLSearchParams`. Never concatenate category strings with `encodeURIComponent`.

```js
// CORRECT
async function fetchProducts(category, brand, limit) {
  const SERVER = 'https://hunto-server-production.up.railway.app';
  const params = new URLSearchParams({ limit: limit || 20 });
  if (category) params.set('category', category);
  if (brand)    params.set('brand', brand);
  const data = await (await fetch(SERVER + '/catalog/products?' + params)).json();
  return data.products || [];
}
```

### Valid Category Strings
```
T-Shirts                    Fleece - Core - Hood
T-Shirts - Core             Fleece - Core - Crew
T-Shirts - Long Sleeve      Fleece - Premium - Hood
T-Shirts - Premium          Fleece - Premium - Crew
Outerwear                   Polos
```

### Color Picking from Product
```js
function pickColor(product, hints) {
  const colors = product.colors || [];
  for (const h of hints) {
    const c = colors.find(x => x.front && (x.name||'').toLowerCase().includes(h));
    if (c) return c.front;
  }
  const any = colors.find(x => x.front);
  return any ? any.front : product.image || null;
}
```

---

## 5. Displaying a Product Image Safely

Never set `src=""` with `display:block` — browsers show a broken image icon.

```js
function showImg(id, src) {
  const img = document.getElementById(id);
  const loading = document.getElementById(id + '-loading');
  if (!img || !src) return;
  const tmp = new Image();
  tmp.onload = () => {
    img.src = src;
    img.style.display = 'block';
    if (loading) loading.style.display = 'none';
  };
  tmp.src = src;
}
```

### HTML for Image Card (category grid pattern)
```html
<div id="catimg-tshirt-wrap" style="height:200px;background:#f4f4f6;
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden">
  <!-- display:none until showImg() fires -->
  <img id="catimg-tshirt" src="" alt=""
    style="width:100%;height:100%;object-fit:contain;display:none">
  <!-- Loading placeholder -->
  <div id="catimg-tshirt-loading"
    style="position:absolute;font-size:44px;opacity:.15">👕</div>
  <!-- YOUR DESIGN HERE overlay -->
  <div class="cat-ydh">
    <span>YOUR</span><span>DESIGN</span><span>HERE</span>
  </div>
</div>
```

### CSS for overlays
```css
.cat-ydh {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -60%);
  text-align: center;
  pointer-events: none;
  z-index: 2;
}
.cat-ydh span {
  display: block;
  font-family: 'Impact', 'Arial Black', Arial, sans-serif;
  font-weight: 900;
  font-style: italic;
  color: #fff;
  font-size: 18px;
  text-shadow: 0 2px 6px rgba(0,0,0,.7), 0 0 12px rgba(0,0,0,.4);
  line-height: 1.1;
}
```

---

## 6. Embedding Base64 Images

### Logo (PNG → base64 → embed)
```python
from PIL import Image
import base64, io

img = Image.open('/path/to/logo.png').convert('RGB')
# Optionally resize
buf = io.BytesIO()
img.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()

# In HTML:
# <img src="data:image/png;base64,{b64}" style="height:38px;width:auto">
```

### Customer Photos (compress before embedding)
```python
from PIL import Image
import base64, io

img = Image.open(path).convert('RGB')
w, h = img.size
scale = min(480/w, 480/h, 1.0)
img = img.resize((int(w*scale), int(h*scale)), Image.LANCZOS)
buf = io.BytesIO()
img.save(buf, 'JPEG', quality=78, optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
# Keep under ~50kb per image
```

### Favicon (ICO with multiple sizes)
```python
from PIL import Image
import base64, io

img = Image.open(path).convert('RGB')
img = img.resize((256, 256), Image.LANCZOS)
buf = io.BytesIO()
img.save(buf, format='ICO',
  sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
b64 = base64.b64encode(buf.getvalue()).decode()

# In <head>:
# <link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,{b64}">
```

---

## 7. Adding a Studio Panel

### 1. Add panel HTML (inside `#s-panel`)
```html
<div id="sp-mypanel" class="s-panel" style="display:none">
  <div class="s-panel-hdr">
    <span class="s-panel-title">My Panel</span>
    <button class="s-panel-close" onclick="sClosePanel()">✕</button>
  </div>
  <!-- content -->
</div>
```

### 2. Add iconbar button
```html
<button class="s-ibtn" id="ibtn-mypanel" onclick="sOpenPanel('mypanel')"
  title="My Panel">
  <div class="s-ibtn-icon" style="background:linear-gradient(135deg,#7c3aed,#4c1d95)">
    <svg ...></svg>
  </div>
  <span class="s-ibtn-label">My Panel</span>
</button>
```

### 3. Register in `sOpenPanel()`
```js
// sOpenPanel handles show/hide and active state automatically
// Just make sure panel id matches: sp-{name}
```

---

## 8. Adding a Layer to the Canvas

```js
// Text layer
addTextLayer('Your Text Here');

// Image layer (from URL)
addImageLayer(imageUrl);

// After adding, the layer auto-selects and opens the edit panel
```

### Layer Object Structure
```js
{
  id: 'layer_1',
  type: 'image', // or 'text'
  src: 'data:image/png;base64,...',
  originalSrc: '...', // before bg removal
  x: 150, y: 120,    // position on canvas
  w: 200, h: 180,    // dimensions
  view: 'front',     // 'front' or 'back'
  filters: 'none',   // 'none' | 'single-color' | 'bw'
  rmbg: false,       // background removed?
}
```

---

## 9. Pricing / Bulk Discounts

```js
// Tier thresholds
const tiers = [
  { min: 24, discount: 10 },
  { min: 12, discount: 7  },
  { min: 6,  discount: 3  },
];

function calcPrice(basePrice, qty) {
  const tier = tiers.find(t => qty >= t.min);
  const disc = tier ? tier.discount : 0;
  return basePrice * (1 - disc / 100);
}
```

---

## 10. Showing/Hiding Pages

```js
// All pages have class="page", active page gets class="page active"
showPage('home');    // homepage
showPage('shop');    // shop grid
showPage('pdp');     // product detail
showPage('studio');  // design studio
```

---

## 11. Notification Toast

```js
// Show a brief notification at top of screen
sNtf('✓ Artwork placed — use the Edit panel to adjust');
sNtf('⚠ Please enter a valid email');
```

---

## 12. Password Gate

The site has a password gate (password: **Fart**) using sessionStorage.
Located immediately after `<body>` tag as inline script.

To update the password:
```python
with open('/home/claude/index.html', 'r') as f:
    content = f.read()
content = content.replace("var PASS = 'Fart';", "var PASS = 'NewPassword';")
with open('/home/claude/index.html', 'w') as f:
    f.write(content)
```

---

## 13. Common Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| Links/buttons not working | Unbalanced `</div>` in page-home | Run div balance check |
| Garment images not loading | Wrong URL encoding for categories | Use `URLSearchParams` |
| Broken image icon showing | `src=""` with `display:block` | Set `display:none` until image loads |
| Shirts cropped | `object-fit:cover` | Use `object-fit:contain` with white bg |
| Logo wrong | SVG recreation instead of PNG | Embed actual PNG base64 from `full_logo_b64.txt` |
| JS error on load | Syntax error in script | Run node --check before deploying |
| File truncated | Python slice with `-1` index | Always assert index > 0 before slicing |
| Favicon not updating | Browser cache | Hard refresh: Cmd+Shift+R |

---

## 14. File Size Targets

| Condition | Action |
|-----------|--------|
| < 500kb | Ideal — fast load |
| 500kb–1.5mb | Acceptable (current range with gallery photos) |
| > 2mb | Compress images or move to CDN |

Check with:
```bash
wc -l /home/claude/index.html    # line count
du -sh /home/claude/index.html   # file size
```

---

## 15. Stored Assets (Claude server)

| Path | Contents |
|------|----------|
| `/home/claude/full_logo_b64.txt` | Logo PNG base64 |
| `/home/claude/new_favicon_b64.txt` | Favicon ICO base64 |
| `/home/claude/new_favicon_png_b64.txt` | Favicon PNG base64 |
| `/home/claude/gallery_imgs.json` | 9 customer photos as base64 JPEG array |

Re-embed logo if ever lost:
```python
with open('/home/claude/full_logo_b64.txt') as f:
    logo_b64 = f.read().strip()
# Then replace hdr-logo img src with f"data:image/png;base64,{logo_b64}"
```

---

## 16. Playwright Browser Testing

Available at `/home/claude/.npm-global/lib/node_modules/playwright`

```js
const { chromium } = require('playwright');
// Unlock: fill password 'Fart', click 'Unlock'
// Devices: {w:375,h:667} iPhone SE, {w:390,h:844} iPhone 14, {w:412,h:915} Android
```

---

## 17. Deploy via Claude Code (local machine)

The standard deploy pattern used in Claude Code terminal:
```
Copy /Users/hunto/Downloads/index.html to current directory,
commit and push "vX.X - description", delete download
```

This runs:
```bash
cp /Users/hunto/Downloads/index.html /Users/hunto/Documents/GitHub/hunto-site/index.html
git add index.html
git commit -m "vX.X - description"
git push https://<token>@github.com/huntocom/hunto-site.git main
rm /Users/hunto/Downloads/index.html
```
