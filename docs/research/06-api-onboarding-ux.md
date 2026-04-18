# Research 06 — API Key Onboarding UX

**Date**: 2026-04-18 · **Status**: Decision recorded

## Decision

Adopt a **3-step first-run flow** modeled on Cherry Studio + Msty, with a **mandatory zero-config path** (free OpenRouter or built-in demo key) so the user can produce one design before being asked for any key.

## Top 5 must-haves (CI-checked in PR review)

1. **Zero-config first run** — OpenRouter free model as default OR limited built-in demo key (5/day). User sees value before being asked anything.
2. **Smart key detection + live validation** — paste → detect provider by prefix → 500ms debounce → ping `/v1/models` → show model count or specific error.
3. **"How to get this key" inline link per provider** — direct link, not a generic FAQ. Modeled on Msty's complete table (endpoint / key URL / visibility / pricing).
4. **Specific error messages** — distinguish 401 / 402 / 429 / network. Each error has an actionable next step with a link.
5. **System keychain encryption** — macOS Keychain / Windows Credential Manager. Never plain JSON.

## 3-step flow (UI sketch)

**Step 1 — Welcome + path picker**
```
🚀 Try free now (OpenRouter free tier)   ← default
🔑 Use my API key
🖥️ Use local model (Ollama detected)     ← only if detected
```

**Step 2A — Key paste (if path B chosen)**
```
[Paste sk-ant-...        ]   ← auto-detects Anthropic
✓ Recognized: Anthropic Claude
✓ Format valid
✓ Connected (3 models available)

[How to get an Anthropic key →]
```
Auto-detect by prefix: `sk-ant-` Anthropic, `sk-or-` OpenRouter, `sk-` OpenAI, `AIza` Google, `xai-` xAI, `gsk_` Groq.

**Step 3 — Model defaults**
```
Primary design model:   [claude-sonnet-4-6 ▼]  (recommended)
Fast completion model:  [claude-haiku-3 ▼]    (recommended)
Estimated cost: ~$0.01-0.05 per design session
```

## Top 10 anti-patterns to avoid

1. **API key required on first screen** — #1 cause of churn. Always have a free path.
2. **No "where to get key" link** — sends user to Google.
3. **Vague errors** — "API call failed" without distinguishing 401/402/429.
4. **Opaque key precedence** — user thinks subscription is broken because invalid BYOK key silently overrides (Cursor's mistake).
5. **Google Gemini complexity** — GCP project + billing + ID verification (45 min). Route Gemini through OpenRouter instead.
6. **Plain-text key storage on Windows** — use Credential Manager.
7. **No paste validation** — user discovers key is wrong only on first message after 30 min of setup.
8. **Manual model ID entry** — auto-fetch from `/v1/models`.
9. **Model switch wipes context** — preserve chat or warn explicitly.
10. **No free tier and no OpenRouter integration** — user hits "fund your account first" wall and leaves.

## Reference best implementations

| Capability | Best-in-class | Why |
|---|---|---|
| Zero-config path | Cherry Studio (CherryIN OAuth) / OpenRouter / Msty (local Gemma) | Multiple proven patterns |
| Browser OAuth | Claude Code | Skips key copy-paste entirely |
| Provider key links | Msty's "Find API Keys" doc | Endpoint + URL + visibility + pricing per provider |
| Auto model discovery | Cherry Studio + Open WebUI | Silently fetch on first save |
| Multi-key per provider | Cherry Studio (comma-separated, round-robin) | Power-user friendly |
| Ollama auto-detect | Msty / Cherry Studio / Jan | Surface in first-run picker |

## Implementation plan for open-codesign

- **Phase 0.1 (Phase 1 of overall roadmap)**: ship Step 1 + Step 2A + Step 3 with Anthropic + OpenAI + OpenRouter only. Skip Google Gemini for v0.1 (route via OpenRouter if requested).
- **Phase 0.2**: add Ollama auto-detection.
- **Phase 0.3**: add `pi-ai`'s 22 providers behind a "More providers" expander.
- **Phase 0.4**: add browser OAuth for Anthropic when their public OAuth becomes available.
- **Always**: every key lives in OS keychain. Config TOML stores only references.

## Sources

Highlights:
- Cherry Studio Issue #13421 + PR #13774 — onboarding wizard implementation
- Msty Find API Keys docs — provider info template
- OpenRouter free models router — zero-config pattern
- Claude Code Authentication Guide — OAuth as CLI gold standard
- Ankur Sethi blog on Gemini API frustration — 318 HN upvotes, anti-pattern reference

Full source list (22 references) recorded in conversation log on 2026-04-18.
