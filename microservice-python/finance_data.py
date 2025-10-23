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
        data = ticker.history(period="1d")
        info = ticker.info

        if data.empty:
            return None

        current_price = info.get("currentPrice") or data["Close"].iloc[-1]
        prev_close = info.get("previousClose")
        open_price = info.get("open", data["Open"].iloc[-1])
        high = info.get("dayHigh", data["High"].iloc[-1])
        low = info.get("dayLow", data["Low"].iloc[-1])
        volume = info.get("volume", data["Volume"].iloc[-1])

        change_percent = None
        if prev_close and prev_close != 0:
            change_percent = ((current_price - prev_close) / prev_close) * 100

        return {
            "symbol": symbol,
            "currentPrice": current_price,
            "previousClose": prev_close,
            "open": open_price,
            "high": high,
            "low": low,
            "volume": volume,
            "changePercent": change_percent,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Error fetching current quote for {symbol}: {e}")
        return None


# ---------------------------
# Historical OHLCV Data
# ---------------------------
def get_historical_data(symbol: str, start_date: str, end_date: str):
    """
    Fetch historical OHLCV data between two dates.
    """
    try:
        df = yf.download(symbol, start=start_date, end=end_date)
        df.reset_index(inplace=True)
        df["Date"] = pd.to_datetime(df["Date"])
        return df
    except Exception as e:
        print(f"Error fetching historical data for {symbol}: {e}")
        return pd.DataFrame()


# ---------------------------
# Fundamental Metrics
# ---------------------------
def get_fundamentals(symbol: str):
    """
    Fetch basic fundamental ratios and info.
    """
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

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
        print(f"Error fetching fundamentals for {symbol}: {e}")
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
        df = historical_df.copy()
        df["Daily Return"] = df["Close"].pct_change()
        df.dropna(inplace=True)

        avg_return = df["Daily Return"].mean()
        volatility = df["Daily Return"].std()
        sharpe_ratio = (avg_return - (risk_free_rate / 252)) / volatility if volatility else None
        cumulative_return = (df["Close"].iloc[-1] / df["Close"].iloc[0]) - 1

        return {
            "averageDailyReturn": avg_return,
            "volatility": volatility,
            "sharpeRatio": sharpe_ratio,
            "cumulativeReturn": cumulative_return
        }
    except Exception as e:
        print(f"Error computing metrics: {e}")
        return None

def append_file(path, data):
    with open(path, "a", encoding="utf-8") as f:
        f.write("\n===========================\n")
        f.write(data)
        f.write("\n===========================\n")

if __name__ == "__main__":
    symbol = "RVNL.NS"

    print("\n--- Current Quote ---")
    print(get_current_quote(symbol))

    print("\n--- Historical Data (1M) ---")
    end = datetime.today().date()
    start = end - timedelta(days=30)
    hist = get_historical_data(symbol, str(start), str(end))
    print(hist.head())

    print("\n--- Fundamentals ---")
    print(get_fundamentals(symbol))

    print("\n--- Computed Metrics ---")
    print(compute_metrics(hist))
