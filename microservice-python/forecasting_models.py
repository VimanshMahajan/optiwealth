# forecasting_models.py
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from arch import arch_model


def forecast_arima(series: pd.Series, steps: int = 30) -> pd.Series:
    """
    Forecast future values using ARIMA(5,1,0).
    Returns a Series of length 'steps' containing forecasted returns.
    """
    series = series.dropna().reset_index(drop=True)
    series_1d = series.iloc[:, 0] if isinstance(series, pd.DataFrame) else series

    # std_val = float(series.std(skipna=True)) if not series.empty else 0.0
    # std_val = float(series['returns'].std(skipna=True)) if not series.empty else 0.0
    std_val = float(series_1d.std(skipna=True)) if not series_1d.empty else 0.0
    if len(series_1d) < 20 or std_val < 1e-9:
        print(f"[ARIMA Warning] Insufficient or constant data — returning NaNs.")
        return pd.Series([np.nan] * steps)

    try:
        model = ARIMA(series_1d, order=(5, 1, 0))
        model_fit = model.fit()
        forecast = model_fit.forecast(steps=steps)
        return forecast
    except Exception as e:
        print(f"[ARIMA Error] {e}")
        return pd.Series([np.nan] * steps)


def forecast_garch(series: pd.Series, steps: int = 30) -> np.ndarray:
    """
    Forecast future volatility using GARCH(1,1).
    Returns an array of forecasted volatility values.
    """
    series = series.dropna().reset_index(drop=True)
    series_1d = series.iloc[:, 0] if isinstance(series, pd.DataFrame) else series
    # std_val = float(series.std(skipna=True)) if not series.empty else 0.0
    std_val = float(series_1d.std(skipna=True)) if not series_1d.empty else 0.0

    if len(series_1d) < 20 or std_val < 1e-9:
        print(f"[GARCH Warning] Insufficient or constant data — returning NaNs.")
        return np.full(steps, np.nan)

    try:
        model = arch_model(series_1d * 100, vol='Garch', p=1, q=1, rescale=False)
        model_fit = model.fit(disp="off")
        forecasts = model_fit.forecast(horizon=steps)
        return np.sqrt(forecasts.variance.values[-1] / 10000)
    except Exception as e:
        print(f"[GARCH Error] {e}")
        return np.full(steps, np.nan)


def monte_carlo_simulation(current_price: float, mu: float, sigma: float, steps: int = 30, sims: int = 1000) -> np.ndarray:
    """
    Monte Carlo simulation for future price paths using geometric Brownian motion.
    Returns a 2D array: shape (steps x sims).
    """
    # Force everything to scalar
    current_price = float(np.squeeze(current_price))
    mu = float(np.squeeze(mu))
    sigma = float(np.squeeze(sigma))

    dt = 1 / 252
    paths = np.zeros((steps, sims))

    for s in range(sims):
        prices = [current_price]
        for _ in range(steps):
            shock = float(np.random.normal(loc=mu * dt, scale=sigma * np.sqrt(dt)))
            next_price = max(float(prices[-1]) * (1 + shock), 0.0)
            prices.append(next_price)
        paths[:, s] = prices[1:]

    return paths


def summarize_forecast(symbol: str, df: pd.DataFrame, steps: int = 30, sims: int = 500) -> dict:
    """
    Compact summary of ARIMA, GARCH, and Monte Carlo simulations for one stock.
    """
    close_data = df["Close"]
    close_series = close_data.iloc[:, 0] if isinstance(close_data, pd.DataFrame) else close_data
    close_series = close_series.dropna()

    if close_series.empty:
        return {"symbol": symbol, "error": "No valid close data"}

    returns = close_series.pct_change().dropna()
    if returns.empty:
        return {"symbol": symbol, "error": "No valid returns"}

    current_price = float(close_series.iloc[-1])

    # Run forecasts
    arima_fc = forecast_arima(returns, steps)
    garch_vol = forecast_garch(returns, steps)
    mc_paths = monte_carlo_simulation(
        current_price=current_price,

        # Safe extraction for mu (mean)
        mu=float(returns.iloc[:, 0].mean(skipna=True)) if isinstance(returns, pd.DataFrame) else float(
            returns.mean(skipna=True)),

        # Safe extraction for sigma (standard deviation)
        sigma=float(returns.iloc[:, 0].std(skipna=True)) if isinstance(returns, pd.DataFrame) else float(
            returns.std(skipna=True)),

        steps=steps,
        sims=sims
    )

    # --- Summaries ---
    arima_values = np.asarray(arima_fc, dtype=float)
    arima_finite = arima_values[np.isfinite(arima_values)]
    arima_mean = float(np.mean(arima_finite)) if arima_finite.size else np.nan
    arima_last = float(arima_values[-1]) if arima_values.size else np.nan

    garch_values = np.asarray(garch_vol, dtype=float)
    garch_finite = garch_values[np.isfinite(garch_values)]
    garch_mean = float(np.mean(garch_finite)) if garch_finite.size else np.nan
    garch_trend = (
        "increasing" if garch_values[-1] > garch_values[0] else
        "decreasing" if garch_values[-1] < garch_values[0] else "stable"
    ) if garch_values.size >= 2 and np.all(np.isfinite(garch_values)) else "unknown"

    final_prices = mc_paths[-1, :]
    finite_prices = final_prices[np.isfinite(final_prices)]
    if finite_prices.size == 0:
        price_mean = np.nan
        price_min = np.nan
        price_max = np.nan
        pct_change_range = [np.nan, np.nan]
    else:
        price_mean = float(np.nanmean(finite_prices))
        price_min = float(np.nanmin(finite_prices))
        price_max = float(np.nanmax(finite_prices))
        pct_change_range = (
            [round((price_min - current_price) / current_price * 100, 2),
             round((price_max - current_price) / current_price * 100, 2)]
            if np.isfinite(current_price) and current_price != 0
            else [np.nan, np.nan]
        )

    return {
        "symbol": symbol,
        "currentPrice": round(current_price, 2),
        "forecast": {
            "expectedReturn": round(arima_mean, 6),
            "trendDirection": "up" if arima_mean > 0 else "down" if arima_mean < 0 else "flat",
            "volatility": {
                "average": round(garch_mean, 6),
                "trend": garch_trend
            },
            "priceRange": {
                "expected": round(price_mean, 2),
                "min": round(price_min, 2),
                "max": round(price_max, 2),
                "pctChangeRange": pct_change_range
            }
        }
    }


def generate_forecasts(holdings: list, historical_data: dict, steps: int = 30, sims: int = 1000) -> dict:
    """
    Compact, API-friendly version — only summary metrics for each holding.
    """
    forecasts = {}

    for h in holdings:
        symbol = h.get("symbol")
        if not symbol or symbol not in historical_data:
            print(f"[Data Warning] Missing data for {symbol}. Skipping.")
            continue

        df = historical_data[symbol]
        if "Close" not in df.columns or df["Close"].dropna().empty:
            print(f"[Data Warning] Invalid price data for {symbol}.")
            continue

        forecasts[symbol] = summarize_forecast(symbol, df, steps, sims)

    return forecasts


# Example standalone test
# if __name__ == "__main__":
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
#     print("[INFO] Generating forecasts ...")
#     forecast_results = generate_forecasts(holdings, historical_data, steps=30, sims=500)
#     print("\n[RESULT] Forecast Output:\n")
#     print(forecast_results)
