# Research 02 — Inline Comment + AI Slider POC

**Date**: 2026-04-18 · **Status**: Decision recorded

## Decision summary

| Mechanism | Chosen approach |
|---|---|
| Element selection | Inject overlay script in same-origin srcdoc iframe; identify by `data-codesign-id` (preferred) > `id` > XPath fallback |
| Comment-to-AI patch | Send element `outerHTML` + comment to LLM; require **str_replace** block response (Anthropic `text_editor_20250728` format) |
| Cross-version stability | AI must inject stable `data-codesign-id` per element on initial generation; subsequent edits target by id |
| Slider rendering | AI emits `design_params` JSON alongside HTML; frontend renders controls; bind via CSS variables |
| Slider update | Direct `setProperty()` on iframe `:root` — no model re-run for value tweaks |

## Element selection — recommended impl

```js
// injected into iframe srcdoc
document.addEventListener('click', e => {
  e.preventDefault(); e.stopPropagation();
  window.parent.postMessage({
    type: 'ELEMENT_SELECTED',
    id: e.target.dataset.codesignId,
    xpath: getXPath(e.target),
    outerHTML: e.target.outerHTML.slice(0, 500),
    rect: e.target.getBoundingClientRect()
  }, '*');
}, true);
```

## Patch protocol

System prompt requires str_replace blocks:

```
<<<<<<< SEARCH
{exact text}
=======
{new text}
>>>>>>> REPLACE
```

- Cheaper than re-sending full HTML (~500 tokens vs 10-50K)
- Aider benchmark: SEARCH/REPLACE has higher Claude success rate than unified diff
- Add `flexible_search_and_replace` (whitespace-tolerant) for resilience

## Slider protocol

```typescript
interface DesignParam {
  id: string;            // CSS var name (without --)
  label: string;
  type: "color" | "range" | "select" | "toggle";
  cssVar: string;        // "--primary-color"
  defaultValue: string;
  min?: number; max?: number; step?: number;
  unit?: string;         // "px" | "rem" | "%"
  options?: string[];
}
```

System prompt rule: "Use CSS custom properties for all tunable values. Output design_params JSON after HTML. Maximum 8 sliders."

## Known traps

1. Same-origin requirement → use `srcdoc`, never external `src`
2. CSP `<meta>` tags in AI output may block injection → strip during preprocessing
3. AI parameter hallucination (var name mismatch HTML vs JSON) → require "declare after use" prompt structure
4. Color format mismatch (color picker `#rgb` vs `oklch()` in HTML) → format normalize layer
5. Too many params → cap at 8 in system prompt; collapse groups in UI
6. iframe CSS var scope: must call `iframe.contentDocument.documentElement.style.setProperty()`, not parent's

## Reference implementations

- **stagewise** (github.com/stagewise-io/stagewise) — 6.5k stars, AGPL — XPath + iframe bridge reference
- **layrr** (github.com/thetronjohnson/layrr) — MIT — click-to-Claude-Code direct fork inspiration
- **istarkov/ai-cli-edit** — XML edit prompt structure reference
- **vercel-labs/json-render** — generative UI framework, has Slider/ColorPicker
- **CodePen slideVars** — auto CSS-var → control panel
- **yairEO/knobs** (1.2k stars) — CSS-var bound UI controls
- **v0 Design Mode** — production reference of CSS-var-driven sliders

## POC effort estimate

- Inline comment loop: 3-5 days
- AI slider loop: 2-3 days
- Combined: ~1 week of focused work for both

## Decision impact

- `packages/runtime` overlay script: bundle as small TS module, inject via `srcdoc`
- `packages/core` artifact schema: add `design_params` field
- System prompt template (`packages/templates/system/design-generator.md`): codify the JSON output requirement
