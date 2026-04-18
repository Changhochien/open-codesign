# Research 03 — Sandbox Runtime Selection

**Date**: 2026-04-18 · **Status**: Decision recorded

## Decision

**Primary**: Electron-native iframe `srcdoc` + esbuild-wasm + import maps with locally-bundled common deps.
**Fallback (online mode)**: Sandpack for richer npm ecosystem when network is available.
**Rejected**: WebContainers, pure CDN.

## Why

- ✅ **Fully offline** — packs ~5MB esbuild-wasm + locally cached `react`/`vue`/`tailwind` ESM into Electron `extraResources`
- ✅ **Apache-2.0 / MIT** — no commercial license, no per-seat fee
- ✅ **No COOP/COEP requirement** — sidesteps Electron 41 cross-origin isolation regression bug
- ✅ **No HTTP server** — direct `file://` works
- ✅ **Hot reload < 50ms** via srcdoc rewrite or service-worker partial update
- ✅ **Bundle impact ~5MB** — within our 80MB total budget

## Comparison matrix

| Feature | Sandpack | WebContainers | esbuild-wasm | Pure CDN | Electron native |
|---|:---:|:---:|:---:|:---:|:---:|
| React | 5 | 5 | 5 | 3 | 4 |
| Vue SFC | 5 | 5 | 3 | 3 | 3 |
| Tailwind | 4 | 5 | 4 | 4 | 4 |
| Real npm install | 3 | **5** | 1 | 1 | 1 |
| Offline | 2 | **1** | **5** | 1 | **5** |
| HMR | 5 | 5 | 4 | 3 | 5 |
| Bundle size | 4 | 2 | 3 | **5** | **5** |
| Electron fit | 3 | 2 | 4 | 4 | **5** |
| Engineering cost | **5** | 4 | 2 | **5** | 3 |

## Why each rejected option fails

### WebContainers — REJECTED
- ToS requires commercial license; community reports ~$27k/year quote
- Hard dependency on `staticblitz.com` runtime fetch — never offline
- Electron 41+ has cross-origin isolation regression breaking COOP/COEP requirement
- Triple disqualifier

### Pure CDN (esm.sh) — REJECTED
- Offline-incompatible; first import = HTTP request
- esm.sh accessibility unstable in mainland China (deal-breaker for our user base)
- No native JSX support (would still need transpiler)
- React singleton issues with multiple esm.sh URLs

### Sandpack — DOWNGRADED to fallback
- Self-hosting bundler requires Node 16 build chain (broken since Vercel deprecation)
- Electron CORS issues when reaching codesandbox.io subdomain bundlers
- Offline issue #1223 still open as of 2024-10
- Excellent online experience — keep as opt-in mode

## Architecture

```
[AI generates code]
  ↓
[esbuild-wasm in Web Worker]  ← .wasm preloaded from extraResources
  ↓ transpile/bundle <200ms
[Import map resolver]  ← local ESM cache: react, react-dom, vue, tailwind
  ↓
[<iframe sandbox="allow-scripts" srcdoc="...">]
  ↓ postMessage
[Main renderer collects console/errors]
```

## Implementation notes

- esbuild-wasm `initialize()` can only be called once → maintain global singleton, careful with HMR
- Vue SFC needs `@vue/compiler-sfc` (~500KB gzip extra) — defer until v0.5 unless required earlier
- Sandbox attribute: `allow-scripts` only; never `allow-same-origin` (would let iframe escape into parent DOM)
- Use `protocol.handle('codesign:', ...)` to serve cached deps without Electron security warnings

## Effort estimate

- Core sandbox runtime: 7-10 days for full feature set (incl. Vue SFC, dep precaching)
- Minimum viable (React only, no precache): 3 days

## Sources

1. https://github.com/codesandbox/sandpack — Apache-2.0, performance benchmarks
2. https://webcontainers.io/enterprise — commercial license terms
3. https://github.com/electron/electron/issues/50242 — COOP/COEP regression bug
4. https://github.com/codesandbox/sandpack/issues/1223 — offline limitation
5. https://github.com/NimbleLabs/vibe-coding-bundler — esbuild-wasm reference impl
6. https://www.electronjs.org/docs/tutorial/security — sandbox best practices
