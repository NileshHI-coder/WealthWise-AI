/* ═══════════════════════════════════════════════════════════
   WealthWise AI — Frontend Script
   Particles · Charts · Animations · AI Chat · API Calls
═══════════════════════════════════════════════════════════ */

'use strict';

// ── State ─────────────────────────────────────────────────
let dashboardData = null;
let spendingData = null;
let wealthChartInstance = null;
let spendingChartInstance = null;
let scoreGaugeInstance = null;
let loanGaugeInstance = null;

// ── Helpers ───────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat('en-IN').format(Math.round(n));
const $ = id => document.getElementById(id);

function countUp(el, target, duration = 1200) {
  if (!el) return;
  const start = performance.now();
  const from = parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = from + (target - from) * ease;
    el.textContent = Math.round(val);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Particles ─────────────────────────────────────────────
function initParticles() {
  const canvas = $('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? '139,92,246' : '59,130,246';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  // Draw lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139,92,246,${0.05 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

// ── Cursor Glow ───────────────────────────────────────────
function initCursorGlow() {
  const glow = $('cursorGlow');
  if (!glow) return;
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

// ── Scroll Reveal ─────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── Gauge Canvas (Arc) ────────────────────────────────────
function drawGauge(canvasId, score, color1, color2, trackColor = 'rgba(255,255,255,0.06)') {
  const canvas = $(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 8;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const pct = score / 100;

  // Track
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  const scoreAngle = startAngle + (endAngle - startAngle) * pct;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, scoreAngle);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Glow dot at end
  const dotX = cx + Math.cos(scoreAngle) * r;
  const dotY = cy + Math.sin(scoreAngle) * r;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
  ctx.fillStyle = color2;
  ctx.shadowColor = color2;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Animate gauge score
function animateGauge(canvasId, targetScore, c1, c2) {
  let current = 0;
  const step = () => {
    current = Math.min(current + 1.5, targetScore);
    drawGauge(canvasId, current, c1, c2);
    if (current < targetScore) requestAnimationFrame(step);
  };
  step();
}

// ── Spending Doughnut ─────────────────────────────────────
const SPENDING_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function renderSpendingChart(categories) {
  const canvas = $('spendingChart');
  if (!canvas) return;

  if (spendingChartInstance) spendingChartInstance.destroy();

  spendingChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => c.amount),
        backgroundColor: SPENDING_COLORS,
        borderWidth: 0,
        hoverOffset: 8,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '70%',
      animation: { animateRotate: true, duration: 1200 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${fmt(ctx.raw)} (${categories[ctx.dataIndex].percentage}%)`
          },
          backgroundColor: 'rgba(13,21,48,0.95)',
          borderColor: 'rgba(139,92,246,0.3)',
          borderWidth: 1,
          titleColor: '#c4b5fd',
          bodyColor: '#94a3b8',
        }
      }
    }
  });

  // Legend
  const legend = $('spendingLegend');
  if (legend) {
    legend.innerHTML = categories.map((c, i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${SPENDING_COLORS[i]}"></div>
        <span class="legend-name">${c.category}</span>
        <span class="legend-pct">${c.percentage}%</span>
        <span class="legend-amt">₹${fmt(c.amount)}</span>
      </div>`).join('');
  }
}

// ── Wealth Line Chart ─────────────────────────────────────
function renderWealthChart(data) {
  const canvas = $('wealthChart');
  if (!canvas) return;
  if (wealthChartInstance) wealthChartInstance.destroy();

  const labels = data.map(d => d.month);
  const values = data.map(d => d.value);

  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(139,92,246,0.3)');
  grad.addColorStop(1, 'rgba(139,92,246,0)');

  wealthChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#8b5cf6',
        backgroundColor: grad,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#050918',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1400, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ₹${fmt(ctx.raw)}` },
          backgroundColor: 'rgba(13,21,48,0.95)',
          borderColor: 'rgba(139,92,246,0.3)',
          borderWidth: 1,
          titleColor: '#c4b5fd',
          bodyColor: '#f1f5f9',
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#475569', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: {
            color: '#475569', font: { size: 11 },
            callback: v => '₹' + (v >= 100000 ? (v/100000).toFixed(0) + 'L' : fmt(v))
          }
        }
      }
    }
  });
}

// ── Goals ─────────────────────────────────────────────────
function renderGoals(goals) {
  const el = $('goalsList');
  if (!el) return;
  el.innerHTML = goals.map(g => `
    <div class="goal-item">
      <div class="goal-header">
        <span class="goal-icon">${g.icon}</span>
        <div class="goal-info">
          <div class="goal-name">${g.name}</div>
          <div class="goal-amounts">₹${fmt(g.current_amount)} / ₹${fmt(g.target_amount)}</div>
          <div class="goal-deadline">Target: ${g.deadline ? new Date(g.deadline).toLocaleString('en-IN', {month:'short', year:'numeric'}) : 'N/A'}</div>
        </div>
        <span class="goal-pct">${g.progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:0%" data-target="${g.progress}"></div>
      </div>
    </div>`).join('');

  // Animate progress bars
  setTimeout(() => {
    el.querySelectorAll('.progress-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 200);
}

// ── AI Insights ───────────────────────────────────────────
async function loadInsights() {
  const el = $('insightsList');
  const btn = $('refreshInsights');
  if (!el) return;
  if (btn) btn.classList.add('spinning');

  el.innerHTML = `
    <div class="insight-skeleton"></div>
    <div class="insight-skeleton"></div>
    <div class="insight-skeleton"></div>`;

  try {
    const res = await fetch('/api/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    renderInsights(data.insights || []);
  } catch {
    el.innerHTML = '<p style="color:#ef4444;font-size:13px;">Failed to load insights. Please try again.</p>';
  }
  if (btn) btn.classList.remove('spinning');
}

function renderInsights(insights) {
  const el = $('insightsList');
  if (!el) return;
  el.innerHTML = insights.map((ins, i) => `
    <div class="insight-item" style="animation-delay:${i * 0.1}s">
      <div class="insight-icon insight-icon--${ins.type || 'default'}">${ins.icon || '💡'}</div>
      <div class="insight-text">${ins.message}</div>
    </div>`).join('');
}

// ── Greeting ──────────────────────────────────────────────
function setGreeting(name = 'Nilesh') {
  const h = new Date().getHours();
  const time = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const el = $('greetingTitle');
  if (el) el.textContent = `Good ${time}, ${name}! 👋`;
}

// ── Load Dashboard Data ───────────────────────────────────
async function loadDashboard() {
  try {
    const [dash, spending, goals, loan] = await Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/spending-analysis').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/loan-readiness').then(r => r.json()),
    ]);

    dashboardData = dash;
    spendingData = spending;

    const user = dash.user;
    setGreeting(user.name);

    // KPI
    const totalBal = (user.total_savings || 0) + (user.total_investments || 0);
    const monthlySav = (user.monthly_income || 0) - (user.monthly_expenses || 0);

    const balEl = $('totalBalance');
    const savEl = $('monthlySavings');
    const invEl = $('investmentsValue');

    if (balEl) { balEl.textContent = '₹' + fmt(totalBal); }
    if (savEl) { savEl.textContent = '₹' + fmt(monthlySav); }
    if (invEl) { invEl.textContent = '₹' + fmt(user.total_investments || 0); }

    // Health Score gauge
    const score = dash.financial_score?.score || 84;
    const scoreEl = $('healthScore');
    if (scoreEl) countUp(scoreEl, score);
    const labelEl = $('healthScoreLabel');
    if (labelEl) {
      labelEl.textContent = score >= 80 ? "Great! You're on the right track." :
                            score >= 60 ? "Good progress, keep going!" : "Let's improve your finances.";
    }
    animateGauge('scoreGauge', score, '#10b981', '#3b82f6');

    // Loan gauge
    const loanScore = loan.score || 78;
    const loanEl = $('loanScore');
    if (loanEl) countUp(loanEl, loanScore);
    animateGauge('loanGauge', loanScore, '#10b981', '#8b5cf6');
    const loanAmtEl = $('loanAmount');
    if (loanAmtEl) loanAmtEl.textContent = '₹' + fmt(loan.eligible_amount || 1200000);
    const loanTypeEl = $('loanType');
    if (loanTypeEl) loanTypeEl.textContent = loan.loan_type || 'Personal Loan';
    const loanLabelEl = $('loanLabel');
    if (loanLabelEl) loanLabelEl.textContent = loanScore >= 75 ? 'Good! You are loan ready.' : 'Work on your score to qualify.';

    // Spending total
    const stEl = $('spendingTotal');
    if (stEl) stEl.textContent = '₹' + fmt(spending.total || 65430);

    // Charts
    renderSpendingChart(spending.categories);
    renderWealthChart(dash.wealth_growth);
    renderGoals(goals.goals);

    // Insights (async, don't block)
    loadInsights();

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ── AI Chat ───────────────────────────────────────────────
function openAIChat() {
  const modal = $('aiModal');
  if (modal) modal.classList.add('open');
}

function closeAIChat() {
  const modal = $('aiModal');
  if (modal) modal.classList.remove('open');
}

async function sendChat() {
  const input = $('chatInput');
  const messages = $('chatMessages');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  // User message
  messages.innerHTML += `
    <div class="chat-msg user">
      <div class="chat-bubble">${text}</div>
    </div>`;

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `
    <div class="chat-msg bot" id="${typingId}">
      <div class="chat-bubble typing">Thinking</div>
    </div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    // Build financial context
    const context = dashboardData ? `
User financial context:
- Monthly Income: ₹${fmt(dashboardData.user.monthly_income)}
- Monthly Expenses: ₹${fmt(dashboardData.user.monthly_expenses)}
- Total Savings: ₹${fmt(dashboardData.user.total_savings)}
- Total Investments: ₹${fmt(dashboardData.user.total_investments)}
- Financial Health Score: ${dashboardData.financial_score?.score}/100
` : '';

    const res = await fetch('/api/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, context })
    });

    const data = await res.json();
    const reply = data.insights?.[0]?.message || data.message ||
      "Based on your financial profile, I recommend focusing on increasing your monthly savings rate and diversifying your investment portfolio. Would you like specific recommendations?";

    document.getElementById(typingId)?.remove();

    messages.innerHTML += `
      <div class="chat-msg bot">
        <div class="chat-bubble">${reply}</div>
      </div>`;
  } catch {
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `
      <div class="chat-msg bot">
        <div class="chat-bubble">I'm having trouble connecting right now. Please try again later.</div>
      </div>`;
  }

  messages.scrollTop = messages.scrollHeight;
}

// ── Profile Modal ─────────────────────────────────────────
function openProfileModal() {
  const modal = $('profileModal');
  if (modal) modal.classList.add('open');
}

function closeProfileModal() {
  const modal = $('profileModal');
  if (modal) modal.classList.remove('open');
}

async function updateProfile() {
  const data = {
    income: parseFloat($('pIncome')?.value || 95000),
    expenses: parseFloat($('pExpenses')?.value || 65430),
    savings: parseFloat($('pSavings')?.value || 245000),
    investments: parseFloat($('pInvestments')?.value || 875430),
    debt: parseFloat($('pDebt')?.value || 120000),
  };

  await fetch('/api/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  closeProfileModal();
  loadDashboard();
}

// ── Theme Toggle ──────────────────────────────────────────
let lightMode = false;
function initThemeToggle() {
  const btn = $('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    lightMode = !lightMode;
    btn.textContent = lightMode ? '☀️' : '🌙';
    document.body.classList.toggle('light-mode', lightMode);
  });
}

// ── Sidebar Toggle (mobile) ───────────────────────────────
function initSidebar() {
  const ham = $('hamburger');
  const sidebar = document.querySelector('.sidebar');
  if (!ham || !sidebar) return;
  ham.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && !ham.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ── Nav items (SPA-lite) ──────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sec = item.dataset.section;

      // Update active
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Handle routes
      if (sec === 'reports') { window.location.href = '/reports'; return; }
      if (sec === 'dashboard' && window.location.pathname !== '/dashboard') {
        window.location.href = '/dashboard'; return;
      }
    });
  });
}

function scrollToSection(sec) {
  // No-op on single page — could scroll to section if sections were implemented
}

// ── Ripple Effect ─────────────────────────────────────────
function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-outline, .btn-primary, .btn-promo');
    if (!btn) return;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      background:rgba(255,255,255,0.2);
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      transform:scale(0); animation:rippleAnim 0.5s ease;
      pointer-events:none;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // Inject ripple keyframe
  const style = document.createElement('style');
  style.textContent = '@keyframes rippleAnim { to { transform: scale(2); opacity: 0; } }';
  document.head.appendChild(style);
}

async function sendMessage() {

    const input =
        document.getElementById("userInput");

    const msg = input.value.trim();

    if (!msg) return;

    const messages =
        document.getElementById("chatMessages");

    messages.innerHTML += `
        <div class="user-message">
            ${msg}
        </div>
    `;

    input.value = "";

    const response = await fetch(
        "/api/chat",
        {
            method: "POST",
            headers: {
                "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
                message: msg
            })
        }
    );

    const data = await response.json();

    messages.innerHTML += `
        <div class="bot-message">
            ${data.response}
        </div>
    `;

    messages.scrollTop =
        messages.scrollHeight;
}

// ── Landing Page animations ───────────────────────────────
function initLanding() {
  if (!document.querySelector('.landing-hero')) return;

  // Animate features on scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'slideUp 0.5s ease both';
        e.target.style.opacity = '1';
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.feature-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.animationDelay = i * 0.08 + 's';
    obs.observe(card);
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCursorGlow();
  initReveal();
  initThemeToggle();
  initSidebar();
  initNav();
  initRipple();
  initLanding();

  // Load dashboard only on dashboard page
  if (document.querySelector('.kpi-grid')) {
    loadDashboard();

    // Period select for wealth chart
    const sel = $('periodSelect');
    if (sel) {
      sel.addEventListener('change', () => {
        if (!dashboardData) return;
        let data = dashboardData.wealth_growth;
        if (sel.value === '6m') data = data.slice(-6);
        if (sel.value === '3m') data = data.slice(-3);
        renderWealthChart(data);
      });
    }
  }

  // Avatar opens profile modal
  document.querySelector('.avatar')?.addEventListener('click', openProfileModal);

  // Close modals on backdrop click
  $('aiModal')?.addEventListener('click', e => {
    if (e.target === $('aiModal')) closeAIChat();
  });
  $('profileModal')?.addEventListener('click', e => {
    if (e.target === $('profileModal')) closeProfileModal();
  });
});

// Expose for HTML onclick
window.openAIChat = openAIChat;
window.closeAIChat = closeAIChat;
window.sendChat = sendChat;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.updateProfile = updateProfile;
window.loadInsights = loadInsights;
window.scrollToSection = scrollToSection;
