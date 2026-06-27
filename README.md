# WealthWise AI 💜

> **AI-Powered Digital Wealth Management Platform with Avatar Financial Advisor**
> Built with Flask · SQLite · Groq AI (Llama 3.3 70B) · Chart.js · Glassmorphism UI

---

## 📸 Features at a Glance

- 🏦 **Financial Health Score** — Dynamic scoring engine (savings, debt, investments, balance)
- 📊 **Spending Analysis** — Doughnut chart with category breakdown & overspending alerts
- 📈 **Wealth Growth Analytics** — Animated line chart with monthly trends
- 🎯 **Goal-Based Planning** — Track House, Education, Vacation goals with progress bars
- 🏷️ **Loan Readiness** — Score meter + eligible amount + loan type recommendation
- 🤖 **Avatar AI Advisor (Aria)** — CSS-only SVG avatar with TTS, voice waveform & chat
- 💡 **AI Insights** — Groq/Llama-powered personalized financial recommendations
- 📋 **Financial Reports** — Bar, line, doughnut charts across all categories
- ✨ **Premium UI** — Glassmorphism, neon glows, particle background, smooth animations

---

## 🚀 Quick Start

### 1. Clone / Download the project

```bash
cd wealthwise-ai
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv

# Activate
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Groq API key (optional but recommended)

```bash
cp .env.example .env
```

Edit `.env` and add your key:

```
GROQ_API_KEY=your_groq_api_key_here
```

> Get a free key at [https://console.groq.com](https://console.groq.com)
> The app works fully without a key using intelligent built-in fallback responses.

### 5. Run the app

```bash
python app.py
```

### 6. Open in browser

| Page | URL |
|---|---|
| Landing Page | http://127.0.0.1:5000 |
| Dashboard | http://127.0.0.1:5000/dashboard |
| Avatar Advisor | http://127.0.0.1:5000/advisor |
| Reports | http://127.0.0.1:5000/reports |

---

## 📁 Project Structure

```
wealthwise-ai/
│
├── app.py                        # Flask backend — all routes & API endpoints
├── database.db                   # SQLite database (auto-created on first run)
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
├── README.md
│
├── static/
│   ├── css/
│   │   ├── style.css             # Main dashboard styles (glassmorphism, animations)
│   │   └── avatar.css            # Avatar advisor styles (scoped, additive only)
│   └── js/
│       ├── script.js             # Dashboard charts, particles, API calls
│       └── avatar.js             # Avatar chat, TTS, animations (uses eid() not $)
│
├── templates/
│   ├── index.html                # Landing page
│   ├── dashboard.html            # Main dashboard
│   ├── avatar.html               # Avatar AI advisor page
│   ├── chatbot.html              # Original chatbot page
│   └── reports.html              # Financial reports
│
└── models/
    ├── financial_score.py        # Health score calculation engine
    ├── spending_analysis.py      # Spending categorization & alerts
    ├── goal_prediction.py        # Goal forecasting & success probability
    └── loan_readiness.py         # Loan eligibility scoring model
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| GET | `/dashboard` | Main dashboard |
| GET | `/advisor` | Avatar AI advisor |
| GET | `/chatbot` | Original chatbot |
| GET | `/reports` | Financial reports |
| GET | `/api/dashboard` | Full dashboard data (user, score, loan, chart) |
| GET | `/api/financial-score` | Recalculate & return health score |
| GET | `/api/goals` | All goals with predictions |
| POST | `/api/goals` | Add a new goal |
| GET | `/api/spending-analysis` | Spending breakdown + alerts |
| GET | `/api/loan-readiness` | Loan score & eligibility |
| POST | `/api/generate-insights` | AI insights via Groq |
| POST | `/api/chat` | Conversational AI chat (avatar + chatbot) |
| POST | `/api/update-profile` | Update user financial profile |

---

## 🤖 Avatar AI Advisor — Aria

The avatar advisor lives at `/advisor` and is built from 3 dedicated files:

| File | Purpose |
|---|---|
| `templates/avatar.html` | Page layout — reuses existing sidebar, topbar, glassmorphism classes |
| `static/css/avatar.css` | All avatar styles scoped to `.advisor-page` — zero interference with `style.css` |
| `static/js/avatar.js` | Chat logic, TTS, animations — uses `eid()` instead of `$()` to avoid conflict with `script.js` |

### Avatar Features

| Feature | Details |
|---|---|
| CSS-only SVG avatar | Professional banker face with suit, eyes, mouth — no Three.js |
| Floating animation | Smooth up/down idle float |
| Breathing animation | Subtle body scale on idle |
| Eye blink | Auto-blink every 4 seconds |
| Active pulse ring | Spinning glow ring while Aria is thinking/responding |
| Bounce on reply | Avatar bounces when a new message arrives |
| Typing indicator | Three animated dots while waiting for API |
| Text-to-Speech | Browser Speech Synthesis API, prefers `en-IN` voice |
| Voice waveform | 7-bar animated equalizer shown while TTS plays |
| Mute/unmute | Toggle button to silence TTS |
| Conversation history | Last 8 turns sent to Groq for context-aware replies |
| Quick questions | 5 preset financial questions for instant interaction |
| Session timer | Live elapsed session time and message counter |
| Fallback replies | 8 topic-aware responses when Groq key is not set |
| Fully responsive | Mobile collapses avatar to a top strip |

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | User profile & financial figures |
| `transactions` | Monthly expense transactions by category |
| `goals` | Savings goals with target, current, deadline |
| `financial_scores` | Historical health score records |
| `loan_readiness` | Historical loan score records |
| `recommendations` | AI-generated financial recommendations |

The database is **auto-created and seeded** with realistic sample data on first run — no setup needed.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4 |
| Backend | Python Flask 3.0 |
| Database | SQLite |
| AI / LLM | Groq API — Llama 3.3 70B Versatile |
| Voice | Web Speech Synthesis API (browser built-in) |
| Animations | CSS Keyframes, Intersection Observer |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | Deep Navy `#050918` |
| Primary | Purple `#8b5cf6` |
| Accent | Electric Blue `#3b82f6` |
| Success | Neon Green `#10b981` |
| Warning | Amber `#f59e0b` |
| Text | Soft White `#f1f5f9` |
| Cards | Glassmorphism — `rgba(13,21,48,0.65)` + `backdrop-filter: blur(16px)` |

---

## 🗺️ Future Development Roadmap

- [ ] User Authentication (Login / Register)
- [ ] OTP & Email Verification
- [ ] Real-time Bank Transaction Sync
- [ ] Account Aggregator Integration
- [ ] Investment Marketplace
- [ ] Voice Input for Avatar (Speech-to-Text)
- [ ] Mobile Application (Android / iOS)
- [ ] Multi-language Support (Hindi, Gujarati, Tamil)
- [ ] Dark / Light Mode Toggle
- [ ] PDF Export of Financial Reports
- [ ] Push Notifications for Spending Alerts
- [ ] AI Goal Auto-adjustment based on spending patterns

---

## ⚠️ Important Notes

- **Data is simulated** — all financial figures are sample/seed data for demonstration.
- **No authentication** — single user (Nilesh) is pre-seeded. Auth is listed under Future Development.
- **Groq API is optional** — the app runs fully offline with smart fallback responses covering savings, loans, investments, goals, spending, debt, and health score queries.
- Built for **national-level hackathon demonstration**.

---

*WealthWise AI — Smart, Beautiful, and Impactful* 💜
