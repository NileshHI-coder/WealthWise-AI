# WealthWise AI — Goal Prediction Model

from datetime import datetime, timedelta

def predict_goal(target_amount, current_amount, monthly_contribution, deadline_str=None):
    """Returns prediction data for a financial goal."""
    remaining = max(target_amount - current_amount, 0)
    progress = round(current_amount / target_amount * 100, 1) if target_amount else 0

    if monthly_contribution > 0:
        months_needed = remaining / monthly_contribution
        predicted_date = datetime.now() + timedelta(days=months_needed * 30)
    else:
        months_needed = None
        predicted_date = None

    # Success probability
    if deadline_str and months_needed is not None:
        try:
            deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
            months_available = (deadline - datetime.now()).days / 30
            if months_available >= months_needed:
                probability = min(0.95, 0.6 + (months_available - months_needed) / months_available * 0.35)
            else:
                probability = max(0.1, months_available / months_needed * 0.6)
        except Exception:
            probability = 0.7
    else:
        probability = 0.7

    return {
        'progress': progress,
        'remaining': round(remaining),
        'months_needed': round(months_needed) if months_needed else None,
        'predicted_completion': predicted_date.strftime('%b %Y') if predicted_date else 'N/A',
        'success_probability': round(probability * 100),
    }
