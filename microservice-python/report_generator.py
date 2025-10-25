# report_generator.py
import json
from data_fetcher import get_historical_data
from descriptive_metrics import analyze_portfolio
from risk_diagnostics import compute_risk_diagnostics
from forecasting_models import generate_forecasts
from optimization_engine import optimize_portfolio
import pandas as pd


# ---------------------------
# Utility: Convert NumPy types to Python native
# ---------------------------
def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif isinstance(obj, (float, int)):
        return obj
    elif hasattr(obj, 'tolist'):
        return obj.tolist()
    else:
        return obj


# ---------------------------
# Sweet Spot: Portfolio Report Generator
# ---------------------------
def generate_portfolio_report(holdings, steps=30, sims=500):
    """
    Generates a compact but informative 'sweet spot' JSON report:
    - Layer A: descriptive metrics
    - Layer B: risk diagnostics (with betas & simplified correlation)
    - Layer C: forecasts (expected return, trend, volatility, price range)
    - Layer D: optimization (max Sharpe, min volatility, CVaR)
    """

    # Base portfolio & holdings metrics
    descriptive_summary = analyze_portfolio(holdings)

    # Historical data for forecasting
    historical_data = {}
    for h in holdings:
        symbol = h["symbol"]
        end_date = pd.Timestamp.today().date()
        start_date = end_date - pd.Timedelta(days=365)
        historical_data[symbol] = get_historical_data(symbol, str(start_date), str(end_date))

    # Forecasting (compact)
    forecast_summary = generate_forecasts(holdings, historical_data, steps=steps, sims=sims)
    sweet_forecasts = {}
    for sym, f in forecast_summary.items():
        sweet_forecasts[sym] = {
            "currentPrice": f.get("currentPrice"),
            "expectedReturn": f["forecast"].get("expectedReturn"),
            "trend": f["forecast"].get("trendDirection"),
            "volatility": f["forecast"]["volatility"].get("average"),
            "priceRange": f["forecast"]["priceRange"].get("pctChangeRange")
        }

    # Risk diagnostics
    risk_summary = compute_risk_diagnostics(holdings)
    risk_metrics = risk_summary.get("riskMetrics", {})

    # Simplified correlation matrix (only pairwise)
    corr_matrix = risk_metrics.get("correlationMatrix", {})
    simple_corr = {k: {kk: round(vv, 4) for kk, vv in val.items()} for k, val in corr_matrix.items()}

    # Optimization
    optimization_summary = optimize_portfolio(forecast_summary, holdings)

    # Construct sweet spot JSON
    final_report = {
        "portfolio": {
            "portfolioValue": descriptive_summary.get("portfolioValue"),
            "totalCost": descriptive_summary.get("totalCost"),
            "profit": descriptive_summary.get("profit"),
            "profitPercent": descriptive_summary.get("profitPercent"),
            "sharpeRatio": descriptive_summary.get("sharpeRatio"),
            "holdings": descriptive_summary.get("holdings")
        },
        "riskMetrics": {
            "portfolioVolatility": risk_metrics.get("portfolioVolatility"),
            "valueAtRisk95": risk_metrics.get("valueAtRisk95"),
            "conditionalVaR95": risk_metrics.get("conditionalVaR95"),
            "maxDrawdown": risk_metrics.get("maxDrawdown"),
            "diversificationScore": risk_metrics.get("diversificationScore"),
            "betas": risk_metrics.get("betas"),
            "correlationMatrix": simple_corr
        },
        "forecasts": sweet_forecasts,
        "optimization": {
            "maxSharpe": optimization_summary["efficientFrontier"]["maxSharpe"]["weights"],
            "minVolatility": optimization_summary["efficientFrontier"]["minVolatility"]["weights"],
            "portfolioCVaR95": optimization_summary.get("portfolioCVaR95")
        }
    }

    # Ensure JSON-serializable
    return convert_numpy(final_report)


# ---------------------------
# Example Test Run
# ---------------------------
# if __name__ == "__main__":
#     holdings = [
#         {"symbol": "RVNL.NS", "quantity": 32, "avgCost": 357.06},
#         {"symbol": "BEL.NS", "quantity": 20, "avgCost": 271.66},
#         {"symbol": "ITC.NS", "quantity": 10, "avgCost": 380.36},
#     ]
#
#     report = generate_portfolio_report(holdings, steps=30, sims=500)
#     print(json.dumps(report, indent=2))
