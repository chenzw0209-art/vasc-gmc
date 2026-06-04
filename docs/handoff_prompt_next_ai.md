# Handoff Prompt For Next AI

## 2026-06-02 Late Update: Current Active Direction

The older Amazon US/MX/JP/BR raw-SKU direction below is no longer the active path.

Current active direction:

- Amazon US only.
- Use processed report bottom tables from `Z:\主线任务2-天眼计划\行业专题研究\行研报告`.
- Exclude `AI-行业研究`, `Fintech-行业研究`, `3C-行业报告`, and `tiktok市场研究`.
- Use category mapping workbook `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx`.
- Reuse the existing portal UI and logic where possible; first priority is filling data/content and improving visualization.
- Product page is product opportunity / third-level category / buying-point level, not SKU-level.

Current builder:

```text
scripts/build_amazon_us_processed_portal_assets_v0_1.py
```

Current docs:

```text
docs/amazon_us_processed_portal_assets_v0_1.md
```

You are taking over a local data-engineering and web project for the 天眼计划增长情报门户.

Project root:

```text
C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal
```

Current user decision:

```text
Temporarily exclude Shopee. Build the current complete sprint with Amazon only:
US / MX / JP / BR Amazon.
```

Reason:

Shopee Excel volume is extremely large. The current goal is to finish the Amazon data governance, market presentation content, analysis viewpoints, and visualization flow first, then move into web design. Shopee stays in governance/audit records and should become phase 2 after local intermediate processed workbooks are built.

## Read First

The user provided this design spec:

```text
C:\Users\wale.chen\Downloads\市场_玩家_产品模块设计说明_v1.1.md
```

Key rules from the spec:

- This is a growth intelligence backend, not a report, PPT, or knowledge base.
- Market answers: `为什么做这个行业`.
- Player answers: `为什么打这个客户`.
- Product answers: `为什么打这个产品`.
- Market page display grain is `standard_l2`.
- Country/platform/time are filters or auxiliary comparisons, not the primary table grain.
- Do not show raw platform categories, mapping status, listing count, or third-level category by default.
- First screen should show filters, core insights, KPIs, one main chart, one auxiliary country chart, and part of the table.
- Core insights must be conclusion + evidence + action.
- Row click should open a right drawer, about 420px wide.
- Player V1 should use Amazon brand/company as primary. Do not force merge Shopee/TikTok.
- Product V1 should use Amazon product tables as primary.

## Current Completed State

Amazon-only package is built and reproducible.

Main script:

```text
scripts/build_amazon_market_package_v0_1.py
```

Run:

```powershell
cd C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_amazon_market_package_v0_1.py
```

Latest verified output:

```text
amazon_records: 151
amazon_raw_sources: 1044
read_ok/read_failed: 1044/0
monthly_gmv: 42,771,519,845.19
annual_gmv: 517,407,686,177.49
```

Country monthly GMV:

```text
US_Amazon: $38.55B
JP_Amazon: $2.80B
MX_Amazon: $0.92B
BR_Amazon: $0.51B
```

Display-level aggregation:

```text
151 country/platform/standard_l2 fact records
50 standard_l2 market table rows after page aggregation
```

Top aggregated standard_l2:

```text
厨房餐饮: $62.20B annualized GMV
手机与配件: $51.29B annualized GMV
护肤与个护: $42.89B annualized GMV
鞋履: $33.10B annualized GMV
健康管理综合: $26.95B annualized GMV
```

Historical industry research has also been scanned and partially integrated.

Inventory script:

```text
scripts/scan_industry_research_assets_v0_1.py
```

Inventory outputs:

```text
data_assets/research/industry_research_asset_inventory.json
docs/industry_research_content_integration_plan.md
```

Inventory result:

```text
scanned assets: 653
bottom tables: 341
narrative reports: 113
cross-industry decision tables: 10
report folders: 28
```

Research enrichment script:

```text
scripts/build_market_research_enrichment_v0_1.py
```

Research enrichment outputs:

```text
data_assets/curated/research/market_research_enrichment.json
portal/data/research/market_research_enrichment.json
```

Current enrichment source:

```text
Z:\主线任务2-天眼计划\行业专题研究\全行业-值得做的行业和客户_行研视角_v1.2_new.xlsx
```

Current enrichment result:

```text
research records: 912
Amazon records: 546
market display rows with research match: 41 / 50
```

## Asset Layer

Master governed assets:

```text
data_assets/curated/market/amazon_market_facts_monthly.json
data_assets/curated/market/amazon_market_story_v0_1.json
```

Web cache:

```text
portal/data/market/amazon_market_facts_monthly.json
portal/data/market/amazon_market_story_v0_1.json
```

Do not treat `portal/data` as the source of truth. It is only the web app cache.

## Web Page

Current market page:

```text
portal/pages/market/index.html
```

Local URL:

```text
http://127.0.0.1:8787/pages/market/
```

Current implementation:

- Fixed sidebar and topbar.
- Filter controls for market and period.
- The market page must show one specific platform-country market at a time, e.g. Amazon US. Do not mix countries/platforms in the market-detail table.
- Standard-l1 filter placeholder exists, but current Amazon facts do not expose reliable `standard_l1`; do not show standard_l1 in page body.
- Core insights are derived in-page from filtered data.
- KPI cards: market size, recent growth, player coverage, data coverage, standard_l2 unit count.
- Main chart: standard_l2 annualized GMV bar list.
- Auxiliary chart: country monthly GMV.
- Detail table unit: standard_l2.
- Row click opens right drawer with evidence, country split, player clues, and next step.
- The page also loads `portal/data/research/market_research_enrichment.json`.
- Standard-l2 rows show historical research heat when matched.
- Right drawer shows historical research supplement: heat, research GMV, CN share, major segments, and representative players.
- Market-detail rows are sorted by single-market heat:
  - `annual sales normalized * 0.6 + monthly growth normalized * 0.4`
  - normalization is within the selected market only.
- Market-detail fields should stay human-readable:
  - 标准二级行业
  - 年销售额
  - 当月销售额
  - 月环比增长
  - 中国品牌销售占比
  - 市场热度
  - 重点细分
  - 代表玩家
  - 增长信号
- Do not re-add `平台`, `国家`, `信源数`, or `纳入观察` as market-detail fields.
- Growth views should explain growth reason and growth signal. Use `portal/data/research/market_growth_signals.json`, sourced from `Z:\主线任务2-天眼计划\行业专题研究\信号追踪表.md`.

Validated:

```text
JSON parse passed.
Inline JS syntax passed.
HTTP 200 for /pages/market/.
HTTP 200 for /data/market/amazon_market_facts_monthly.json.
```

The in-app browser plugin failed with a Windows sandbox startup error. Use HTTP and script validation unless the browser recovers.

## FX

Amazon output currency is USD.

Rates in current Amazon package script:

```text
US: 1.0
MX: 1 / 17.4433
JP: 1 / 159.344
BR: 1 / 5.0331
```

The FX note is written into `summary.fx_note` in the JSON output.

## Shopee Phase 2

Do not re-enable Shopee in the current market page.

Next Shopee prerequisite:

```text
data_assets/intermediate/shopee/*_processed_l1_workbooks/
```

Only after that layer exists should Shopee be regenerated into facts and brought into visualization.

## Next Work

1. Continue polishing the market page visual design within the v1.1 backend pattern.
2. Add a player module route using Amazon brand/company facts.
3. Add a product module route using Amazon product facts.
4. Build charts with a stable local visualization library or keep CSS bars until dependency strategy is decided.
5. Add a small validation script that checks JSON schema and page aggregation invariants.
6. Keep analysis viewpoints evidence-based: compare first, conclude second, act third.

## Commands To Validate Current State

```powershell
cd C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal

& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_amazon_market_package_v0_1.py

& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c "import json; files=['data_assets/curated/market/amazon_market_facts_monthly.json','data_assets/curated/market/amazon_market_story_v0_1.json','portal/data/market/amazon_market_facts_monthly.json','portal/data/market/amazon_market_story_v0_1.json']; [json.load(open(f,encoding='utf-8')) for f in files]; print('json_ok')"

& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -e "const fs=require('fs'); const html=fs.readFileSync('portal/pages/market/index.html','utf8'); const m=html.match(/<script>\s*([\s\S]*)\s*<\/script>/); new Function(m[1]); console.log('inline_js_ok')"
```

## One-Sentence Prompt To Continue

```text
请继续在 C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal 中推进 Amazon-only 市场/玩家/产品模块；遵循 C:\Users\wale.chen\Downloads\市场_玩家_产品模块设计说明_v1.1.md，市场页以 standard_l2 为展示粒度，观点必须是结论+证据+动作，Shopee 暂缓到二期中间处理层完成后再接入。
```

## 2026-06-02 V0.7 Update

Players and products V1 now exist.

Scripts:

```text
scripts/build_players_products_v0_1.py
scripts/validate_portal_pages_v0_1.js
```

Assets:

```text
data_assets/curated/players/amazon_players_monthly.json
portal/data/players/amazon_players_monthly.json
data_assets/curated/products/amazon_product_opportunities_monthly.json
portal/data/products/amazon_product_opportunities_monthly.json
```

Pages:

```text
portal/pages/players/index.html
portal/pages/products/index.html
```

Output:

```text
players: 1655
product opportunities: 231
```

Important product caveat:

```text
Product page is currently product-opportunity clusters, not final SKU-level product facts.
The next AI should ingest raw Amazon product tables and create:
data_assets/curated/products/amazon_products_monthly.json
portal/data/products/amazon_products_monthly.json
```
