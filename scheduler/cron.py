"""
Scheduler: triggers the pipeline every morning at 07:30 Beijing time (UTC+8).

Run with:
  python scheduler/cron.py

Uses APScheduler (blocking). In production, wrap with systemd / Docker / pm2.
"""
from __future__ import annotations

import logging

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from pipeline import run_pipeline

logger = logging.getLogger(__name__)


def job() -> None:
    logger.info("Scheduled pipeline triggered.")
    try:
        result = run_pipeline(render_video=True)
        logger.info("Pipeline completed: %s", result)
    except Exception as exc:
        logger.exception("Pipeline failed: %s", exc)


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    scheduler = BlockingScheduler(timezone="Asia/Shanghai")

    # Every day at 07:30 Beijing time
    scheduler.add_job(
        job,
        trigger=CronTrigger(hour=7, minute=30, timezone="Asia/Shanghai"),
        name="financial_news_pipeline",
        misfire_grace_time=300,   # allow up to 5-min late start
        coalesce=True,            # skip missed runs
    )

    logger.info("Scheduler started — pipeline will run daily at 07:30 (Asia/Shanghai).")
    logger.info("Press Ctrl+C to exit.")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    main()
