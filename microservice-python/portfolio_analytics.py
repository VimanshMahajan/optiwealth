import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from finance_data import get_current_quote, get_historical_data, compute_metrics

# -------------------------------------------------
# Compute Per-Holding Statistics
# -------------------------------------------------

# def analyze_holdings(holdings: list):
#     """
#     Takes a list of holdings (symbol, quantity, avgCost)
#     and computes per-holding analytics.
#     """
#     analyzed = []
#     for h in holdings:
#         symbol = h["symbol"] + ".NS" if not h["symbol"].endswith(".NS") else h["symbol"]
#         quantity = h["quantity"]
#         avg_cost = h["avgCost"]
#
#         quote = get_current_quote(symbol)
#         if not quote:
#             continue
#
#         current_price = quote["currentPrice"]
#         current_value = current_price * quantity
#         total_cost = avg_cost * quantity
#         profit = current_value - total_cost
#         profit_percent = ((current_price - avg_cost) / avg_cost) * 100 if avg_cost else None
#
#         analyzed.append({
#             "symbol": h["symbol"],
#             "quantity": quantity,
#             "avgCost": avg_cost,
#             "currentPrice": current_price,
#             "currentValue": current_value,
#             "profit": profit,
#             "profitPercent": profit_percent
#         })
#
#     return analyzed
#

# -------------------------------------------------
# Portfolio-Level Aggregation
# -------------------------------------------------

def analyze_holdings(holdings: list):
    """
    Takes a list of holdings (symbol, quantity, avgCost)
    and computes per-holding analytics (including historical risk metrics).
    """
    analyzed = []
    end = datetime.today().date()
    start = end - timedelta(days=90)  # last 3 months for metrics

    for h in holdings:
        symbol = h["symbol"] + ".NS" if not h["symbol"].endswith(".NS") else h["symbol"]
        quantity = h["quantity"]
        avg_cost = h["avgCost"]

        quote = get_current_quote(symbol)
        if not quote:
            continue

        current_price = quote["currentPrice"]
        current_value = current_price * quantity
        total_cost = avg_cost * quantity
        profit = current_value - total_cost
        profit_percent = ((current_price - avg_cost) / avg_cost) * 100 if avg_cost else None

        # --- NEW: compute historical metrics ---
        hist = get_historical_data(symbol, str(start), str(end))
        stock_metrics = compute_metrics(hist) if not hist.empty else {}

        analyzed.append({
            "symbol": h["symbol"],
            "quantity": int(quantity),
            "avgCost": float(avg_cost),
            "currentPrice": float(current_price),
            "currentValue": float(current_value),
            "profit": float(profit),
            "profitPercent": float(profit_percent) if profit_percent is not None else None,
            "volatility": float(stock_metrics.get("volatility")) if stock_metrics.get(
                "volatility") is not None else None,
            "sharpeRatio": float(stock_metrics.get("sharpeRatio")) if stock_metrics.get(
                "sharpeRatio") is not None else None,
            "cumulativeReturn": float(stock_metrics.get("cumulativeReturn")) if stock_metrics.get(
                "cumulativeReturn") is not None else None
        })

    return analyzed

def compute_portfolio_summary(analyzed_holdings: list):
    """
    Compute total portfolio value, profit/loss, etc.
    """
    total_value = sum(h["currentValue"] for h in analyzed_holdings)
    total_cost = sum(h["avgCost"] * h["quantity"] for h in analyzed_holdings)
    profit = total_value - total_cost
    profit_percent = ((total_value - total_cost) / total_cost * 100) if total_cost else None

    for h in analyzed_holdings:
        h["currentPercent"] = float(h["currentValue"] / total_value * 100) if total_value else 0.0

    return {
        "portfolioValue": total_value,
        "totalCost": total_cost,
        "profit": profit,
        "profitPercent": profit_percent
    }


# -------------------------------------------------
# Portfolio Risk Metrics (Volatility, Sharpe)
# -------------------------------------------------
def compute_portfolio_metrics(holdings: list, period_days: int = 90, risk_free_rate: float = 0.06):
    """
    Use historical data for Sharpe ratio, volatility, etc.
    Weighted combination of all assets.
    """
    returns_data = pd.DataFrame()
    end = datetime.today().date()
    start = end - timedelta(days=period_days)

    for h in holdings:
        symbol = h["symbol"] + ".NS" if not h["symbol"].endswith(".NS") else h["symbol"]
        hist = get_historical_data(symbol, str(start), str(end))
        if hist.empty:
            continue
        hist["Return"] = hist["Close"].pct_change()
        returns_data[h["symbol"]] = hist["Return"]

    returns_data.dropna(inplace=True)
    if returns_data.empty:
        return {"sharpeRatio": None, "volatility": None}

    weights = np.array([h["quantity"] for h in holdings])
    weights = weights / weights.sum()

    cov_matrix = returns_data.cov()
    avg_returns = returns_data.mean()

    portfolio_return = np.dot(weights, avg_returns)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    sharpe_ratio = (portfolio_return - (risk_free_rate / 252)) / portfolio_volatility if portfolio_volatility else None

    return {
        "averageDailyReturn": float(portfolio_return),
        "volatility": float(portfolio_volatility),
        "sharpeRatio": float(sharpe_ratio) if sharpe_ratio is not None else None
    }


# -------------------------------------------------
# Simple Modern Portfolio Optimization (MPT)
# -------------------------------------------------
def optimize_portfolio(holdings: list, num_portfolios: int = 5000, risk_free_rate: float = 0.06):
    """
    Find optimal allocation using Monte Carlo-based MPT simulation.
    """
    returns_data = pd.DataFrame()
    end = datetime.today().date()
    start = end - timedelta(days=180)

    for h in holdings:
        symbol = h["symbol"] + ".NS" if not h["symbol"].endswith(".NS") else h["symbol"]
        hist = get_historical_data(symbol, str(start), str(end))
        if hist.empty:
            continue
        hist["Return"] = hist["Close"].pct_change()
        returns_data[h["symbol"]] = hist["Return"]

    returns_data.dropna(inplace=True)
    if returns_data.empty:
        return []

    avg_returns = returns_data.mean()
    cov_matrix = returns_data.cov()
    symbols = returns_data.columns.tolist()

    best_sharpe = -np.inf
    best_weights = None

    for _ in range(num_portfolios):
        weights = np.random.random(len(symbols))
        weights /= np.sum(weights)
        ret = np.dot(weights, avg_returns)
        vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        sharpe = (ret - (risk_free_rate / 252)) / vol if vol else 0

        if sharpe > best_sharpe:
            best_sharpe = sharpe
            best_weights = weights

    recommended = []
    if best_weights is not None:
        for symbol, w in zip(symbols, best_weights):
            recommended.append({
                "symbol": symbol,
                "recommendedPercent": float(round(w * 100, 2))
            })
    return recommended


# -------------------------------------------------
# Main Orchestrator
# -------------------------------------------------
def analyze_portfolio(portfolio_data: dict):
    """
    Main entry point — used by controller.
    Takes in portfolio JSON and returns enriched analytics.
    """
    holdings = portfolio_data.get("holdings", [])
    analyzed_holdings = analyze_holdings(holdings)
    summary = compute_portfolio_summary(analyzed_holdings)
    metrics = compute_portfolio_metrics(holdings)
    optimal = optimize_portfolio(holdings)

    diversification_note = "Portfolio seems balanced."
    max_alloc = max(h["currentPercent"] for h in analyzed_holdings)
    if max_alloc > 50:
        diversification_note = "Portfolio is concentrated; consider diversifying."

    result = {
        "portfolioId": portfolio_data["portfolioId"],
        **summary,
        **metrics,
        "optimalWeights": optimal,
        "diversificationAdvice": diversification_note,
        "holdings": analyzed_holdings
    }

    return result


# -------------------------------------------------
# Testing
# -------------------------------------------------
if __name__ == "__main__":
    sample_portfolio = {
        "portfolioId": 2,
        "holdings": [
            {"symbol": "RVNL", "quantity": 15, "avgCost": 200.10},
            {"symbol": "BEL", "quantity": 5, "avgCost": 100.30},
            {"symbol": "ITC", "quantity": 10, "avgCost": 103.80}
        ]
    }

    result = analyze_portfolio(sample_portfolio)
    print(result)