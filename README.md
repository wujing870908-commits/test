# 美股日报自动化视频生成系统

每天早上 7:30（北京时间）自动生成一条涵盖隔夜美股行情、Mag7、大宗商品和宏观新闻的中文财经视频。

```
数据抓取 → AI 生成台词 → TTS 语音合成 → Remotion 视频渲染
```

---

## 系统架构

```
financial-news-video/
├── fetcher/
│   ├── market_data.py      # Yahoo Finance → 指数 / Mag7 / 大宗商品
│   └── news_fetcher.py     # NewsAPI / RSS → 宏观新闻
├── ai/
│   └── script_generator.py # Claude API → 中文播报脚本
├── tts/
│   └── synthesizer.py      # edge-tts → MP3 + 精确时间戳
├── pipeline/
│   └── orchestrator.py     # 四步流水线总调度
├── scheduler/
│   └── cron.py             # APScheduler 每日 07:30 自动触发
├── video/remotion/         # Remotion 视频项目（TypeScript/React）
│   └── src/
│       ├── Composition.tsx     # 主合成：随音频节奏切换画面
│       ├── components/
│       │   ├── StockCard.tsx   # 涨跌卡片（弹簧动画）
│       │   ├── MiniChart.tsx   # 30 日 K 线迷你图（recharts）
│       │   ├── SubtitleBar.tsx # 字幕条（与音频时间戳同步）
│       │   └── NewsTicket.tsx  # 新闻卡片
│       └── hooks/
│           └── useCurrentSegment.ts  # 根据当前帧返回活跃字幕段
├── config.py               # 集中配置
├── main.py                 # 单次手动执行
└── requirements.txt
```

---

## 快速开始

### 1. Python 环境

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Node.js 环境（Remotion 渲染）

```bash
cd video/remotion
npm install
```

> 要求 Node.js ≥ 18，ffmpeg 已安装（`brew install ffmpeg` / `apt install ffmpeg`）

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入：
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEWS_API_KEY=...（可选，无 key 自动降级到 RSS）
```

### 4. 手动运行一次

```bash
# 完整流程（含视频渲染）
python main.py

# 跳过视频渲染（快速测试脚本+语音）
python main.py --no-video
```

输出文件位于 `output/YYYY-MM-DD/`：
| 文件 | 内容 |
|------|------|
| `script.json` | AI 生成的分段播报脚本 |
| `narration.mp3` | 合并后的完整语音 |
| `timings.json` | 每段语音的精确时间戳（供 Remotion 使用）|
| `remotion_props.json` | 传给 Remotion 的完整数据 |
| `daily_report.mp4` | 最终视频 |

### 5. 启动每日定时任务

```bash
python scheduler/cron.py
```

每天 07:30（北京时间）自动触发完整流程。

---

## 数据来源

| 类别 | 来源 | 免费 |
|------|------|------|
| 美股指数 / Mag7 / 大宗商品 | Yahoo Finance (`yfinance`) | ✅ |
| 宏观新闻 | NewsAPI.org (有 key) 或 Reuters/Bloomberg RSS (无 key) | ✅ |
| AI 台词生成 | Anthropic Claude API (`claude-sonnet-4-6`) | 按量计费 |
| 文字转语音 | Microsoft Edge TTS (`edge-tts`) | ✅ |
| 视频渲染 | Remotion | ✅ |

---

## 关键技术点

### 音画同步原理

```
TTS 合成时 → 记录每段台词的 start_ms / end_ms
                        ↓
         写入 timings.json（时间戳清单）
                        ↓
Remotion 渲染时 → useCurrentSegment(frame)
              → 根据当前帧对应毫秒数找到活跃字幕段
              → 字幕条、数据卡片、图表随音频节奏切换
```

### 视频画面分段

| 音频段类型 | 视频内容 |
|-----------|---------|
| `intro` | 主指数卡片 + 日期 |
| `indices` | S&P / Nasdaq / Dow 卡片 + 30日折线图 |
| `mag7` | 七巨头涨跌网格 |
| `commodities` | 黄金 / 原油 / 比特币 + 图表 |
| `news` | 宏观新闻卡片列表 |
| `outro` | 片尾 |

---

## 专题视频生成器

除了每日美股日报，系统还支持**自定义专题视频**——只需写一个 YAML 配置文件。

### 快速上手

```bash
# 1. 复制模板
cp topics/_template.yaml topics/my_topic.yaml

# 2. 编辑配置（填入标题、股票代码、新闻、背景信息）
vi topics/my_topic.yaml

# 3. 生成视频
python3 generate_topic_video.py topics/my_topic.yaml

# 跳过渲染只生成脚本+音频（快速预览）
python3 generate_topic_video.py topics/my_topic.yaml --no-video

# 自定义输出文件名
python3 generate_topic_video.py topics/my_topic.yaml --slug v2-test
```

输出文件位于 `~/jobs/专题视频/YYYY-MM-DD_slug/`。

### 现有选题

| 文件 | 选题 | 说明 |
|------|------|------|
| `topics/_template.yaml` | 空白模板 | 有详细注释，复制即用 |
| `topics/auto_war.yaml` | 德国汽车 vs 中国新能源 | 德系利润暴跌 vs BYD反攻欧洲 |
| `topics/gold_crash.yaml` | 黄金暴跌反常识 | 打仗了黄金反而跌23% |
| `topics/us_jobs_fake.yaml` | 美国就业虚假繁荣 | 一个行业撑起整个数据 |

### YAML 配置说明

```yaml
title: "视频标题"                # 显示在封面
subtitle: "English Subtitle"    # 封面英文副标题
slug: my-topic                  # 输出文件夹名

tts_voice: "zh-CN-YunyangNeural"  # 男声（有力）
tts_rate: "+35%"                   # 语速
duration_target: "90-120秒"        # AI控制脚本长度
history_period: "6mo"              # 走势图周期

# 股票分组（最多4组，对应视频4个展示区域）
stocks:
  indices:                    # 第一组：带走势图（适合3-5只）
    label: "组名"
    tickers:
      中文名: YAHOO_TICKER

  mag7:                       # 第二组：紧凑卡片（适合5-7只）
    label: "组名"
    tickers: { ... }

  commodities:                # 第三组：横向对比柱状图
    label: "涨跌幅对比"
    mode: ytd                 # ytd=年初至今 / daily=当日
    tickers: { ... }

  sectors:                    # 第四组：紧凑卡片
    label: "组名"
    tickers: { ... }

# Yahoo Finance 代码速查：
#   A股: 000001.SZ / 600000.SS    港股: 0700.HK
#   美股: AAPL / TSLA             德股: VOW3.DE
#   ETF: SPY / QQQ / XLK         商品: GC=F / CL=F
#   指数: ^GSPC / ^IXIC          加密: BTC-USD

news_items:                   # 新闻区（最多4条）
  - title: "标题"
    source: "来源"

extra_context: |              # 注入AI的背景信息
  关键数据和你想强调的观点...
```

### 文件路径总览

```
/root/claudeCode/remotion-daily-report/test/
├── generate_topic_video.py     ← 专题视频生成引擎
├── topics/                     ← 选题配置目录
│   ├── _template.yaml          ← 空白模板
│   ├── auto_war.yaml           ← 德国汽车 vs 中国新能源
│   ├── gold_crash.yaml         ← 黄金暴跌
│   └── us_jobs_fake.yaml       ← 美国就业
├── main.py                     ← 每日美股日报（原有）
├── config.py                   ← 环境变量配置
└── video/remotion/             ← Remotion 视频模板
```

输出目录：`~/jobs/专题视频/YYYY-MM-DD_slug/`

---

## 常见问题

**Q: 视频渲染报错 `ffmpeg not found`**
A: 安装 ffmpeg 并确保在 PATH 中。

**Q: TTS 合成的声音不够自然**
A: 修改 `EDGE_TTS_VOICE`，可选中文声音列表：`edge-tts --list-voices | grep zh`

**Q: 新闻都是英文的**
A: AI 脚本生成时已自动翻译摘要为中文。如需中文新闻源，替换 `news_fetcher.py` 中的 RSS 列表。

**Q: 如何在服务器后台常驻**
```bash
# 使用 pm2
pm2 start "python scheduler/cron.py" --name financial-news

# 或 systemd service
```
