// ─── AI Provider Registry ───────────────────────────────────────────────────
// Provider-specific request builders keep keys scoped to their own endpoints.

const AIProviders = (() => {
  const FEATURES = [
    { id: 'companion', label: 'AI Companion' },
    { id: 'insights', label: 'Practice Insights' },
    { id: 'sitGuidance', label: 'Sit Guidance' },
    { id: 'retreat', label: 'Retreat Guide' },
  ];

  function textPart(value) {
    return typeof value === 'string' ? value : JSON.stringify(value || '');
  }

  function toChatMessages(systemPrompt, messages) {
    const chat = (messages || []).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: textPart(m.content),
    }));
    return systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...chat]
      : chat;
  }

  function toGeminiContents(messages) {
    return (messages || []).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: textPart(m.content) }],
    }));
  }

  function buildChatRequest(endpoint, apiKey, model, systemPrompt, messages, maxTokens, stream, extraHeaders = {}) {
    return {
      url: endpoint,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: toChatMessages(systemPrompt, messages),
          max_tokens: maxTokens,
          stream,
        }),
      },
    };
  }

  function parseChatResponse(data) {
    return data?.choices?.[0]?.message?.content || '';
  }

  function parseChatStream(evt) {
    return evt?.choices?.[0]?.delta?.content || '';
  }

  const providers = {
    anthropic: {
      id: 'anthropic',
      displayName: 'Anthropic',
      keyHint: 'sk-ant-...',
      keyPattern: /^sk-ant-/,
      allowedHosts: ['api.anthropic.com'],
      supportsStreaming: true,
      models: [
        { id: 'claude-sonnet-4-6', label: 'Claude Sonnet' },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku' },
      ],
      defaults: {
        companion: 'claude-sonnet-4-6',
        insights: 'claude-sonnet-4-6',
        sitGuidance: 'claude-haiku-4-5-20251001',
        retreat: 'claude-sonnet-4-6',
      },
      buildRequest({ apiKey, model, systemPrompt, messages, maxTokens, stream }) {
        return {
          url: 'https://api.anthropic.com/v1/messages',
          options: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              system: systemPrompt,
              messages,
              stream,
            }),
          },
        };
      },
      parseResponse(data) {
        return data?.content?.map(block => block.text || '').join('') || '';
      },
      parseStreamEvent(evt) {
        if (evt?.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          return evt.delta.text || '';
        }
        return '';
      },
    },

    openai: {
      id: 'openai',
      displayName: 'OpenAI',
      keyHint: 'sk-...',
      keyPattern: /^sk-/,
      allowedHosts: ['api.openai.com'],
      supportsStreaming: true,
      models: [
        { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
        { id: 'gpt-4o', label: 'GPT-4o' },
      ],
      defaults: {
        companion: 'gpt-4o-mini',
        insights: 'gpt-4o-mini',
        sitGuidance: 'gpt-4o-mini',
        retreat: 'gpt-4o-mini',
      },
      buildRequest({ apiKey, model, systemPrompt, messages, maxTokens, stream }) {
        return buildChatRequest('https://api.openai.com/v1/chat/completions', apiKey, model, systemPrompt, messages, maxTokens, stream);
      },
      parseResponse: parseChatResponse,
      parseStreamEvent: parseChatStream,
    },

    gemini: {
      id: 'gemini',
      displayName: 'Google Gemini',
      keyHint: 'Google AI Studio key',
      keyPattern: null,
      allowedHosts: ['generativelanguage.googleapis.com'],
      supportsStreaming: false,
      models: [
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      ],
      defaults: {
        companion: 'gemini-2.0-flash',
        insights: 'gemini-2.0-flash',
        sitGuidance: 'gemini-2.0-flash',
        retreat: 'gemini-2.0-flash',
      },
      buildRequest({ apiKey, model, systemPrompt, messages, maxTokens }) {
        const body = {
          contents: toGeminiContents(messages),
          generationConfig: { maxOutputTokens: maxTokens },
        };
        if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

        return {
          url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        };
      },
      parseResponse(data) {
        return data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
      },
      parseStreamEvent() { return ''; },
    },

    mistral: {
      id: 'mistral',
      displayName: 'Mistral',
      keyHint: 'Mistral API key',
      keyPattern: null,
      allowedHosts: ['api.mistral.ai'],
      supportsStreaming: true,
      models: [
        { id: 'mistral-small-latest', label: 'Mistral Small' },
        { id: 'mistral-large-latest', label: 'Mistral Large' },
      ],
      defaults: {
        companion: 'mistral-small-latest',
        insights: 'mistral-small-latest',
        sitGuidance: 'mistral-small-latest',
        retreat: 'mistral-small-latest',
      },
      buildRequest({ apiKey, model, systemPrompt, messages, maxTokens, stream }) {
        return buildChatRequest('https://api.mistral.ai/v1/chat/completions', apiKey, model, systemPrompt, messages, maxTokens, stream);
      },
      parseResponse: parseChatResponse,
      parseStreamEvent: parseChatStream,
    },

    openrouter: {
      id: 'openrouter',
      displayName: 'OpenRouter',
      keyHint: 'sk-or-...',
      keyPattern: /^sk-or-/,
      allowedHosts: ['openrouter.ai'],
      supportsStreaming: true,
      models: [
        { id: 'anthropic/claude-sonnet-4', label: 'Claude via OpenRouter' },
        { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini via OpenRouter' },
        { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash via OpenRouter' },
      ],
      defaults: {
        companion: 'anthropic/claude-sonnet-4',
        insights: 'anthropic/claude-sonnet-4',
        sitGuidance: 'openai/gpt-4o-mini',
        retreat: 'anthropic/claude-sonnet-4',
      },
      buildRequest({ apiKey, model, systemPrompt, messages, maxTokens, stream }) {
        return buildChatRequest(
          'https://openrouter.ai/api/v1/chat/completions',
          apiKey,
          model,
          systemPrompt,
          messages,
          maxTokens,
          stream,
          { 'X-Title': 'Sota' }
        );
      },
      parseResponse: parseChatResponse,
      parseStreamEvent: parseChatStream,
    },
  };

  function list() {
    return Object.values(providers);
  }

  function getProvider(id) {
    return providers[id] || providers.anthropic;
  }

  function getDefaultModel(providerId, feature = 'companion') {
    const provider = getProvider(providerId);
    return provider.defaults?.[feature] || provider.models[0]?.id || '';
  }

  function validateKey(providerId, key) {
    const provider = getProvider(providerId);
    const clean = key ? key.trim() : '';
    if (!clean) return { ok: false, message: 'Paste an API key first.' };
    if (provider.keyPattern && !provider.keyPattern.test(clean)) {
      return { ok: false, message: `That does not look like a ${provider.displayName} key.` };
    }
    if (!provider.keyPattern && clean.length < 16) {
      return { ok: false, message: `That ${provider.displayName} key looks too short.` };
    }
    return { ok: true };
  }

  function isAllowedEndpoint(providerId, url) {
    const provider = getProvider(providerId);
    try {
      const host = new URL(url).hostname;
      return provider.allowedHosts.includes(host);
    } catch (_) {
      return false;
    }
  }

  return {
    FEATURES,
    list,
    getProvider,
    getDefaultModel,
    validateKey,
    isAllowedEndpoint,
  };
})();
