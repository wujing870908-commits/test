"""
Fetches market data via Financial Modeling Prep (FMP) API.
Provides intraday 1-min data, real-time quotes, and company logos.
Falls back to yfinance if FMP_API_KEY is not set.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from config import FMP_API_KEY

logger = logging.getLogger(__name__)

FMP_BASE = "https://financialmodelingprep.com/api/v3"

# FMP uses standard symbols (no ^ prefix for indices)
SYMBOL_MAP = {
    "^GSPC": "^GSPC",
    "^IXIC": "^IXIC",
    "^DJI":  "^DJI",
    "^RUT":  "^RUT",
    "^VIX":  "^VIX",
}


def _fmp_get(endpoint: str, params: dict | None = None) -> Any:
    """Make an authenticated GET request to FMP API."""
    params = params or {}
    params["apikey"] = FMP_API_KEY
    url = f"{FMP_BASE}/{endpoint}"
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def fetch_quote(symbol: str) -> dict[str, Any]:
    """Fetch real-time quote for a single symbol."""
    data = _fmp_get(f"quote/{symbol}")
    if not data:
        return {"price": None, "change_pct": None}
    q = data[0]
    return {
        "price": round(q.get("price", 0), 4),
        "change_pct": round(q.get("changesPercentage", 0), 2),
    }


def fetch_intraday(symbol: str, interval: str = "1min") -> list[dict[str, Any]]:
    """
    Fetch intraday data (1-min intervals) for the current/last trading day.
    Returns list of {"time": "HH:MM", "close": float}.
    """
    try:
        data = _fmp_get(f"historical-chart/{interval}/{symbol}")
        if not data:
            return []

        # FMP returns newest first; reverse for chronological order
        data = list(reversed(data))

        # Filter to most recent trading day only
        if data:
            last_date = data[-1].get("date", "")[:10]
            data = [d for d in data if d.get("date", "").startswith(last_date)]

        return [
            {
                "time": d.get("date", "")[11:16],  # "HH:MM"
                "close": round(float(d.get("close", 0)), 4),
            }
            for d in data
            if d.get("date") and d.get("close") is not None
        ]
    except Exception as exc:
        logger.warning("FMP intraday fetch failed for %s: %s", symbol, exc)
        return []


def fetch_logo_url(symbol: str) -> str | None:
    """Return the FMP company logo URL."""
    # FMP provides logos at a predictable URL
    return f"https://financialmodelingprep.com/image-stock/{symbol}.png"


def fetch_ticker_fmp(symbol: str) -> dict[str, Any]:
    """
    Return price, change%, 30-day history, and intraday data for one ticker.
    Drop-in replacement for yfinance _fetch_ticker().
    """
    # Real-time quote
    quote = fetch_quote(symbol)

    # 30-day daily history
    history = []
    try:
        data = _fmp_get(f"historical-price-full/{symbol}", {"timeseries": 30})
        if data and "historical" in data:
            history = [
                {"date": d["date"], "close": round(float(d["close"]), 4)}
                for d in reversed(data["historical"])
            ]
    except Exception as exc:
        logger.warning("FMP 30d history failed for %s: %s", symbol, exc)

    # Intraday 1-min data
    intraday = fetch_intraday(symbol)

    return {
        "price": quote["price"],
        "change_pct": quote["change_pct"],
        "history": history,
        "intraday": intraday,
    }


def is_available() -> bool:
    """Check if FMP API key is configured."""
    return bool(FMP_API_KEY)
