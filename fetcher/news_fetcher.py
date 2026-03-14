"""
Fetches top macro/financial news headlines via NewsAPI.
Falls back to a curated RSS parse if no API key is set.
"""
from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import Any

import requests

from config import NEWS_API_KEY

logger = logging.getLogger(__name__)

# RSS feeds used as fallback (no key required)
RSS_FEEDS = [
    ("Reuters Markets",  "https://feeds.reuters.com/reuters/businessNews"),
    ("Bloomberg Markets","https://feeds.bloomberg.com/markets/news.rss"),
    ("FT Markets",       "https://www.ft.com/markets?format=rss"),
]

NEWSAPI_ENDPOINT = "https://newsapi.org/v2/top-headlines"
NEWSAPI_PARAMS = {
    "category": "business",
    "language": "en",
    "pageSize": 10,
}


def _fetch_via_newsapi() -> list[dict[str, str]]:
    params = {**NEWSAPI_PARAMS, "apiKey": NEWS_API_KEY}
    resp = requests.get(NEWSAPI_ENDPOINT, params=params, timeout=15)
    resp.raise_for_status()
    articles = resp.json().get("articles", [])
    return [
        {"title": a["title"], "source": a["source"]["name"], "url": a["url"]}
        for a in articles
        if a.get("title")
    ][:8]


def _fetch_via_rss() -> list[dict[str, str]]:
    headlines: list[dict[str, str]] = []
    for source, url in RSS_FEEDS:
        try:
            resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            root = ET.fromstring(resp.content)
            for item in root.findall(".//item")[:4]:
                title_el = item.find("title")
                link_el  = item.find("link")
                if title_el is not None and title_el.text:
                    headlines.append({
                        "title":  title_el.text.strip(),
                        "source": source,
                        "url":    link_el.text.strip() if link_el is not None else "",
                    })
        except Exception as exc:
            logger.warning("RSS fetch failed for %s: %s", source, exc)
    return headlines[:8]


def fetch_macro_news() -> list[dict[str, str]]:
    """
    Returns up to 8 news items:
    [{"title": "...", "source": "Reuters", "url": "..."}, ...]
    """
    if NEWS_API_KEY:
        try:
            return _fetch_via_newsapi()
        except Exception as exc:
            logger.warning("NewsAPI failed, falling back to RSS: %s", exc)
    return _fetch_via_rss()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    for item in fetch_macro_news():
        print(f"[{item['source']}] {item['title']}")
