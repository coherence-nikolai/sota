// ─── App Router & Initialisation ─────────────────────────────────────────────

(function () {
  'use strict';

  // ── Setup screen ───────────────────────────────────────────────────────────
  function initSetup() {
    const screen    = document.getElementById('screen-setup');
    const input     = document.getElementById('api-key-input');
    const saveBtn   = document.getElementById('api-key-save');
    const skipLink  = document.getElementById('skip-setup');

    function launch() {
      screen.classList.remove('active');
      screen.style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      initApp();
    }

    saveBtn.addEventListener('click', () => {
      const key = input.value.trim();
      if (key && key.startsWith('sk-ant-')) {
        Storage.setApiKey(key);
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
  const MODES = ['sit-setup', 'compass', 'tracker', 'noting', 'companion'];
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
    if (mode === 'noting') Noting.reset();
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
  }

  // ── Settings panel ─────────────────────────────────────────────────────────
  function initSettings() {
    const panel      = document.getElementById('settings-panel');
    const toggle     = document.getElementById('settings-toggle');
    const closeBtn   = document.getElementById('settings-close');
    const antInput   = document.getElementById('settings-ant-key');
    const antSave    = document.getElementById('settings-ant-save');

    function openPanel() {
      antInput.value = '';
      antInput.placeholder = Storage.hasApiKey() ? 'Already set — paste to replace' : 'sk-ant-…';
      elInput.value = '';
      elInput.placeholder = Storage.hasElKey() ? 'Already set — paste to replace' : 'Your ElevenLabs key…';
      vidInput.value = Storage.getVoiceId();
      panel.classList.remove('hidden');
    }

    toggle.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    antSave.addEventListener('click', () => {
      const val = antInput.value.trim();
      if (!val) return;
      if (!val.startsWith('sk-ant-')) {
        antInput.style.borderColor = 'var(--danger)';
        setTimeout(() => { antInput.style.borderColor = ''; }, 2000);
        return;
      }
      Storage.setApiKey(val);
      antInput.value = '';
      antInput.placeholder = 'Saved.';
      setTimeout(() => { antInput.placeholder = 'Already set — paste to replace'; }, 2000);
    });

  }

  // ── Main init ──────────────────────────────────────────────────────────────
  function initApp() {
    initNav();
    initCompass();
    Sit.init();
    Kasina.init();
    Tracker.init();
    Companion.init();
    Voice.init();
    initSettings();
    showMode('sit-setup');
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);

    // Friend Sit: join a synchronised sit via URL link
    if (params.get('friend')) {
      document.getElementById('screen-setup').classList.remove('active');
      document.getElementById('screen-setup').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      initApp();
      Sit.joinFriend(params);
      return;
    }

    // If API key already set, skip setup
    if (Storage.hasApiKey()) {
      document.getElementById('screen-setup').classList.remove('active');
      document.getElementById('screen-setup').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      initApp();
    } else {
      initSetup();
    }
  });

  // ── Service worker registration ────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sota/sw.js')
        .catch(() => {}); // Fail silently in dev
    });
  }

})();
