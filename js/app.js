// ─── App Router & Initialisation ─────────────────────────────────────────────

(function () {
  'use strict';

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function populateProviderSelect(select, selected = 'anthropic') {
    if (!select) return;
    select.innerHTML = AIProviders.list().map(provider => `
      <option value="${provider.id}" ${provider.id === selected ? 'selected' : ''}>${provider.displayName}</option>
    `).join('');
  }

  function populateModelSelect(select, providerId, feature, selected = '') {
    if (!select) return;
    const provider = AIProviders.getProvider(providerId);
    const value = selected || AIProviders.getDefaultModel(provider.id, feature);
    select.innerHTML = provider.models.map(model => `
      <option value="${model.id}" ${model.id === value ? 'selected' : ''}>${model.label}</option>
    `).join('');
  }

  let appInitialized = false;

  function hideEntryScreens() {
    ['screen-entry', 'screen-setup'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active');
      el.style.display = 'none';
    });
  }

  function openApp() {
    hideEntryScreens();
    document.getElementById('app').classList.remove('hidden');
    if (!appInitialized) {
      initApp();
      appInitialized = true;
    }
  }

  function openSetup() {
    const entry = document.getElementById('screen-entry');
    const setup = document.getElementById('screen-setup');
    if (entry) {
      entry.classList.remove('active');
      entry.style.display = 'none';
    }
    setup.style.display = '';
    setup.classList.add('active');
    initSetup();
  }

  // ── Entry screen ──────────────────────────────────────────────────────────
  function initEntry() {
    const enterBtn = document.getElementById('entry-enter');
    const privacyToggle = document.getElementById('entry-privacy-toggle');
    const privacyPanel = document.getElementById('entry-privacy-panel');

    enterBtn?.addEventListener('click', () => {
      if (Storage.hasApiKey()) openApp();
      else openSetup();
    });

    privacyToggle?.addEventListener('click', () => {
      const expanded = privacyToggle.getAttribute('aria-expanded') === 'true';
      privacyToggle.setAttribute('aria-expanded', String(!expanded));
      privacyPanel.hidden = expanded;
    });
  }

  // ── Setup screen ───────────────────────────────────────────────────────────
  function initSetup() {
    const screen    = document.getElementById('screen-setup');
    const providerInput = document.getElementById('api-provider-input');
    const input     = document.getElementById('api-key-input');
    const saveBtn   = document.getElementById('api-key-save');
    const skipLink  = document.getElementById('skip-setup');

    populateProviderSelect(providerInput, 'anthropic');

    function updatePlaceholder() {
      const provider = AIProviders.getProvider(providerInput.value);
      input.placeholder = provider.keyHint || 'API key';
    }

    providerInput.addEventListener('change', updatePlaceholder);
    updatePlaceholder();

    function launch() {
      openApp();
    }

    saveBtn.addEventListener('click', () => {
      const key = input.value.trim();
      const providerId = providerInput.value;
      const validation = AIProviders.validateKey(providerId, key);
      if (validation.ok) {
        Storage.addApiKey(providerId, key, 'Primary');
        // Show onboarding question if not already answered
        if (!Storage.getSetting('onboarding_level')) {
          document.getElementById('onboarding-block').style.display = '';
          saveBtn.style.display = 'none';
        } else {
          launch();
        }
      } else if (key) {
        input.style.borderColor = 'var(--danger)';
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
      }
    });

    document.querySelectorAll('.onboard-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.setSetting('onboarding_level', btn.dataset.level);
        launch();
      });
    });

    skipLink.addEventListener('click', e => {
      e.preventDefault();
      launch();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveBtn.click();
    });
  }

  // ── Mode router ────────────────────────────────────────────────────────────
  const MODES = ['sit-setup', 'compass', 'tracker', 'retreat', 'noting', 'companion'];
  let activeMode = 'sit-setup';

  function showMode(mode) {
    MODES.forEach(m => {
      document.getElementById('mode-' + m)?.classList.add('hidden');
    });
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    const el = document.getElementById('mode-' + mode);
    if (el) el.classList.remove('hidden');

    activeMode = mode;

    if (mode === 'tracker') Tracker.refresh();
    if (mode === 'noting')  Noting.reset();
    if (mode === 'retreat') Retreat.refresh();
  }

  function initNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => showMode(btn.dataset.mode));
    });
  }

  // ── Stage Compass ──────────────────────────────────────────────────────────
  function initCompass() {
    const mapEl    = document.getElementById('compass-map');
    const detailEl = document.getElementById('compass-detail');
    const detailContent = document.getElementById('compass-detail-content');

    COMPASS.renderMap(mapEl, nana => {
      mapEl.classList.add('hidden');
      COMPASS.renderDetail(detailContent, nana);
      detailEl.classList.remove('hidden');
    });

    detailEl.querySelector('.compass-back').addEventListener('click', () => {
      detailEl.classList.add('hidden');
      mapEl.classList.remove('hidden');
    });

    // Tab switching: Map | Resolve
    document.querySelectorAll('.compass-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.compass-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const name = tab.dataset.tab;
        document.getElementById('compass-tab-map').classList.toggle('hidden', name !== 'map');
        document.getElementById('compass-tab-resolve').classList.toggle('hidden', name !== 'resolve');
        if (name === 'resolve') renderResolution();
      });
    });

    // Resolution save
    document.getElementById('resolve-save')?.addEventListener('click', () => {
      const text = document.getElementById('resolve-text').value.trim();
      if (!text) return;
      Storage.setResolution({ text, date: new Date().toISOString() });
      renderResolution();
      const btn = document.getElementById('resolve-save');
      btn.textContent = 'Saved.';
      setTimeout(() => { btn.textContent = 'Save & Renew'; }, 2000);
    });
  }

  function renderResolution() {
    const r       = Storage.getResolution();
    const textEl  = document.getElementById('resolve-text');
    const dateEl  = document.getElementById('resolve-date');
    if (r) {
      textEl.value = r.text;
      const d = new Date(r.date);
      dateEl.textContent = 'Last renewed ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      dateEl.textContent = '';
    }
  }

  // ── Settings panel ─────────────────────────────────────────────────────────
  function initSettings() {
    const panel    = document.getElementById('settings-panel');
    const toggle   = document.getElementById('settings-toggle');
    const closeBtn = document.getElementById('settings-close');
    const keyProvider = document.getElementById('settings-key-provider');
    const keyLabel = document.getElementById('settings-key-label');
    const keyInput = document.getElementById('settings-key-value');
    const keySave  = document.getElementById('settings-key-save');
    const keyList  = document.getElementById('settings-key-list');
    const keyStatus = document.getElementById('settings-key-status');
    const featureList = document.getElementById('settings-ai-features');
    const deleteKeysBtn = document.getElementById('settings-delete-keys');
    const deletePracticeBtn = document.getElementById('settings-delete-practice');

    populateProviderSelect(keyProvider, 'anthropic');

    function setApiKeyStatus(message, tone = '') {
      if (!keyStatus) return;
      keyStatus.textContent = message;
      keyStatus.className = tone ? `settings-status ${tone}` : 'settings-status';
    }

    function resetApiKeyForm() {
      keyLabel.value = '';
      keyInput.value = '';
      updateKeyPlaceholder();
    }

    function updateKeyPlaceholder() {
      const provider = AIProviders.getProvider(keyProvider.value);
      keyInput.placeholder = provider.keyHint || 'API key';
    }

    function renderApiKeys() {
      const keys = Storage.getApiKeySummaries();

      if (!keys.length) {
        keyList.innerHTML = '<div class="api-key-empty">No AI keys saved. Offline guidance still works.</div>';
        return;
      }

      keyList.innerHTML = keys.map(k => `
        <div class="api-key-card ${k.active ? 'active' : ''}">
          <div class="api-key-main">
            <div class="api-key-provider">${escHtml(k.providerName)}</div>
            <div class="api-key-name">
              ${escHtml(k.label)}
              ${k.active ? '<span class="api-key-active">active</span>' : ''}
            </div>
            <div class="api-key-mask">${escHtml(k.masked)}</div>
          </div>
          <div class="api-key-actions">
            ${k.active ? '' : `<button class="btn-ghost-sm" data-action="activate" data-id="${escHtml(k.id)}">use</button>`}
            <button class="btn-ghost-sm" data-action="remove" data-id="${escHtml(k.id)}">remove</button>
          </div>
        </div>
      `).join('');

      keyList.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === 'activate') {
            const active = Storage.setActiveApiKey(id);
            renderApiKeys();
            setApiKeyStatus(active ? `${active.label} is now active for ${AIProviders.getProvider(active.provider).displayName}.` : '', 'is-ok');
          }
          if (action === 'remove') {
            if (!window.confirm('Remove this API key from this device?')) return;
            Storage.deleteApiKey(id);
            renderApiKeys();
            setApiKeyStatus('Key removed from this device.', 'is-ok');
          }
        });
      });
    }

    function renderFeatureDefaults() {
      featureList.innerHTML = AIProviders.FEATURES.map(feature => {
        const settings = Storage.getFeatureAISettings(feature.id);
        return `
          <div class="ai-feature-row" data-feature="${feature.id}">
            <div class="ai-feature-title">${feature.label}</div>
            <div class="ai-feature-controls">
              <select class="ai-feature-provider" aria-label="${feature.label} provider"></select>
              <select class="ai-feature-model" aria-label="${feature.label} model"></select>
            </div>
          </div>
        `;
      }).join('');

      featureList.querySelectorAll('.ai-feature-row').forEach(row => {
        const feature = row.dataset.feature;
        const providerSelect = row.querySelector('.ai-feature-provider');
        const modelSelect = row.querySelector('.ai-feature-model');
        const settings = Storage.getFeatureAISettings(feature);

        populateProviderSelect(providerSelect, settings.provider);
        populateModelSelect(modelSelect, settings.provider, feature, settings.model);

        providerSelect.addEventListener('change', () => {
          populateModelSelect(modelSelect, providerSelect.value, feature);
          Storage.setFeatureAISettings(feature, {
            provider: providerSelect.value,
            model: modelSelect.value,
          });
        });

        modelSelect.addEventListener('change', () => {
          Storage.setFeatureAISettings(feature, {
            provider: providerSelect.value,
            model: modelSelect.value,
          });
        });
      });
    }

    function openPanel() {
      resetApiKeyForm();
      setApiKeyStatus('');
      renderApiKeys();
      renderFeatureDefaults();
      panel.classList.remove('hidden');
      updateNotifBtn();
    }

    keyProvider.addEventListener('change', updateKeyPlaceholder);
    toggle.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    keySave.addEventListener('click', () => {
      const val = keyInput.value.trim();
      const providerId = keyProvider.value;
      const provider = AIProviders.getProvider(providerId);
      const label = keyLabel.value.trim() || `${provider.displayName} key ${Storage.getApiKeySummaries(providerId).length + 1}`;
      if (!val) return;
      const validation = AIProviders.validateKey(providerId, val);
      if (!validation.ok) {
        keyInput.style.borderColor = 'var(--danger)';
        setTimeout(() => { keyInput.style.borderColor = ''; }, 2000);
        setApiKeyStatus(validation.message, 'is-error');
        return;
      }
      Storage.addApiKey(providerId, val, label);
      resetApiKeyForm();
      renderApiKeys();
      renderFeatureDefaults();
      setApiKeyStatus(`${label} saved and set active.`, 'is-ok');
    });

    deleteKeysBtn?.addEventListener('click', () => {
      if (!window.confirm('Delete all AI provider keys from this device?')) return;
      Storage.deleteAllApiKeys();
      renderApiKeys();
      setApiKeyStatus('All AI keys deleted from this device.', 'is-ok');
    });

    deletePracticeBtn?.addEventListener('click', () => {
      if (!window.confirm('Delete all practice log, retreat, and resolution data from this device?')) return;
      Storage.clearPracticeData();
      Tracker.refresh?.();
      Retreat.refresh?.();
      setApiKeyStatus('Practice data deleted from this device.', 'is-ok');
    });

    // Notification toggle
    const notifBtn = document.getElementById('settings-notif-toggle');
    function updateNotifBtn() {
      if (!notifBtn) return;
      const enabled = Storage.getSetting('notifications_enabled');
      const perm    = 'Notification' in window ? Notification.permission : 'denied';
      if (perm === 'denied') {
        notifBtn.textContent = 'Notifications blocked by browser';
        notifBtn.disabled = true;
      } else if (enabled && perm === 'granted') {
        notifBtn.textContent = 'Reminder: on — tap to disable';
      } else {
        notifBtn.textContent = 'Enable Daily Reminder';
        notifBtn.disabled = false;
      }
    }
    notifBtn?.addEventListener('click', () => {
      const enabled = Storage.getSetting('notifications_enabled');
      if (enabled) {
        Storage.setSetting('notifications_enabled', false);
        updateNotifBtn();
        return;
      }
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          Storage.setSetting('notifications_enabled', true);
        }
        updateNotifBtn();
      });
    });
  }

  // ── Notification reminder ───────────────────────────────────────────────────
  function checkNotificationReminder() {
    if (!Storage.getSetting('notifications_enabled')) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const log = Storage.getLog();
    if (!log.length) return;
    const hoursSince = (Date.now() - new Date(log[0].timestamp).getTime()) / 36e5;
    if (hoursSince >= 18) {
      new Notification('Sota', {
        body: 'Your practice is waiting.',
        icon: '/sota/assets/icons/icon-192.png',
        silent: true,
      });
    }
  }

  // ── Main init ──────────────────────────────────────────────────────────────
  function initApp() {
    initNav();
    initCompass();
    Sit.init();
    Kasina.init();
    Tracker.init();
    Companion.init();
    Retreat.init();
    Voice.init();
    initSettings();
    showMode('sit-setup');
    checkNotificationReminder();
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);

    // Friend Sit: join a synchronised sit via URL link
    if (params.get('friend')) {
      openApp();
      Sit.joinFriend(params);
      return;
    }

    initEntry();
  });

  // ── Service worker registration ────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sota/sw.js')
        .catch(() => {}); // Fail silently in dev
    });
  }

})();
