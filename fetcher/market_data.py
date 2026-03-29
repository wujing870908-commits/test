"""
Fetches overnight US market data.
Primary source: FMP API (if FMP_API_KEY is set) — provides intraday 1-min data.
Fallback: yfinance (free, no key required).
Returns a structured dict ready for AI processing and Remotion rendering.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import yfinance as yf

from config import INDICES, MAG7, COMMODITIES, SECTORS

logger = logging.getLogger(__name__)


def _fetch_ticker_yf(symbol: str) -> dict[str, Any]:
    """Return price, change%, and 30-day history via yfinance (fallback)."""
    tk = yf.Ticker(symbol)
    # Pull last 2 trading days to compute overnight change
    hist = tk.history(period="2d", interval="1d")
    if len(hist) < 2:
        hist = tk.history(period="5d", interval="1d")

    if hist.empty:
        logger.warning("No data for %s", symbol)
        return {"price": None, "change_pct": None, "history": [], "intraday": []}

    latest = hist["Close"].iloc[-1]
    prev   = hist["Close"].iloc[-2]
    change_pct = (latest - prev) / prev * 100

    # 30-day close history for chart rendering
    hist30 = tk.history(period="30d", interval="1d")
    history = [
        {"date": str(d.date()), "close": round(float(c), 4)}
        for d, c in zip(hist30.index, hist30["Close"])
    ]

    # yfinance intraday: try 1-day 1-min data
    intraday = []
    try:
        hist_intra = tk.history(period="1d", interval="1m")
        if not hist_intra.empty:
            intraday = [
                {"time": str(d.time())[:5], "close": round(float(c), 4)}
                for d, c in zip(hist_intra.index, hist_intra["Close"])
            ]
    except Exception:
        pass

    return {
        "price":      round(float(latest), 4),
        "change_pct": round(float(change_pct), 2),
        "history":    history,
        "intraday":   intraday,
    }


def _fetch_ticker(symbol: str) -> dict[str, Any]:
    """Fetch ticker data. Prefer FMP if available, fall back to yfinance."""
    try:
        from fetcher.fmp_data import is_available, fetch_ticker_fmp
        if is_available():
            logger.info("Using FMP API for %s", symbol)
            return fetch_ticker_fmp(symbol)
    except ImportError:
        pass
    return _fetch_ticker_yf(symbol)


def fetch_market_snapshot() -> dict[str, Any]:
    """
    Main entry point. Returns:
    {
      "as_of": "2026-03-14T07:30:00+08:00",
      "indices":    { "S&P 500": {...}, ... },
      "mag7":       { "苹果": {...}, ... },
      "commodities": { "黄金": {...}, ... },
    }
    """
    now_beijing = datetime.now(timezone(timedelta(hours=8)))
    snapshot: dict[str, Any] = {
        "as_of": now_beijing.isoformat(timespec="seconds"),
        "indices": {},
        "mag7": {},
        "commodities": {},
        "sectors": {},
    }

    groups = [
        ("indices",     INDICES),
        ("mag7",        MAG7),
        ("commodities", COMMODITIES),
        ("sectors",     SECTORS),
    ]

    for key, symbols in groups:
        for name, symbol in symbols.items():
            logger.info("Fetching %s (%s)…", name, symbol)
            try:
                snapshot[key][name] = _fetch_ticker(symbol)
            except Exception as exc:
                logger.error("Failed %s: %s", symbol, exc)
                snapshot[key][name] = {"price": None, "change_pct": None, "history": []}

    return snapshot


if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.INFO)
    data = fetch_market_snapshot()
    print(json.dumps(data, ensure_ascii=False, indent=2))
