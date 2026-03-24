// ─── Kasina Concentration Mode ────────────────────────────────────────────────
// Three objects: fire, white disc, light.
// Canvas visual + nimitta instruction + returns counter.

const Kasina = (() => {

  let animFrame   = null;
  let timerInterval = null;
  let seconds     = 0;
  let targetSeconds = 0;
  let isActive    = false;
  let returns     = 0;
  let currentObject = 'disc';
  let canvas, ctx;

  const INTRO = {
    fire:  'Fix the gaze on the flame. Let it fill the eye. Soft, unwavering. Not staring — resting.',
    disc:  'Rest the gaze on the white disc. Steady, not forced. The object holds the mind.',
    light: 'Let the light settle into the visual field. Gentle, sustained attention. No effort beyond return.',
  };

  const GUIDANCE = [
    'When the mind moves, return to the object. Count each return. The returns are the practice.',
    'The sign arises naturally — a faint afterimage, a shape that persists when the eyes close. Do not force it.',
    'If the nimitta arises, hold it gently. Let it stabilise. Do not grab at it or try to make it brighter.',
    'Return to the object. Each return deepens concentration. Steadiness is the method.',
    'The mind may try to analyse what it sees. Note the impulse and return. The object, not the idea of it.',
    'Stillness now. Stay with the object. Let everything peripheral recede.',
    'If the afterimage is stable and bright, incline gently toward it. You may enter a deeper stillness.',
  ];

  // ── Public API ───────────────────────────────────────────────────────────────

  function init() {
    canvas = document.getElementById('kasina-canvas');
    ctx    = canvas ? canvas.getContext('2d') : null;

    document.getElementById('kasina-end').addEventListener('click', endKasina);

    document.getElementById('kasina-return').addEventListener('click', () => {
      returns++;
      document.getElementById('kasina-returns').textContent = returns;
      const btn = document.getElementById('kasina-return');
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 400);
    });

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
      if (isActive && canvas) resizeCanvas();
    });
  }

  function start(object, durationMin) {
    currentObject  = object || 'disc';
    targetSeconds  = (durationMin || 60) * 60;
    seconds        = 0;
    returns        = 0;
    isActive       = true;

    document.getElementById('kasina-returns').textContent = '0';
    document.getElementById('kasina-object-label').textContent =
      ({ fire: 'Fire', disc: 'White Disc', light: 'Light' })[currentObject] || currentObject;
    document.getElementById('kasina-timer').textContent = '00:00';

    showGuidance(INTRO[currentObject] || GUIDANCE[0], true);

    if (canvas) { resizeCanvas(); startRender(); }
    timerInterval = setInterval(tick, 1000);
    scheduleGuidance();
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  function endKasina() {
    isActive = false;
    clearInterval(timerInterval);
    timerInterval = null;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    if (seconds > 60) {
      Storage.addEntry({
        duration: Math.round(seconds / 60),
        stage:    'kasina',
        notes:    `Object: ${currentObject}. Returns: ${returns}.`,
        type:     'kasina',
      });
    }

    document.getElementById('mode-kasina').classList.add('hidden');
    document.getElementById('mode-sit-setup').classList.remove('hidden');
  }

  function tick() {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('kasina-timer').textContent =
      String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

    if (targetSeconds > 0 && seconds >= targetSeconds) {
      showGuidance('The sit is complete. Rest in the stillness for a moment.');
      setTimeout(endKasina, 30000);
    }
  }

  function scheduleGuidance() {
    [3, 8, 15, 25, 38, 52, 68].forEach((min, i) => {
      setTimeout(() => {
        if (!isActive) return;
        showGuidance(GUIDANCE[i % GUIDANCE.length]);
      }, min * 60 * 1000);
    });
  }

  function showGuidance(text, immediate = false) {
    const el = document.getElementById('kasina-guidance');
    if (!el) return;
    if (immediate) {
      el.textContent = text;
      el.style.opacity = '1';
      return;
    }
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = '1';
    }, 700);
  }

  // ── Canvas ───────────────────────────────────────────────────────────────────

  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width  = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  function startRender() {
    const renders = { fire: renderFire, disc: renderDisc, light: renderLight };
    const render  = renders[currentObject] || renderDisc;
    let t = 0;

    function loop() {
      if (!isActive) return;
      render(t);
      t += 0.016;
      animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  function renderFire(t) {
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2 + h * 0.05;
    ctx.clearRect(0, 0, w, h);

    const baseR = Math.min(w, h) * 0.07;

    // Outer glow layers
    for (let i = 4; i >= 1; i--) {
      const r  = baseR * (1 + i * 0.6);
      const fl = 1 + 0.06 * Math.sin(t * 2.5 + i * 1.1);
      const a  = 0.07 - i * 0.012;
      const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * fl);
      g.addColorStop(0, `rgba(255,200,80,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * fl, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Flame body — upward teardrop shape
    const fl = 1 + 0.07 * Math.sin(t * 3.8);
    const fh = baseR * 2.2 * fl;
    ctx.save();
    ctx.translate(cx, cy + baseR * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(baseR * 0.9, -fh * 0.4, baseR * 0.8, -fh * 0.8, 0, -fh);
    ctx.bezierCurveTo(-baseR * 0.8, -fh * 0.8, -baseR * 0.9, -fh * 0.4, 0, 0);
    const fg = ctx.createLinearGradient(0, 0, 0, -fh);
    fg.addColorStop(0, 'rgba(255,160,30,0.9)');
    fg.addColorStop(0.4, 'rgba(255,220,80,0.85)');
    fg.addColorStop(0.8, 'rgba(255,255,200,0.7)');
    fg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();

    // Core bright point
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.6);
    cg.addColorStop(0, 'rgba(255,255,240,1)');
    cg.addColorStop(0.5, 'rgba(255,240,160,0.7)');
    cg.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
  }

  function renderDisc(t) {
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.22;
    ctx.clearRect(0, 0, w, h);

    // Soft outer halo
    const haloR = r * (1.6 + 0.03 * Math.sin(t * 0.6));
    const halo  = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, haloR);
    halo.addColorStop(0, 'rgba(255,255,255,0.06)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();

    // Main disc — very slight breathe
    const discR = r * (1 + 0.008 * Math.sin(t * 0.4));
    const grad  = ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.12, 0, cx, cy, discR);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.55, 'rgba(245,245,250,0.97)');
    grad.addColorStop(0.85, 'rgba(220,220,230,0.88)');
    grad.addColorStop(1, 'rgba(180,180,200,0.7)');
    ctx.beginPath();
    ctx.arc(cx, cy, discR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function renderLight(t) {
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const baseR = Math.min(w, h) * 0.13;
    ctx.clearRect(0, 0, w, h);

    // Expanding pulse rings
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.4 + i * 0.7) % (Math.PI * 2);
      const expand = (phase / (Math.PI * 2));
      const ringR  = baseR * (1.2 + i * 0.7 + expand * 1.5);
      const alpha  = Math.max(0, (0.10 - i * 0.015) * (1 - expand));
      if (alpha <= 0) continue;
      const grad = ctx.createRadialGradient(cx, cy, ringR * 0.7, cx, cy, ringR);
      grad.addColorStop(0, `rgba(255,252,220,${alpha})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Core glow
    const pulse = 1 + 0.04 * Math.sin(t * 1.1);
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * pulse);
    cg.addColorStop(0,   'rgba(255,255,245,1)');
    cg.addColorStop(0.35,'rgba(255,252,200,0.9)');
    cg.addColorStop(0.7, 'rgba(255,240,140,0.4)');
    cg.addColorStop(1,   'rgba(255,220,80,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * pulse * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    // Bright centre point
    const dot = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.25);
    dot.addColorStop(0, 'rgba(255,255,255,1)');
    dot.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = dot;
    ctx.fill();
  }

  return { init, start };
})();
