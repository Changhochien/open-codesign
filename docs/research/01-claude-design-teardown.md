# Research 01 — Claude Design Hands-on Teardown

**Date**: 2026-04-18 · **Status**: Decision recorded

## TL;DR

Claude Design (claude.ai/design, released 2026-04-17) is a chat-driven AI design tool by Anthropic Labs, powered by Opus 4.7. Output formats: HTML / PDF / PPTX / ZIP / Canva push / Claude Code handoff. Independent weekly usage allowance (numbers undisclosed). Eight UI demos identified for replication.

## UI layout (confirmed across multiple sources)

```
┌──────────────────────────────────────────────┐
│ [Logo] [Project]  [Share] [Export ▼]         │
├──────────────────┬───────────────────────────┤
│ LEFT: Chat panel │ RIGHT: Design canvas      │
│ - messages       │ - live HTML render        │
│ - inline comment │ - click element to comment│
│   input          │ - direct text edit        │
│ - progress bar   │ - custom sliders nearby   │
└──────────────────┴───────────────────────────┘
```

- No visible Figma-style version history; chat itself is implicit history
- Sliders are AI-generated per design (not a fixed control set)
- Click-to-comment is element-level, not region selection

## Key interaction details

| Feature | Mechanism |
|---|---|
| Inline comments | Click element → comment popup → submit. Known bug: comments occasionally disappear before processing |
| Custom sliders | AI emits per-design sliders for spacing/color/layout. Drag = real-time update, no model re-run |
| Design system | Onboard via GitHub repo / local dir / natural language. AI extracts colors, typography, components, spacing. Persisted as `SKILL.md` |
| Web Capture | Paste URL inside the app (no extension). Likely screenshot + vision, not DOM scrape |
| Handoff to Claude Code | Generates expiring URL bundling design + chat + README. User pastes URL into Claude Code |

## Eight demos to replicate

1. Calm Spaces meditation app (mobile prototype)
2. Client case study one-pager (dark theme, exportable PDF)
3. B2B SaaS pitch deck (PPTX export)
4. Inline comment editing loop
5. AI-generated tunable sliders
6. Codebase → design system extraction
7. Web Capture (URL → reference)
8. Handoff bundle to engineering tool (theirs: Claude Code; ours: open-cowork)

## Pricing (relevant for our positioning)

- Claude Design has independent weekly cap, separate from Chat / Claude Code
- Specific generation count per tier never disclosed
- Pro $20/mo, Max 5x $100/mo, Max 20x $200/mo
- → Open-source BYOK angle: no cap, only token costs

## Known issues (theirs — cherry-picking design lessons)

1. Inline comments sometimes vanish before processing
2. Compact layout view save errors
3. Large monorepos slow to scan (recommend linking subdirs only)
4. Occasional rendering errors
5. No reusable component primitives (Figma-style auto-layout missing)
6. No visible version history UI
7. No Figma / Sketch / XD integrations (only Canva)

## Critical gap in research

**No public sample of an exported HTML file exists.** First task on day 1: get a Pro subscription, generate one, download, reverse-engineer DOM structure, font embedding, JS runtime presence. Without this we are designing blind.

## Top sources

1. https://www.anthropic.com/news/claude-design-anthropic-labs (official announcement)
2. https://claude.com/resources/tutorials/using-claude-design-for-prototypes-and-ux (official tutorial — most detail)
3. https://support.claude.com/en/articles/14667344 (pricing / weekly cap mechanics)
4. https://www.youtube.com/watch?v=A2eEv3KYGPg (Vivek Mishra — only full walkthrough video found)
5. https://dev.to/vteacher/...claude-design-is-finally-here... (Japanese user real screenshots, SKILL.md output noted)
6. https://pasqualepillitteri.it/en/news/975/claude-design-anthropic-labs-figma-alternative (UI layout teardown with screenshots)
7. https://gln75.com/en/blog/anthropic-claude-design-launch (cites official support docs for known bugs)

## Decision impact

- Confirmed UI layout to mirror (left chat / right canvas)
- Confirmed eight demos as v1.0 success criteria (already in VISION.md)
- Need to acquire one exported HTML sample before locking artifact schema
- Differentiation angles confirmed: no weekly cap, no Canva dependency, local design system extraction
