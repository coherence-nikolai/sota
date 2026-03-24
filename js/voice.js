// ─── Voice Layer ──────────────────────────────────────────────────────────────
// Pre-generated audio files, cloned voice, baked into the app.
// Every user hears the same voice — no configuration needed.
//
// File layout:  /sota/assets/audio/sit/{stage}-{index}.mp3
//               /sota/assets/audio/kw/{keyword}.mp3
//               /sota/assets/audio/sit/complete.mp3
//
// Dynamic companion voice (optional): ElevenLabs at runtime,
// only if the user has configured their own EL key in Settings.

const Voice = (() => {

  let currentAudio = null;

  // ── State ────────────────────────────────────────────────────────────────────
  function isEnabled() {
    return Storage.getSetting('voice_enabled', true) !== false;
  }

  function setEnabled(val) {
    Storage.setSetting('voice_enabled', val);
    if (!val) stop();
  }

  // ── Pre-generated file playback ───────────────────────────────────────────────
  // Used for all scheduled sit guidance and keyword triggers.
  // Falls back silently if the file is missing or autoplay is blocked.
  function playFile(src) {
    if (!isEnabled()) return;
    stop();
    const audio = new Audio(src);
    currentAudio = audio;
    audio.play().catch(() => {}); // Graceful on missing file or iOS autoplay block
  }

  // ── Singing bowl (synthesised) ────────────────────────────────────────────────
  // Tibetan bowl partials: fundamental + 2nd and 3rd harmonics with natural decay.
  function playBell() {
    if (!isEnabled()) return;
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const base = 174; // Hz — deep bowl fundamental

      // Partial: [frequency multiplier, peak gain, decay seconds]
      const partials = [
        [1,     0.55, 9],
        [2.756, 0.22, 6],
        [5.51,  0.08, 3.5],
      ];

      partials.forEach(([mult, peak, decay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = base * mult;

        // Quick strike attack, long exponential decay
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + decay);
      });

      setTimeout(() => ctx.close().catch(() => {}), 10000);
    } catch (_) {}
  }

  // ── Playback control ─────────────────────────────────────────────────────────
  function stop() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  function init() {
    // Nothing to initialise for file-based audio
  }

  return { init, playFile, playBell, stop, isEnabled, setEnabled };
})();
