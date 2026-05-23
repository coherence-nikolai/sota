// ─── Multi-Provider AI API Layer ────────────────────────────────────────────

const API = (() => {

  const FAILOVER_STATUSES = new Set([401, 403, 408, 409, 429, 500, 502, 503, 529]);

  function getFeatureSelection(feature, providerOverride = null, modelOverride = null) {
    const saved = Storage.getFeatureAISettings(feature);
    const providerId = providerOverride || saved.provider || 'anthropic';
    const provider = AIProviders.getProvider(providerId);
    const model = modelOverride || saved.model || AIProviders.getDefaultModel(provider.id, feature);
    return { provider, model };
  }

  function getKeyCandidates(provider) {
    const keys = Storage.getApiKeysForRequest?.(provider.id) || [];
    if (!keys.length) {
      const err = new Error(`No ${provider.displayName} API key set. Add one in Settings.`);
      err.code = 'NO_API_KEY';
      throw err;
    }
    return keys.filter(k => k.provider === provider.id);
  }

  function sanitizeError(message, key = '') {
    let clean = String(message || 'API request failed.');
    if (key) clean = clean.split(key).join('[redacted key]');
    return clean
      .replace(/sk-[A-Za-z0-9._-]{8,}/g, '[redacted key]')
      .replace(/key=[A-Za-z0-9._-]{8,}/g, 'key=[redacted]');
  }

  async function getApiError(res, key) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || err?.message || `API error ${res.status}`;
    return sanitizeError(message, key);
  }

  function assertAllowedEndpoint(provider, url) {
    if (!AIProviders.isAllowedEndpoint(provider.id, url)) {
      throw new Error(`${provider.displayName} endpoint blocked by Sota provider policy.`);
    }
  }

  async function postMessages({ provider, model, systemPrompt, messages, maxTokens, stream }) {
    const keys = getKeyCandidates(provider);
    const failures = [];

    for (const keyRecord of keys) {
      if (keyRecord.provider !== provider.id) continue;

      const request = provider.buildRequest({
        apiKey: keyRecord.key,
        model,
        systemPrompt,
        messages,
        maxTokens,
        stream: stream && provider.supportsStreaming,
      });

      assertAllowedEndpoint(provider, request.url);

      const res = await fetch(request.url, request.options);

      if (res.ok) {
        Storage.setActiveApiKey?.(provider.id, keyRecord.id);
        Storage.markApiKeyUsed?.(keyRecord.id);
        return res;
      }

      const message = await getApiError(res, keyRecord.key);
      failures.push(`${keyRecord.label}: ${message}`);

      if (!FAILOVER_STATUSES.has(res.status) || keys.length === 1) {
        throw new Error(message);
      }
    }

    throw new Error(`All ${provider.displayName} API keys failed. ${failures.join(' | ')}`);
  }

  async function call({ feature = 'companion', provider: providerOverride, model, systemPrompt, messages, maxTokens = 1024 }) {
    const selected = getFeatureSelection(feature, providerOverride, model);
    const res = await postMessages({
      provider: selected.provider,
      model: selected.model,
      systemPrompt,
      messages,
      maxTokens,
      stream: false,
    });
    const data = await res.json();
    return selected.provider.parseResponse(data);
  }

  async function stream({ feature = 'companion', provider: providerOverride, model, systemPrompt, messages, maxTokens = 1024, onChunk, onDone }) {
    const selected = getFeatureSelection(feature, providerOverride, model);

    if (!selected.provider.supportsStreaming) {
      const text = await call({
        feature,
        provider: selected.provider.id,
        model: selected.model,
        systemPrompt,
        messages,
        maxTokens,
      });
      if (onChunk) onChunk(text, text);
      if (onDone) onDone(text);
      return text;
    }

    const res = await postMessages({
      provider: selected.provider,
      model: selected.model,
      systemPrompt,
      messages,
      maxTokens,
      stream: true,
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const evt = JSON.parse(raw);
          const chunk = selected.provider.parseStreamEvent(evt);
          if (chunk) {
            fullText += chunk;
            if (onChunk) onChunk(chunk, fullText);
          }
        } catch (_) {}
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  }

  async function invokeAgent(agentKey, conversationHistory, options = {}) {
    const agent = AGENTS[agentKey];
    if (!agent) throw new Error(`Unknown agent: ${agentKey}`);

    const feature = options.feature || (agentKey === 'retreat' ? 'retreat' : 'companion');
    const selected = getFeatureSelection(feature, options.provider, options.model);
    const model = options.model || (selected.provider.id === 'anthropic' ? agent.model : null) || selected.model;

    return stream({
      feature,
      provider: selected.provider.id,
      model,
      systemPrompt: agent.systemPrompt,
      messages: conversationHistory,
      maxTokens: options.maxTokens || 1500,
      onChunk: options.onChunk,
      onDone: options.onDone,
    });
  }

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
      feature: 'sitGuidance',
      systemPrompt,
      messages: [{ role: 'user', content: `Generate guidance for: ${situation}` }],
      maxTokens: 300,
    });
  }

  return { call, stream, invokeAgent, getGuidance };
})();
