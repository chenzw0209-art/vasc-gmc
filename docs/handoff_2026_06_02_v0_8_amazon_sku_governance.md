# 2026-06-02 V0.8 Amazon SKU Governance Handoff

## 2026-06-02 Late Update: Superseded Source Scope

This handoff's original four-country raw-SKU task is superseded by the user's latest direction.

Current active scope:

- Amazon US only.
- Use processed report bottom tables under `Z:\主线任务2-天眼计划\行业专题研究\行研报告`.
- Exclude `AI-行业研究`, `Fintech-行业研究`, `3C-行业报告`, and `tiktok市场研究`.
- Use `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx` for standard industry mapping.
- Product page is currently product-opportunity level from processed Sheet 1/5, not raw SKU-level.

See:

```text
docs/amazon_us_processed_portal_assets_v0_1.md
scripts/build_amazon_us_processed_portal_assets_v0_1.py
```

Status: paused by user. Hand this project to the next AI from this file.

Project root:

```text
C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal
```

## User Direction

- Shopee is deferred.
- First finish Amazon: US, MX, JP, BR.
- The portal should move toward data governance, presentation, analysis viewpoints, and visualization.
- Market page answers: why do this industry.
- Player page answers: why target this customer.
- Product page answers: why target this product.
- Viewpoints must be evidence-based, comparative, and practical. Avoid generic conclusions.
- Amazon bottom-table generation logic must follow:

```text
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\Amazon行业底表处理方法论v8.0.md
```

## Current Progress

Completed:

- Amazon-only market fact package exists.
- Market page is single country/platform scoped, not mixed.
- Market detail grain is `standard_l2`.
- Market heat is normalized within selected market:

```text
heat = annual_sales_norm * 0.6 + monthly_growth_norm * 0.4
```

- Research enrichment has been integrated from:

```text
Z:\主线任务2-天眼计划\行业专题研究\全行业-值得做的行业和客户_行研视角_v1.2_new.xlsx
```

- Growth signals have been integrated from:

```text
Z:\主线任务2-天眼计划\行业专题研究\信号追踪表.md
```

- Player V1 page exists.
- Product-opportunity V1 page exists.
- Validation script exists and previously passed.

Not complete:

- Product module is not yet true SKU-level product facts.
- Current product page uses product-opportunity clusters from research/signals.
- Raw Amazon product tables have only been inventoried and sampled.
- Player parent-company mapping is still incomplete.
- Web visual design is functional but not final.

## Key Files

Scripts:

```text
scripts/build_amazon_market_package_v0_1.py
scripts/build_market_research_enrichment_v0_1.py
scripts/build_market_growth_signals_v0_1.py
scripts/build_players_products_v0_1.py
scripts/inspect_amazon_product_sources_v0_1.py
scripts/inspect_product_workbook_rows_v0_1.py
scripts/validate_portal_pages_v0_1.js
```

Assets:

```text
data_assets/curated/market/amazon_market_facts_monthly.json
portal/data/market/amazon_market_facts_monthly.json
data_assets/curated/research/market_research_enrichment.json
portal/data/research/market_research_enrichment.json
data_assets/curated/research/market_growth_signals.json
portal/data/research/market_growth_signals.json
data_assets/curated/players/amazon_players_monthly.json
portal/data/players/amazon_players_monthly.json
data_assets/curated/products/amazon_product_opportunities_monthly.json
portal/data/products/amazon_product_opportunities_monthly.json
```

Pages:

```text
portal/pages/market/index.html
portal/pages/players/index.html
portal/pages/products/index.html
```

## Amazon Source Paths

US confusion note:

- Some US Amazon numbers were moved into:

```text
Z:\主线任务2-天眼计划\行业专题研究\行研报告
```

- US raw product workbooks also exist in:

```text
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon美国所有二级类目底表
```

Raw product workbook folders:

```text
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon美国所有二级类目底表
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon墨西哥所有二级类目底表
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon日本所有二级类目底表
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon巴西所有二级类目底表
```

Processed sibling folders exist but need recursive inspection before use:

```text
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon美国所有二级类目底表（已处理）
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon墨西哥所有二级类目底表（已处理）
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon日本所有二级类目底表（已处理）
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon巴西所有二级类目底表（已处理）
```

Latest audit:

```text
US raw product: 311 xlsx
MX raw product: 268 xlsx
JP raw product: 322 xlsx
BR raw product: 229 xlsx
Processed top-level xlsx: 0 for all four countries
```

Sample workbook structure:

```text
Sheet: 产品
Actual header row: pandas header=3, Excel row 4
Data starts: pandas row 4, Excel row 5

Important columns:
产品名称
ASIN
ParentASIN
URL
Listing月销量
Listing年销量
销量变化率
Listing月销额($)
ASIN月销量
ASIN月销额($)
实际价格($)
物流方式

Sheet: 销量趋势
Columns:
ASIN, ParentASIN, 2026-04, 2026-03, 2026-02, ...
```

## Immediate Next Tasks

1. Read `Amazon行业底表处理方法论v8.0.md`.
2. Build SKU ingestion script:

```text
scripts/build_amazon_products_monthly_v0_1.py
```

3. Create governed outputs:

```text
data_assets/curated/products/amazon_products_monthly.json
portal/data/products/amazon_products_monthly.json
```

4. Suggested product fields:

```text
product_id
platform
country
month
standard_l2
raw_l2
product_name
asin
parent_asin
brand
product_url
image_url
listing_monthly_sales
listing_annual_sales
listing_monthly_gmv_usd
asin_monthly_sales
asin_monthly_gmv_usd
growth_rate
price_usd
fulfillment
source_file
source_sheet
source_quality
```

5. Mapping rules:

- Parse raw category from filename:

```text
YYYYMMDD_不限产品_{raw_l2}产品看板导出.xlsx
```

- Map `raw_l2` to `standard_l2` using existing governed market facts and canonical source mapping.
- If mapping is missing, keep `standard_l2 = raw_l2` and mark `mapping_quality = fallback_raw_l2`.

6. Performance recommendation:

- For tonight, ingest top 200 SKUs per raw workbook by `Listing月销额($)` or `ASIN月销额($)`.
- Document this as a first-pass governed sample.
- Full SKU ingestion can follow with pagination/indexing.

7. Update product page:

- Prefer `portal/data/products/amazon_products_monthly.json`.
- Keep `amazon_product_opportunities_monthly.json` as insight fallback.
- Product page should answer: why target this product.

8. Re-run validation:

```powershell
cd C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal

& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_amazon_products_monthly_v0_1.py

& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\validate_portal_pages_v0_1.js
```

## Prompt For Next AI

```text
请接手 C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal。先阅读 docs\handoff_2026_06_02_v0_8_amazon_sku_governance.md、docs\handoff_prompt_next_ai.md、docs\iteration_log.md，以及 Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\Amazon行业底表处理方法论v8.0.md。当前 Shopee 暂缓，只做 Amazon US/MX/JP/BR。市场页和玩家页已有 V1；产品页目前只是机会簇，不是真 SKU。你的首要任务是按方法论读取四国 Amazon 原始产品底表，生成 data_assets/curated/products/amazon_products_monthly.json 和 portal/data/products/amazon_products_monthly.json，再把 portal/pages/products/index.html 改为优先展示 SKU/product facts。今晚可先按每个二级类目 Top 200 SKU 入库，后续全量再做索引。观点必须坚持实证、对比、抓大放小，回答“为什么做行业 / 为什么打客户 / 为什么打产品”。完成后运行 scripts/validate_portal_pages_v0_1.js，并把数据路径、口径、限制写回 docs。
```
