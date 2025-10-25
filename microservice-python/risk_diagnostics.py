import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_fetcher import get_historical_data, compute_metrics
from descriptive_metrics import analyze_portfolio

# -----------------------------
# Helper: Max Drawdown
# -----------------------------
def compute_max_drawdown(returns_series: pd.Series):
    cumulative = (1 + returns_series).cumprod()
    peak = cumulative.cummax()
    drawdown = (cumulative - peak) / peak
    return drawdown.min()


# -----------------------------
# Helper: Value at Risk (VaR)
# -----------------------------
def compute_var(returns: pd.Series, confidence=0.95):
    if returns.empty:
        return None
    return np.percentile(returns, (1 - confidence) * 100)


# -----------------------------
# Helper: Conditional VaR (CVaR)
# -----------------------------
def compute_cvar(returns: pd.Series, confidence=0.95):
    var = compute_var(returns, confidence)
    if var is None:
        return None
    return returns[returns < var].mean()


# -----------------------------
# Helper: Beta vs Benchmark
# -----------------------------
def compute_beta(asset_returns: pd.Series, benchmark_returns: pd.Series):
    # Convert to 1D np.array
    asset_arr = np.asarray(asset_returns).flatten()
    bench_arr = np.asarray(benchmark_returns).flatten()

    # Align lengths
    min_len = min(len(asset_arr), len(bench_arr))
    asset_arr = asset_arr[-min_len:]
    bench_arr = bench_arr[-min_len:]

    # Compute covariance and variance
    covariance = np.cov(asset_arr, bench_arr)[0][1]
    market_var = np.var(bench_arr)
    return covariance / market_var if market_var != 0 else None



# -----------------------------
# Core: Risk Diagnostics Layer
# -----------------------------
# -----------------------------
# Utility: Convert numpy floats to Python floats
# -----------------------------
def convert_numpy_to_python(obj):
    """
    Recursively convert all np.float64 or np.int64 in dict/list to native Python float/int.
    """
    if isinstance(obj, dict):
        return {k: convert_numpy_to_python(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_to_python(i) for i in obj]
    elif isinstance(obj, (np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.int64, np.int32)):
        return int(obj)
    else:
        return obj

def compute_risk_diagnostics(holdings):
    """
    Takes holdings list and returns extended risk metrics for the full portfolio.
    """

    # Base descriptive stats
    base_summary = analyze_portfolio(holdings)
    holding_symbols = [h["symbol"] for h in base_summary["holdings"]]

    # Fetch 1Y historical data for all holdings
    end_date = datetime.today().date()
    start_date = end_date - timedelta(days=365)
    price_data = pd.DataFrame()

    for sym in holding_symbols:
        df = get_historical_data(sym, str(start_date), str(end_date))
        if not df.empty:
            price_data[sym] = df.set_index("Date")["Close"].squeeze()

    price_data.dropna(inplace=True)

    if price_data.empty:
        return {**base_summary, "riskMetrics": {"warning": "No sufficient price data"}}

    # Daily returns matrix
    returns = price_data.pct_change().dropna()

    # Portfolio-level risk measures
    correlation_matrix = returns.corr()
    portfolio_volatility = np.sqrt(np.dot(base_summary["volatility"], base_summary["volatility"]))

    # Benchmark (NIFTY 50)
    benchmark_df = get_historical_data("^NSEI", str(start_date), str(end_date))
    benchmark_returns = benchmark_df["Close"].pct_change().dropna() if not benchmark_df.empty else pd.Series()

    betas = {}
    for sym in holding_symbols:
        if not benchmark_returns.empty and sym in returns.columns:
            beta = compute_beta(returns[sym], benchmark_returns)
            betas[sym] = round(beta, 3) if beta is not None else None

    # Value at Risk / Conditional VaR / Max Drawdown
    portfolio_returns = returns.mean(axis=1)
    var_95 = compute_var(portfolio_returns, 0.95)
    cvar_95 = compute_cvar(portfolio_returns, 0.95)
    max_dd = compute_max_drawdown(portfolio_returns)

    diversification_score = (1 - correlation_matrix.abs().mean().mean()) * 100

    risk_metrics = {
        "correlationMatrix": correlation_matrix.to_dict(),
        "portfolioVolatility": round(float(portfolio_volatility), 6),
        "valueAtRisk95": round(float(var_95), 6) if var_95 else None,
        "conditionalVaR95": round(float(cvar_95), 6) if cvar_95 else None,
        "maxDrawdown": round(float(max_dd), 6) if max_dd else None,
        "betas": betas,
        "diversificationScore": round(float(diversification_score), 2),
    }

    # Merge everything
    enriched_summary = {**base_summary, "riskMetrics": risk_metrics}
    return convert_numpy_to_python(enriched_summary)

# if __name__ == "__main__":
#     holdings = [
#         {"symbol": "RVNL.NS", "quantity": 32, "avgCost": 357.06},
#         {"symbol": "BEL.NS", "quantity": 20, "avgCost": 271.66},
#         {"symbol": "ITC.NS", "quantity": 10, "avgCost": 380.36},
#     ]
#
#     risk_summary = compute_risk_diagnostics(holdings)
#     print(risk_summary)
#
