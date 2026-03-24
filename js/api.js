// ─── Claude API Layer ─────────────────────────────────────────────────────────
// claude-haiku  → lightweight real-time guidance (sit mode)
// claude-sonnet → AI Companion dialogue (all agents)

const API = (() => {

  const ENDPOINTS = {
    messages: 'https://api.anthropic.com/v1/messages',
  };

  const MODELS = {
    haiku:  'claude-haiku-4-5-20251001',
    sonnet: 'claude-sonnet-4-6',
  };

  // ── Core call ──────────────────────────────────────────────────────────────
  async function call({ model, systemPrompt, messages, maxTokens = 1024 }) {
    const apiKey = Storage.getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const body = {
      model: model || MODELS.sonnet,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    };

    const res = await fetch(ENDPOINTS.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `API error ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    return data.content[0].text;
  }

  // ── Streaming call (for companion mode) ───────────────────────────────────
  async function stream({ model, systemPrompt, messages, maxTokens = 1024, onChunk, onDone }) {
    const apiKey = Storage.getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const body = {
      model: model || MODELS.sonnet,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      stream: true,
    };

    const res = await fetch(ENDPOINTS.messages, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            const chunk = evt.delta.text;
            fullText += chunk;
            if (onChunk) onChunk(chunk, fullText);
          }
        } catch (_) {}
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  }

  // ── Agent invocation ───────────────────────────────────────────────────────
  async function invokeAgent(agentKey, conversationHistory, options = {}) {
    const agent = AGENTS[agentKey];
    if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

    return stream({
      model: options.model || agent.model || MODELS.sonnet,
      systemPrompt: agent.systemPrompt,
      messages: conversationHistory,
      maxTokens: options.maxTokens || 1500,
      onChunk: options.onChunk,
      onDone: options.onDone,
    });
  }

  // ── Haiku: lightweight real-time guidance ─────────────────────────────────
  async function getGuidance(stage, situation, duration = '30s') {
    const systemPrompt = `You are the voice guidance system for Sota, a meditation app for serious practitioners.

Deliver precise, stage-specific guidance in the Hamilton Project register:
- Second person, present tense, direct address
- No hedging, no over-explaining, no wellness-brand language
- The voice of someone who has been exactly where the listener is
- Short sentences. Built for speaking, not reading.

Stage context: ${stage}
Situation: ${situation}
Target duration when read aloud slowly: ${duration}

Generate a single guidance passage. Just the words to be spoken — no labels, no formatting.
Never name specific teachers, authors, forum communities, or dharma movements.`;

    return call({
      model: MODELS.haiku,
      systemPrompt,
      messages: [{ role: 'user', content: `Generate guidance for: ${situation}` }],
      maxTokens: 300,
    });
  }

  return { call, stream, invokeAgent, getGuidance, MODELS };
})();
