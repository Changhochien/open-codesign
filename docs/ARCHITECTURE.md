# Architecture

High-level shape of the codebase. Detailed module READMEs live in each `packages/*/README.md`.

## Bird's-eye view

```
                          ┌──────────────────────────────┐
                          │     apps/desktop (Electron)  │
                          │  ┌────────────┬───────────┐  │
                          │  │ Chat panel │  Canvas   │  │
                          │  └─────┬──────┴─────┬─────┘  │
                          └────────┼────────────┼────────┘
                                   │            │
                         ┌─────────▼──┐    ┌────▼─────────┐
                         │  core      │    │  runtime     │
                         │ (orchestra │    │ (sandbox     │
                         │  tion)     │    │  renderer)   │
                         └──┬─────────┘    └──────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌────────────┐
       │providers │  │artifacts │  │ exporters  │
       │ (pi-ai + │  │ (schema) │  │ (PDF/PPTX) │
       │ wrappers)│  └──────────┘  └────────────┘
       └──────────┘
```

## Package responsibilities

- **`apps/desktop`** — Electron shell. Main process owns SQLite, file system, and IPC. Renderer hosts the React UI. No business logic here; delegate to packages.
- **`packages/core`** — Generation orchestration. Takes a user prompt + design system + history → calls `providers` → streams artifacts → emits events the UI subscribes to.
- **`packages/providers`** — Wraps `@mariozechner/pi-ai` and adds the six missing capabilities documented in `docs/research/05-pi-ai-boundary.md`. App code never imports a provider SDK directly.
- **`packages/runtime`** — Sandbox preview. Owns the iframe `srcdoc`, esbuild-wasm worker, import map resolution, and the overlay script for inline comments and slider bindings.
- **`packages/ui`** — Design tokens (CSS variables aligned with open-cowork) + Radix-based component primitives + Tailwind preset. Consumed by `apps/desktop`.
- **`packages/artifacts`** — Zod schemas for artifact types (HTML / SVG / slide deck / asset bundle) + the `<artifact>` tag streaming parser.
- **`packages/exporters`** — PDF, PPTX, ZIP. Each exporter is its own subpath export with dynamic import to keep the cold-start bundle lean.
- **`packages/templates`** — Built-in demo prompts and starter templates. Read at runtime, not bundled into core.
- **`packages/shared`** — Plain types, utility functions, and zod schemas shared across packages. No runtime dependencies.

## Data flow: one generation

1. User types a prompt in chat panel
2. `desktop/renderer` calls `core.generate({ prompt, designSystem, history })` via IPC
3. `core` builds the prompt context (system prompt + design system + chat history)
4. `core` calls `providers.streamArtifacts(model, context)`
5. `providers` invokes pi-ai `stream()` and runs the `<artifact>` parser state machine over `text_delta` events
6. `core` emits `artifact:start` / `artifact:chunk` / `artifact:end` events
7. `desktop/renderer` pipes chunks into the `runtime` iframe via postMessage; `runtime` rebuilds `srcdoc` incrementally
8. On `artifact:end`, `core` persists snapshot to SQLite via main process

## Data flow: inline comment

1. User clicks an element in the iframe
2. Overlay script (in `runtime`) postMessages selected element info to renderer
3. Renderer shows comment popup
4. On submit, `core.applyComment({ artifactId, elementId, comment })` is called
5. `core` builds str_replace prompt and calls `providers.structuredComplete()`
6. Returned patch is applied to the artifact's HTML
7. New version snapshot written to SQLite; iframe rebuilt

## Data flow: slider drag

No model call. `runtime` calls `iframe.contentDocument.documentElement.style.setProperty(cssVar, value)` directly. On `mouseup`, the new values are persisted to SQLite as part of the artifact metadata.

## Boundaries that must not be crossed

- ❌ `apps/desktop` importing from `@anthropic-ai/sdk` or `openai` — go through `packages/providers`
- ❌ `packages/core` importing from `apps/desktop` or React
- ❌ `packages/ui` knowing about LLMs or artifacts
- ❌ Exporters bundled into the main app shell — must be dynamic-imported
- ❌ Any package writing to disk except via `apps/desktop` IPC
