---
phase: 15-aggiungi-la-favicon
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/favicon.ico
  - app/icon.png
autonomous: true

must_haves:
  truths:
    - "Browser tab displays stove icon"
    - "Favicon appears in 16x16 and 32x32 sizes"
    - "No broken icon in browser tab"
  artifacts:
    - path: "app/favicon.ico"
      provides: "Multi-size ICO file for legacy browsers"
      min_lines: 1
    - path: "app/icon.png"
      provides: "Modern favicon for Next.js"
      min_lines: 1
  key_links:
    - from: "Browser"
      to: "app/favicon.ico"
      via: "Next.js auto-serving"
      pattern: "favicon.ico in app/ directory"
---

<objective>
Add proper favicon support with ICO and PNG formats for browser tabs.

Purpose: Display the stove icon in browser tabs and bookmarks
Output: favicon.ico (multi-size) and icon.png (32x32) in app/ directory
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/favicon.png
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/public/icons/icon-192.png
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/layout.tsx

**Current state:**
- `app/favicon.png` exists (192x192) but too large for browser tab favicon
- `public/icons/icon-192.png` exists (same stove icon on blue background)
- No `favicon.ico` exists
- No small favicon sizes (16x16, 32x32) exist

**Next.js App Router favicon conventions:**
- `app/favicon.ico` → auto-served at `/favicon.ico`
- `app/icon.png` → auto-served at `/icon.png` (used for modern favicon)
- No manual link tags needed (Next.js handles automatically)
</context>

<tasks>

<task type="auto">
  <name>Generate favicon files from existing icon</name>
  <files>
    app/favicon.ico
    app/icon.png
  </files>
  <action>
Use ImageMagick (convert) to generate favicon files from the existing app/favicon.png (192x192):

1. Create `app/icon.png` (32x32 PNG for modern browsers):
   ```bash
   convert app/favicon.png -resize 32x32 app/icon.png
   ```

2. Create `app/favicon.ico` (multi-size ICO: 16x16, 32x32, 48x48):
   ```bash
   convert app/favicon.png \
     \( -clone 0 -resize 16x16 \) \
     \( -clone 0 -resize 32x32 \) \
     \( -clone 0 -resize 48x48 \) \
     -delete 0 app/favicon.ico
   ```

3. Verify files created:
   ```bash
   ls -lh app/favicon.ico app/icon.png
   file app/favicon.ico app/icon.png
   ```

**Why these formats:**
- `favicon.ico`: Legacy browser support (multi-size ICO format)
- `icon.png`: Modern browsers (32x32 PNG, Next.js convention)
- Source: Existing 192x192 PNG stove icon (blue background with white stove)

**Next.js App Router auto-serving:**
- Files in `app/` directory are automatically served
- No manual `<link>` tags needed in layout.tsx
- Next.js generates proper metadata automatically
  </action>
  <verify>
1. Check files exist and have correct sizes:
   ```bash
   ls -lh app/favicon.ico app/icon.png
   file app/favicon.ico app/icon.png
   ```

2. Start dev server and verify favicon appears in browser tab:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and check browser tab shows stove icon

3. Verify both formats are served:
   - http://localhost:3000/favicon.ico (should serve the ICO file)
   - http://localhost:3000/icon.png (should serve the 32x32 PNG)
  </verify>
  <done>
- `app/favicon.ico` exists (multi-size ICO format)
- `app/icon.png` exists (32x32 PNG)
- Browser tab displays stove icon when visiting localhost:3000
- Both /favicon.ico and /icon.png are accessible
  </done>
</task>

</tasks>

<verification>
**Visual check:**
1. Open http://localhost:3000 in browser
2. Browser tab shows stove icon (not broken/missing icon)
3. Icon is clear and recognizable at small size

**Technical check:**
```bash
ls -lh app/favicon.ico app/icon.png
file app/favicon.ico app/icon.png
curl -I http://localhost:3000/favicon.ico
curl -I http://localhost:3000/icon.png
```
</verification>

<success_criteria>
- favicon.ico exists with 3 embedded sizes (16x16, 32x32, 48x48)
- icon.png exists at 32x32 pixels
- Browser tab displays stove icon when visiting the app
- No manual link tags needed (Next.js auto-serving works)
</success_criteria>

<output>
After completion, create `.planning/quick/15-aggiungi-la-favicon/15-SUMMARY.md`
</output>
