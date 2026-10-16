import logging
import time

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
    except Exception:
        logger.exception("Symbol/top-picks refresh failed; previous catalog remains active")


def main():
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


if __name__ == "__main__":
    main()
