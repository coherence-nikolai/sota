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

  return { init, playFile, stop, isEnabled, setEnabled };
})();
