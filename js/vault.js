// ─── Local Provider Key Vault ────────────────────────────────────────────────
// Single boundary for AI provider keys. Today this is device-local browser
// storage; native Keychain/secure-storage can replace this module later without
// changing the rest of the app.

const Vault = (() => {
  const KEY = 'sota_api_keys';

  function read() {
    try {
      const records = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(records) ? records : [];
    } catch (_) {
      return [];
    }
  }

  function write(records) {
    if (!records.length) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(records));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { read, write, clear };
})();
