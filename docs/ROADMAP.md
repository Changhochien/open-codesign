# Roadmap

Living document. Updated as research lands and decisions are made.

## Phase 0 — Foundations (current)

**Goal**: Repo is ready to accept code.

- [x] Repo created (`OpenCoworkAI/open-codesign`)
- [x] Local git initialized, remote linked
- [x] Vision, Principles, CLAUDE.md drafted
- [ ] Apache-2.0 license + DCO + standard OSS files
- [ ] pnpm + Turborepo + Biome + TypeScript + Vitest scaffold
- [ ] CI: lint, typecheck, test, size budget
- [ ] CONTRIBUTING + ISSUE/PR templates + CODEOWNERS
- [ ] First commit pushed

## Phase 1 — Spike (after research lands)

**Goal**: Prove the architecture with one demo. No UI polish.

Depends on completion of `docs/RESEARCH_QUEUE.md`. After research is in:

- [ ] `packages/providers` wraps pi-ai, exports a unified `generate()`
- [ ] `packages/runtime` renders one HTML artifact in an iframe sandbox (sandbox tech TBD pending research item #3)
- [ ] `packages/core` orchestrates: prompt → model call → artifact → render
- [ ] `apps/desktop` Electron shell with chat panel + preview pane
- [ ] One demo working end-to-end: **Calm Spaces meditation app**

## Phase 2 — Three demos

**Goal**: Show enough to recruit early contributors.

- [ ] PPTX export (lib choice TBD pending research item #4)
- [ ] PDF export (Puppeteer or similar)
- [ ] Demos working: meditation app, case study one-pager, pitch deck
- [ ] Built-in template gallery
- [ ] Settings page with API key + model picker

## Phase 3 — Killer interactions

**Goal**: Ship the things that differentiate us from "yet another AI HTML generator".

- [ ] Inline comment → AI patch loop (mechanism TBD pending research item #2)
- [ ] AI-generated custom sliders (mechanism TBD pending research item #2)
- [ ] Version timeline with snapshot rollback

## Phase 4 — Ecosystem features

**Goal**: Codebase awareness + handoff.

- [ ] Codebase scanner → design system extraction
- [ ] Web Capture (Playwright on demand)
- [ ] Handoff bundle to open-cowork
- [ ] All eight killer demos working

## Phase 5 — Release polish

**Goal**: 1.0 quality.

- [ ] Mac notarization + Windows Authenticode
- [ ] Homebrew Cask + winget + scoop manifests
- [ ] Auto-update (opt-in)
- [ ] Install size budget verified ≤ 80 MB
- [ ] Onboarding flow ≤ 3 steps
- [ ] Documentation site (Fumadocs)
- [ ] Public 1.0 release

## Deferred (post-1.0)

Tracked but not on the critical path:

- Real-time collaboration
- MCP server interface (expose design generation to Claude Code et al.)
- Claude Artifacts `<artifact>` tag compatibility (import from claude.ai)
- Plugin loading inside open-cowork
- Hosted demo site (web build)
- Linux installer
- Mobile companion (read-only)

## Anti-goals

Things we will say no to in roadmap discussions:

- Built-in payment / billing
- User accounts / cloud sync
- Stock asset library
- Custom model fine-tuning
- Team admin console
