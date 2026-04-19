---
'@open-codesign/core': patch
---

fix(core): self-healing reasoning knob for any provider/model

The fixed regex whitelist was a brittle way to decide whether to send a `reasoning` parameter — every new reasoning-mandatory model on OpenRouter (e.g. `minimax/minimax-m2.5:free`) would bounce off a hard `400 Reasoning is mandatory for this endpoint and cannot be disabled.`

Now generation is self-healing in addition to the fast-path whitelist:
- Whitelist still applies for known reasoning models (no extra round trip).
- For unknown models, on a `400` whose body says reasoning is required, retry once with `reasoning='medium'`.
- Symmetrically: if reasoning was sent and the upstream rejects with "not supported", retry once without it.

This means new reasoning models work out of the box and stale whitelist entries auto-recover.

Also extends the static OpenRouter whitelist (fast path) to cover the common reasoning-mandatory ids: `:thinking` suffix, `anthropic/claude-(opus|sonnet)-4*`, `openai/(o1|o3|o4|gpt-5)*`, `minimax/minimax-m*`, `deepseek/deepseek-r*`, `qwen/qwq*`.
