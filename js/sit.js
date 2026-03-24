// ─── Guided Sit (Mode 1) ──────────────────────────────────────────────────────
// Timer + timed guidance + keyword-triggered guidance streams.

const Sit = (() => {

  let timerInterval = null;
  let seconds = 0;
  let targetSeconds = 0;
  let currentStage = 'unknown';
  let currentType  = 'noting'; // noting | metta | samatha
  let guidanceQueue = [];
  let guidanceIndex = 0;
  let isActive = false;

  const METTA_GUIDANCE = [
    'Settle in. Let the body be still. Bring to mind the simplest wish: may I be well.',
    'May I be happy. Not grasping for happiness — just offering the wish, openly.',
    'May I be free from suffering. Say it and mean it. Whatever is present right now — may it ease.',
    'May I be at peace. Let the words land. Let them be felt, not just recited.',
    'Expand outward now. Someone you love easily. May they be well. May they be happy.',
    'Someone neutral — a stranger, a passerby. May they be well. May they be free from suffering.',
  ];

  // Anapana (Samatha) — staged breath anchoring progression
  const SAMATHA_GUIDANCE = [
    'Settle at the breath. Find the most vivid point of contact — the nostril tip, the upper lip, the exact place where air enters and exits.',
    'Don\'t follow the breath in. Stay at the entrance — the nostril tip. Just this point. Just this sensation, right now.',
    'Each time the mind moves, return to that point. No commentary. Just return. The returning is the practice.',
    'The breath will become more subtle as concentration deepens. Don\'t hold the gross sensation — follow it inward. Subtler and subtler.',
    'A sign may arise — a brightness, a warmth, a glow at the nostril. If it comes, don\'t look at it directly. Peripheral awareness. Let it stabilise.',
    'If the nimitta is bright and stable, incline the mind gently toward it. Don\'t force entry. The door opens when the conditions are right.',
  ];

  // Offline guidance library — used when no API key or for instant delivery
  const OFFLINE_GUIDANCE = {
    early: [
      'Anchor at the upper lip. Each breath — rising, falling. Don\'t control it. Just observe the sensations.',
      'Keep noting. Whatever arises — thought, image, sensation — note it and move on. Nothing gets through without a note.',
      'The mind will wander. That\'s not a problem. The noting of the wandering is the practice. Note it and return.',
    ],
    ap: [
      'Something just lit up. Don\'t chase it. Don\'t try to hold onto it. Note what\'s arising and let it pass.',
      'The dissolution is coming. Know that now. It\'s not a problem. It\'s the path.',
      'Keep noting. Whatever is lighting up — note it, let it pass. The A&P is not the destination.',
    ],
    dissolution: [
      'Things are falling apart. This is the practice working. Keep noting what\'s there even if it\'s hazy.',
      'Note what you can. Even if phenomena are unclear, unclear is what\'s arising. Note it.',
      'The dark night is approaching. Keep the momentum going into it.',
    ],
    'dark-night': [
      'The brightness has gone. What\'s here now is heavier. This is exactly what comes after the A&P. Keep noting.',
      'Note the heaviness itself. Note the fear of the heaviness. None of it is you.',
      'The move through here is dispassion. Not pushing harder. Not fighting what\'s here. Just noting.',
    ],
    reobs: [
      'You\'re here again. The wheel. The cycling. Don\'t add the weight of discouragement to what\'s already here.',
      'Note the discouragement too. Note the frustration at being back here. Everything gets noted.',
      'The wheel stops when you stop pushing it. Keep the momentum going. Note it.',
    ],
    equanimity: [
      'Vast. Open. Still. This is not the finish line. This is the launch pad.',
      'Keep noting. Note the spaciousness. Note the stillness. Note the sense of everything being fine.',
      'The blinking in and out of the sense of "I" — notice that. Note it directly. You are very close.',
    ],
    unknown: [
      'Keep noting. Whatever arises — note it and move on.',
      'Stay with the breath when the mind wanders. Return to noting whatever takes centre stage.',
      'Momentum. Constancy, not heroics. Every note counts.',
    ],
  };

  // Keyword guidance — triggered mid-sit
  const KEYWORD_GUIDANCE = {
    heavy: 'Note the heaviness. Heavy, heavy. It is not you. It is not yours. Just more impersonal phenomena. Keep noting.',
    cycling: 'The wheel is spinning. Do not add discouragement. Note the cycling itself. Cycling, cycling. The wheel stops when you stop pushing it.',
    craving: 'Note the craving. Craving, craving. See it as just sensation. It is not you. It is not yours. It is just more sensation and thought. Keep moving.',
    fear: 'Note the fear. Fear, fear. The mind is close enough to the truth to be afraid of it. That fear is signal. Keep noting.',
    electric: 'Don\'t chase it. Don\'t hold onto it. Note what\'s arising and let it pass. The dissolution is coming.',
    open: 'Vast. Open. Still. Don\'t rest here. Keep noting — even the spaciousness. Especially the stillness. The launch pad is not the destination.',
    numb: 'Note the numbness. Numb, numb. Even the absence of obvious phenomena is something to note. Boredom, flatness — note it all.',
    close: 'You are very close. Keep noting. Note the sense of closeness. Don\'t grasp at it. Let it happen. Let go.',
  };

  // ── Friend Sit ────────────────────────────────────────────────────────────────

  function initFriendSit() {
    const btn = document.getElementById('friend-sit-btn');
    const panel = document.getElementById('friend-sit-panel');
    const urlEl = document.getElementById('friend-sit-url');
    const copyBtn = document.getElementById('friend-sit-copy');
    const closeBtn = document.getElementById('friend-sit-close');

    if (!btn) return;

    btn.addEventListener('click', () => {
      const activeBtn = document.querySelector('.dur-btn.active');
      const minutes   = parseInt(activeBtn?.dataset.min || '60');
      const dur       = minutes > 0 ? minutes * 60 : 3600;
      const start     = Date.now();
      const base      = window.location.origin + window.location.pathname;
      const url       = `${base}?friend=1&start=${start}&dur=${dur}`;
      urlEl.value     = url;
      panel.classList.remove('hidden');
    });

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(urlEl.value).then(() => {
        copyBtn.textContent = 'copied';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 2000);
      }).catch(() => {
        urlEl.select();
        document.execCommand('copy');
        copyBtn.textContent = 'copied';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 2000);
      });
    });

    closeBtn?.addEventListener('click', () => panel.classList.add('hidden'));
  }

  function joinFriend(params) {
    const startMs  = parseInt(params.get('start') || '0');
    const durSecs  = parseInt(params.get('dur')   || '3600');
    if (!startMs) return;

    const elapsed  = Math.floor((Date.now() - startMs) / 1000);
    if (elapsed >= durSecs) return; // sit already finished

    // Boot into the sit at the elapsed offset
    currentType   = 'noting';
    currentStage  = 'unknown';
    targetSeconds = durSecs;
    seconds       = Math.max(0, elapsed);
    isActive      = true;

    document.getElementById('mode-sit-setup').classList.add('hidden');
    document.getElementById('mode-sit').classList.remove('hidden');
    document.getElementById('sit-stage-label').textContent = 'friend sit';

    showGuidance('You\'re in. Timer is synchronised. Settle in.');
    timerInterval = setInterval(tick, 1000);
    scheduleGuidance();
    scheduleReminders();
  }

  function init() {
    document.getElementById('sit-begin').addEventListener('click', beginSit);
    document.getElementById('sit-end').addEventListener('click', endSit);
    document.getElementById('sit-close').addEventListener('click', endSit);
    initFriendSit();

    // Duration buttons
    document.querySelectorAll('.dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Session type buttons
    document.querySelectorAll('.session-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.session-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
        // Show/hide blocks based on type
        const stageBlock  = document.getElementById('stage-select-block');
        const kasinaBlock = document.getElementById('kasina-select-block');
        if (stageBlock)  stageBlock.style.display  = currentType === 'noting'  ? '' : 'none';
        if (kasinaBlock) kasinaBlock.style.display = currentType === 'kasina'  ? '' : 'none';
      });
    });

    // Kasina object buttons
    document.querySelectorAll('.kasina-obj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.kasina-obj-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Keyword buttons
    document.querySelectorAll('.kw-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const kw = btn.dataset.kw;
        triggerKeyword(kw, btn);
      });
    });

    // Voice toggle
    const voiceBtn = document.getElementById('sit-voice-toggle');
    if (voiceBtn) {
      updateVoiceBtn(voiceBtn);
      voiceBtn.addEventListener('click', () => {
        Voice.setEnabled(!Voice.isEnabled());
        updateVoiceBtn(voiceBtn);
      });
    }
  }

  function updateVoiceBtn(btn) {
    const on = Voice.isEnabled();
    btn.textContent = on ? 'voice on' : 'voice off';
    btn.classList.toggle('voice-off', !on);
  }

  function beginSit() {
    const activeBtn   = document.querySelector('.dur-btn.active');
    const minutes     = parseInt(activeBtn?.dataset.min || '60');
    currentType       = document.querySelector('.session-btn.active')?.dataset.type || 'noting';

    // Kasina gets its own screen
    if (currentType === 'kasina') {
      const kasinaObj = document.querySelector('.kasina-obj-btn.active')?.dataset.obj || 'disc';
      document.getElementById('mode-sit-setup').classList.add('hidden');
      document.getElementById('mode-kasina').classList.remove('hidden');
      Kasina.start(kasinaObj, minutes || 60);
      return;
    }

    currentStage  = currentType === 'noting'
      ? document.getElementById('sit-stage-select').value
      : currentType;
    targetSeconds = minutes * 60;
    seconds       = 0;
    isActive      = true;

    // Show the sit screen
    document.getElementById('mode-sit-setup').classList.add('hidden');
    document.getElementById('mode-sit').classList.remove('hidden');

    // Stage badge
    const stageLabels = {
      early: 'early stages', ap: 'A&P', dissolution: 'dissolution',
      'dark-night': 'dark night', reobs: 're-observation',
      equanimity: 'equanimity', unknown: 'sitting',
      metta: 'metta', samatha: 'anapana',
    };
    document.getElementById('sit-stage-label').textContent =
      stageLabels[currentType] || stageLabels[currentStage] || 'sitting';

    // Initial guidance
    if (currentType === 'metta') {
      showGuidance(METTA_GUIDANCE[0], 'assets/audio/sit/metta-0.mp3');
    } else if (currentType === 'samatha') {
      showGuidance(SAMATHA_GUIDANCE[0], 'assets/audio/sit/anapana-0.mp3');
    } else {
      showGuidance(
        getGuidanceText(currentStage, 'opening'),
        `assets/audio/sit/${currentStage}-0.mp3`
      );
    }

    timerInterval = setInterval(tick, 1000);
    scheduleGuidance();
    scheduleReminders();
  }

  function endSit() {
    isActive = false;
    clearInterval(timerInterval);
    timerInterval = null;
    Voice.stop();

    // Log the sit
    if (seconds > 60) {
      Storage.addEntry({
        duration: Math.round(seconds / 60),
        stage: currentStage,
        notes: '',
        type: 'guided',
      });
    }

    document.getElementById('mode-sit').classList.add('hidden');
    document.getElementById('mode-sit-setup').classList.remove('hidden');

    // Reset
    seconds = 0;
    document.getElementById('sit-timer').textContent = '00:00';
    document.getElementById('sit-guidance').textContent = '';
  }

  function tick() {
    seconds++;
    updateTimer();

    if (targetSeconds > 0 && seconds >= targetSeconds) {
      Voice.playBell();
      setTimeout(() => {
        showGuidance(
          'The sit is complete. Rest here for a moment. When you\'re ready, open your eyes.',
          'assets/audio/sit/complete.mp3'
        );
      }, 2500);
      setTimeout(endSit, 32000);
    }
  }

  function updateTimer() {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('sit-timer').textContent =
      String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // Short momentum reminders — play between main guidance, no text change
  // Files: assets/audio/sit/remind-{0-7}.mp3
  function scheduleReminders() {
    // Fire at 10, 20, 30, 40, 50, 60, 70, 80, 90 min (midway between main guidance)
    [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach((min, i) => {
      setTimeout(() => {
        if (!isActive) return;
        Voice.playFile(`assets/audio/sit/remind-${i % 8}.mp3`);
      }, min * 60 * 1000);
    });
  }

  function scheduleGuidance() {
    const intervals = [5, 15, 25, 35, 45, 55].map(m => m * 60 * 1000);
    intervals.forEach((delay, i) => {
      setTimeout(() => {
        if (!isActive) return;
        if (currentType === 'metta') {
          const idx = i % METTA_GUIDANCE.length;
          showGuidance(METTA_GUIDANCE[idx], `assets/audio/sit/metta-${idx}.mp3`);
        } else if (currentType === 'samatha') {
          const idx = i % SAMATHA_GUIDANCE.length;
          showGuidance(SAMATHA_GUIDANCE[idx], `assets/audio/sit/anapana-${idx}.mp3`);
        } else {
          const texts = OFFLINE_GUIDANCE[currentStage] || OFFLINE_GUIDANCE.unknown;
          const idx   = i % texts.length;
          const stage = OFFLINE_GUIDANCE[currentStage] ? currentStage : 'unknown';
          showGuidance(texts[idx], `assets/audio/sit/${stage}-${idx}.mp3`);
        }
      }, delay);
    });
  }

  function showGuidance(text, audioPath = null) {
    const el = document.getElementById('sit-guidance');
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = '1';
      if (audioPath) Voice.playFile(audioPath);
    }, 800);
  }

  function getGuidanceText(stage, moment) {
    const texts = OFFLINE_GUIDANCE[stage] || OFFLINE_GUIDANCE.unknown;
    return texts[0];
  }

  function triggerKeyword(kw, btn) {
    // Visual feedback
    document.querySelectorAll('.kw-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 2000);

    const offlineText = KEYWORD_GUIDANCE[kw];
    const audioPath   = `assets/audio/kw/${kw}.mp3`;

    showGuidance(offlineText, audioPath);
  }

  return { init, joinFriend };
})();
