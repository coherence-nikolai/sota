// ─── Retreat Planner (Mode 6) ─────────────────────────────────────────────────
// Structured multi-day home retreat plans.
// Three templates: 5-day, 7-day, 10-day.
// Tracks progress day-by-day via localStorage.

const Retreat = (() => {

  // ── Templates ────────────────────────────────────────────────────────────────

  const TEMPLATES = {
    '5day': {
      name: '5-Day Sprint',
      tagline: 'Build momentum. Break through.',
      description: 'Five days of intensive noting. Structured to build concentration early and drive into the terrain on days three through five.',
      days: [
        {
          theme: 'Foundation',
          note: 'Today is about building the base. Let the noting become automatic before you ask it to go deep. Two sits — one longer, one shorter. The metta at the end is not optional.',
          sits: [
            { type: 'noting',  duration: 60, label: '60 min noting' },
            { type: 'metta',   duration: 30, label: '30 min metta' },
          ],
        },
        {
          theme: 'Sharpening',
          note: 'Increase the duration. Let the mind settle into longer sits. The second day often feels like nothing is happening. That\'s fine. The groove is forming. Stay with it.',
          sits: [
            { type: 'noting', duration: 75, label: '75 min noting (morning)' },
            { type: 'noting', duration: 45, label: '45 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Momentum',
          note: 'Three sits today. The cumulative effect of sitting multiple times in a day is qualitatively different from one long sit. Notice that by the third sit.',
          sits: [
            { type: 'noting', duration: 60, label: '60 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
            { type: 'noting', duration: 45, label: '45 min noting (evening)' },
          ],
        },
        {
          theme: 'Push',
          note: 'Longer sits today. 90 minutes gives the mind time to settle, churn, and find its rhythm. Don\'t stop when it gets uncomfortable. Note the discomfort and keep going.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Integration',
          note: 'Final day. Note what has shifted over the five days — or what hasn\'t. End with metta. Offer the merit of the retreat outward.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting' },
            { type: 'metta',  duration: 45, label: '45 min metta' },
          ],
        },
      ],
    },

    '7day': {
      name: '7-Day Home Retreat',
      tagline: 'A full cycle. Foundation to integration.',
      description: 'Seven days structured around the arc of the Progress of Insight. Foundation, terrain, navigation, opening, and rest.',
      days: [
        {
          theme: 'Arrival',
          note: 'Today is for arriving. Leave the week behind. Two sits to settle the nervous system and begin to orient inward. Don\'t push for anything.',
          sits: [
            { type: 'noting',  duration: 60, label: '60 min noting' },
            { type: 'samatha', duration: 30, label: '30 min anapana' },
          ],
        },
        {
          theme: 'Foundation',
          note: 'Build concentration. The noting should become more automatic today — the lag between arising and noting shortening with each sit.',
          sits: [
            { type: 'noting', duration: 75, label: '75 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Deepening',
          note: 'Three sits. The mind may become more vivid today — more rapid, more electric. Note whatever arises without adding interpretation. Let it be what it is.',
          sits: [
            { type: 'noting', duration: 75, label: '75 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
            { type: 'metta',  duration: 30, label: '30 min metta (evening)' },
          ],
        },
        {
          theme: 'Navigation',
          note: 'The terrain may have shifted. Things might be heavier, more fragmented, less interesting than before. This is the path. Keep noting without pushing for anything in particular.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Constancy',
          note: 'The middle of a retreat is often the hardest — familiar enough to be dull, not yet close enough to feel the pull forward. Note that. Note the wanting it to be different.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
            { type: 'noting', duration: 45, label: '45 min noting (evening)' },
          ],
        },
        {
          theme: 'Opening',
          note: 'Something may begin to ease today. A sense of space, of things being less solid. Note the opening itself. Don\'t rest in it — note it and keep going.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Integration',
          note: 'Last day. One long sit, then metta. Offer the retreat outward. Note what has changed — and what hasn\'t. Return to the world without leaving the practice.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting' },
            { type: 'metta',  duration: 45, label: '45 min metta' },
          ],
        },
      ],
    },

    '10day': {
      name: '10-Day Classic',
      tagline: 'The full arc. No shortcuts.',
      description: 'Ten days following the classical structure: foundation, acceleration, dark night, equanimity, integration. The format most practitioners find transformative.',
      days: [
        {
          theme: 'Arrival',
          note: 'Arrive fully. Two sits to let the week fall away and the practice body wake up.',
          sits: [
            { type: 'noting',  duration: 60, label: '60 min noting' },
            { type: 'samatha', duration: 30, label: '30 min anapana' },
          ],
        },
        {
          theme: 'Foundation',
          note: 'Establish the noting rhythm. Consistency over intensity at this stage. Let the method settle in.',
          sits: [
            { type: 'noting', duration: 75, label: '75 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Sharpening',
          note: 'Increase duration and frequency. The mind is finding its groove. Let it deepen.',
          sits: [
            { type: 'noting', duration: 75, label: '75 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Acceleration',
          note: 'Things may become more vivid — faster, brighter, more electric. Note without chasing. The dissolution is coming.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 60, label: '60 min noting (afternoon)' },
            { type: 'metta',  duration: 30, label: '30 min metta (evening)' },
          ],
        },
        {
          theme: 'Into the Dark',
          note: 'The brightness may have dimmed. Things feel more fragmented, heavier, less interesting. This is the terrain — keep noting through it. This is where the work happens.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Constancy',
          note: 'The long middle. The most important instruction here is: don\'t stop. Note the desire to stop. Note the discouragement. Note it all.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
            { type: 'noting', duration: 60, label: '60 min noting (evening)' },
          ],
        },
        {
          theme: 'Navigation',
          note: 'Continue through. The wheel stops when you stop pushing it. Two long sits today.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 90, label: '90 min noting (afternoon)' },
          ],
        },
        {
          theme: 'Easing',
          note: 'Something may begin to open. More space, less solidity, things less urgent. Don\'t stop here — note the openness itself.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
          ],
        },
        {
          theme: 'The Launch Pad',
          note: 'Equanimity is not the destination. It is the launch pad. Keep noting. Note the sense of everything being fine. Note the stillness. You are very close.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting (morning)' },
            { type: 'noting', duration: 75, label: '75 min noting (afternoon)' },
            { type: 'metta',  duration: 45, label: '45 min metta (evening)' },
          ],
        },
        {
          theme: 'Integration',
          note: 'Final day. One long sit. Then metta. Offer the retreat outward. Return to the world without leaving the practice.',
          sits: [
            { type: 'noting', duration: 90, label: '90 min noting' },
            { type: 'metta',  duration: 45, label: '45 min metta' },
          ],
        },
      ],
    },
  };

  // ── State ─────────────────────────────────────────────────────────────────────

  // Called from app.js when mode switches to 'retreat'
  function refresh() { render(); }

  function init() {
    // Template selection
    document.querySelectorAll('.retreat-template-btn').forEach(btn => {
      btn.addEventListener('click', () => beginRetreat(btn.dataset.template));
    });

    document.getElementById('retreat-end-btn')?.addEventListener('click', endRetreat);

    document.getElementById('retreat-checkin-btn')?.addEventListener('click', () => {
      const retreat = Storage.getRetreat();
      if (!retreat) return;
      const dayIdx = getCurrentDay(retreat);
      const tmpl   = TEMPLATES[retreat.template];
      const day    = tmpl?.days[dayIdx];
      Companion.switchAgent('retreat');
      // Let app router handle the navigation
      document.querySelector('[data-mode="companion"]')?.click();
    });
  }

  function beginRetreat(templateKey) {
    if (!TEMPLATES[templateKey]) return;
    Storage.setRetreat({
      template:       templateKey,
      startDate:      new Date().toISOString().slice(0, 10),
      completedSits:  [],
    });
    render();
  }

  function endRetreat() {
    if (!confirm('End this retreat? Your progress will be cleared.')) return;
    Storage.clearRetreat();
    render();
  }

  function getCurrentDay(retreat) {
    const start = new Date(retreat.startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - start) / 864e5));
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function render() {
    const retreat = Storage.getRetreat();
    document.getElementById('retreat-home').classList.toggle('hidden', !!retreat);
    document.getElementById('retreat-active').classList.toggle('hidden', !retreat);
    if (retreat) renderActive(retreat);
  }

  function renderActive(retreat) {
    const tmpl   = TEMPLATES[retreat.template];
    if (!tmpl) return;

    const dayIdx  = getCurrentDay(retreat);
    const total   = tmpl.days.length;
    const isOver  = dayIdx >= total;
    const day     = isOver ? tmpl.days[total - 1] : tmpl.days[dayIdx];
    const dispDay = Math.min(dayIdx + 1, total);

    // Header
    document.getElementById('retreat-day-label').textContent =
      isOver ? `${tmpl.name} — complete` : `Day ${dispDay} of ${total}`;
    document.getElementById('retreat-theme').textContent = day.theme;
    document.getElementById('retreat-note').textContent  = day.note;
    document.getElementById('retreat-title-line').textContent = tmpl.name;

    // Progress dots
    const dotsEl = document.getElementById('retreat-dots');
    dotsEl.innerHTML = Array.from({ length: total }, (_, i) => {
      const cls = i < dayIdx ? 'dot-done' : i === dayIdx ? 'dot-today' : 'dot-future';
      return `<span class="retreat-dot ${cls}"></span>`;
    }).join('');

    // Today's sits
    const sitsEl = document.getElementById('retreat-sits');
    sitsEl.innerHTML = day.sits.map((sit, i) => {
      const key   = `day${dayIdx}-sit${i}`;
      const done  = retreat.completedSits.includes(key);
      const label = typeLabel(sit.type);
      return `
        <div class="retreat-sit-row ${done ? 'sit-done' : ''}">
          <button class="retreat-sit-done-btn ${done ? 'done' : ''}" data-key="${key}" title="${done ? 'Mark undone' : 'Mark done'}">
            ${done ? '✓' : '○'}
          </button>
          <span class="retreat-sit-label">${sit.label}</span>
          <button class="retreat-sit-begin btn-ghost-sm" data-type="${sit.type}" data-dur="${sit.duration}">begin →</button>
        </div>
      `;
    }).join('');

    // Wire sit buttons
    sitsEl.querySelectorAll('.retreat-sit-done-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleSitDone(btn.dataset.key));
    });

    sitsEl.querySelectorAll('.retreat-sit-begin').forEach(btn => {
      btn.addEventListener('click', () => launchSit(btn.dataset.type, parseInt(btn.dataset.dur)));
    });

    // Check-in button visibility
    const checkinBtn = document.getElementById('retreat-checkin-btn');
    if (checkinBtn) checkinBtn.style.display = Storage.hasApiKey() ? '' : 'none';
  }

  function toggleSitDone(key) {
    const retreat = Storage.getRetreat();
    if (!retreat) return;
    const idx = retreat.completedSits.indexOf(key);
    if (idx === -1) retreat.completedSits.push(key);
    else retreat.completedSits.splice(idx, 1);
    Storage.setRetreat(retreat);
    renderActive(retreat);
  }

  function launchSit(type, duration) {
    // Pre-configure sit setup and navigate to it
    document.querySelector('[data-mode="sit-setup"]')?.click();
    setTimeout(() => {
      // Set session type
      document.querySelectorAll('.session-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
      });
      // Trigger the visual block toggle
      const stageBlock  = document.getElementById('stage-select-block');
      const kasinaBlock = document.getElementById('kasina-select-block');
      if (stageBlock)  stageBlock.style.display  = type === 'noting'  ? '' : 'none';
      if (kasinaBlock) kasinaBlock.style.display = type === 'kasina'  ? '' : 'none';
      // Set duration — find closest button or default
      const durBtn = [...document.querySelectorAll('.dur-btn')]
        .find(b => parseInt(b.dataset.min) === duration);
      if (durBtn) {
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        durBtn.classList.add('active');
      }
    }, 50);
  }

  function typeLabel(type) {
    return { noting: 'Noting', metta: 'Metta', samatha: 'Anapana', kasina: 'Kasina' }[type] || type;
  }

  return { init, refresh };
})();
