# WealthWise AI 💜

> **AI-Powered Digital Wealth Management Platform**  
> Built with Flask · SQLite · Groq AI · Chart.js · Glassmorphism UI

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure Groq API (optional — app works without it)
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 3. Run the app
python app.py

# 4. Open in browser
# http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
wealthwise-ai/
├── app.py                    # Flask backend, all API routes
├── database.db               # SQLite (auto-created on first run)
├── requirements.txt
├── .env.example
├── static/
│   ├── css/style.css         # Premium fintech CSS (glassmorphism, animations)
│   └── js/script.js          # Charts, particles, AI chat, animations
├── templates/
│   ├── index.html            # Landing page
│   ├── dashboard.html        # Main dashboard
│   └── reports.html          # Financial reports
    └── chatbot.html          # AI Advisor

└── models/
    ├── financial_score.py    # Health score engine
    ├── spending_analysis.py  # Spending categorization
    ├── goal_prediction.py    # Goal forecasting
    └── loan_readiness.py     # Loan eligibility model
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | All dashboard data |
| GET | `/api/financial-score` | Recalculate health score |
| GET | `/api/goals` | Goal progress |
| POST | `/api/goals` | Add new goal |
| GET | `/api/spending-analysis` | Spending breakdown |
| GET | `/api/loan-readiness` | Loan score & eligibility |
| POST | `/api/generate-insights` | AI-powered insights (Groq) |
| POST | `/api/update-profile` | Update financial profile |

---

## ✨ Features

- **Financial Health Score** — Dynamic scoring (savings, debt, investments, balance)
- **Spending Analysis** — Doughnut chart with category breakdown
- **Wealth Growth** — Animated line chart with monthly trends
- **Goal Planning** — Buy a House · Child Education · Dream Vacation with progress bars
- **Loan Readiness** — Score meter + eligible amount + loan type recommendation
- **AI Insights** — Groq/Llama-powered personalized financial advice
- **AI Chat** — Ask anything about your finances
- **Particle Background** — Canvas-based animated particles
- **Glassmorphism UI** — Blur cards, neon glows, gradient borders
- **Fully Responsive** — Mobile, tablet, desktop

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.4 |
| Backend | Python Flask |
| Database | SQLite |
| AI | Groq API (Llama 3.1 8B) |

---

## 🗺 Future Development

- ✅ User Authentication (Login/Register)
- ✅ OTP & Email Verification
- ✅ Real-time Bank Transaction Sync
- ✅ Account Aggregator Integration
- ✅ Investment Marketplace
- ✅ Voice Assistant (AI Chatbot)
- ✅ Mobile Application (Android/iOS)
- ✅ Multi-language Support

---

*Built for national-level hackathon demonstration. Data is simulated.*
