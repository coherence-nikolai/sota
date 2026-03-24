// ─── Storage Layer ────────────────────────────────────────────────────────────
// All data stays on device. localStorage for settings + recent data.
// Practice log uses a simple append-only array in localStorage.

const Storage = (() => {

  const KEYS = {
    apiKey:      'sota_api_key',
    practiceLog: 'sota_practice_log',
    settings:    'sota_settings',
  };

  // ── API Key ────────────────────────────────────────────────────────────────
  function getApiKey() {
    return localStorage.getItem(KEYS.apiKey) || '';
  }

  function setApiKey(key) {
    if (key) {
      localStorage.setItem(KEYS.apiKey, key.trim());
    } else {
      localStorage.removeItem(KEYS.apiKey);
    }
  }

  function hasApiKey() {
    return !!getApiKey();
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
        return `- ${dateStr}: ${e.duration}min, stage: ${e.stage}${e.notes ? ', notes: ' + e.notes.slice(0, 80) : ''}`;
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
    getLog, addEntry, deleteEntry,
    getMomentumScore, getSummaryForAgent,
    getStreak,
    getRetreat, setRetreat, clearRetreat,
    getSettings, setSetting, getSetting,
    getElKey, setElKey, hasElKey, getVoiceId, setVoiceId,
  };
})();
