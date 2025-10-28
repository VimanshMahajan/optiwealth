import yfinance as yf
import pandas as pd
from tqdm import tqdm
import time

CSV_PATH = "nse_symbols.csv"
OUTPUT_PATH = "valid_nse_symbols.csv"


def is_valid_ticker(symbol):
    try:
        data = yf.Ticker(symbol).info
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
