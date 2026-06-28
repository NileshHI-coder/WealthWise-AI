# WealthWise AI — Spending Analysis Model

CATEGORY_BUDGETS = {
    'Food': 0.15,
    'Shopping': 0.10,
    'Travel': 0.08,
    'Utilities': 0.06,
    'Entertainment': 0.05,
}

def analyze_spending(expenses_by_category, monthly_income):
    """Returns alerts and saving opportunities."""
    alerts = []
    opportunities = []
    total = sum(expenses_by_category.values())

    for cat, amount in expenses_by_category.items():
        budget_pct = CATEGORY_BUDGETS.get(cat, 0.10)
        budget_amt = monthly_income * budget_pct
        if amount > budget_amt * 1.2:
            excess = amount - budget_amt
            alerts.append({
                'category': cat,
                'message': f'{cat} spending is {round((amount/budget_amt-1)*100)}% over budget.',
                'excess': round(excess),
                'priority': 'high' if amount > budget_amt * 1.5 else 'medium',
            })
        elif amount < budget_amt * 0.7:
            saving = budget_amt - amount
            opportunities.append({
                'category': cat,
                'message': f'Great job on {cat}! You saved ₹{round(saving):,} vs budget.',
                'saved': round(saving),
            })

    return {'alerts': alerts, 'opportunities': opportunities, 'total': round(total)}
