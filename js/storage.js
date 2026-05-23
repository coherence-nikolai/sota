// ─── Storage Layer ────────────────────────────────────────────────────────────
// All data stays on device. localStorage for settings + recent data.
// Practice log uses a simple append-only array in localStorage.

const Storage = (() => {

  const KEYS = {
    apiKey:      'sota_api_key',
    apiKeys:     'sota_api_keys',
    activeApiKey:'sota_active_api_key_id',
    activeApiKeys:'sota_active_api_key_ids',
    practiceLog: 'sota_practice_log',
    settings:    'sota_settings',
  };

  // ── Provider API Keys ─────────────────────────────────────────────────────
  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'key_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function getLegacyApiKey() {
    return localStorage.getItem(KEYS.apiKey) || '';
  }

  function providerExists(provider) {
    return AIProviders.list().some(p => p.id === provider);
  }

  function normalizeApiKeyRecord(record, index = 0) {
    if (!record) return null;
    const key = typeof record === 'string' ? record : record.key;
    if (!key || !key.trim()) return null;
    const provider = providerExists(record.provider) ? record.provider : 'anthropic';

    return {
      id:        record.id || makeId(),
      provider,
      label:     (record.label || (index === 0 ? 'Primary' : `Key ${index + 1}`)).trim(),
      key:       key.trim(),
      createdAt: record.createdAt || new Date().toISOString(),
      lastUsedAt: record.lastUsedAt || null,
    };
  }

  function readApiKeys() {
    return Vault.read().map(normalizeApiKeyRecord).filter(Boolean);
  }

  function readActiveMap() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.activeApiKeys) || '{}');
      if (saved && typeof saved === 'object') return saved;
    } catch (_) {}

    const legacyActive = localStorage.getItem(KEYS.activeApiKey);
    return legacyActive ? { anthropic: legacyActive } : {};
  }

  function writeActiveMap(activeMap) {
    if (!Object.keys(activeMap).length) {
      localStorage.removeItem(KEYS.activeApiKeys);
      localStorage.removeItem(KEYS.activeApiKey);
      return;
    }
    localStorage.setItem(KEYS.activeApiKeys, JSON.stringify(activeMap));
    if (activeMap.anthropic) localStorage.setItem(KEYS.activeApiKey, activeMap.anthropic);
    else localStorage.removeItem(KEYS.activeApiKey);
  }

  function writeApiKeys(keys) {
    if (!keys.length) {
      Vault.clear();
      writeActiveMap({});
      localStorage.removeItem(KEYS.apiKey);
      return;
    }

    Vault.write(keys);
    const activeMap = readActiveMap();

    AIProviders.list().forEach(provider => {
      const hasActive = keys.some(k => k.provider === provider.id && k.id === activeMap[provider.id]);
      if (!hasActive) {
        const first = keys.find(k => k.provider === provider.id);
        if (first) activeMap[provider.id] = first.id;
        else delete activeMap[provider.id];
      }
    });

    writeActiveMap(activeMap);
    const activeAnthropic = getActiveApiKeyFrom(keys, 'anthropic');
    if (activeAnthropic) localStorage.setItem(KEYS.apiKey, activeAnthropic.key);
    else localStorage.removeItem(KEYS.apiKey);
  }

  function getActiveApiKeyFrom(keys, provider = 'anthropic') {
    const activeId = readActiveMap()[provider];
    return keys.find(k => k.provider === provider && k.id === activeId) ||
      keys.find(k => k.provider === provider) ||
      null;
  }

  function getApiKeys(provider = null) {
    const keys = readApiKeys();
    const legacy = getLegacyApiKey();
    let changed = Vault.read().some(record => record && !record.provider);

    if (legacy && !keys.some(k => k.provider === 'anthropic' && k.key === legacy)) {
      keys.unshift(normalizeApiKeyRecord({
        id: 'legacy-anthropic-key',
        provider: 'anthropic',
        label: 'Primary',
        key: legacy,
      }));
      changed = true;
    }

    if (changed) writeApiKeys(keys);
    return provider ? keys.filter(k => k.provider === provider) : keys;
  }

  function getActiveApiKey(provider = 'anthropic') {
    return getActiveApiKeyFrom(getApiKeys(), provider);
  }

  function getApiKey(provider = 'anthropic') {
    return getActiveApiKey(provider)?.key || '';
  }

  function addApiKey(providerOrKey, keyOrLabel = '', labelMaybe = '') {
    const hasProvider = providerExists(providerOrKey);
    const provider = hasProvider ? providerOrKey : 'anthropic';
    const key = hasProvider ? keyOrLabel : providerOrKey;
    const label = hasProvider ? labelMaybe : keyOrLabel;
    const clean = key ? key.trim() : '';
    if (!clean) return null;

    const keys = getApiKeys();
    const sameProviderKeys = keys.filter(k => k.provider === provider);
    const existingIndex = keys.findIndex(k => k.provider === provider && k.key === clean);
    const record = normalizeApiKeyRecord({
      ...(existingIndex >= 0 ? keys[existingIndex] : {}),
      provider,
      key: clean,
      label: label || (existingIndex >= 0 ? keys[existingIndex].label : `Key ${sameProviderKeys.length + 1}`),
    }, sameProviderKeys.length);

    if (existingIndex >= 0) keys[existingIndex] = record;
    else keys.push(record);

    const activeMap = readActiveMap();
    activeMap[provider] = record.id;
    writeActiveMap(activeMap);
    writeApiKeys(keys);
    return record;
  }

  function setApiKey(key) {
    if (key) addApiKey('anthropic', key, getActiveApiKey('anthropic')?.label || 'Primary');
    else deleteAllApiKeys();
  }

  function setActiveApiKey(providerOrId, maybeId = null) {
    const provider = maybeId ? providerOrId : null;
    const id = maybeId || providerOrId;
    const keys = getApiKeys();
    const active = keys.find(k => k.id === id && (!provider || k.provider === provider));
    if (!active) return null;

    const activeMap = readActiveMap();
    activeMap[active.provider] = active.id;
    writeActiveMap(activeMap);
    if (active.provider === 'anthropic') localStorage.setItem(KEYS.apiKey, active.key);
    return active;
  }

  function deleteApiKey(id) {
    const keys = getApiKeys().filter(k => k.id !== id);
    writeApiKeys(keys);
    return keys;
  }

  function deleteAllApiKeys() {
    writeApiKeys([]);
  }

  function hasApiKey(provider = null) {
    return provider ? getApiKeys(provider).length > 0 : getApiKeys().length > 0;
  }

  function markApiKeyUsed(id) {
    const keys = getApiKeys();
    const idx = keys.findIndex(k => k.id === id);
    if (idx === -1) return;
    keys[idx].lastUsedAt = new Date().toISOString();
    writeApiKeys(keys);
  }

  function getApiKeysForRequest(provider = 'anthropic') {
    const keys = getApiKeys(provider);
    const active = getActiveApiKeyFrom(keys, provider);
    if (!active) return [];
    return [active, ...keys.filter(k => k.id !== active.id)];
  }

  function maskApiKey(key) {
    if (!key) return '';
    if (key.length <= 12) return '••••';
    return key.slice(0, 7) + '…' + key.slice(-4);
  }

  function getApiKeySummaries(provider = null) {
    return getApiKeys(provider).map(k => {
      const active = getActiveApiKey(k.provider);
      return {
        id: k.id,
        provider: k.provider,
        providerName: AIProviders.getProvider(k.provider).displayName,
        label: k.label,
        masked: maskApiKey(k.key),
        active: !!active && active.id === k.id,
        lastUsedAt: k.lastUsedAt,
      };
    });
  }

  function getFeatureAISettings(feature) {
    const settings = getSettings();
    const featureSettings = settings.ai_features?.[feature] || {};
    const provider = providerExists(featureSettings.provider)
      ? featureSettings.provider
      : (getApiKeys()[0]?.provider || 'anthropic');

    return {
      provider,
      model: featureSettings.model || AIProviders.getDefaultModel(provider, feature),
    };
  }

  function setFeatureAISettings(feature, value) {
    const settings = getSettings();
    settings.ai_features = settings.ai_features || {};
    const provider = providerExists(value.provider) ? value.provider : 'anthropic';
    settings.ai_features[feature] = {
      provider,
      model: value.model || AIProviders.getDefaultModel(provider, feature),
    };
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  // ── Practice Log ──────────────────────────────────────────────────────────
  function getLog() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.practiceLog) || '[]');
    } catch (_) { return []; }
  }

  function addEntry(entry) {
    const log = getLog();
    log.unshift({
      id:        Date.now(),
      timestamp: new Date().toISOString(),
      ...entry,
    });
    localStorage.setItem(KEYS.practiceLog, JSON.stringify(log));
    return log;
  }

  function deleteEntry(id) {
    const log = getLog().filter(e => e.id !== id);
    localStorage.setItem(KEYS.practiceLog, JSON.stringify(log));
  }

  function clearPracticeData() {
    localStorage.removeItem(KEYS.practiceLog);
    localStorage.removeItem('sota_resolution');
    localStorage.removeItem('sota_retreat');
  }

  // ── Momentum Score ─────────────────────────────────────────────────────────
  // Rolling 7-day practice continuity score (0–100)
  function getMomentumScore() {
    const log = getLog();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Unique practice days in last 7 days
    const recentDays = new Set();
    log.forEach(e => {
      const age = now - new Date(e.timestamp).getTime();
      if (age < sevenDays) {
        recentDays.add(new Date(e.timestamp).toDateString());
      }
    });

    // Unique practice days in last 30 days
    const monthDays = new Set();
    log.forEach(e => {
      const age = now - new Date(e.timestamp).getTime();
      if (age < thirtyDays) {
        monthDays.add(new Date(e.timestamp).toDateString());
      }
    });

    const score7  = Math.round((recentDays.size / 7) * 100);
    const score30 = Math.round((monthDays.size / 30) * 100);

    return {
      score7,
      score30,
      days7:  recentDays.size,
      days30: monthDays.size,
      total:  log.length,
    };
  }

  // ── Practice History Summary ───────────────────────────────────────────────
  // Used by AI Companion agents for personalisation context
  function getSummaryForAgent(maxEntries = 10) {
    const log = getLog().slice(0, maxEntries);
    if (!log.length) return 'No practice history yet.';

    const momentum = getMomentumScore();
    const lines = [
      `Practice history (${log.length} total sessions logged):`,
      `7-day momentum: ${momentum.score7}% (${momentum.days7}/7 days)`,
      `30-day momentum: ${momentum.score30}% (${momentum.days30}/30 days)`,
      '',
      'Recent sessions:',
      ...log.map(e => {
        const d = new Date(e.timestamp);
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const stage = e.stage === 'dark-night' ? 'dukkha ñāṇas' : e.stage;
        return `- ${dateStr}: ${e.duration}min, stage: ${stage}${e.notes ? ', notes: ' + e.notes.slice(0, 80) : ''}`;
      }),
    ];

    return lines.join('\n');
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
    } catch (_) { return {}; }
  }

  function setSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  function getSetting(key, fallback = null) {
    return getSettings()[key] ?? fallback;
  }

  // ── Streak ─────────────────────────────────────────────────────────────────
  function getStreak() {
    const log = getLog();
    if (!log.length) return { current: 0, longest: 0, lastSitDaysAgo: null };

    // Build set of unique practice dates (YYYY-MM-DD)
    const dateSets = new Set(
      log.map(e => new Date(e.timestamp).toISOString().slice(0, 10))
    );
    const dates = Array.from(dateSets).sort().reverse(); // newest first

    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

    // Current streak — must include today or yesterday to be live
    let current = 0;
    if (dates[0] === today || dates[0] === yesterday) {
      let check = new Date(dates[0]);
      for (const d of dates) {
        const expected = check.toISOString().slice(0, 10);
        if (d === expected) {
          current++;
          check = new Date(check.getTime() - 864e5);
        } else break;
      }
    }

    // Longest streak
    let longest = 0, run = 1;
    const asc = [...dates].reverse();
    for (let i = 1; i < asc.length; i++) {
      const prev = new Date(asc[i - 1]).getTime();
      const curr = new Date(asc[i]).getTime();
      if (curr - prev === 864e5) { run++; }
      else { longest = Math.max(longest, run); run = 1; }
    }
    longest = Math.max(longest, run);

    const lastMs = new Date(dates[0]).getTime();
    const lastSitDaysAgo = Math.floor((Date.now() - lastMs) / 864e5);

    return { current, longest, lastSitDaysAgo };
  }

  // ── Resolution ─────────────────────────────────────────────────────────────
  function getResolution() {
    try { return JSON.parse(localStorage.getItem('sota_resolution') || 'null'); } catch(_) { return null; }
  }
  function setResolution(data) { localStorage.setItem('sota_resolution', JSON.stringify(data)); }

  // ── Retreat ────────────────────────────────────────────────────────────────
  function getRetreat()         { try { return JSON.parse(localStorage.getItem('sota_retreat') || 'null'); } catch(_) { return null; } }
  function setRetreat(data)     { localStorage.setItem('sota_retreat', JSON.stringify(data)); }
  function clearRetreat()       { localStorage.removeItem('sota_retreat'); }

  // ── ElevenLabs / Voice ─────────────────────────────────────────────────────
  function getElKey()     { return getSetting('el_key') || ''; }
  function setElKey(k)    { setSetting('el_key', k ? k.trim() : null); }
  function hasElKey()     { return !!getElKey(); }
  function getVoiceId()   { return getSetting('voice_id') || ''; }
  function setVoiceId(id) { setSetting('voice_id', id ? id.trim() : null); }

  return {
    getApiKey, setApiKey, hasApiKey,
    getApiKeys, getActiveApiKey, addApiKey, deleteApiKey, deleteAllApiKeys, setActiveApiKey,
    getApiKeysForRequest, markApiKeyUsed, getApiKeySummaries,
    getFeatureAISettings, setFeatureAISettings,
    getLog, addEntry, deleteEntry, clearPracticeData,
    getMomentumScore, getSummaryForAgent,
    getStreak,
    getResolution, setResolution,
    getRetreat, setRetreat, clearRetreat,
    getSettings, setSetting, getSetting,
    getElKey, setElKey, hasElKey, getVoiceId, setVoiceId,
  };
})();
