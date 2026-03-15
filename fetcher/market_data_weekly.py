import logging
from datetime import datetime, timedelta, timezone
from typing import Any
import yfinance as yf
from .market_data import _fetch_ticker as _fetch_daily_ticker # Keep daily logic if needed

logger = logging.getLogger(__name__)

def fetch_weekly_ticker(symbol: str) -> dict[str, Any]:
    tk = yf.Ticker(symbol)
    # Fetch 1 month to ensure we have last Friday and this Friday
    hist = tk.history(period="1mo", interval="1d")
    
    if len(hist) < 2:
        return {"price": None, "change_pct": None, "history": []}

    # "This Friday" (latest close)
    latest_close = hist["Close"].iloc[-1]
    
    # "Last Friday": Look back for the trading day 5 sessions ago
    # For a standard week, -1 is Fri, -2 Thu, -3 Wed, -4 Tue, -5 Mon, -6 Previous Fri
    try:
        prev_friday_close = hist["Close"].iloc[-6] 
        change_pct = (latest_close - prev_friday_close) / prev_friday_close * 100
    except IndexError:
        prev_close = hist["Close"].iloc[-2]
        change_pct = (latest_close - prev_close) / prev_close * 100

    hist30 = tk.history(period="30d", interval="1d")
    history = [
        {"date": str(d.date()), "close": round(float(c), 4)}
        for d, c in zip(hist30.index, hist30["Close"])
    ]

    return {
        "price":      round(float(latest_close), 4),
        "change_pct": round(float(change_pct), 2),
        "history":    history,
    }
