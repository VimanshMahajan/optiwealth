import os
from datetime import datetime, timezone

import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT") or "5432"),
}


def _database_config():
    names = {"DB_NAME": "dbname", "DB_USER": "user", "DB_PASSWORD": "password", "DB_HOST": "host"}
    missing = [key for key, field in names.items() if not DB_CONFIG[field]]
    if missing:
        raise RuntimeError("Missing required Python database environment variables: " + ", ".join(missing))
    return DB_CONFIG

NSE_SYMBOLS_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"


def get_connection():
    return psycopg2.connect(**_database_config())


def get_active_symbols():
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT symbol FROM symbols WHERE is_active = TRUE ORDER BY symbol"
            )
            return [row[0] for row in cursor.fetchall()]


def refresh_symbols():
    """Replace the active catalog only after the complete NSE download succeeds."""
    source = pd.read_csv(NSE_SYMBOLS_URL, usecols=["SYMBOL"])
    symbols = sorted({
        str(value).strip().upper()
        for value in source["SYMBOL"].dropna()
        if str(value).strip()
    })
    if not symbols:
        raise RuntimeError("NSE symbol download returned no symbols")

    timestamp = datetime.now(timezone.utc)
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS symbols (
                    symbol VARCHAR(30) PRIMARY KEY,
                    company_name VARCHAR(255),
                    exchange VARCHAR(20) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
                )
                """
            )
            cursor.execute("UPDATE symbols SET is_active = FALSE")
            cursor.executemany(
                """
                INSERT INTO symbols (symbol, exchange, is_active, updated_at)
                VALUES (%s, 'NSE', TRUE, %s)
                ON CONFLICT (symbol) DO UPDATE SET
                    exchange = EXCLUDED.exchange,
                    is_active = TRUE,
                    updated_at = EXCLUDED.updated_at
                """,
                [(symbol, timestamp) for symbol in symbols],
            )
        connection.commit()
    return len(symbols)
