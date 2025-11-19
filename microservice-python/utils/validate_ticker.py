import yfinance as yf
import pandas as pd
from tqdm import tqdm
import time

# Use curl_cffi session for yfinance to avoid API errors
try:
    from curl_cffi import requests as curl_requests
    YF_SESSION = curl_requests.Session()
except ImportError:
    YF_SESSION = None
    print("[Warning] curl_cffi not installed, yfinance may experience API errors")

CSV_PATH = "nse_symbols.csv"
OUTPUT_PATH = "valid_nse_symbols.csv"


def is_valid_ticker(symbol):
    try:
        ticker = yf.Ticker(symbol, session=YF_SESSION) if YF_SESSION else yf.Ticker(symbol)
        data = ticker.info
        # If 'regularMarketPrice' or similar key exists, it's valid
        return "regularMarketPrice" in data
    except Exception:
        return False


def main():
    df = pd.read_csv(CSV_PATH)
    tickers = [f"{s}.NS" for s in df["SYMBOL"].dropna().unique()]

    valid = []
    for t in tqdm(tickers, desc="Validating tickers"):
        if is_valid_ticker(t):
            valid.append(t)
        time.sleep(0.2)  # to avoid rate limits

    pd.DataFrame(valid, columns=["symbol"]).to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {len(valid)} valid tickers to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
