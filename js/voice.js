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

  // ── Dynamic TTS (companion only) ─────────────────────────────────────────────
  // Only fires if the user has configured their own ElevenLabs key + voice ID.
  // Used for the ▶ listen button on companion messages.
  async function speak(text) {
    if (!isEnabled() || !text?.trim()) return;
    if (!Storage.hasElKey() || !Storage.getVoiceId()) return;

    stop();

    const key     = Storage.getSetting('el_key');
    const voiceId = Storage.getSetting('voice_id');

    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method:  'POST',
        headers: {
          'xi-api-key':   key,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text:     text.trim(),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability:         0.72,
            similarity_boost:  0.85,
            style:             0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!res.ok) return;

      const blob   = await res.blob();
      const url    = URL.createObjectURL(blob);
      const audio  = new Audio(url);
      currentAudio = audio;
      audio.play().catch(() => {});
      audio.onended = () => URL.revokeObjectURL(url);

    } catch (_) {}
  }

  // ── Playback control ─────────────────────────────────────────────────────────
  function stop() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  // True if user has their own EL key configured (for companion listen button)
  function hasVoice() {
    return !!(Storage.getSetting('el_key') && Storage.getSetting('voice_id'));
  }

  function init() {
    // Nothing to initialise for file-based audio
  }

  return { init, playFile, speak, stop, hasVoice, isEnabled, setEnabled };
})();
