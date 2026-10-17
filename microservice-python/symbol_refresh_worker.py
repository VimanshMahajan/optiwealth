import argparse
import logging
import sys

from apscheduler.schedulers.blocking import BlockingScheduler

from top_picks.top_picks import execute_picks
from utils.symbol_catalog import refresh_symbols

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def refresh_catalog_and_picks():
    try:
        count = refresh_symbols()
        logger.info("Refreshed %d NSE symbols", count)
        execute_picks()
        return True
    except Exception:
        logger.exception("Symbol/top-picks refresh failed; previous catalog remains active")
        return False


def main(argv=None):
    parser = argparse.ArgumentParser(description="Refresh the NSE symbol catalog and Top Picks.")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run the refresh once and exit with a success or failure status.",
    )
    args = parser.parse_args(argv)

    if args.once:
        return 0 if refresh_catalog_and_picks() else 1

    scheduler = BlockingScheduler()
    scheduler.add_job(
        refresh_catalog_and_picks,
        "cron",
        hour=2,
        minute=0,
        id="daily_catalog_refresh",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    logger.info("Running initial symbol and top-picks refresh in worker process")
    refresh_catalog_and_picks()
    logger.info("Worker started; next refresh is scheduled for 02:00")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown(wait=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
