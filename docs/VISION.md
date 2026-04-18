# Vision — open-codesign

Locked product decisions. Update via PR, not in passing.

## One-line pitch

Open-source desktop AI design tool — prompt to interactive prototype, slide deck, and marketing assets. Multi-model, BYOK, local-first.

## What we are building

A Mac/Windows desktop application that lets non-designers (founders, PMs, marketers) and designers alike turn natural-language prompts into:

- Interactive HTML prototypes (mobile + desktop)
- One-page PDF case studies, reports, marketing pages
- PPTX slide decks (pitch, quarterly, training)
- Design-system-aware mockups derived from a user's existing codebase
- Asset bundles (ZIP) ready to handoff

The product is the open-source counterpart to Anthropic's [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) (released 2026-04-17). Our goal for MVP is to **reproduce every public Claude Design demo**.

## What we are NOT building

- Not v0 / Bolt / Lovable — we don't generate deployable React/Next.js apps. For engineering handoff, we delegate to [open-cowork](https://github.com/OpenCoworkAI/open-cowork).
- Not a Figma replacement — we don't do collaborative vector editing.
- Not a Canva replacement — we don't ship a stock asset library or template marketplace.
- Not hosted SaaS (at least not at MVP).

## Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Form factor | Electron desktop (Mac + Win) | Local file access, codebase scan privacy, complements open-cowork |
| Model layer | `pi-ai` (multi-provider) | Already proven in open-cowork; covers Anthropic / OpenAI / Gemini / DeepSeek / local |
| Authentication | None — BYOK | No backend, no liability for user keys |
| Storage | Local SQLite (`better-sqlite3`) + filesystem | Local-first, no cloud dependency |
| Design language | Aligned with open-cowork (Claude-style) | Future plugin/merge possible; shared `packages/ui` |
| Package manager | pnpm + Turborepo | Workspace, caching, fast |
| Lint/format | Biome (single tool) | Lessons learned from open-cowork's ESLint+Prettier complexity |
| License | Apache-2.0 | Patent grant; enterprise-friendly |
| Contributor agreement | DCO (`Signed-off-by`) | Lower friction than CLA |

## Killer demos (must ship for v1.0)

Each must be reproducible from a single prompt, on the first try, with default settings:

1. **Calm Spaces meditation app** — mobile prototype with phone frame, soft palette, interactive nav
2. **Client case study one-pager** — dark theme, before/after metrics, CEO quote, exportable as PDF
3. **B2B SaaS pitch deck** — 8-12 slides, exportable as PPTX
4. **Inline comment editing** — click any element in preview, write a comment, AI rewrites that region
5. **AI-generated tunable sliders** — model emits adjustable parameters (color/spacing/font), user drags to refine
6. **Codebase → design system** — point at a local repo, extract tokens, apply to all subsequent generations
7. **Web Capture** — paste a URL, scrape it as a design reference for further iteration
8. **Handoff to open-cowork** — package the design + intent README, hand off to open-cowork to engineer

## Differentiation vs Claude Design

| Axis | Claude Design | open-codesign |
|---|---|---|
| Model | Opus 4.7 only | Multi-provider via pi-ai |
| Form | Web SaaS | Local desktop |
| Privacy | Cloud-stored | Local-first |
| Backend | Anthropic + Canva | None |
| Engineering handoff | Claude Code | open-cowork |
| Source | Closed | Apache-2.0 |
| Cost | Subscription | BYOK token cost only |

## Non-goals (explicit)

- Real-time multi-user collaboration
- Built-in stock photo / icon library (link out instead)
- Mobile app
- Self-hosted server mode
- Custom in-house models

## Ecosystem positioning (deferred)

Two ecosystem axes to revisit post-MVP. Tracked as future work, not implemented now:

- **Claude ecosystem compat**: parse Claude Artifacts `<artifact>` tag protocol; expose ourselves as MCP server for Claude Code
- **open-cowork ecosystem**: shared `packages/ui`, shared sandbox runtime, shared SQLite schema; eventually load as a plugin inside open-cowork

## Versioning milestones

- `0.1` — single-prompt → HTML preview, one model provider
- `0.2` — three killer demos working
- `0.5` — all eight killer demos
- `1.0` — install size budget green, signed installers, all demos pass smoke tests
