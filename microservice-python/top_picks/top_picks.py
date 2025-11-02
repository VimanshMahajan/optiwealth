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
    data = yf.download(tickers, period="6mo", interval="1d", group_by="ticker", auto_adjust=True, progress=False)

    print(f"  Downloaded data shape: {data.shape}")
    print(f"  Column structure: {type(data.columns)}")

    # Handle multi-index or flat columns
    if isinstance(data.columns, pd.MultiIndex):
        print(f"  Multi-index columns. Levels: {data.columns.names}")
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

    print(f"  After extraction: {data.shape}")
    print(f"  Non-null columns: {data.notna().any().sum()}")

    return data


def compute_scores(df):
    if df.empty or len(df.columns) == 0:
        print("Warning: Empty dataframe passed to compute_scores")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "score", "last_price"])

    print(f"  Input shape: {df.shape}")
    print(f"  Columns with all NaN: {df.isna().all().sum()}")
    print(f"  Columns with any NaN: {df.isna().any().sum()}")

    # Drop columns that are entirely NaN
    df_clean = df.dropna(axis=1, how='all')
    print(f"  After dropping all-NaN columns: {df_clean.shape[1]} stocks")

    if df_clean.empty or len(df_clean.columns) == 0:
        print("  Warning: All columns were NaN")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "score", "last_price"])

    # Fix FutureWarning by specifying fill_method=None
    returns = df_clean.pct_change(fill_method=None).dropna()

    # Calculate metrics - need valid first and last prices
    first_prices = df_clean.iloc[0]
    last_prices = df_clean.iloc[-1]

    # Only calculate for stocks with valid first and last prices
    valid_mask = ~(first_prices.isna() | last_prices.isna() | (first_prices == 0))

    print(f"  Stocks with valid first/last prices: {valid_mask.sum()}")

    if valid_mask.sum() == 0:
        print("  Warning: No stocks have valid first and last prices")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "score", "last_price"])

    # Filter to valid stocks only
    df_valid = df_clean.loc[:, valid_mask]
    first_valid = first_prices[valid_mask]
    last_valid = last_prices[valid_mask]
    returns_valid = df_valid.pct_change(fill_method=None).dropna()

    total_return = (last_valid / first_valid) - 1
    volatility = returns_valid.std()

    # Handle division by zero - avoid inf values
    # Use a small epsilon to prevent division by zero
    score = total_return / (volatility + 1e-10)

    results = pd.DataFrame({
        "symbol": df_valid.columns,
        "return": total_return.values,
        "volatility": volatility.values,
        "score": score.values,
        "last_price": last_valid.values
    })

    initial_count = len(results)

    # Only drop rows where critical values are NaN or inf
    results = results.replace([float('inf'), float('-inf')], float('nan'))
    results = results.dropna(subset=['return', 'score', 'last_price'])

    filtered_count = initial_count - len(results)
    if filtered_count > 0:
        print(f"  Filtered out {filtered_count} stocks due to NaN/inf values (kept {len(results)})")

    return results.sort_values("score", ascending=False)


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
    print(f"Total tickers to fetch: {len(tickers)}")
    conn = psycopg2.connect(**DB_CONFIG)
    all_data = pd.DataFrame()

    # Fetch in batches
    for i in range(0, len(tickers), BATCH_SIZE):
        batch = tickers[i:i+BATCH_SIZE]
        try:
            df = fetch_batch(batch)
            all_data = pd.concat([all_data, df], axis=1)
            print(f"Batch {i//BATCH_SIZE + 1}: Fetched {len(df.columns)} symbols, total so far: {len(all_data.columns)}")
        except Exception as e:
            print(f"Batch {i} failed: {e}")
        time.sleep(2)

    print(f"\nTotal data collected: {all_data.shape[0]} rows x {all_data.shape[1]} columns")
    if not all_data.empty:
        print(f"Date range: {all_data.index[0]} to {all_data.index[-1]}")

    # Derive sub-periods
    one_month = all_data.tail(22)
    three_month = all_data.tail(66)
    six_month = all_data

    print(f"\nPeriod data shapes:")
    print(f"1 Month: {one_month.shape[0]} rows x {one_month.shape[1]} columns")
    print(f"3 Month: {three_month.shape[0]} rows x {three_month.shape[1]} columns")
    print(f"6 Month: {six_month.shape[0]} rows x {six_month.shape[1]} columns")

    # Compute top 5 for each period
    print("\nComputing scores for each period...")
    ranked_1M = compute_scores(one_month).head(5)
    ranked_3M = compute_scores(three_month).head(5)
    ranked_6M = compute_scores(six_month).head(5)

    print(f"\nRanked results:")
    print(f"1M top picks: {len(ranked_1M)}")
    if len(ranked_1M) > 0:
        print(f"  Top 1M stock: {ranked_1M.iloc[0]['symbol']} (score: {ranked_1M.iloc[0]['score']:.2f})")
    print(f"3M top picks: {len(ranked_3M)}")
    if len(ranked_3M) > 0:
        print(f"  Top 3M stock: {ranked_3M.iloc[0]['symbol']} (score: {ranked_3M.iloc[0]['score']:.2f})")
    print(f"6M top picks: {len(ranked_6M)}")
    if len(ranked_6M) > 0:
        print(f"  Top 6M stock: {ranked_6M.iloc[0]['symbol']} (score: {ranked_6M.iloc[0]['score']:.2f})")

    # Gather all unique top symbols
    all_top_symbols = pd.concat([ranked_1M, ranked_3M, ranked_6M])["symbol"].unique()
    print(f"\nFetching metadata for {len(all_top_symbols)} unique symbols...")
    meta = fetch_metadata(all_top_symbols)

    # Insert into database
    for label, ranked in [("1M", ranked_1M), ("3M", ranked_3M), ("6M+", ranked_6M)]:
        upsert_top_picks(conn, ranked, label, meta)
        print(f"Top {len(ranked)} for {label} updated with metadata.")

    conn.close()
    print("All top picks updated successfully.")


if __name__ == "__main__":
    execute_picks()
