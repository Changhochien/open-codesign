# Engineering Principles

These are not guidelines. They are CI-enforced constraints. A PR that violates one needs explicit waiver in the description.

## 1. Lean by default

**Install size budget: ≤ 80 MB across Mac and Windows installers.**

- ❌ Do not bundle Node runtime, Python, or browser binaries
- ❌ Do not bundle any LLM weights
- ✅ Heavy features (PPTX export, web capture, codebase scan) must use dynamic `import()` on first use
- ✅ Ship Electron with `asar` enabled; optional modules go to `extraResources` and load on demand
- ✅ Use Vite + Rolldown; produce ESM-only output; tree-shake aggressively
- ✅ CI runs `size-limit` and `bundlewatch` — > 5% increase fails the build

**Dependency budget: ≤ 30 production dependencies.**

- ❌ No `lodash`, `moment`, `axios` — use Web standard equivalents
- ❌ No utility-belt libs (one-off tiny packages preferred over kitchen-sink)
- ✅ A new prod dep requires PR description listing: install size, licensing, alternatives considered
- ✅ Prefer peer deps when the consumer can supply

## 2. First-run delight

**Goal: Download → first generated design ≤ 90 seconds, including model auth.**

- ✅ Distribute via Homebrew Cask, winget, scoop, and direct `.dmg` / `.exe`
- ✅ Mac notarization + Windows Authenticode — no "unknown developer" warnings
- ✅ Onboarding ≤ 3 steps: pick model → run a built-in demo → done. Skippable.
- ✅ Auto-detect provider from API key prefix (`sk-ant-…` → Anthropic, `sk-…` → OpenAI, etc.)
- ✅ Offer a free-tier path: bundled config for OpenRouter free models so users can try without keys
- ✅ Single-page Settings, max 4 tabs (Models, Appearance, Storage, Advanced) — not 10+

## 3. Configuration is human-readable

- ✅ Config lives at `~/.config/open-codesign/config.toml` — TOML, not JSON, not binary
- ✅ Every setting has a CLI equivalent: `open-codesign config set anthropic.key=…`
- ✅ One-command export/import (`open-codesign config export > backup.toml`)
- ❌ No `electron-store` opaque blobs; no SQLite for config
- ✅ Defaults documented in `docs/CONFIG.md` with every key

## 4. Local-first, no surprise networking

- ❌ No analytics, telemetry, or "phone home" without explicit opt-in
- ❌ No automatic background downloads (model lists, templates) without user-visible UI
- ✅ A network-request audit dashboard accessible from Settings (see what calls who)
- ✅ Auto-update is opt-in, not default

## 5. Simplest viable version first

Every feature ships in three tiers. We never go to tier 2 until tier 1 has real users.

- **Tier 1 (dumb but works)**: hardest path possible, no edge cases, hardcoded if needed. Ship this.
- **Tier 2 (handles common cases)**: only after tier 1 has been used and the actual edge cases are known.
- **Tier 3 (production-grade)**: only if usage proves it matters.

Concrete examples:

| Feature | Tier 1 (ship first) | Tier 2 | Tier 3 |
|---|---|---|---|
| Inline comment | Re-send entire HTML to model on every comment | str_replace patches with stable `data-codesign-id` | Optimistic UI + diff streaming |
| Custom sliders | Hardcoded 3 sliders (color/spacing/font) for every design | AI-emitted `design_params` JSON | Per-slider AI explanation tooltips |
| Multi-model A/B | Run sequentially, show in tabs | Parallel streams, three columns | Diff highlighting between outputs |
| URL style steal | Screenshot only, send to vision model | DOM scrape + computed style extraction | Component-level pattern matching |
| Codebase → DS | Read `tailwind.config.js` only | Walk `**/*.css` for variables | Full AST analysis of design tokens |
| PPTX export | One slide per HTML page, screenshot embedded | dom-to-pptx for editable shapes | Font embedding + CJK patches |
| Reverse Redesign | Single-shot vision call, output new HTML | Multi-step refine loop | Style transfer with brand preservation |

Rule of thumb: **if tier 1 takes more than 2 days, the feature is too ambitious for first cut — pick a simpler tier 1.**

## 6. No premature abstraction

- ❌ No factory patterns, plugin systems, or DI containers without 2+ real callers
- ❌ No config-driven dispatch when a `switch` works
- ✅ Three similar lines is fine. Extract on the fourth.
- ✅ Delete dead code instead of keeping `// removed` comments

## 7. Comments explain *why*, not *what*

- ❌ No JSDoc on private functions
- ❌ No "// loops over the array" comments
- ✅ Comment when the reader will be surprised: workaround, hidden constraint, subtle invariant
- ✅ One short line max — never multi-paragraph blocks

## 8. UI uses tokens, not literals

- ❌ No hard-coded `#fff`, `16px`, `font-family: …` in app code
- ✅ All visual properties come from `packages/ui` tokens
- ✅ Add tokens to `packages/ui` before using them
- ✅ Tailwind config consumes the same tokens — no divergence

## 9. Tests at the right boundary

- ✅ Unit tests in Vitest, colocated with source (`foo.ts` → `foo.test.ts`)
- ✅ E2E in Playwright against the built app, not a mocked harness
- ✅ Mock the LLM at the `core` boundary, never at the SDK level
- ❌ No snapshot tests for prompts (they rot)

## 10. Errors are user-visible or thrown, never silently swallowed

**No silent fallbacks. Failures are loud.** Fallbacks hide bugs and make debugging miserable. Treat every fallback as technical debt that must be justified in code review.

Banned patterns:
- ❌ `catch (e) {}` — empty catch blocks
- ❌ `catch (e) { return defaultValue }` — fallback value masking real error
- ❌ `catch (e) { return null }` followed by callers checking `if (x === null)` — null-check fallback chain
- ❌ `try { primaryProvider() } catch { fallbackProvider() }` — silent provider swap
- ❌ `value ?? sensible_default` when undefined means "something went wrong upstream"
- ❌ Optional chaining (`?.`) used to swallow missing data instead of validating

Allowed:
- ✅ Throw with context: `throw new Error('PPTX export failed: ' + e.message, { cause: e })`
- ✅ Surface in UI with actionable message: "Anthropic API key invalid — open Settings"
- ✅ Log at WARN/ERROR level with structured context
- ✅ Genuine fallback chains where each step is intentional and the chain is logged: model A failed → user sees notice → asks if try model B

The exception: at *system boundaries* (loading user config that may not exist yet, parsing JSON that may be malformed by user), defaults are fine when they map to a clearly-defined "first run" state — and the default itself is documented.

When in doubt, throw. A loud crash with a stack trace is always more useful than a quiet wrong answer.

## 11. PRs are small, reviewed, signed

- ✅ One concern per PR; rebase don't merge
- ✅ Conventional Commits subject; body explains *why*
- ✅ DCO `Signed-off-by` required (configure with `git commit -s`)
- ✅ All CI green before merge; force-push to main forbidden
