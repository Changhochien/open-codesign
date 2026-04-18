# Research 04 — PPTX Export Library Selection

**Date**: 2026-04-18 · **Status**: Decision recorded

## Decision

**Primary**: `pptxgenjs` (5k stars, MIT, Apache-2.0 compatible) + `dom-to-pptx` (110 stars, MIT) for HTML-to-shape translation.
**Fallback**: Headless Chromium screenshot embedded as image for slides containing CSS that dom-to-pptx can't translate.
**Rejected**: python-pptx subprocess (Python runtime cost), Aspose FOSS (insufficient Node.js story), pure screenshot (loses editability).

## Why

- ✅ **All-JS stack** — no Python runtime, ~5MB bundle impact (vs 50-100MB for python-pptx)
- ✅ **MIT license** — clean Apache-2.0 compatibility
- ✅ **HTML-first** — dom-to-pptx reads `getComputedStyle()`, matches Claude Design output paradigm
- ✅ **DOM access native** — Electron renderer = browser, dom-to-pptx designed for browser
- ✅ **Active maintenance** — pptxgenjs v4.0.1 (2025-06), 2.4M weekly npm downloads
- ✅ **PowerPoint + Keynote + LibreOffice + Google Slides** all confirmed compatible

## Comparison

| Lib | License | Bundle | HTML→PPTX | Editability | CJK | Maintenance |
|---|---|---|---|---|---|---|
| **pptxgenjs** | MIT | 2.5MB | only `<table>` | full | chart bug | active (5k★) |
| **dom-to-pptx** | MIT | +2.5MB | **core feature** | full | wrap bug | new (110★) |
| python-pptx | MIT | +50-100MB | none (manual) | full | controllable | slow (3k★) |
| Headless screenshot | N/A | 0 | N/A | **none** | 100% | N/A |
| Aspose FOSS | MIT | +20-80MB | none | full | good | new |

## Architecture

```
HTML/CSS slide (Electron renderer)
  ↓
dom-to-pptx.exportToPptx(element)  ← reads computed styles, emits pptxgenjs shape calls
  ↓
pptxgenjs assembly
  ↓
.pptx Buffer → fs.writeFile
```

For elements with unsupported CSS (transform, complex SVG filter, gradients dom-to-pptx can't parse):
1. `html2canvas` snapshot of region
2. `pres.addImage(...)` covering the region
3. Overlay editable text on top to preserve title/subtitle editability

## Known traps

1. **CJK word-wrap bug in dom-to-pptx** (issue #19, still open) — patch pptxgenjs `bodyPr` with `wrap="square"` + `normAutofit` post-export
2. **pptxgenjs no native font embedding** (issue #176, open since 2017) — community `pptx-embed-fonts` extension exists; default to system-installed CJK fonts (PingFang/微软雅黑) to sidestep
3. **Chart CJK fonts on Mac PowerPoint** (issue #1420) — render charts as PNG and embed
4. **Tailwind v4 oklch colors** — dom-to-pptx v1.1.6 already supports
5. **Position: absolute + nested circles** — was bug, fixed in v1.1.1

## Effort estimate

| Module | LOC |
|---|---|
| Base integration | ~150 |
| CJK word-wrap patch | ~50 |
| Screenshot fallback | ~80 |
| Multi-slide traversal | ~40 |
| Font embed (community extension) | ~30 |
| **Total** | **~350 TS lines** |

## Reference implementations

- **presenton** (github.com/presenton/presenton) — 4.7k stars, Apache-2.0 — Electron + Python PPTX (different stack but architectural reference)
- **allweonedev/presentation-ai** (2.7k stars, MIT) — uses pptxgenjs; admits "images don't translate one-to-one"
- **hugohe3/ppt-master** (5.6k stars, MIT) — AI generates python-pptx code

## Why not python-pptx (despite better CJK control)

- 50-100MB Python runtime vs our 80MB total bundle budget — would consume most of it
- We have no other Python dependency; introducing one whole runtime for one feature violates "lean by default"
- Electron + Python subprocess (`uv` venv) is workable (presenton proves it) but only worth it if we already have Python elsewhere

## Sources

1. https://github.com/gitbrent/PptxGenJS — main library
2. https://github.com/atharva9167j/dom-to-pptx — HTML translation layer
3. https://github.com/scanny/python-pptx — Python alternative analysis
4. https://docs.aspose.org/slides/net/getting-started/license/ — Aspose FOSS license confirmation
5. https://github.com/presenton/presenton — reference Electron + PPTX stack
6. https://github.com/atharva9167j/dom-to-pptx/issues/19 — CJK word-wrap bug status
