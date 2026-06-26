# WealthWise AI — Loan Readiness Model

LOAN_PRODUCTS = [
    {'name': 'Personal Loan',  'min_score': 0,  'multiplier': 12, 'rate': '10.5%–18%'},
    {'name': 'Home Loan',      'min_score': 70, 'multiplier': 48, 'rate': '8.5%–10.5%'},
    {'name': 'Premium Loan',   'min_score': 85, 'multiplier': 60, 'rate': '7.5%–9%'},
]

def assess_loan(monthly_income, total_savings, total_debt, employment_months=24):
    """Returns loan readiness score, eligible amount, and recommended products."""
    income_score    = min(monthly_income / 100000 * 30, 30)
    savings_score   = min(total_savings / 500000 * 25, 25)
    debt_score      = max(0, (1 - total_debt / max(monthly_income * 12, 1)) * 25)
    employment_score = min(employment_months / 24 * 20, 20)

    total = income_score + savings_score + debt_score + employment_score
    score = int(min(max(total, 20), 100))

    eligible = monthly_income * 48 * 0.4 * (score / 100)
    eligible = round(eligible / 10000) * 10000  # round to nearest 10k

    suitable = [p for p in LOAN_PRODUCTS if score >= p['min_score']]
    recommended = suitable[-1] if suitable else LOAN_PRODUCTS[0]

    return {
        'score': score,
        'eligible_amount': eligible,
        'loan_type': recommended['name'],
        'interest_rate': recommended['rate'],
        'factors': {
            'income_stability': round(income_score / 30 * 100),
            'savings_strength': round(savings_score / 25 * 100),
            'debt_management': round(debt_score / 25 * 100),
            'employment': round(employment_score / 20 * 100),
        }
    }
