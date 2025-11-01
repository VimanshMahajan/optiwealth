import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# ---------------------------
# Fetch Current Quote
# ---------------------------
def get_current_quote(symbol: str):
    """
    Fetch current market data for a stock.
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d", auto_adjust=True)
        fast_info = ticker.fast_info  # faster and more stable than .info

        if data.empty:
            return None

        current_price = fast_info.get("last_price") or data["Close"].iloc[-1]
        prev_close = fast_info.get("previous_close")
        open_price = fast_info.get("open", data["Open"].iloc[-1])
        high = fast_info.get("day_high", data["High"].iloc[-1])
        low = fast_info.get("day_low", data["Low"].iloc[-1])
        volume = fast_info.get("last_volume", data["Volume"].iloc[-1])

        change_percent = None
        if prev_close and prev_close != 0:
            change_percent = ((current_price - prev_close) / prev_close) * 100

        return {
            "symbol": symbol,
            "currentPrice": round(current_price, 2),
            "previousClose": round(prev_close, 2) if prev_close else None,
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "volume": int(volume),
            "changePercent": round(change_percent, 2) if change_percent else None,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"[Error] Fetching current quote for {symbol}: {e}")
        return None


# ---------------------------
# Historical OHLCV Data
# ---------------------------
def get_historical_data(symbol: str, start_date: str, end_date: str):
    """
    Fetch historical OHLCV data between two dates.
    """
    try:
        df = yf.download(symbol, start=start_date, end=end_date, auto_adjust=True, progress=False)
        if df.empty:
            print(f"[Warning] No historical data returned for {symbol}")
            return pd.DataFrame()

        df.reset_index(inplace=True)
        df["Date"] = pd.to_datetime(df["Date"])
        return df
    except Exception as e:
        print(f"[Error] Fetching historical data for {symbol}: {e}")
        return pd.DataFrame()


# ---------------------------
# Fundamental Metrics
# ---------------------------
def get_fundamentals(symbol: str):
    """
    Fetch basic fundamental ratios and info.
    (Using 'info' — slower but more complete)
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}

        fundamentals = {
            "symbol": symbol,
            "marketCap": info.get("marketCap"),
            "peRatio": info.get("trailingPE"),
            "pbRatio": info.get("priceToBook"),
            "dividendYield": info.get("dividendYield"),
            "eps": info.get("trailingEps"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"),
            "revenueGrowth": info.get("revenueGrowth"),
            "profitMargins": info.get("profitMargins"),
        }

        return fundamentals
    except Exception as e:
        print(f"[Error] Fetching fundamentals for {symbol}: {e}")
        return None


# ---------------------------
# Derived Metrics
# ---------------------------
def compute_metrics(historical_df: pd.DataFrame, risk_free_rate: float = 0.06):
    """
    Compute derived metrics: daily returns, cumulative return,
    volatility, and Sharpe ratio.
    """
    try:
        if historical_df.empty or "Close" not in historical_df.columns:
            print("[Warning] Empty or invalid dataframe for compute_metrics.")
            return None

        df = historical_df.copy()

        # Ensure Close is a Series, not a DataFrame
        close_series = df["Close"]
        if isinstance(close_series, pd.DataFrame):
            close_series = close_series.squeeze()

        # Calculate daily returns
        daily_returns = close_series.pct_change()
        daily_returns = daily_returns.dropna()

        if daily_returns.empty:
            print("[Warning] No valid daily returns calculated.")
            return None

        avg_return = daily_returns.mean()
        volatility = daily_returns.std()
        sharpe_ratio = (avg_return - (risk_free_rate / 252)) / volatility if volatility and volatility != 0 else None

        # Cumulative return
        first_close = close_series.iloc[0]
        last_close = close_series.iloc[-1]
        cumulative_return = float((last_close / first_close) - 1) if first_close != 0 else 0

        return {
            "averageDailyReturn": round(float(avg_return), 6),
            "volatility": round(float(volatility), 6),
            "sharpeRatio": round(float(sharpe_ratio), 4) if sharpe_ratio else None,
            "cumulativeReturn": round(float(cumulative_return), 4)
        }
    except Exception as e:
        print(f"[Error] Computing metrics: {e}")
        return None


# ---------------------------
# Utility: File Logger
# ---------------------------
def append_file(path, data):
    """
    Append text or JSON-like string to a file for debugging/logging.
    """
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write("\n===========================\n")
            f.write(str(data))
            f.write("\n===========================\n")
    except Exception as e:
        print(f"[Error] Writing to log file: {e}")


# # ---------------------------
# # Test Run
# # ---------------------------
# if __name__ == "__main__":
#     symbol = "RELIANCE.NS"
#
#     print("\n--- Current Quote ---")
#     print(get_current_quote(symbol))
#
#     print("\n--- Historical Data (1M) ---")
#     end = datetime.today().date()
#     start = end - timedelta(days=30)
#     hist = get_historical_data(symbol, str(start), str(end))
#     print(hist.head())
#
#     print("\n--- Fundamentals ---")
#     print(get_fundamentals(symbol))
#
#     print("\n--- Computed Metrics ---")
#     print(compute_metrics(hist))
