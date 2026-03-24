// ─── Noting Trainer (Mode 5) ──────────────────────────────────────────────────
// 3-step noting practice: sense door → feeling tone → emotion.
// Trains the noting reflex outside of formal sits.

const Noting = (() => {

  const SENSE_DOORS = ['Seeing', 'Hearing', 'Smell', 'Taste', 'Sensation', 'Thought'];
  const VEDANA      = ['Pleasant', 'Unpleasant', 'Neutral'];
  const EMOTIONS    = ['Agitation', 'Heaviness', 'Fear', 'Wanting', 'Resistance', 'Openness', 'Joy', 'Confusion'];

  const TONES = {
    Seeing: 528, Hearing: 440, Smell: 396, Taste: 462, Sensation: 528, Thought: 396,
    Pleasant: 528, Unpleasant: 396, Neutral: 432,
    Agitation: 440, Heaviness: 396, Fear: 396, Wanting: 462,
    Resistance: 440, Openness: 528, Joy: 528, Confusion: 432,
  };

  let step = 'sense';
  let data = {};
  let audioCtx = null;

  // ── Audio ────────────────────────────────────────────────────────────────────
  function getAudio() {
    try {
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
    return audioCtx;
  }

  function playTone(freq) {
    const ctx = getAudio();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      o.type = 'sine';
      o.frequency.value = freq;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(lp); lp.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 1.5);
    } catch (_) {}
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function init() {
    // Nothing — render happens on first showMode call
  }

  function reset() {
    step = 'sense';
    data = {};
    paint();
  }

  // Immediate render — no fade, used on entry to the mode
  function paint() {
    const el = document.getElementById('noting-content');
    if (!el) return;
    el.style.transition = 'none';
    el.style.opacity = '1';
    buildContent(el);
    wireButtons();
  }

  // Animated transition between steps
  function render() {
    const el = document.getElementById('noting-content');
    if (!el) return;
    el.style.transition = 'opacity 0.35s ease';
    el.style.opacity = '0';
    setTimeout(() => {
      buildContent(el);
      wireButtons();
      el.style.opacity = '1';
    }, 370);
  }

  function buildContent(el) {
    if (step === 'sense') {
      el.innerHTML = buildGrid('what are you noticing?', 'sense door', SENSE_DOORS, 'noting-grid-2col');
    } else if (step === 'vedana') {
      el.innerHTML = buildGrid('what is its tone?', 'feeling tone', VEDANA, 'noting-grid-3col');
    } else {
      el.innerHTML = buildGrid('any emotion present?', 'emotion', EMOTIONS, 'noting-grid-2col');
    }
  }

  function buildGrid(question, title, items, gridClass) {
    const btns = items.map(item =>
      `<button class="noting-btn" data-item="${escHtml(item)}">${escHtml(item)}</button>`
    ).join('');

    return `
      <p class="noting-question">${escHtml(question)}</p>
      <p class="noting-step-title">${escHtml(title)}</p>
      <div class="noting-grid ${gridClass}">${btns}</div>
    `;
  }

  function wireButtons() {
    document.querySelectorAll('.noting-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.add('noting-btn-selected');
        btn.disabled = true;

        const item = btn.dataset.item;
        playTone(TONES[item] || 432);

        if (step === 'sense') {
          data.sense = item;
          setTimeout(() => { step = 'vedana'; render(); }, 700);
        } else if (step === 'vedana') {
          data.vedana = item;
          setTimeout(() => { step = 'emotion'; render(); }, 700);
        } else {
          data.emotion = item;
          setTimeout(complete, 500);
        }
      });
    });
  }

  function complete() {
    const el = document.getElementById('noting-content');
    el.style.transition = 'opacity 0.35s ease';
    el.style.opacity = '0';

    setTimeout(() => {
      el.innerHTML = `
        <div class="noting-complete">
          <div class="noting-note">${escHtml(data.sense)} · ${escHtml(data.vedana)} · ${escHtml(data.emotion)}</div>
          <div class="noting-complete-sub">noted</div>
        </div>
      `;
      el.style.opacity = '1';
      playTone(528);
      setTimeout(() => { step = 'sense'; data = {}; render(); }, 2500);
    }, 370);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { init, reset };
})();
