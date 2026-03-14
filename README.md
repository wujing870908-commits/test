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
