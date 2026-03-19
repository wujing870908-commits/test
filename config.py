"""
Central configuration for Financial News Video Automation.
Copy .env.example to .env and fill in your keys.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ──────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4-5")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")          # newsapi.org (free tier OK)
EDGE_TTS_VOICE = os.getenv("EDGE_TTS_VOICE", "zh-CN-XiaoxiaoNeural")  # female voice
EDGE_TTS_RATE  = os.getenv("EDGE_TTS_RATE",  "+40%")                 # 40% faster

# ── Market symbols ────────────────────────────────────────────────────────────
INDICES = {
    "标准普尔500": "^GSPC",
    "纳斯达克":    "^IXIC",
    "道琼斯":      "^DJI",
    "罗素2000":    "^RUT",
    "恐慌指数":    "^VIX",
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
    "WTI原油":  "CL=F",
    "布伦特原油": "BZ=F",
    "黄金":     "GC=F",
    "白银":     "SI=F",
    "天然气":   "NG=F",
    "铜":       "HG=F",
}

SECTORS = {
    "科技":    "XLK",
    "金融":    "XLF",
    "能源":    "XLE",
    "医疗健康": "XLV",
    "消费可选": "XLY",
    "消费必需": "XLP",
    "工业":    "XLI",
    "材料":    "XLB",
    "通信服务": "XLC",
    "房地产":  "XLRE",
    "公用事业": "XLU",
}

# ── Paths ─────────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.expanduser(os.getenv("OUTPUT_DIR", "~/jobs/海外日报"))
AUDIO_FILENAME = "narration.mp3"

# ── Scheduler ─────────────────────────────────────────────────────────────────
# 07:30 Beijing time = 23:30 UTC (when US market is closed ~4h earlier)
SCHEDULE_TIME_UTC = "23:30"
