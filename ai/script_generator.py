"""
Generates a Chinese financial-news broadcast script using the Claude API.
The output is a list of "segments", each carrying:
  - text   : the spoken words
  - type   : "intro" | "indices" | "mag7" | "commodities" | "news" | "outro"
  - data   : optional structured payload for Remotion overlays
"""
from __future__ import annotations

import json
import logging
from typing import Any

import anthropic

from config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """你是一位专业的中文财经播报员，风格简洁、生动、通俗易懂。
你的任务是把原始市场数据转化为一段适合视频播报的中文脚本。

要求：
1. 以 JSON 数组格式返回，每个元素是一个"片段"，包含字段：
   - "type": 片段类型，值为 intro / indices / mag7 / commodities / news / outro 之一
   - "text": 播报员要说的话（中文，自然流畅，不超过 80 字/段）
   - "highlight": 可选，该片段最值得上屏展示的关键数字或词语
2. 开场用 intro，结尾用 outro，中间按顺序覆盖指数、Mag7、大宗商品、宏观新闻。
3. 涨跌用"涨了 X%"/"跌了 X%"表达；用"上涨"/"下跌"描述方向。
4. 新闻段落只选 2-3 条最重要的，简要一句话总结。
5. 绝对不要输出 JSON 以外的任何内容，不要 markdown 代码块。"""


def _build_user_message(snapshot: dict[str, Any], news: list[dict[str, str]]) -> str:
    def _fmt_group(group: dict[str, Any]) -> str:
        lines = []
        for name, data in group.items():
            if data.get("price") is None:
                lines.append(f"  {name}: 数据缺失")
            else:
                sign = "+" if data["change_pct"] >= 0 else ""
                lines.append(f"  {name}: {data['price']}  {sign}{data['change_pct']}%")
        return "\n".join(lines)

    news_lines = "\n".join(
        f"  [{i+1}] {item['title']} ({item['source']})"
        for i, item in enumerate(news[:5])
    )

    return f"""时间：{snapshot['as_of']}

【美股主要指数】
{_fmt_group(snapshot['indices'])}

【Mag7 七巨头】
{_fmt_group(snapshot['mag7'])}

【大宗商品】
{_fmt_group(snapshot['commodities'])}

【宏观新闻】
{news_lines}

请生成播报脚本。"""


def generate_script(
    snapshot: dict[str, Any],
    news: list[dict[str, str]],
) -> list[dict[str, Any]]:
    """
    Returns a list of segment dicts, e.g.
    [
      {"type": "intro", "text": "大家早上好，...", "highlight": null},
      {"type": "indices", "text": "昨夜美股收盘...", "highlight": "+1.2%"},
      ...
    ]
    """
    user_msg = _build_user_message(snapshot, news)
    logger.info("Calling Claude to generate script…")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()
    logger.debug("Raw Claude response:\n%s", raw)

    try:
        segments = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Claude response as JSON: %s\n%s", exc, raw)
        # Fallback: wrap everything in a single segment
        segments = [{"type": "intro", "text": raw, "highlight": None}]

    return segments


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    # Quick test with dummy data
    dummy_snapshot = {
        "as_of": "2026-03-14T07:30:00+08:00",
        "indices": {"S&P 500": {"price": 5120.5, "change_pct": 0.85, "history": []}},
        "mag7": {"英伟达": {"price": 875.0, "change_pct": 3.2, "history": []}},
        "commodities": {"黄金": {"price": 2320.0, "change_pct": -0.3, "history": []}},
    }
    dummy_news = [{"title": "Fed holds rates steady", "source": "Reuters", "url": ""}]
    segments = generate_script(dummy_snapshot, dummy_news)
    print(json.dumps(segments, ensure_ascii=False, indent=2))
