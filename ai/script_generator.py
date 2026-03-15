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

from openai import OpenAI

from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

SYSTEM_PROMPT = """你是一位专业的中文财经播报员，风格简洁、生动、通俗易懂。
你的任务是把原始市场数据转化为一段适合视频播报的中文脚本，总播报时长控制在 110-130 秒（约 2 分钟）。

【数据准确性是最高优先级，任何错误都可能误导投资者】

要求：
1. 以 JSON 数组格式返回，每个元素是一个"片段"，包含字段：
   - "type": 片段类型，值为 intro / indices / mag7 / commodities / crypto / sectors / news / outro 之一
   - "text": 播报员要说的话（中文，自然流畅，每段 50-70 字，语速约 4字/秒）
   - "highlight": 可选，该片段最值得上屏展示的关键数字或词语
2. 必须包含的段落顺序：intro → indices → mag7 → commodities → crypto → sectors → news → outro
3. 涨跌方向规则（严格执行，绝不允许搞反）：
   - change_pct 为负数 → 只能用"跌"、"下跌"、"回落"等词，绝对禁止用"涨"
   - change_pct 为正数 → 只能用"涨"、"上涨"、"走强"等词，绝对禁止用"跌"
4. 数字准确性规则：
   - 只能引用原始数据中的确切数字，严禁估算、四舍五入超过0.01%或编造数字
   - 所有数字必须使用阿拉伯数字，如 75000、+1.2%、-0.85%，严禁中文数字
5. 一致性规则：
   - 个股表现必须与所在板块ETF方向一致，若个股多数下跌则板块不能说"普涨"
   - 大盘指数方向必须与实际数据匹配，禁止说"市场全线飘红"而数据显示全跌
6. 新闻只选 2 条最重要的，用中文一句话总结（若标题是英文须翻译成中文）。
7. 绝对不要输出 JSON 以外的任何内容，不要 markdown 代码块。"""


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

    sectors_str = _fmt_group(snapshot.get("sectors", {}))
    crypto_str = _fmt_group(snapshot.get("crypto", {}))

    return f"""时间：{snapshot['as_of']}

【美股主要指数】
{_fmt_group(snapshot['indices'])}

【Mag7 七巨头】
{_fmt_group(snapshot['mag7'])}

【大宗商品】
{_fmt_group(snapshot['commodities'])}

【加密货币】
{crypto_str}

【板块ETF】
{sectors_str}

【宏观新闻】
{news_lines}

请生成约2分钟的播报脚本。"""


def _validate_script(segments: list[dict[str, Any]], snapshot: dict[str, Any]) -> list[str]:
    """
    Check the generated script for directional inconsistencies vs. actual data.
    Returns a list of warning strings (empty = all good).
    """
    # Build name → change_pct lookup across all asset categories
    assets: dict[str, float] = {}
    for cat in ("indices", "mag7", "commodities", "crypto", "sectors"):
        for name, data in snapshot.get(cat, {}).items():
            if data.get("change_pct") is not None:
                assets[name] = data["change_pct"]

    UP_WORDS   = ("涨", "上涨", "走强", "飘红", "反弹", "拉升", "升")
    DOWN_WORDS = ("跌", "下跌", "回落", "走弱", "飘绿", "下挫", "降")

    warnings = []
    for seg in segments:
        text = seg.get("text", "")
        seg_type = seg.get("type", "")
        for name, change_pct in assets.items():
            if name not in text:
                continue
            # Extract a window of text around the asset name
            idx = text.find(name)
            window = text[max(0, idx - 8): idx + len(name) + 16]

            has_up   = any(w in window for w in UP_WORDS)
            has_down = any(w in window for w in DOWN_WORDS)

            if change_pct < 0 and has_up and not has_down:
                warnings.append(
                    f"[{seg_type}] 数据不符: {name} 实际跌 {abs(change_pct):.2f}%，"
                    f"但脚本描述为上涨。上下文: 「{window.strip()}」"
                )
            elif change_pct > 0 and has_down and not has_up:
                warnings.append(
                    f"[{seg_type}] 数据不符: {name} 实际涨 {change_pct:.2f}%，"
                    f"但脚本描述为下跌。上下文: 「{window.strip()}」"
                )
    return warnings


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
    logger.info("Calling %s via OpenRouter to generate script…", OPENROUTER_MODEL)

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        max_tokens=2048,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
    )

    raw = response.choices[0].message.content.strip()
    logger.debug("Raw model response:\n%s", raw)

    # Strip markdown code fences if present (e.g. ```json ... ```)
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        segments = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse model response as JSON: %s\n%s", exc, raw)
        segments = [{"type": "intro", "text": raw, "highlight": None}]

    # ── Data consistency validation ────────────────────────────────────────
    issues = _validate_script(segments, snapshot)
    if issues:
        logger.warning("⚠️  Script data inconsistencies detected (%d):", len(issues))
        for issue in issues:
            logger.warning("    %s", issue)
    else:
        logger.info("✅ Script data validation passed — no direction mismatches.")

    return segments


def translate_news(news: list[dict[str, str]]) -> list[dict[str, str]]:
    """
    Translate any English news titles to Chinese.
    Returns a new list with 'title' translated; other fields preserved.
    """
    titles = [item["title"] for item in news]
    # Check if any title appears to be non-Chinese (contains mostly ASCII)
    needs_translation = any(
        sum(1 for c in t if ord(c) > 127) < len(t) * 0.3
        for t in titles
    )
    if not needs_translation:
        return news

    prompt = (
        "将以下新闻标题翻译成简洁的中文，保留原意，每条一行，只输出翻译结果，不要编号或解释：\n"
        + "\n".join(titles)
    )
    logger.info("Translating %d news titles to Chinese…", len(titles))
    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    translated_lines = response.choices[0].message.content.strip().split("\n")

    result = []
    for i, item in enumerate(news):
        translated_title = translated_lines[i].strip() if i < len(translated_lines) else item["title"]
        result.append({**item, "title": translated_title})
    return result


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
