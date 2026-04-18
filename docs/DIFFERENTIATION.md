# Differentiation

What open-codesign does that Claude Design (and other AI design tools) cannot or does not.

## Structural advantages (free with our architecture)

| # | Advantage | Why competitors can't easily match |
|---|---|---|
| 1 | Zero vendor lock-in | They ship Opus-only; we run any model via pi-ai (BYOK) |
| 2 | Designs never leave the laptop | Compliance-friendly for legal / medical / finance |
| 3 | No cap, no subscription | Local model = effectively free; cloud model = pay per token only |
| 4 | Forkable, hackable | Custom system prompts, custom exporters — closed tools won't allow |
| 5 | No Canva dependency | Direct PPTX/HTML/PDF; no second subscription, no second data leak |

## Picked killer features for v0.2 — v0.5

Scored on `(impact × ease)`. These ship alongside the eight Claude Design demos.

| Feature | Phase | Why it goes viral |
|---|---|---|
| **Three-column model A/B race** (same prompt → Opus vs GPT-5 vs Gemini side-by-side) | v0.2 | Tweet-native screenshot; "which model designs best" debates fuel themselves |
| **CLI mode** (`codesign "make me a landing page" -m gpt-5 -o out.html`) | v0.3 | HN front-page bait; integrates into shells, Makefiles, CI |
| **Steal URL Style** (paste any URL → learn aesthetic → apply to your content) | v0.3 | 30-second demo video format; immediate practical value |
| **Reverse Redesign** (point at any ugly site → AI redesigns it) | v0.4 | Classic before/after Twitter format |
| **Local Ollama zero-cost preset** | v0.4 | "Free forever, no API key" tagline |
| **Multi-IDE handoff** (Cursor / Cline / Aider / open-cowork) | v0.5 | Builds bridges to entire AI-coding ecosystem |

## Roadmap deferred (post-1.0)

| Feature | Why deferred |
|---|---|
| Skills marketplace (community prompt packs) | Needs user base first |
| GitHub PR design preview bot | Requires backend service — violates "no backend" principle |
| Figma import | Engineering effort vs payoff unfavorable |
| Real-time multi-user editing | Violates local-first architecture |
| Git-aware design diff | Useful but not viral |
| Codebase live sync (file watcher) | Polish, not differentiation |
| MCP server interface | Clean tech but small audience |

## Brand-level positioning (candidates)

- "Claude Design without the lock-in"
- "Your designs, your models, your machine."
- "Open-source AI design — local, multi-model, forever yours."

## Anti-marketing claims

Things we will NOT say even if true:

- ❌ "Better than Claude Design" — we're not, we're different
- ❌ "Faster than Figma" — orthogonal product
- ❌ "Replace your designer" — we augment, not replace
