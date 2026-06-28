/* ═══════════════════════════════════════════════════════════════════════
   WealthWise AI — Avatar Advisor JavaScript
   Handles: chat, TTS, avatar animations, quick questions, session state

   NOTE: Uses `eid()` instead of `$()` to avoid re-declaration conflict
   with the `const $ = ...` already declared in script.js
═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ── Helper: getElementById (avoids $ conflict with script.js) ─────────
const eid = id => document.getElementById(id);

// ── State ─────────────────────────────────────────────────────────────
const avatarState = {
  history:      [],       // [{role, content}] for API context
  isMuted:      false,
  isBusy:       false,
  messageCount: 0,
  sessionStart: new Date(),
};

// ── DOM refs ───────────────────────────────────────────────────────────
const av = {
  messages:     eid('avMessages'),
  input:        eid('avInput'),
  sendBtn:      eid('avSendBtn'),
  muteBtn:      eid('avMuteBtn'),
  clearBtn:     eid('avClearBtn'),
  moodBox:      eid('avMood'),
  waveform:     eid('avWaveform'),
  sessionBadge: eid('avSessionBadge'),
  msgCount:     eid('avMsgCount'),
  frame:        eid('avFrame'),
};

// ── Helpers ────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });
}

function setMood(text, type = '') {
  if (!av.moodBox) return;
  av.moodBox.className = 'av-mood' + (type ? ' av-mood--' + type : '');
  av.moodBox.textContent = text;
}

function updateSession() {
  const elapsed = Math.floor((Date.now() - avatarState.sessionStart) / 60000);
  if (av.sessionBadge) av.sessionBadge.textContent = 'Session ' + elapsed + 'm';
  if (av.msgCount)     av.msgCount.textContent = avatarState.messageCount;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function scrollBottom() {
  if (av.messages) av.messages.scrollTop = av.messages.scrollHeight;
}

// ── Avatar animation helpers ───────────────────────────────────────────
function avatarSetActive(on) {
  if (av.frame) av.frame.classList.toggle('av-active', on);
}

function avatarBounce() {
  if (!av.frame) return;
  av.frame.classList.remove('av-bounce');
  void av.frame.offsetWidth;          // force reflow so animation re-triggers
  av.frame.classList.add('av-bounce');
  av.frame.addEventListener('animationend', () => {
    av.frame.classList.remove('av-bounce');
  }, { once: true });
}

// ── Message rendering ──────────────────────────────────────────────────
function appendMessage(role, text, animate = true) {
  const isUser = role === 'user';
  const row = document.createElement('div');
  row.className = 'av-msg-row ' + (isUser ? 'av-user' : 'av-aria');
  if (!animate) row.style.animation = 'none';

  row.innerHTML =
    '<div class="av-msg-badge ' + (isUser ? 'user' : 'aria') + '">' +
      (isUser ? '👤' : '✦') +
    '</div>' +
    '<div class="av-bubble">' +
      escHtml(text) +
      '<span class="av-bubble-time">' + nowTime() + '</span>' +
    '</div>';

  av.messages.appendChild(row);
  scrollBottom();
  avatarState.messageCount++;
  updateSession();
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'av-typing-row';
  row.id = 'avTypingIndicator';
  row.innerHTML =
    '<div class="av-msg-badge aria">✦</div>' +
    '<div class="av-typing-bubble">' +
      '<div class="av-dot"></div>' +
      '<div class="av-dot"></div>' +
      '<div class="av-dot"></div>' +
    '</div>';
  av.messages.appendChild(row);
  scrollBottom();
}

function hideTyping() {
  const el = eid('avTypingIndicator');
  if (el) el.remove();
}

// ── Text-to-Speech ─────────────────────────────────────────────────────
function speak(text) {
  if (avatarState.isMuted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const clean = text.replace(/<[^>]+>/g, '').replace(/₹/g, 'rupees ');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate   = 0.92;
  utter.pitch  = 1.05;
  utter.volume = 0.9;

  // Prefer Indian English voice
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  utter.onstart = () => {
    showWaveform(true);
    setMood('🎙️ Aria is speaking…', 'speaking');
  };
  utter.onend = () => {
    showWaveform(false);
    setMood('✅ Ready to help', '');
    avatarSetActive(false);
  };
  utter.onerror = () => {
    showWaveform(false);
    setMood('✅ Ready to help', '');
  };

  window.speechSynthesis.speak(utter);
}

// Voices load async in some browsers
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

function showWaveform(on) {
  if (av.waveform) av.waveform.classList.toggle('visible', on);
}

// ── Lock / unlock UI ───────────────────────────────────────────────────
function lockUI() {
  avatarState.isBusy  = true;
  av.sendBtn.classList.add('loading');
  av.sendBtn.disabled = true;
  av.input.disabled   = true;
}

function unlockUI() {
  avatarState.isBusy  = false;
  av.sendBtn.classList.remove('loading');
  av.sendBtn.disabled = false;
  av.input.disabled   = false;
  av.input.focus();
}

// ── Core: send message ─────────────────────────────────────────────────
async function sendMessage() {
  if (avatarState.isBusy) return;

  const text = (av.input.value || '').trim();
  if (!text) return;

  // Clear input & reset height
  av.input.value = '';
  av.input.style.height = '';

  lockUI();
  appendMessage('user', text);

  // Add to history before sending
  avatarState.history.push({ role: 'user', content: text });

  avatarSetActive(true);
  setMood('🤔 Aria is thinking…', 'thinking');
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: avatarState.history.slice(-8),
      }),
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();

    // Support both response keys: 'reply' (avatar) and 'response' (chatbot)
    const reply = data.reply || data.response ||
      "I'm sorry, I couldn't generate a response right now.";

    hideTyping();
    appendMessage('aria', reply);

    avatarState.history.push({ role: 'assistant', content: reply });

    avatarBounce();
    speak(reply);

  } catch (err) {
    console.error('Avatar chat error:', err);
    hideTyping();
    appendMessage('aria',
      "I'm having trouble connecting right now. Please check your connection and try again."
    );
    avatarSetActive(false);
    setMood('⚠️ Connection issue', '');
  } finally {
    unlockUI();
  }
}

// ── Quick questions ────────────────────────────────────────────────────
function askQuick(question) {
  if (avatarState.isBusy) return;
  av.input.value = question;
  sendMessage();
}

// ── Mute toggle ────────────────────────────────────────────────────────
function toggleMute() {
  avatarState.isMuted = !avatarState.isMuted;
  if (av.muteBtn) {
    av.muteBtn.classList.toggle('active', !avatarState.isMuted);
    av.muteBtn.innerHTML = avatarState.isMuted
      ? '<span>🔇</span> Muted'
      : '<span>🔊</span> Voice On';
  }
  if (avatarState.isMuted && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    showWaveform(false);
  }
}

// ── Clear conversation ─────────────────────────────────────────────────
function clearConversation() {
  if (avatarState.isBusy) return;
  avatarState.history      = [];
  avatarState.messageCount = 0;
  av.messages.innerHTML    = '';
  appendGreeting(false);
  setMood('✅ Ready to help', '');
  updateSession();
}

function appendGreeting(animate = true) {
  appendMessage(
    'aria',
    "Hello! I'm Aria, your WealthWise AI financial advisor. I can help you with savings strategies, investment planning, goal tracking, loan eligibility, and personalised wealth insights. What would you like to discuss today?",
    animate
  );
}

// ── Auto-resize textarea ───────────────────────────────────────────────
function initAutoResize() {
  if (!av.input) return;
  av.input.addEventListener('input', () => {
    av.input.style.height = 'auto';
    av.input.style.height = Math.min(av.input.scrollHeight, 120) + 'px';
  });
}

// ── Keyboard: Enter = send, Shift+Enter = newline ──────────────────────
function initKeyboard() {
  if (!av.input) return;
  av.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// ── Session timer ──────────────────────────────────────────────────────
function initSessionTimer() {
  updateSession();
  setInterval(updateSession, 60000);
}

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAutoResize();
  initKeyboard();
  initSessionTimer();

  av.sendBtn?.addEventListener('click', sendMessage);
  av.muteBtn?.addEventListener('click', toggleMute);
  av.clearBtn?.addEventListener('click', clearConversation);

  // Quick question buttons
  document.querySelectorAll('.av-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => askQuick(btn.dataset.q));
  });

  // Initial greeting
  appendGreeting();
  setMood('✅ Ready to help', '');
  av.input?.focus();
});

// Expose globals for any inline onclick fallbacks in HTML
window.sendMessage       = sendMessage;
window.toggleMute        = toggleMute;
window.clearConversation = clearConversation;
window.askQuick          = askQuick;