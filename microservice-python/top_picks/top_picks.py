import yfinance as yf
import pandas as pd
import psycopg2
import time
from dotenv import load_dotenv
import os
import requests
from json import JSONDecodeError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

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
BATCH_SIZE = 1  # Reduced batch size to avoid rate limits
RETRY_ATTEMPTS = 2
RETRY_DELAY = 3  # seconds

# Create a session with proper headers to avoid rate limiting
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
})


def get_all_tickers():
    df = pd.read_csv(CSV_PATH)
    tickers = [f"{s}.NS" for s in df["SYMBOL"].dropna().unique()]
    return tickers


def fetch_batch(tickers):
    """
    Fetch historical data with robust error handling and retries.
    Returns a DataFrame with price data, skipping failed tickers.
    """
    logger.info(f"Fetching {len(tickers)} tickers...")

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            # Use yfinance with progress disabled and threads=True for better handling
            data = yf.download(
                tickers,
                period="6mo",
                interval="1d",
                group_by="ticker",
                auto_adjust=True,
                progress=False,
                threads=True,
                ignore_tz=True,
                timeout=30
            )

            if data.empty:
                logger.warning(f"  Attempt {attempt}/{RETRY_ATTEMPTS}: No data returned")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_DELAY * attempt)
                    continue
                else:
                    return pd.DataFrame()

            logger.info(f"  Downloaded data shape: {data.shape}")

            # Handle multi-index or flat columns
            if isinstance(data.columns, pd.MultiIndex):
                logger.info(f"  Multi-index columns. Levels: {data.columns.names}")
                if "Adj Close" in data.columns.get_level_values(1):
                    data = data.xs("Adj Close", axis=1, level=1)
                elif "Close" in data.columns.get_level_values(1):
                    data = data.xs("Close", axis=1, level=1)
                else:
                    logger.error(f"Neither 'Adj Close' nor 'Close' found in columns")
                    if attempt < RETRY_ATTEMPTS:
                        time.sleep(RETRY_DELAY * attempt)
                        continue
                    return pd.DataFrame()
            elif "Adj Close" in data.columns:
                data = data["Adj Close"]
            elif "Close" in data.columns:
                data = data["Close"]
            else:
                logger.error(f"Unexpected columns: {data.columns}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_DELAY * attempt)
                    continue
                return pd.DataFrame()

            logger.info(f"  After extraction: {data.shape}")
            logger.info(f"  Non-null columns: {data.notna().any().sum()}")

            return data

        except Exception as e:
            logger.error(f"  Attempt {attempt}/{RETRY_ATTEMPTS} failed: {str(e)}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_DELAY * attempt)
            else:
                logger.error(f"  All retry attempts exhausted for batch")
                return pd.DataFrame()

    return pd.DataFrame()


def compute_scores(df):
    if df.empty or len(df.columns) == 0:
        logger.warning("Empty dataframe passed to compute_scores")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "sharpe_ratio", "win_rate", "recent_return", "max_drawdown", "score", "last_price"])

    logger.info(f"  Input shape: {df.shape}")
    logger.info(f"  Columns with all NaN: {df.isna().all().sum()}")
    logger.info(f"  Columns with any NaN: {df.isna().any().sum()}")

    # Drop columns that are entirely NaN
    df_clean = df.dropna(axis=1, how='all')
    logger.info(f"  After dropping all-NaN columns: {df_clean.shape[1]} stocks")

    if df_clean.empty or len(df_clean.columns) == 0:
        logger.warning("  All columns were NaN")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "sharpe_ratio", "win_rate", "recent_return", "max_drawdown", "score", "last_price"])

    # Calculate returns with fill_method=None to avoid FutureWarning
    returns = df_clean.pct_change(fill_method=None).dropna()

    # Calculate metrics - need valid first and last prices
    first_prices = df_clean.iloc[0]
    last_prices = df_clean.iloc[-1]

    # Only calculate for stocks with valid first and last prices
    valid_mask = ~(first_prices.isna() | last_prices.isna() | (first_prices == 0))

    logger.info(f"  Stocks with valid first/last prices: {valid_mask.sum()}/{len(valid_mask)}")

    if valid_mask.sum() == 0:
        logger.warning("  No stocks have valid first and last prices")
        return pd.DataFrame(columns=["symbol", "return", "volatility", "sharpe_ratio", "win_rate", "recent_return", "max_drawdown", "score", "last_price"])

    # Filter to valid stocks only
    df_valid = df_clean.loc[:, valid_mask]
    first_valid = first_prices[valid_mask]
    last_valid = last_prices[valid_mask]
    returns_valid = df_valid.pct_change(fill_method=None).dropna()

    # === FACTOR 1: Total Return (Momentum) ===
    total_return = (last_valid / first_valid) - 1
    volatility = returns_valid.std()

    # === FACTOR 2: Sharpe Ratio (Risk-Adjusted Returns) ===
    risk_free_rate = 0.06 / 252  # ~6% annual, daily rate
    sharpe_ratio = (returns_valid.mean() - risk_free_rate) / (volatility + 1e-10)

    # === FACTOR 3: Win Rate (Consistency) ===
    # Percentage of positive return days
    win_rate = (returns_valid > 0).sum() / len(returns_valid)

    # === FACTOR 4: Recent Strength (Weighted) ===
    # Give more weight to recent performance (last 20% of period)
    recent_window = max(5, len(df_valid) // 5)
    recent_return = (df_valid.iloc[-1] / df_valid.iloc[-recent_window]) - 1

    # === FACTOR 5: Drawdown Resilience ===
    # Calculate max drawdown - lower is better (less negative)
    cumulative = (1 + returns_valid).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()
    # Convert to positive metric (recovery ability)
    drawdown_score = 1 + max_drawdown  # closer to 1 is better

    # === COMPOSITE SCORE ===
    # Normalize each factor to 0-1 range within the batch
    def normalize_factor(series):
        """Min-max normalization"""
        min_val = series.min()
        max_val = series.max()
        if max_val - min_val == 0:
            return pd.Series([0.5] * len(series), index=series.index)
        return (series - min_val) / (max_val - min_val)

    # Normalize all factors
    norm_return = normalize_factor(total_return)
    norm_sharpe = normalize_factor(sharpe_ratio)
    norm_win_rate = normalize_factor(win_rate)
    norm_recent = normalize_factor(recent_return)
    norm_drawdown = normalize_factor(drawdown_score)

    # Weighted composite score (0 to 1 range)
    composite_score = (
        0.30 * norm_return +      # 30% - Total return (momentum)
        0.25 * norm_sharpe +       # 25% - Risk-adjusted return
        0.20 * norm_recent +       # 20% - Recent strength
        0.15 * norm_win_rate +     # 15% - Consistency
        0.10 * norm_drawdown       # 10% - Drawdown resilience
    )

    results = pd.DataFrame({
        "symbol": df_valid.columns,
        "return": total_return.values,
        "volatility": volatility.values,
        "sharpe_ratio": sharpe_ratio.values,
        "win_rate": win_rate.values,
        "recent_return": recent_return.values,
        "max_drawdown": max_drawdown.values,
        "score": composite_score.values,
        "last_price": last_valid.values
    })

    initial_count = len(results)

    # Only drop rows where critical values are NaN or inf
    results = results.replace([float('inf'), float('-inf')], float('nan'))
    results = results.dropna(subset=['return', 'score', 'last_price'])

    filtered_count = initial_count - len(results)
    if filtered_count > 0:
        logger.info(f"  Filtered out {filtered_count} stocks due to NaN/inf values (kept {len(results)})")

    return results.sort_values("score", ascending=False)


def fetch_metadata(symbols):
    """
    Fetch company name and sector for given symbols with robust error handling.
    Handles rate limits, JSON decode errors, and network issues gracefully.
    """
    meta = {}
    failed_symbols = []

    logger.info(f"Fetching metadata for {len(symbols)} symbols...")

    for idx, sym in enumerate(symbols, 1):
        for attempt in range(1, RETRY_ATTEMPTS + 1):
            try:
                # Add delay to avoid rate limiting (longer delay every 5 symbols)
                if idx > 1:
                    delay = 1.0 if idx % 5 != 0 else 2.0
                    time.sleep(delay)

                ticker = yf.Ticker(sym, session=session)
                info = ticker.info

                # Validate that we got actual data (not empty or error response)
                if not info or len(info) == 0:
                    raise ValueError(f"Empty info response for {sym}")

                # Check if we got an HTML error page or rate limit response
                if 'trailingPegRatio' not in info and 'longName' not in info and 'shortName' not in info:
                    # Likely got rate limited or error response
                    raise ValueError(f"Invalid info structure for {sym} - possible rate limit")

                meta[sym] = {
                    "company_name": info.get("longName") or info.get("shortName") or "N/A",
                    "sector": info.get("sector", "N/A")
                }

                logger.debug(f"  [{idx}/{len(symbols)}] {sym}: {meta[sym]['company_name']}")
                break  # Success, exit retry loop

            except JSONDecodeError as e:
                logger.warning(f"  [{idx}/{len(symbols)}] {sym} - JSON decode error (attempt {attempt}/{RETRY_ATTEMPTS}): {str(e)[:100]}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_DELAY * attempt)  # Exponential backoff
                else:
                    # Final attempt failed, use fallback
                    meta[sym] = {"company_name": sym.replace(".NS", ""), "sector": "N/A"}
                    failed_symbols.append(sym)

            except Exception as e:
                error_msg = str(e)[:100]
                logger.warning(f"  [{idx}/{len(symbols)}] {sym} - Error (attempt {attempt}/{RETRY_ATTEMPTS}): {error_msg}")
                if attempt < RETRY_ATTEMPTS:
                    time.sleep(RETRY_DELAY * attempt)
                else:
                    # Final attempt failed, use fallback
                    meta[sym] = {"company_name": sym.replace(".NS", ""), "sector": "N/A"}
                    failed_symbols.append(sym)

    if failed_symbols:
        logger.warning(f"Failed to fetch metadata for {len(failed_symbols)} symbols (using fallback): {failed_symbols[:5]}")

    logger.info(f"Metadata fetch complete: {len(meta) - len(failed_symbols)}/{len(symbols)} successful")
    return meta


def upsert_top_picks(conn, ranked_df, period, meta, batch_timestamp):
    """
    Upsert top picks with a shared timestamp to ensure all picks from the same run
    have identical updated_at values (prevents millisecond differences).
    """
    cur = conn.cursor()
    for _, row in ranked_df.iterrows():
        symbol_full = row["symbol"]
        symbol = symbol_full.replace(".NS", "")
        company_name = meta.get(symbol_full, {}).get("company_name", "N/A")
        sector = meta.get(symbol_full, {}).get("sector", "N/A")

        # Build detailed rationale
        sharpe = row.get('sharpe_ratio', 0)
        win_rate = row.get('win_rate', 0)
        rationale = (
            f"Multi-factor score {row['score']:.2f}/1.0: "
            f"{row['return']*100:.1f}% return, "
            f"Sharpe {sharpe:.2f}, "
            f"{win_rate*100:.0f}% win rate"
        )

        cur.execute("""
            INSERT INTO top_picks (symbol, company_name, sector, period, last_price, expected_target, return_percent, score, rationale, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol, period)
            DO UPDATE SET
                company_name = EXCLUDED.company_name,
                sector = EXCLUDED.sector,
                last_price = EXCLUDED.last_price,
                expected_target = EXCLUDED.expected_target,
                return_percent = EXCLUDED.return_percent,
                score = EXCLUDED.score,
                rationale = EXCLUDED.rationale,
                updated_at = EXCLUDED.updated_at;
        """, (
            symbol,
            company_name,
            sector,
            period,
            float(row["last_price"]),
            float(row["last_price"] * (1 + row["return"])),
            float(row["return"] * 100),
            float(row["score"]),
            rationale,
            batch_timestamp  # Use shared timestamp instead of now()
        ))
    conn.commit()
    cur.close()


def execute_picks():
    """
    Main execution function with comprehensive error handling.
    Fetches stock data, computes scores, and updates database.
    """
    try:
        tickers = get_all_tickers()
        logger.info(f"Starting top picks execution for {len(tickers)} tickers")

        conn = psycopg2.connect(**DB_CONFIG)
        all_data = pd.DataFrame()

        # Fetch in batches with progress tracking
        total_batches = (len(tickers) + BATCH_SIZE - 1) // BATCH_SIZE
        successful_batches = 0

        for i in range(0, len(tickers), BATCH_SIZE):
            batch_num = i // BATCH_SIZE + 1
            batch = tickers[i:i+BATCH_SIZE]

            logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} symbols)")

            try:
                df = fetch_batch(batch)
                if not df.empty and len(df.columns) > 0:
                    all_data = pd.concat([all_data, df], axis=1)
                    successful_batches += 1
                    logger.info(f"  Batch {batch_num} success: {len(df.columns)} symbols, cumulative: {len(all_data.columns)}")
                else:
                    logger.warning(f"  Batch {batch_num} returned no data")
            except Exception as e:
                logger.error(f"  Batch {batch_num} failed: {e}")

            # Add delay between batches to avoid rate limiting
            if batch_num < total_batches:
                time.sleep(3)

        logger.info(f"\n{'='*60}")
        logger.info(f"Data collection complete: {successful_batches}/{total_batches} batches successful")
        logger.info(f"Total data: {all_data.shape[0]} rows x {all_data.shape[1]} columns")

        if all_data.empty or len(all_data.columns) == 0:
            logger.error("CRITICAL: No data collected. Cannot compute top picks.")
            conn.close()
            return

        logger.info(f"Date range: {all_data.index[0]} to {all_data.index[-1]}")
        logger.info(f"{'='*60}\n")

        # Derive sub-periods
        one_month = all_data.tail(22) if len(all_data) >= 22 else all_data
        three_month = all_data.tail(66) if len(all_data) >= 66 else all_data
        six_month = all_data

        logger.info("Period data shapes:")
        logger.info(f"  1 Month: {one_month.shape[0]} rows x {one_month.shape[1]} columns")
        logger.info(f"  3 Month: {three_month.shape[0]} rows x {three_month.shape[1]} columns")
        logger.info(f"  6 Month: {six_month.shape[0]} rows x {six_month.shape[1]} columns")

        # Compute top 5 for each period
        logger.info("\nComputing scores for each period...")
        ranked_1M = compute_scores(one_month).head(5)
        ranked_3M = compute_scores(three_month).head(5)
        ranked_6M = compute_scores(six_month).head(5)

        logger.info(f"\nRanked results:")
        logger.info(f"  1M top picks: {len(ranked_1M)}")
        if len(ranked_1M) > 0:
            logger.info(f"    Top: {ranked_1M.iloc[0]['symbol']} (score: {ranked_1M.iloc[0]['score']:.3f})")
        logger.info(f"  3M top picks: {len(ranked_3M)}")
        if len(ranked_3M) > 0:
            logger.info(f"    Top: {ranked_3M.iloc[0]['symbol']} (score: {ranked_3M.iloc[0]['score']:.3f})")
        logger.info(f"  6M top picks: {len(ranked_6M)}")
        if len(ranked_6M) > 0:
            logger.info(f"    Top: {ranked_6M.iloc[0]['symbol']} (score: {ranked_6M.iloc[0]['score']:.3f})")

        # Check if we have any valid picks
        if len(ranked_1M) == 0 and len(ranked_3M) == 0 and len(ranked_6M) == 0:
            logger.error("CRITICAL: No valid picks generated for any period!")
            conn.close()
            return

        # Gather all unique top symbols
        all_top_symbols = pd.concat([ranked_1M, ranked_3M, ranked_6M])["symbol"].unique()
        logger.info(f"\nFetching metadata for {len(all_top_symbols)} unique symbols...")
        meta = fetch_metadata(all_top_symbols)

        # Create a single timestamp for all picks in this batch
        from datetime import datetime, timezone
        batch_timestamp = datetime.now(timezone.utc)
        logger.info(f"Using batch timestamp: {batch_timestamp}")

        # Insert into database with shared timestamp
        for label, ranked in [("1M", ranked_1M), ("3M", ranked_3M), ("6M+", ranked_6M)]:
            if len(ranked) > 0:
                upsert_top_picks(conn, ranked, label, meta, batch_timestamp)
                logger.info(f"  ✓ Top {len(ranked)} for {label} updated with metadata")
            else:
                logger.warning(f"  ⚠ No picks to update for {label}")

        conn.close()
        logger.info("✓ All top picks updated successfully")

    except Exception as e:
        logger.error(f"CRITICAL ERROR in execute_picks: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    execute_picks()
