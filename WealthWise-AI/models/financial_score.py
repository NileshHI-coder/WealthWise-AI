# WealthWise AI — Financial Score Model
"""
Calculates a composite financial health score based on
savings ratio, debt burden, investment growth, and cash balance.
"""

def calculate_score(income, expenses, savings, investments, debt):
    """Returns (score: int, category: str, breakdown: dict)"""
    if income <= 0:
        return 0, 'Invalid', {}

    savings_ratio = max(0, min((income - expenses) / income, 1)) * 30
    debt_ratio = max(0, 1 - debt / max(income * 6, 1)) * 25
    investment_ratio = min(investments / max(income * 12, 1), 2) * 10
    balance_months = savings / max(expenses, 1)
    balance_score = min(balance_months / 6, 1) * 25
    diversity = 10  # baseline

    total = savings_ratio + debt_ratio + investment_ratio + balance_score + diversity
    score = int(min(max(total, 10), 98))

    if score >= 85:
        cat = 'Excellent'
    elif score >= 70:
        cat = 'Good'
    elif score >= 50:
        cat = 'Fair'
    else:
        cat = 'Needs Improvement'

    return score, cat, {
        'savings': round(savings_ratio, 1),
        'debt': round(debt_ratio, 1),
        'investments': round(investment_ratio, 1),
        'balance': round(balance_score, 1),
    }
