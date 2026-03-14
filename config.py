"""
Central configuration for Financial News Video Automation.
Copy .env.example to .env and fill in your keys.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ──────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")          # newsapi.org (free tier OK)
EDGE_TTS_VOICE = os.getenv("EDGE_TTS_VOICE", "zh-CN-YunxiNeural")  # free MS TTS

# ── Market symbols ────────────────────────────────────────────────────────────
INDICES = {
    "S&P 500":  "^GSPC",
    "纳斯达克":  "^IXIC",
    "道琼斯":   "^DJI",
    "恐慌指数":  "^VIX",
}

MAG7 = {
    "苹果":    "AAPL",
    "微软":    "MSFT",
    "谷歌":    "GOOGL",
    "亚马逊":  "AMZN",
    "Meta":   "META",
    "特斯拉":  "TSLA",
    "英伟达":  "NVDA",
}

COMMODITIES = {
    "黄金":  "GC=F",
    "原油":  "CL=F",
    "比特币": "BTC-USD",
}

# ── Paths ─────────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")
AUDIO_FILENAME = "narration.mp3"
VIDEO_FILENAME = "daily_report.mp4"

# ── Scheduler ─────────────────────────────────────────────────────────────────
# 07:30 Beijing time = 23:30 UTC (when US market is closed ~4h earlier)
SCHEDULE_TIME_UTC = "23:30"
