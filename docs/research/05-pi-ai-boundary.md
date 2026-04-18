# Research 05 — pi-ai Capability Boundary

**Date**: 2026-04-18 · **Status**: Decision recorded

## Decision

**Use `@mariozechner/pi-ai` (v0.67.x) as the LLM transport layer. Pin to a stable version. Wrap missing capabilities in `packages/providers`. Do NOT fork.**

## What pi-ai gives us ✅

| Capability | Notes |
|---|---|
| 22 providers | Anthropic / OpenAI / Gemini / Bedrock / Mistral / OpenRouter / xAI / Groq / GitHub Copilot / Vercel AI Gateway / etc. |
| Ollama / LM Studio / vLLM | Via `openai-completions` provider with custom `baseUrl` |
| Streaming (SSE) | `AssistantMessageEventStream` AsyncIterable; events: `text_delta` / `thinking_delta` / `toolcall_delta` |
| Tool use | Unified `Tool<TParameters extends TSchema>` interface using TypeBox; auto-translated per provider |
| Image input | `ImageContent { type, data: base64, mimeType }`; non-vision models silently ignore |
| Anthropic prompt caching | `CacheRetention = "none" \| "short" \| "long"` enum, `cache_control` injection |
| Token + cost tracking | Per-event `Usage { input, output, cacheRead, cacheWrite, cost: {...} }` |
| Context overflow detection | `isContextOverflow()` cross-provider regex |
| API key management | Env var auto-detect (22 providers) + `options.apiKey` override |
| Partial JSON parsing | Streaming tool args via `partial-json` |

## What pi-ai is missing ❌

| Gap | Impact | Mitigation |
|---|---|---|
| **Structured output / JSON schema** | Need for `design_params` slider JSON | Wrapper using forced tool calls (Anthropic) + `onPayload` hook to inject `text.format` (OpenAI) |
| **`<artifact>` tag streaming parser** | Need for Claude Artifacts protocol compat | State machine in `packages/core` over `text_delta` events |
| **PDF / audio input** | Useful for design briefs | Direct `@anthropic-ai/sdk` for these calls (one-off, contained) |
| **Auto provider fallback** | Robustness | `streamWithFallback([m1, m2])` wrapper |
| **Provider-level retry** | Only Gemini CLI has it | `completeWithRetry()` exponential backoff wrapper |
| **Zod → Tool helper** | Convenience | 3-line util using existing `zod-to-json-schema` dep |

## Wrappers to build in `packages/providers`

```ts
// 1. structured output
export async function structuredComplete<T>(
  model: Model<any>,
  context: Context,
  schema: TSchema | ZodSchema
): Promise<T>

// 2. artifact streaming
export async function* streamArtifacts(
  model: Model<any>,
  context: Context
): AsyncIterable<ArtifactEvent>  // emits start/chunk/end per <artifact>

// 3. fallback
export async function streamWithFallback(
  models: Model<any>[],
  context: Context
): Promise<AssistantMessage>

// 4. retry
export async function completeWithRetry(
  model: Model<any>,
  context: Context,
  opts?: { maxRetries?: number; baseDelayMs?: number }
): Promise<AssistantMessage>

// 5. zod helper
export function zodToTool<T extends ZodTypeAny>(
  name: string, description: string, schema: T
): Tool

// 6. PDF input (escape hatch — direct SDK)
export async function completeWithPdf(
  pdfBase64: string, prompt: string
): Promise<string>  // Anthropic only for v0.x
```

## Maintenance risk

| Metric | Value |
|---|---|
| Stars | 36,864 |
| Repo age | ~8 months |
| Releases | ~292 in 8 months (1-2/day) |
| Top contributor | badlogic (Mario Zechner) — 2,850 commits |
| Second contributor | mitsuhiko (Armin Ronacher) — 41 commits |
| New contributor PRs | Auto-closed by default; maintainer reviews daily |
| Bus factor | **1** — high long-term risk |

**Short-term (6-12 months)**: very low risk. Activity is excellent.
**Long-term**: pin versions defensively; keep wrappers thin enough that switching transport is a packages/providers swap.

## Why not fork

- Update cadence is 1-2 releases/day — heavy fork = merge hell
- Architecture is clean; custom providers register via `registerApiProvider()` (no fork needed)
- Missing features all live cleanly in our `packages/providers` layer
- If PDF/audio becomes critical, **submit PR** — Mario merges fast

## Why not direct SDKs

- 22 providers; rebuilding the abstraction is months of work
- Loses: prompt caching, streaming events, tool unification, cost tracking, retry on overflow
- We'd reinvent pi-ai badly

## Sources

1. https://github.com/badlogic/pi-mono — main repo
2. https://www.npmjs.com/package/@mariozechner/pi-ai — version history
3. `packages/ai/src/types.ts` — `KnownProvider` enum, full type surface
4. `packages/ai/src/providers/anthropic.ts` — caching impl reference
5. `packages/coding-agent/src/core/agent-session.ts` — retry pattern reference
6. `OpenCoworkAI/open-cowork` `src/main/utils/artifact-parser.ts` — production usage of pi-ai with custom artifact regex
