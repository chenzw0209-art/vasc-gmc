# Amazon US Processed Portal Assets v0.1

Last updated: 2026-06-02

## Scope

Current portal scope is Amazon US only.

The previous handoff paths for four-country raw Amazon SKU workbooks are not the active source for this iteration. The active source is the processed research bottom-table layer under:

```text
Z:\主线任务2-天眼计划\行业专题研究\行研报告
```

Excluded folders:

```text
Z:\主线任务2-天眼计划\行业专题研究\行研报告\AI-行业研究
Z:\主线任务2-天眼计划\行业专题研究\行研报告\Fintech-行业研究
Z:\主线任务2-天眼计划\行业专题研究\行研报告\3C-行业报告
Z:\主线任务2-天眼计划\行业专题研究\行研报告\tiktok市场研究
```

Category mapping source:

```text
Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx
```

## Build Script

```text
scripts/build_amazon_us_processed_portal_assets_v0_1.py
```

The script reads processed workbooks named:

```text
*竞品分析底表-市场大盘v1.xlsx
```

It uses:

- Sheet 1: `1_类目细分市场分析` for market/category facts.
- Sheet 2/3: China-brand and brand-competition sheets for player facts.
- Sheet 4: brand monthly trend columns for MoM growth and the market-page industry growth line chart.
- Sheet 5: buying-point tags for product opportunity signals.

## Outputs

Governed assets:

```text
data_assets/curated/market/amazon_market_facts_monthly.json
data_assets/curated/market/amazon_market_story_v0_1.json
data_assets/curated/players/amazon_players_monthly.json
data_assets/curated/products/amazon_products_monthly.json
```

Web cache:

```text
portal/data/market/amazon_market_facts_monthly.json
portal/data/market/amazon_market_story_v0_1.json
portal/data/players/amazon_players_monthly.json
portal/data/products/amazon_products_monthly.json
```

Latest run:

```text
workbooks scanned: 296
read ok: 295
market records: 53
player records: 5000
product opportunity records in web payload: 12000
Amazon US monthly GMV: $40.93B
Amazon US annual GMV: $494.22B
weighted CN GMV share: 33.1%
market monthly trend coverage: 24 months, 2024-05 to 2026-04
```

## Product Page Caveat

The product page is not SKU-level in this iteration.

It displays product opportunities from processed bottom tables:

- third/fourth-level category opportunities from Sheet 1;
- buying-point/tag opportunities from Sheet 5;
- representative players and CN share where available.

Use this page to answer `为什么打这个产品` at the opportunity level first. True SKU-level facts require a later pass against raw product sheets or a restored external database product-table path.

## Reasoning Rules

The page copy and ranking should keep the existing three-question logic:

- Market: why do this industry.
- Player: why target this customer.
- Product: why target this product.

For this iteration, conclusions are based on:

- GMV scale;
- MoM growth from brand trend sheets;
- CN GMV share;
- traffic/ad dependency;
- representative players;
- category buying-point tags.

Keep the posture empirical, comparative, and practical: compare first, conclude second, act third.

## 2026-06-03 Report-Style Page Layer V0.2

Scope:

- Amazon US only.
- Top page tags are exactly:
  - `standard_l1`, default `Beauty`;
  - `platform`, default `Amazon`;
  - `country`, default `US / 美国`.
- Time period is not exposed as a page tag. The current governed data period is `2026-04`.

Added page/story assets:

```text
scripts/render_report_style_portal_pages_v0_2.js
data_assets/curated/research/amazon_us_industry_playbooks_v0_2.json
portal/data/research/amazon_us_industry_playbooks_v0_2.json
```

Updated pages:

```text
portal/pages/market/index.html
portal/pages/players/index.html
portal/pages/products/index.html
```

Page behavior:

- All three pages load the same Amazon US governed facts:
  - `portal/data/market/amazon_market_facts_monthly.json`
  - `portal/data/players/amazon_players_monthly.json`
  - `portal/data/products/amazon_products_monthly.json`
- All three pages render:
  - scope line;
  - four evidence/insight cards;
  - KPI cards;
  - industry GMV curve from Sheet 4 monthly trend data;
  - report-style analysis blocks;
  - scene/audience blocks;
  - a drilldown table.
- The page copy is now designed to answer:
  - Market: why do this industry;
  - Player: why target this customer;
  - Product: why target this product.

Interpretation limits:

- Product page is still opportunity/category-level, not true SKU-level.
- Industry playbooks combine governed Amazon US facts with historical report logic and analyst judgment. They should guide prioritization and BD framing, not replace bottom-table evidence.
- Current page layer does not yet ingest live news feeds. For uncovered industries, the playbook language should be refreshed when a weekly signal/news ingestion job is added.

Validation:

```text
scripts/validate_portal_pages_v0_1.js
portal/pages/market/index.html: inline_js_ok
portal/pages/players/index.html: inline_js_ok
portal/pages/products/index.html: inline_js_ok

HTTP 200:
http://127.0.0.1:8787/pages/market/
http://127.0.0.1:8787/pages/players/
http://127.0.0.1:8787/pages/products/
```

## 2026-06-03 Lead And Category Normalization V0.3

Lead sources added:

```text
Z:\主线任务2-天眼计划\行业专题研究\美妆个护_大区拓客线索_v1.5_TikTok校验版.xlsx
Z:\主线任务2-天眼计划\行业专题研究\行研报告\3C-行业报告\3C-值得做的行业和客户_行研视角.xlsx
```

Build script:

```text
scripts/build_lead_events_from_research_workbooks_v0_2.py
```

Lead outputs:

```text
portal/data/leads/lead_events.json
data_assets/curated/leads/lead_events.json
```

Latest lead counts:

```text
total: 85
Beauty: 30
Consumer Tech: 55
Other industries: intentionally empty
Default lead page scope: Beauty + US
```

Normalization decisions:

- `Consumer Electronics` is merged into `Consumer Tech`.
- Beauty category cleanup:
  - `护肤与个护`, `个人护理`, and `皮肤护理` are displayed as `护肤与个人护理`.
  - `美妆个护综合` is displayed as `口腔护理` because the underlying raw categories are mainly oral-care products and representative brands include Philips Sonicare, Oral-B, Aquasonic, Crest, COSLUS.
  - `剃须和脱毛` is displayed as `脱毛与剃须`.
  - `头发护理` is displayed as `头发护理/造型`.
  - `足部、手部和指甲护理` is displayed as `美甲/手足护理`.

Content rules:

- Every L1 page now has three explicit growth signals.
- Each normalized L2 has three signal sentences where either historical report logic exists or bottom-table facts can support it.
- Player page now prioritizes Chinese players and lead-matched brands. Apple/HP-type global incumbents remain as market context only, not the default player conclusion.
- Product page remains opportunity/category-level and is not the main focus of this iteration.
## 2026-06-03 v0.3 页面与研究口径补充

- 范围继续收敛为 `Amazon US`，不处理 MX/JP/BR/Shopee。
- 新增生成脚本：`scripts/render_research_portal_pages_v0_3.js`。
- 新增/更新页面资产：
  - `portal/pages/market/index.html`
  - `portal/pages/leads/index.html`
  - `portal/pages/players/index.html`
  - `portal/pages/products/index.html`
  - `portal/assets/report_pages_v0_3.js`
  - `portal/assets/leads_page_v0_3.js`
  - `portal/data/research/amazon_us_industry_playbooks_v0_3.json`
  - `data_assets/curated/research/amazon_us_industry_playbooks_v0_3.json`
- 市场页改为系统工作台布局：顶部为核心观点和 KPI；中部左侧为“类目机会排行（标准二级行业）”，右侧为点击行刷新的类目画像、趋势图、Top 品牌和 CN 占比/增长定位；底部保留玩家格局概览和增长信号概览。
- 右上角/顶部筛选口径固定为三个 tag/控件：平台 `Amazon`、国家 `美国站`、一级行业；不展示时间周期。
- `Consumer Electronics` 统一并入 `Consumer Tech`。
- 原 `消费电子综合` 不再作为前端可解释行业展示。当前按玩家主类目拆分为：
  - `办公打印/商用电子`
  - `电子阅读器`
  - `电视/投影/视听娱乐`
  - `智能安防/监控`
  - `音频/DJ/K歌`
- 拆分限制：市场底表当前只有聚合后的 `消费电子综合` 月度趋势，因此 v0.3 用玩家主类目 GMV 权重拆分该聚合行的月度 GMV、年化 GMV、CN GMV 和趋势。后续若回到底表 raw_l2/ASIN 层，应重新按原始行全量重算。
- 线索页改为事件运营台布局：KPI 包含 `本周新增线索`、`A级线索`、`新品发布`、`展会活动`、`招投标`、`融资动态`；当前仅接入 Beauty 与 Consumer Tech 线索表，其他行业不造线索。
- 行业观点补充原则：大盘洞察只解释行业运动，不写 BD 动作；客户动作放到玩家/线索模块。Consumer Tech 的外部事实引用包括 portable power station 市场报告、DJI/GoPro NAB 2026 发布、RingConn CES 2026、eufy Local AI/no monthly fees、Reolink CES 2026。
