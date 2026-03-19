"""
Generates a detailed Chinese financial daily report (report_zh.md) using Claude via OpenRouter.
Mirrors the format of ~/jobs/海外日报/YYYY-MM-DD/report_zh.md.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any

from openai import OpenAI

from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

REPORT_SYSTEM_PROMPT = """你是一位专业的中文金融分析师，擅长撰写深度财经日报。
请根据提供的市场数据和新闻，生成一份详尽的海外金融市场日报（Markdown格式）。

报告结构要求：
# {日期} 海外金融市场日报

*数据反映截至上一交易日收盘*

---

## 执行摘要
（2-3段深度分析，覆盖市场整体走势、核心驱动因素、风险主线）

---

## 0. 过去24小时重大宏观新闻
每条新闻用 ### 标题，加表情符号，正文2-3段深度解读

---

## 1. 主要股指表现
表格 + 深度分析

---

## 2. 大宗商品
### 大宗商品（表格）
深度分析

---

## 3. 科技七巨头（Magnificent 7）表现
表格（含关键驱动因素列）+ 深度分析

---

## 4. 板块表现一览
表格 + 深度解读

---

## 5. 近期重要事件前瞻
表格（日期/事件/市场关注点）

---

## 6. 短期市场预判与风险因素
多头支撑、空头压力、技术面关键位、综合判断

---

*本报告数据基于[日期]收盘价*

要求：
- 全程中文，专业金融术语
- 数据精确，涨跌用▲▼符号
- 每个板块必须有深度分析，不能只列数据
- 直接输出Markdown，不要任何额外说明"""


def _build_report_prompt(snapshot: dict[str, Any], news: list[dict[str, str]]) -> str:
    def _fmt(group: dict[str, Any], show_history: bool = False) -> str:
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
        for i, item in enumerate(news[:6])
    )

    sectors_str = _fmt(snapshot.get("sectors", {}))

    beijing_date = datetime.now(timezone(timedelta(hours=8))).strftime("%Y年%m月%d日")

    return f"""今日日期：{beijing_date}
数据时间：{snapshot['as_of']}

【美股主要指数】
{_fmt(snapshot['indices'])}

【Mag7 七巨头】
{_fmt(snapshot['mag7'])}

【大宗商品】
{_fmt(snapshot['commodities'])}

【板块ETF涨跌】
{sectors_str}

【宏观新闻标题】
{news_lines}

请生成完整日报（注意：不要包含任何加密货币/虚拟货币相关内容）。"""


def generate_report(
    snapshot: dict[str, Any],
    news: list[dict[str, str]],
) -> str:
    """Returns the full Markdown report string."""
    prompt = _build_report_prompt(snapshot, news)
    logger.info("Calling %s via OpenRouter to generate daily report…", OPENROUTER_MODEL)

    response = client.chat.completions.create(
        model=OPENROUTER_MODEL,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content.strip()
