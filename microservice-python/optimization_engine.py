# optimization_engine.py
import numpy as np
import pandas as pd


def calculate_portfolio_metrics(weights, expected_returns, cov_matrix):
    """
    Compute expected return and volatility for a given portfolio allocation.
    """
    port_return = np.dot(weights, expected_returns)
    port_vol = np.sqrt(weights.T @ cov_matrix @ weights)
    return port_return, port_vol


def simulate_efficient_frontier(forecasts, holdings, simulations=5000):
    """
    Monte Carlo simulation to approximate the efficient frontier.
    Returns a dictionary with optimal portfolio allocations and metrics.
    """
    symbols = [h['symbol'] for h in holdings]

    # Extract expected returns and volatility from forecasts
    expected_returns = np.array([forecasts[s]['forecast']['expectedReturn'] for s in symbols])
    volatilities = np.array([forecasts[s]['forecast']['volatility']['average'] for s in symbols])

    # Construct covariance matrix (assume diagonal for simplicity if no correlation info)
    cov_matrix = np.diag(volatilities ** 2)

    results = []
    for _ in range(simulations):
        weights = np.random.random(len(symbols))
        weights /= np.sum(weights)
        port_return, port_vol = calculate_portfolio_metrics(weights, expected_returns, cov_matrix)
        results.append({'weights': weights, 'return': port_return, 'volatility': port_vol})

    # Find portfolios with max Sharpe ratio and min volatility
    results_df = pd.DataFrame(results)
    results_df['sharpe'] = results_df['return'] / results_df['volatility']
    max_sharpe_idx = results_df['sharpe'].idxmax()
    min_vol_idx = results_df['volatility'].idxmin()

    optimal_portfolios = {
        'maxSharpe': {
            'weights': dict(zip(symbols, results_df.loc[max_sharpe_idx, 'weights'].round(4))),
            'expectedReturn': round(float(results_df.loc[max_sharpe_idx, 'return']), 6),
            'volatility': round(float(results_df.loc[max_sharpe_idx, 'volatility']), 6),
            'sharpeRatio': round(float(results_df.loc[max_sharpe_idx, 'sharpe']), 6)
        },
        'minVolatility': {
            'weights': dict(zip(symbols, results_df.loc[min_vol_idx, 'weights'].round(4))),
            'expectedReturn': round(float(results_df.loc[min_vol_idx, 'return']), 6),
            'volatility': round(float(results_df.loc[min_vol_idx, 'volatility']), 6),
            'sharpeRatio': round(float(results_df.loc[min_vol_idx, 'sharpe']), 6)
        }
    }

    return optimal_portfolios


def calculate_cvar(forecasts, holdings, confidence=0.95, sims=10000):
    """
    Estimate portfolio Conditional Value at Risk (CVaR) using Monte Carlo simulation.
    """
    symbols = [h['symbol'] for h in holdings]
    weights = np.array([1 / len(symbols)] * len(symbols))  # simple equal weights

    # Extract expected returns and volatility
    expected_returns = np.array([forecasts[s]['forecast']['expectedReturn'] for s in symbols])
    volatilities = np.array([forecasts[s]['forecast']['volatility']['average'] for s in symbols])

    # Generate Monte Carlo portfolio returns
    portfolio_returns = []
    for _ in range(sims):
        simulated_returns = np.random.normal(loc=expected_returns, scale=volatilities)
        portfolio_returns.append(np.dot(weights, simulated_returns))

    portfolio_returns = np.array(portfolio_returns)
    var = np.percentile(portfolio_returns, (1 - confidence) * 100)
    cvar = portfolio_returns[portfolio_returns <= var].mean()

    return round(float(cvar), 6)


def optimize_portfolio(forecasts, holdings):
    """
    Main entry point for Layer E:
    Combines efficient frontier simulation and CVaR estimation.
    Returns a JSON-ready dictionary.
    """
    ef_summary = simulate_efficient_frontier(forecasts, holdings)
    cvar_estimate = calculate_cvar(forecasts, holdings)

    return {
        "efficientFrontier": ef_summary,
        "portfolioCVaR95": cvar_estimate
    }


# Example test run
# if __name__ == "__main__":
#     from forecasting_models import generate_forecasts
#     from data_fetcher import get_historical_data
#
#     holdings = [
#         {"symbol": "RVNL.NS"},
#         {"symbol": "BEL.NS"},
#         {"symbol": "ITC.NS"},
#     ]
#
#     historical_data = {}
#     end_date = pd.Timestamp.today().date()
#     start_date = end_date - pd.Timedelta(days=365)
#
#     for h in holdings:
#         symbol = h["symbol"]
#         historical_data[symbol] = get_historical_data(symbol, str(start_date), str(end_date))
#
#     forecasts = generate_forecasts(holdings, historical_data, steps=30, sims=500)
#     optimization_summary = optimize_portfolio(forecasts, holdings)
#
#     print("\n[RESULT] Optimization Output:\n")
#     print(optimization_summary)
