// ─── Daily Practice Tracker (Mode 3) ─────────────────────────────────────────

const Tracker = (() => {

  function init() {
    document.getElementById('log-save').addEventListener('click', saveEntry);

    document.getElementById('tracker-export')?.addEventListener('click', exportLog);

    document.getElementById('insights-btn')?.addEventListener('click', runInsights);
    document.getElementById('insights-close')?.addEventListener('click', () => {
      document.getElementById('tracker-insights').style.display = 'none';
    });

    render();
  }

  function exportLog() {
    const log = Storage.getLog();
    if (!log.length) return;
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sota-practice-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runInsights() {
    if (!Storage.hasApiKey()) {
      alert('Add your Anthropic API key in Settings to use Practice Insights.');
      return;
    }
    const panel = document.getElementById('tracker-insights');
    const body  = document.getElementById('insights-body');
    panel.style.display = 'block';
    body.textContent = 'Analysing…';

    const context = Storage.getSummaryForAgent(30);
    const history = [{ role: 'user', content: `Here is my practice history:\n\n${context}\n\nAnalyse the patterns and give me your assessment.` }];

    try {
      let text = '';
      await API.invokeAgent('pattern', history, {
        onChunk: (_, full) => { body.textContent = full; },
        onDone:  (full)    => { body.textContent = full; },
      });
    } catch (err) {
      body.textContent = 'Could not load insights. Check your API key.';
    }
  }

  function saveEntry() {
    const duration = parseInt(document.getElementById('log-duration').value) || 0;
    const stage    = document.getElementById('log-stage').value;
    const notes    = document.getElementById('log-notes').value.trim();

    if (!duration) return;

    Storage.addEntry({ duration, stage, notes });

    // Clear form
    document.getElementById('log-duration').value = '60';
    document.getElementById('log-stage').value = 'unknown';
    document.getElementById('log-notes').value = '';

    render();
  }

  function render() {
    renderMomentum();
    renderHistory();
  }

  function renderMomentum() {
    const el = document.getElementById('tracker-momentum');
    const m  = Storage.getMomentumScore();
    const s  = Storage.getStreak();

    const streakLine = s.current > 0
      ? `<span class="streak-live">${s.current} day${s.current !== 1 ? 's' : ''} ↑</span>`
      : (s.lastSitDaysAgo === 1 ? `<span class="streak-warn">streak broken yesterday</span>`
       : s.lastSitDaysAgo > 1  ? `<span class="streak-warn">last sat ${s.lastSitDaysAgo} days ago</span>`
       : '');

    const longestLine = s.longest > 0
      ? `<span class="streak-pb">best: ${s.longest}d</span>`
      : '';

    el.innerHTML = `
      <div class="streak-row">${streakLine}${longestLine}</div>
      <div class="momentum-label">7-day momentum</div>
      <div class="momentum-score">${m.score7}%</div>
      <div class="momentum-bar"><div class="momentum-fill" style="width:${m.score7}%"></div></div>
      <div class="momentum-label" style="margin-top:12px">30-day momentum</div>
      <div class="momentum-score">${m.score30}%</div>
      <div class="momentum-bar"><div class="momentum-fill" style="width:${m.score30}%"></div></div>
      <div style="margin-top:12px;font-family:var(--font-ui);font-size:0.75rem;color:var(--text-mute)">
        ${m.days7}/7 days this week · ${m.total} sits logged total
      </div>
      ${getMomentumMessage(m)}
    `;
  }

  function getMomentumMessage(m) {
    if (m.total === 0) return '';
    if (m.score7 >= 85) return `<div style="margin-top:10px;font-style:italic;color:var(--text-dim);font-size:0.88rem">Momentum is strong. Keep it going.</div>`;
    if (m.score7 >= 57) return `<div style="margin-top:10px;font-style:italic;color:var(--text-dim);font-size:0.88rem">Good constancy. Not heroics — constancy.</div>`;
    if (m.score7 >= 28) return `<div style="margin-top:10px;font-style:italic;color:var(--amber-dim);font-size:0.88rem">Momentum is building. Keep showing up.</div>`;
    return `<div style="margin-top:10px;font-style:italic;color:var(--text-mute);font-size:0.88rem">The momentum needs attention. One sit today.</div>`;
  }

  function renderHistory() {
    const el  = document.getElementById('tracker-history');
    const log = Storage.getLog().slice(0, 20);

    if (!log.length) {
      el.innerHTML = '<div style="color:var(--text-mute);font-size:0.88rem;padding:8px 0;font-style:italic">No sits logged yet.</div>';
      return;
    }

    const stageLabels = {
      unknown: 'unknown', early: 'early stages', ap: 'A&P',
      dissolution: 'dissolution', 'dark-night': 'dark night',
      reobs: 're-observation', equanimity: 'equanimity', 'post-path': 'post-path',
    };

    el.innerHTML = log.map(e => {
      const d = new Date(e.timestamp);
      const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-entry">
          <div class="history-entry-top">
            <span class="history-date">${dateStr} · ${timeStr}</span>
            <span class="history-dur">${e.duration} min</span>
          </div>
          <div class="history-stage">${stageLabels[e.stage] || e.stage}</div>
          ${e.notes ? `<div class="history-notes">${escHtml(e.notes)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Called from app.js when tracker mode is shown
  function refresh() { render(); }

  return { init, refresh };
})();
