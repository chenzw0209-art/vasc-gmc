# Amazon Market Web Design Brief

## Current Sprint Scope

当前网页设计冲刺只使用 Amazon：

```text
US / MX / JP / BR Amazon
```

Shopee 暂缓进入二期。原因不是放弃 Shopee，而是原始 Excel 体量太大，直接读取会拖慢当前数据闭环和网页设计节奏。Shopee 仍保留在治理/audit 记录中，后续应先生成本地中间处理层，再进入可视化。

## Master Data Assets

| Purpose | Path |
|---|---|
| Amazon market facts | `data_assets/curated/market/amazon_market_facts_monthly.json` |
| Amazon story and chart package | `data_assets/curated/market/amazon_market_story_v0_1.json` |
| Web cache: facts | `portal/data/market/amazon_market_facts_monthly.json` |
| Web cache: story | `portal/data/market/amazon_market_story_v0_1.json` |

`data_assets` 是主资产层，`portal/data` 只是网页消费缓存。

## Current Verified Metrics

```text
standard_l2 country records: 151
standard_l2 display rows: 50
raw source records: 1044
read ok / failed: 1044 / 0
monthly GMV: $42.77B
annualized GMV: $517.41B
currency: USD
period: 2026-04
```

Country monthly GMV after FX normalization:

```text
US_Amazon: $38.55B
JP_Amazon: $2.80B
MX_Amazon: $0.92B
BR_Amazon: $0.51B
```

Top standard_l2 after four-country aggregation:

```text
厨房餐饮: $62.20B annualized GMV
手机与配件: $51.29B annualized GMV
护肤与个护: $42.89B annualized GMV
鞋履: $33.10B annualized GMV
健康管理综合: $26.95B annualized GMV
```

## Page Pattern From v1.1 Spec

市场页回答：

```text
为什么做这个行业？
```

页面不是报告页，也不是长文。当前实现遵循：

- 固定侧边栏 + 顶部筛选器 + 主内容区。
- 顶部筛选器：标准一级、国家、时间。当前数据没有可靠 `standard_l1` 展示维度，因此一级筛选先保留为占位，不在页面正文中显示。
- 第一屏包含：核心判断、KPI、主图、国家辅助图、市场明细表。
- 主分析单位：`standard_l2`。
- 国家、平台、时间是筛选条件和辅助对比维度，不是表格主粒度。
- 不默认展示 `standard_l1`、`standard_l3`、listing、mapping_status、原始映射。
- 点击表格行打开右侧 420px 抽屉，查看证据、国家拆分、玩家线索和下一步动作。

## Analysis Principle

内容分析坚持：

```text
对比得出观点，实证优先，抓大放小。
```

当前页面核心判断来自真实聚合结果：

1. 美国是当前 Amazon 四国主市场：月 GMV $38.55B，占四国绝大部分。
2. 头部二级行业决定首屏顺序：厨房餐饮、手机与配件、护肤与个护、鞋履优先。
3. CN GMV 占比用于筛选玩家/产品机会：高占比看中国玩家渗透，低占比看突破空间。

## Refresh Command

From project root:

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_amazon_market_package_v0_1.py
```

Then validate:

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c "import json; files=['data_assets/curated/market/amazon_market_facts_monthly.json','data_assets/curated/market/amazon_market_story_v0_1.json','portal/data/market/amazon_market_facts_monthly.json','portal/data/market/amazon_market_story_v0_1.json']; [json.load(open(f,encoding='utf-8')) for f in files]; print('json_ok')"
```

## Web Entry

```text
http://127.0.0.1:8787/pages/market/
```

If the static server is not running:

```powershell
python -m http.server 8787 --directory portal
```

## Phase 2 Deferred

Shopee 二期前置任务：

```text
Build local intermediate processed workbooks:
data_assets/intermediate/shopee/*_processed_l1_workbooks/
```

不要在没有中间处理层的情况下重新把 Shopee 接回市场页，否则会拖慢网页设计和验证。
