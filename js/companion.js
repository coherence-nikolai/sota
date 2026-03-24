// ─── AI Companion (Mode 5) ────────────────────────────────────────────────────
// Conversational layer using the agent system prompts.
// Maintains conversation history per agent.

const Companion = (() => {

  // Per-agent conversation history (in-memory, session only)
  const histories = {};
  let currentAgent = 'oracle';

  function init() {
    const agentSelect  = document.getElementById('companion-agent');
    const input        = document.getElementById('companion-input');
    const sendBtn      = document.getElementById('companion-send');
    const messagesEl   = document.getElementById('companion-messages');
    const agentBadge   = document.getElementById('companion-agent-badge');

    // Init histories
    Object.keys(AGENTS).forEach(k => histories[k] = []);

    // Agent switch
    agentSelect.addEventListener('change', () => {
      currentAgent = agentSelect.value;
      agentBadge.textContent = AGENTS[currentAgent]?.name || currentAgent;
    });

    // Send on button
    sendBtn.addEventListener('click', send);

    // Send on Cmd/Ctrl+Enter
    input.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        send();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }

  async function send() {
    const input   = document.getElementById('companion-input');
    const sendBtn = document.getElementById('companion-send');
    const text    = input.value.trim();
    if (!text) return;

    if (!Storage.hasApiKey()) {
      appendMessage('system', 'No API key set. Go to Settings to add your Anthropic API key.');
      return;
    }

    // Append user message
    appendMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    // Add to history
    histories[currentAgent].push({ role: 'user', content: buildUserContent(text) });

    // Loading indicator
    const loadingEl = appendMessage('loading', 'noting…');

    try {
      let responseText = '';
      const agentName = AGENTS[currentAgent]?.name || currentAgent;

      await API.invokeAgent(
        currentAgent,
        histories[currentAgent],
        {
          onChunk: (chunk, full) => {
            responseText = full;
            loadingEl.querySelector('.msg-body').textContent = full;
          },
          onDone: (full) => {
            responseText = full;
          },
        }
      );

      // Replace loading with final
      loadingEl.classList.remove('msg-loading');
      loadingEl.classList.add('msg-assistant');
      loadingEl.querySelector('.msg-body').innerHTML = formatResponse(responseText);
      loadingEl.querySelector('.msg-agent-label').textContent = agentName;

      // Listen button — only if voice configured
      if (Voice.hasVoice()) {
        const listenBtn = document.createElement('button');
        listenBtn.className = 'msg-listen';
        listenBtn.textContent = '▶ listen';
        listenBtn.addEventListener('click', () => {
          Voice.speak(responseText);
          listenBtn.textContent = '▶ playing…';
          setTimeout(() => { listenBtn.textContent = '▶ listen'; }, 3000);
        });
        loadingEl.appendChild(listenBtn);
      }

      // Add to history
      histories[currentAgent].push({ role: 'assistant', content: responseText });

      // Trim history to last 20 exchanges to avoid token bloat
      if (histories[currentAgent].length > 40) {
        histories[currentAgent] = histories[currentAgent].slice(-40);
      }

    } catch (err) {
      loadingEl.classList.remove('msg-loading');
      loadingEl.classList.add('msg-system');
      loadingEl.querySelector('.msg-body').textContent = formatError(err);
    }

    sendBtn.disabled = false;
    scrollToBottom();
  }

  function buildUserContent(text) {
    // Prepend practice context on first message per session
    const history = histories[currentAgent];
    if (history.length === 0) {
      const context = Storage.getSummaryForAgent();
      if (context && context !== 'No practice history yet.') {
        return `[Practice context for this yogi:\n${context}]\n\n${text}`;
      }
    }
    return text;
  }

  function appendMessage(type, text) {
    const messages = document.getElementById('companion-messages');
    const agentName = AGENTS[currentAgent]?.name || currentAgent;

    const div = document.createElement('div');
    div.className = `msg msg-${type}`;

    if (type === 'user') {
      div.innerHTML = `<div class="msg-body">${escHtml(text)}</div>`;
    } else if (type === 'loading') {
      div.innerHTML = `
        <div class="msg-agent-label">${agentName}</div>
        <div class="msg-body">${escHtml(text)}</div>
      `;
    } else if (type === 'assistant') {
      div.innerHTML = `
        <div class="msg-agent-label">${agentName}</div>
        <div class="msg-body">${formatResponse(text)}</div>
      `;
    } else {
      div.innerHTML = `<div class="msg-body">${escHtml(text)}</div>`;
    }

    messages.appendChild(div);
    scrollToBottom();
    return div;
  }

  function formatResponse(text) {
    // Basic markdown: **bold**, *italic*, preserve line breaks
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function formatError(err) {
    if (err.message === 'NO_API_KEY') {
      return 'No API key set. Add your Anthropic API key in Settings.';
    }
    if (err.message.includes('401') || err.message.includes('invalid')) {
      return 'API key invalid or expired. Check your key in Settings.';
    }
    return `Error: ${err.message}`;
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollToBottom() {
    const messages = document.getElementById('companion-messages');
    messages.scrollTop = messages.scrollHeight;
  }

  function clearHistory() {
    Object.keys(histories).forEach(k => histories[k] = []);
  }

  return { init, clearHistory };
})();
