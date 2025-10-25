# descriptive_metrics.py
from datetime import datetime, timedelta
import numpy as np
from data_fetcher import (
    get_current_quote,
    get_historical_data,
    compute_metrics,
)

# ----------------------------------------------------------
# Analyze individual holding
# ----------------------------------------------------------
def analyze_holding(symbol: str, quantity: float, avg_cost: float):
    """
    Compute descriptive stats for one holding.
    Combines current quote + derived metrics + P&L.
    """
    # Current quote
    quote = get_current_quote(symbol)
    if not quote:
        return None

    # Historical metrics (1 year default)
    end_date = datetime.today().date()
    start_date = end_date - timedelta(days=365)
    hist = get_historical_data(symbol, str(start_date), str(end_date))
    derived = compute_metrics(hist) if not hist.empty else None

    # P&L computation
    current_price = quote["currentPrice"]
    current_value = quantity * current_price
    total_cost = quantity * avg_cost
    profit = current_value - total_cost
    profit_percent = (profit / total_cost) * 100 if total_cost > 0 else 0

    # Merge metrics
    return {
        "symbol": symbol,
        "quantity": quantity,
        "avgCost": round(avg_cost, 2),
        "currentPrice": round(current_price, 2),
        "currentValue": round(current_value, 2),
        "profit": round(profit, 2),
        "profitPercent": round(profit_percent, 2),
        "volatility": derived["volatility"] if derived else None,
        "sharpeRatio": derived["sharpeRatio"] if derived else None,
        "cumulativeReturn": derived["cumulativeReturn"] if derived else None,
        "averageDailyReturn": derived["averageDailyReturn"] if derived else None,
        "timestamp": quote["timestamp"],
    }


# ----------------------------------------------------------
# Analyze full portfolio
# ----------------------------------------------------------
def analyze_portfolio(holdings: list):
    """
    holdings = [
        {"symbol": "RVNL", "quantity": 15, "avgCost": 200.10},
        {"symbol": "BEL", "quantity": 5, "avgCost": 100.30},
        ...
    ]
    """
    results = []
    for h in holdings:
        res = analyze_holding(h["symbol"], h["quantity"], h["avgCost"])
        if res:
            results.append(res)

    if not results:
        return {"error": "No valid holdings found."}

    # Aggregate portfolio stats
    total_value = sum(r["currentValue"] for r in results)
    total_cost = sum(r["quantity"] * r["avgCost"] for r in results)
    total_profit = total_value - total_cost
    profit_percent = (total_profit / total_cost) * 100 if total_cost > 0 else 0

    # Weight percentages
    for r in results:
        r["currentPercent"] = (r["currentValue"] / total_value * 100) if total_value > 0 else 0

    # Portfolio averages
    avg_daily_return = np.nanmean([r["averageDailyReturn"] for r in results if r["averageDailyReturn"] is not None])
    avg_volatility = np.nanmean([r["volatility"] for r in results if r["volatility"] is not None])
    avg_sharpe = np.nanmean([r["sharpeRatio"] for r in results if r["sharpeRatio"] is not None])

    return {
        "portfolioValue": round(total_value, 2),
        "totalCost": round(total_cost, 2),
        "profit": round(total_profit, 2),
        "profitPercent": round(profit_percent, 2),
        "averageDailyReturn": round(float(avg_daily_return), 6),
        "volatility": round(float(avg_volatility), 6),
        "sharpeRatio": round(float(avg_sharpe), 4),
        "holdings": results,
    }
#
# if __name__ == "__main__":
#     holdings = [
#         {"symbol": "RVNL.NS", "quantity": 32, "avgCost": 357.06},
#         {"symbol": "BEL.NS", "quantity": 20, "avgCost": 271.66},
#         {"symbol": "ITC.NS", "quantity": 10, "avgCost": 380.36}
#     ]
#
#     summary = analyze_portfolio(holdings)
#     print(summary)
