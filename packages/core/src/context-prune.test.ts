import type { AgentMessage } from '@mariozechner/pi-agent-core';
import { describe, expect, it } from 'vitest';
import { buildTransformContext } from './context-prune.js';

function userMsg(text: string): AgentMessage {
  return {
    role: 'user',
    content: [{ type: 'text', text }],
  } as unknown as AgentMessage;
}

function assistantWithToolCall(toolCallId: string, big: string): AgentMessage {
  return {
    role: 'assistant',
    content: [
      { type: 'text', text: 'ok' },
      { type: 'toolCall', id: toolCallId, name: 'str_replace_based_edit_tool', input: { big } },
    ],
  } as unknown as AgentMessage;
}

function toolResult(toolCallId: string, body: string): AgentMessage {
  return {
    role: 'toolResult',
    toolCallId,
    content: [{ type: 'text', text: body }],
  } as unknown as AgentMessage;
}

function assistantText(text: string): AgentMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
  } as unknown as AgentMessage;
}

describe('buildTransformContext — sliding-window compaction', () => {
  it('is a no-op when well under the cap', async () => {
    const transform = buildTransformContext();
    const messages: AgentMessage[] = [
      userMsg('hi'),
      assistantWithToolCall('t1', 'small'),
      toolResult('t1', 'small result'),
      assistantText('done'),
    ];
    const out = await transform(messages);
    expect(out).toEqual(messages);
  });

  it('leaves the last N tool-use rounds verbatim, stubs older toolResult content', async () => {
    const transform = buildTransformContext();
    const messages: AgentMessage[] = [userMsg('build this')];
    const bulk = 'x'.repeat(2_000);
    // 10 rounds — default window is 6, so first ~4 should be compacted.
    for (let i = 0; i < 10; i += 1) {
      messages.push(assistantWithToolCall(`t${i}`, `args-${i}`));
      messages.push(toolResult(`t${i}`, `result body ${i} ${bulk}`));
    }
    const out = await transform(messages);
    const resultRows = out.filter((m) => m.role === 'toolResult');
    expect(resultRows).toHaveLength(10);
    const early = resultRows.slice(0, 3);
    const recent = resultRows.slice(-6);
    for (const row of early) {
      const first = (row as { content: Array<{ text?: string }> }).content[0]?.text ?? '';
      expect(first.startsWith('[dropped')).toBe(true);
    }
    for (const row of recent) {
      const first = (row as { content: Array<{ text?: string }> }).content[0]?.text ?? '';
      expect(first.startsWith('result body')).toBe(true);
    }
  });

  it('compacts assistant.toolCall.input on old rounds but preserves name + id', async () => {
    const transform = buildTransformContext();
    const messages: AgentMessage[] = [userMsg('build')];
    const bulk = 'a'.repeat(4_000);
    // 10 rounds with big toolCall args — older ones should have args summarized.
    for (let i = 0; i < 10; i += 1) {
      messages.push(assistantWithToolCall(`call-${i}`, bulk));
      messages.push(toolResult(`call-${i}`, 'ok'));
    }
    const out = await transform(messages);
    // Oldest assistant message's toolCall block should have summarized input.
    const oldest = out.find(
      (m) =>
        m.role === 'assistant' &&
        Array.isArray((m as { content?: unknown }).content) &&
        (m as { content: Array<{ type?: string; id?: string }> }).content.some(
          (c) => c?.id === 'call-0',
        ),
    ) as { content: Array<{ id?: string; name?: string; input?: unknown }> } | undefined;
    expect(oldest).toBeDefined();
    const tc = oldest?.content.find((c) => c.id === 'call-0');
    expect(tc?.name).toBe('str_replace_based_edit_tool');
    const input = tc?.input as { _summarized?: boolean; _origBytes?: number } | undefined;
    expect(input?._summarized).toBe(true);
    expect(input?._origBytes).toBeGreaterThan(1_000);
  });

  it('keeps the toolCallId on stubbed toolResult rows (pi-ai shape requirement)', async () => {
    const transform = buildTransformContext();
    const messages: AgentMessage[] = [userMsg('x')];
    const bulk = 'y'.repeat(3_000);
    for (let i = 0; i < 10; i += 1) {
      messages.push(assistantWithToolCall(`call-${i}`, 'a'));
      messages.push(toolResult(`call-${i}`, `body ${bulk}`));
    }
    const out = await transform(messages);
    const first = out.find(
      (m) => m.role === 'toolResult' && (m as { toolCallId?: string }).toolCallId === 'call-0',
    ) as { toolCallId?: string; content: Array<{ text?: string }> } | undefined;
    expect(first).toBeDefined();
    expect(first?.toolCallId).toBe('call-0');
    expect(first?.content[0]?.text?.startsWith('[dropped')).toBe(true);
  });

  it('preserves user messages and assistant-text messages unchanged', async () => {
    const transform = buildTransformContext();
    const bulk = 'z'.repeat(3_000);
    const openingUser = userMsg('initial brief, do not mangle');
    const openingNote = assistantText('I will start now.');
    const messages: AgentMessage[] = [openingUser, openingNote];
    for (let i = 0; i < 10; i += 1) {
      messages.push(assistantWithToolCall(`c${i}`, 'op'));
      messages.push(toolResult(`c${i}`, `r ${bulk}`));
    }
    messages.push(assistantText('final summary line'));
    const out = await transform(messages);
    expect(out.find((m) => m.role === 'user')).toBe(openingUser);
    const textOnlyAssistants = out.filter(
      (m) =>
        m.role === 'assistant' &&
        (m as { content: Array<{ type: string }> }).content.every((c) => c.type === 'text'),
    );
    expect(textOnlyAssistants.length).toBeGreaterThanOrEqual(2);
  });

  it('tightens to the aggressive window when HARD_CAP_BYTES is exceeded', async () => {
    const transform = buildTransformContext();
    const messages: AgentMessage[] = [userMsg('go')];
    const hugeArgs = 'p'.repeat(40_000);
    for (let i = 0; i < 10; i += 1) {
      messages.push(assistantWithToolCall(`big-${i}`, hugeArgs));
      messages.push(toolResult(`big-${i}`, 'small-response'));
    }
    const out = await transform(messages);
    // In aggressive mode only the last 3 rounds stay verbatim. Count
    // assistant toolCall blocks with summarized input.
    let summarizedCount = 0;
    for (const m of out) {
      if (m.role !== 'assistant') continue;
      const content = (m as { content: Array<{ type?: string; input?: unknown }> }).content;
      for (const c of content) {
        if (c.type === 'toolCall') {
          const input = c.input as { _summarized?: boolean } | undefined;
          if (input?._summarized === true) summarizedCount += 1;
        }
      }
    }
    expect(summarizedCount).toBeGreaterThanOrEqual(7);
  });
});
