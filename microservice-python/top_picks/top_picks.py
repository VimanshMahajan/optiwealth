import yfinance as yf
import pandas as pd
import psycopg2
import time
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 5432))
}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHECK_FILE = os.path.join(BASE_DIR, "../utils/nse_symbols.csv")
CHECK_FILE = os.path.normpath(CHECK_FILE)
CSV_PATH = CHECK_FILE
BATCH_SIZE = 150  # fetch in batches to avoid rate limit


def get_all_tickers():
    df = pd.read_csv(CSV_PATH)
    tickers = [f"{s}.NS" for s in df["SYMBOL"].dropna().unique()]
    return tickers


def fetch_batch(tickers):
    print(f"Fetching {len(tickers)} tickers...")
    data = yf.download(tickers, period="6mo", interval="1d", group_by="ticker", auto_adjust=True)

    # Handle multi-index or flat columns
    if isinstance(data.columns, pd.MultiIndex):
        if ("Adj Close" in data.columns.get_level_values(1)):
            data = data.xs("Adj Close", axis=1, level=1)
        elif ("Close" in data.columns.get_level_values(1)):
            data = data.xs("Close", axis=1, level=1)
        else:
            raise ValueError(f"Neither 'Adj Close' nor 'Close' found in columns: {data.columns}")
    elif "Adj Close" in data.columns:
        data = data["Adj Close"]
    elif "Close" in data.columns:
        data = data["Close"]
    else:
        raise ValueError(f"Unexpected columns: {data.columns}")

    return data


def compute_scores(df):
    returns = df.pct_change().dropna()
    total_return = (df.iloc[-1] / df.iloc[0]) - 1
    volatility = returns.std()
    score = total_return / volatility
    results = pd.DataFrame({
        "symbol": df.columns,
        "return": total_return.values,
        "volatility": volatility.values,
        "score": score.values,
        "last_price": df.iloc[-1].values
    })
    return results.dropna().sort_values("score", ascending=False)


def fetch_metadata(symbols):
    """Fetch company name and sector for given symbols (usually ~15)."""
    meta = {}
    for sym in symbols:
        try:
            info = yf.Ticker(sym).info
            meta[sym] = {
                "company_name": info.get("longName", "N/A"),
                "sector": info.get("sector", "N/A")
            }

        except Exception as e:
            meta[sym] = {"company_name": "N/A", "sector": "N/A"}
            print(f"Metadata fetch failed for {sym}: {e}")
        time.sleep(0.5)
    return meta


def upsert_top_picks(conn, ranked_df, period, meta):
    cur = conn.cursor()
    for _, row in ranked_df.iterrows():
        symbol_full = row["symbol"]
        symbol = symbol_full.replace(".NS", "")
        company_name = meta.get(symbol_full, {}).get("company_name", "N/A")
        sector = meta.get(symbol_full, {}).get("sector", "N/A")

        cur.execute("""
            INSERT INTO top_picks (symbol, company_name, sector, period, last_price, expected_target, return_percent, score, rationale, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (symbol, period)
            DO UPDATE SET
                company_name = EXCLUDED.company_name,
                sector = EXCLUDED.sector,
                last_price = EXCLUDED.last_price,
                expected_target = EXCLUDED.expected_target,
                return_percent = EXCLUDED.return_percent,
                score = EXCLUDED.score,
                rationale = EXCLUDED.rationale,
                updated_at = now();
        """, (
            symbol,
            company_name,
            sector,
            period,
            float(row["last_price"]),
            float(row["last_price"] * (1 + row["return"])),
            float(row["return"] * 100),
            float(row["score"]),
            f"Momentum score {row['score']:.3f} from {row['return']*100:.2f}% returns"
        ))
    conn.commit()
    cur.close()


def execute_picks():
    tickers = get_all_tickers()
    conn = psycopg2.connect(**DB_CONFIG)
    all_data = pd.DataFrame()

    # Fetch in batches
    for i in range(0, len(tickers), BATCH_SIZE):
        batch = tickers[i:i+BATCH_SIZE]
        try:
            df = fetch_batch(batch)
            all_data = pd.concat([all_data, df], axis=1)
        except Exception as e:
            print(f"Batch {i} failed: {e}")
        time.sleep(2)

    # Derive sub-periods
    one_month = all_data.tail(22)
    three_month = all_data.tail(66)
    six_month = all_data

    # Compute top 5 for each period
    ranked_1M = compute_scores(one_month).head(5)
    ranked_3M = compute_scores(three_month).head(5)
    ranked_6M = compute_scores(six_month).head(5)

    # Gather all unique top symbols
    all_top_symbols = pd.concat([ranked_1M, ranked_3M, ranked_6M])["symbol"].unique()
    meta = fetch_metadata(all_top_symbols)

    # Insert into database
    for label, ranked in [("1M", ranked_1M), ("3M", ranked_3M), ("6M+", ranked_6M)]:
        upsert_top_picks(conn, ranked, label, meta)
        print(f"Top {len(ranked)} for {label} updated with metadata.")

    conn.close()
    print("All top picks updated successfully.")


if __name__ == "__main__":
    execute_picks()
