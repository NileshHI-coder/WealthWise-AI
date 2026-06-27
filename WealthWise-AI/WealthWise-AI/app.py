"""
WealthWise AI - Flask Backend
AI-powered Digital Wealth Management Application
"""
import os
import json
import sqlite3
from flask import Flask, jsonify, request, render_template, g
from datetime import datetime, timedelta
import random
from models.financial_score import calculate_score
from models.goal_prediction import predict_goal
from models.loan_readiness import assess_loan
from models.spending_analysis import analyze_spending

app = Flask(__name__)
DATABASE = 'database.db'

# ─── Database Helpers ────────────────────────────────────────────────────────

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                monthly_income REAL DEFAULT 85000,
                monthly_expenses REAL DEFAULT 65430,
                total_savings REAL DEFAULT 245000,
                total_investments REAL DEFAULT 875430,
                total_debt REAL DEFAULT 120000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT,
                date TEXT NOT NULL,
                type TEXT DEFAULT 'expense'
            );

            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '🏠',
                target_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                deadline TEXT,
                monthly_contribution REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS financial_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                score INTEGER NOT NULL,
                category TEXT,
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS loan_readiness (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                score INTEGER NOT NULL,
                eligible_amount REAL,
                loan_type TEXT,
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT 1,
                type TEXT,
                message TEXT,
                priority TEXT DEFAULT 'medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # Seed data if empty
        user_count = db.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        if user_count == 0:
            db.execute('''INSERT INTO users (name, email, monthly_income, monthly_expenses, total_savings, total_investments, total_debt)
                          VALUES (?, ?, ?, ?, ?, ?, ?)''',
                       ('Nilesh', 'nilesh@example.com', 95000, 65430, 245000, 875430, 120000))

            # Seed transactions
            categories = ['Food', 'Shopping', 'Travel', 'Utilities', 'Entertainment']
            cat_amounts = {'Food': (2000, 8000), 'Shopping': (3000, 12000), 'Travel': (1000, 5000),
                           'Utilities': (2000, 4000), 'Entertainment': (500, 3000)}
            months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
                      '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
            for month in months:
                for cat in categories:
                    amt = random.randint(*cat_amounts[cat])
                    db.execute('INSERT INTO transactions (category, amount, description, date) VALUES (?, ?, ?, ?)',
                               (cat, amt, f'{cat} expenses', f'{month}-15'))

            # Seed goals
            db.execute('''INSERT INTO goals (name, icon, target_amount, current_amount, deadline, monthly_contribution)
                          VALUES (?, ?, ?, ?, ?, ?)''', ('Buy a House', '🏠', 5000000, 3400000, '2028-12-01', 45000))
            db.execute('''INSERT INTO goals (name, icon, target_amount, current_amount, deadline, monthly_contribution)
                          VALUES (?, ?, ?, ?, ?, ?)''', ('Child Education', '🎓', 3000000, 1560000, '2031-05-01', 22000))
            db.execute('''INSERT INTO goals (name, icon, target_amount, current_amount, deadline, monthly_contribution)
                          VALUES (?, ?, ?, ?, ?, ?)''', ('Dream Vacation', '✈️', 200000, 152000, '2025-08-01', 18000))

            # Seed financial score
            db.execute('INSERT INTO financial_scores (score, category) VALUES (?, ?)', (84, 'Good'))

            # Seed loan readiness
            db.execute('INSERT INTO loan_readiness (score, eligible_amount, loan_type) VALUES (?, ?, ?)',
                       (78, 1200000, 'Personal Loan'))

            # Seed recommendations
            recommendations = [
                ('savings', 'Your savings rate is excellent! Keep it up and consider increasing your investments.', 'low'),
                ('spending', 'Dining expenses increased by 18% this month. Try to optimize for better savings.', 'medium'),
                ('investment', 'You can invest an extra ₹2,000 monthly to reach your goals faster.', 'high'),
            ]
            for rec in recommendations:
                db.execute('INSERT INTO recommendations (type, message, priority) VALUES (?, ?, ?)', rec)

            db.commit()
        print("✅ Database initialized with seed data.")

# ─── Page Routes ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

# ─── Avatar Advisor Page ──────────────────────────────────────────────────────

@app.route('/advisor')
def advisor():
    return render_template('avatar.html')

# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.route('/api/dashboard')
def api_dashboard():
    db = get_db()

    user = dict(
        db.execute('SELECT * FROM users WHERE id = 1').fetchone()
    )

    # Financial Score Model
    score, category, breakdown = calculate_score(
        user['monthly_income'],
        user['monthly_expenses'],
        user['total_savings'],
        user['total_investments'],
        user['total_debt']
    )

    # Loan Readiness Model
    loan = assess_loan(
        user['monthly_income'],
        user['total_savings'],
        user['total_debt']
    )

    # Wealth Growth Chart
    wealth_growth = []
    base = (user['total_savings'] + user['total_investments']) * 0.7
    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    for m in months:
        base += random.randint(15000, 45000)
        wealth_growth.append({'month': m, 'value': round(base)})

    return jsonify({
        'user': user,
        'financial_score': {'score': score, 'category': category, 'breakdown': breakdown},
        'loan_readiness': loan,
        'wealth_growth': wealth_growth
    })


@app.route('/api/financial-score')
def api_financial_score():
    db = get_db()
    user = dict(db.execute('SELECT * FROM users WHERE id = 1').fetchone())

    score, category, breakdown = calculate_score(
        user['monthly_income'],
        user['monthly_expenses'],
        user['total_savings'],
        user['total_investments'],
        user['total_debt']
    )

    db.execute('INSERT INTO financial_scores (score, category) VALUES (?, ?)', (score, category))
    db.commit()

    return jsonify({'score': score, 'category': category, 'breakdown': breakdown})


@app.route('/api/goals')
def api_goals():
    db = get_db()
    goals = [dict(g) for g in db.execute('SELECT * FROM goals WHERE user_id = 1').fetchall()]

    for goal in goals:
        prediction = predict_goal(
            goal['target_amount'],
            goal['current_amount'],
            goal['monthly_contribution'],
            goal['deadline']
        )
        goal.update(prediction)

    return jsonify({'goals': goals})


@app.route('/api/goals', methods=['POST'])
def api_add_goal():
    data = request.get_json()
    db = get_db()
    db.execute(
        'INSERT INTO goals (name, icon, target_amount, current_amount, deadline, monthly_contribution) VALUES (?, ?, ?, ?, ?, ?)',
        (data['name'], data.get('icon', '🎯'), data['target_amount'],
         data.get('current_amount', 0), data.get('deadline', ''), data.get('monthly_contribution', 0))
    )
    db.commit()
    return jsonify({'success': True, 'message': 'Goal added successfully'})


@app.route('/api/spending-analysis')
def api_spending():
    db = get_db()

    rows = db.execute('''
        SELECT category, SUM(amount) as total
        FROM transactions
        WHERE user_id = 1 AND date LIKE "2025-12%"
        GROUP BY category
    ''').fetchall()

    spending = {row['category']: row['total'] for row in rows}

    user = db.execute('SELECT monthly_income FROM users WHERE id = 1').fetchone()
    monthly_income = user['monthly_income']

    analysis = analyze_spending(spending, monthly_income)

    total = sum(spending.values()) or 65430
    categories = ['Food', 'Shopping', 'Travel', 'Utilities', 'Entertainment']
    defaults   = [26172, 16358, 13086, 6543, 3271]

    result = []
    for cat, default in zip(categories, defaults):
        amt = spending.get(cat, default)
        result.append({'category': cat, 'amount': amt, 'percentage': round(amt / total * 100, 1)})

    # Monthly Trend Chart
    monthly = []
    base_month = {'Food': 4000, 'Shopping': 5000, 'Travel': 2000, 'Utilities': 2500, 'Entertainment': 1500}

    for m in ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:
        month_data = {'month': m}
        for cat in categories:
            month_data[cat] = base_month[cat] + random.randint(-500, 1500)
        monthly.append(month_data)

    return jsonify({
        'categories': result,
        'total': total,
        'monthly_trend': monthly,
        'alerts': analysis['alerts'],
        'opportunities': analysis['opportunities']
    })


@app.route('/api/loan-readiness')
def api_loan():
    db = get_db()
    user = dict(db.execute('SELECT * FROM users WHERE id = 1').fetchone())

    result = assess_loan(user['monthly_income'], user['total_savings'], user['total_debt'])

    db.execute(
        'INSERT INTO loan_readiness (score, eligible_amount, loan_type) VALUES (?, ?, ?)',
        (result['score'], result['eligible_amount'], result['loan_type'])
    )
    db.commit()

    return jsonify(result)


@app.route('/api/generate-insights', methods=['POST'])
def api_generate_insights():
    data = request.get_json() or {}
    db = get_db()
    user = dict(db.execute('SELECT * FROM users WHERE id = 1').fetchone())

    groq_key = os.environ.get('GROQ_API_KEY', '')
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            prompt = f"""You are a professional financial advisor AI. Analyze this financial data and provide 3 concise, actionable insights:

User Financial Data:
- Monthly Income: ₹{user['monthly_income']:,.0f}
- Monthly Expenses: ₹{user['monthly_expenses']:,.0f}
- Total Savings: ₹{user['total_savings']:,.0f}
- Total Investments: ₹{user['total_investments']:,.0f}
- Total Debt: ₹{user['total_debt']:,.0f}

Provide exactly 3 insights in JSON format:
{{"insights": [{{"type": "savings|spending|investment", "icon": "emoji", "message": "insight text", "priority": "high|medium|low"}}]}}

Be specific with Indian Rupee amounts. Keep each insight under 100 characters."""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            text = response.choices[0].message.content.strip()
            import re
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                result = json.loads(match.group())
                return jsonify(result)
        except Exception as e:
            print(f"Groq API error: {e}")

    # Fallback insights
    savings_rate = (user['monthly_income'] - user['monthly_expenses']) / user['monthly_income'] * 100
    insights = []

    if savings_rate > 25:
        insights.append({'type': 'savings', 'icon': '💰', 'message': f'Your savings rate of {savings_rate:.0f}% is excellent! Consider increasing SIP investments.', 'priority': 'low'})
    else:
        insights.append({'type': 'savings', 'icon': '⚠️', 'message': f'Savings rate of {savings_rate:.0f}% is below target. Aim for 30% monthly.', 'priority': 'high'})

    insights.append({'type': 'spending', 'icon': '🍽️', 'message': 'Dining expenses increased by 18% this month. Optimize for better savings.', 'priority': 'medium'})
    insights.append({'type': 'investment', 'icon': '📈', 'message': 'You can invest an extra ₹2,000 monthly to reach your goals faster.', 'priority': 'high'})

    return jsonify({'insights': insights})


# ─── Chatbot API (existing — used by chatbot.html) ────────────────────────────

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')
    history = data.get('history', [])   # conversation history for avatar advisor

    db = get_db()
    user = dict(db.execute('SELECT * FROM users WHERE id = 1').fetchone())

    score, category, breakdown = calculate_score(
        user['monthly_income'],
        user['monthly_expenses'],
        user['total_savings'],
        user['total_investments'],
        user['total_debt']
    )

    loan = assess_loan(
        user['monthly_income'],
        user['total_savings'],
        user['total_debt']
    )

    groq_key = os.environ.get('GROQ_API_KEY', '')

    if not groq_key:
        # Intelligent fallback so the avatar still works without a key
        reply = _fallback_reply(message, user, score, category, loan)
        return jsonify({'response': reply, 'reply': reply})

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)

        system_prompt = f"""You are Aria, a professional AI financial advisor for WealthWise AI — a premium digital wealth management platform. You are warm, knowledgeable, trustworthy, and speak in a concise, friendly, yet professional tone.

Current User Financial Profile:
- Name: {user['name']}
- Monthly Income: ₹{user['monthly_income']:,.0f}
- Monthly Expenses: ₹{user['monthly_expenses']:,.0f}
- Total Savings: ₹{user['total_savings']:,.0f}
- Total Investments: ₹{user['total_investments']:,.0f}
- Total Debt: ₹{user['total_debt']:,.0f}
- Financial Health Score: {score}/100 ({category})
- Loan Readiness Score: {loan['score']}/100
- Eligible Loan Amount: ₹{loan['eligible_amount']:,.0f}
- Recommended Loan Type: {loan['loan_type']}
- Savings Score: {breakdown['savings']} | Debt Score: {breakdown['debt']}
- Investment Score: {breakdown['investments']} | Balance Score: {breakdown['balance']}

Instructions:
- Address the user by their first name occasionally.
- Keep replies under 3 sentences unless a detailed explanation is genuinely needed.
- Always use Indian Rupee (₹) and Indian number formatting (lakhs, crores).
- Be actionable: give specific numbers and next steps.
- Do not use markdown formatting like ** or ## in your response.
- Never say you cannot access real-time data — work with the snapshot above."""

        # Build messages — include conversation history for the avatar advisor
        messages = [{"role": "system", "content": system_prompt}]
        for turn in history[-8:]:
            messages.append({"role": turn['role'], "content": turn['content']})
        messages.append({"role": "user", "content": message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        reply = response.choices[0].message.content

        # Return both keys so both chatbot.html and avatar.html work
        return jsonify({'response': reply, 'reply': reply})

    except Exception as e:
        print("Chatbot Error:", e)
        return jsonify({
            'response': "Sorry, I couldn't process your request right now.",
            'reply':    "Sorry, I couldn't process your request right now."
        })


# ─── Avatar Advisor Fallback (no Groq key) ───────────────────────────────────

def _fmt(n):
    """Format number in Indian style."""
    try:
        return '{:,.0f}'.format(float(n))
    except Exception:
        return str(n)


def _fallback_reply(msg, user, score, category, loan):
    """Intelligent rule-based fallback when Groq API key is not set."""
    msg_l   = msg.lower()
    name    = user['name']
    savings = (user['monthly_income'] or 0) - (user['monthly_expenses'] or 0)
    savings_rate = round(savings / user['monthly_income'] * 100) if user['monthly_income'] else 0

    if any(w in msg_l for w in ['hello', 'hi', 'hey', 'good']):
        return (f"Hello {name}! I am Aria, your WealthWise AI advisor. "
                f"Your financial health score is {score}/100. How can I help you today?")

    if any(w in msg_l for w in ['score', 'health', 'rating']):
        return (f"Your financial health score is {score}/100, rated '{category}'. "
                f"Key drivers are your {savings_rate}% savings ratio and "
                f"your investment portfolio of ₹{_fmt(user['total_investments'])}.")

    if any(w in msg_l for w in ['loan', 'borrow', 'credit', 'eligible', 'emi']):
        return (f"Based on your profile, you are eligible for a {loan['loan_type']} "
                f"of up to ₹{_fmt(loan['eligible_amount'])}. "
                f"Your loan readiness score is {loan['score']}/100.")

    if any(w in msg_l for w in ['save', 'saving', 'savings']):
        if savings_rate >= 30:
            tip = "You are already at the 30% target — great discipline!"
        else:
            gap = (0.30 * user['monthly_income']) - savings
            tip = f"Cutting discretionary spending by ₹{_fmt(gap)} would hit the 30% target."
        return (f"You are saving ₹{_fmt(savings)} per month — a {savings_rate}% rate. "
                f"The recommended target is 30%. {tip}")

    if any(w in msg_l for w in ['invest', 'mutual fund', 'sip', 'stock', 'portfolio']):
        return (f"Your investments stand at ₹{_fmt(user['total_investments'])}. "
                f"With a {savings_rate}% savings rate, consider allocating "
                f"an extra ₹2,000/month to index funds via SIP to accelerate compounding.")

    if any(w in msg_l for w in ['goal', 'house', 'home', 'vacation', 'education', 'target']):
        return ("Your goals are well tracked: Buy a House at 68%, Child Education at 52%, "
                "and Dream Vacation at 76%. Increasing monthly contributions by even ₹3,000 "
                "could shorten your timeline significantly.")

    if any(w in msg_l for w in ['spend', 'expense', 'budget', 'spending']):
        saving_opp = _fmt(user['monthly_expenses'] * 0.15)
        return (f"Your monthly expenses are ₹{_fmt(user['monthly_expenses'])}. "
                f"Dining and shopping are the top variable categories. "
                f"Trimming them by 15% could free up ₹{saving_opp} monthly.")

    if any(w in msg_l for w in ['debt', 'liability', 'owe']):
        return (f"Your total debt is ₹{_fmt(user['total_debt'])}. "
                f"At your income level the debt-to-income ratio is manageable. "
                f"Prioritise clearing high-interest debt first to improve your health score.")

    return (f"Great question, {name}! You have ₹{_fmt(user['total_savings'])} in savings "
            f"and a health score of {score}/100. "
            f"Ask me about savings, investments, goals, or loan eligibility for specific advice.")


# ─── Update Profile ───────────────────────────────────────────────────────────

@app.route('/api/update-profile', methods=['POST'])
def api_update_profile():
    data = request.get_json()
    db = get_db()
    db.execute(
        '''UPDATE users SET monthly_income=?, monthly_expenses=?, total_savings=?,
           total_investments=?, total_debt=? WHERE id=1''',
        (data.get('income', 95000), data.get('expenses', 65430),
         data.get('savings', 245000), data.get('investments', 875430), data.get('debt', 120000))
    )
    db.commit()
    return jsonify({'success': True})


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)