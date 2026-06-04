# Beauty Market Rebuild Result - 2026-06-03

## Scope

This iteration only rebuilt the Beauty market page. Other L1 industries were not expanded with the new Beauty standard.

Target page:

```text
http://127.0.0.1:8787/pages/market/?l1=Beauty
```

## Beauty L2 Split Rule

The Beauty page now uses a Beauty-only standard L2 expansion in `scripts/render_research_portal_pages_v0_3.js`.

Source Beauty rows still come from the processed Amazon US market table, but the frontend market page no longer exposes the coarse `护肤与个护` bucket as the main Beauty taxonomy. Beauty rows are rebuilt with `expandBeautyMarket(...)`, using player `main_l3`, brand names, and raw Beauty category hints to distribute the market into 11 standard L2 industries:

```text
功效面部护肤
身体/沐浴/除臭
彩妆/卸妆
香水/香氛
口腔护理
男士剃须/理容
女性脱毛/IPL
洗护/头皮/防脱
造型工具/吹风
美甲/手足护理
美容工具/仪器
```

The left opportunity entry table intentionally shows at most 10 rows, so one standard L2 can be below the first-screen ranking while still remaining part of the Beauty standard split.

## Layout Changes

- Top `核心观点` was renamed to `核心趋势`.
- Beauty uses exactly 3 short core trends:
  - K-Beauty and functional skincare are taking over the content entry point.
  - Device-like personal care is becoming consumer-electronics-like.
  - China-player opportunity is concentrated in parameterized, tutorial-friendly, consumable or device-linked subcategories.
- Middle layout changed from BI-style full-width table plus narrow right rail to a two-column intelligence workspace:
  - left: compact category opportunity entry table, max 10 rows;
  - right: main visual detail panel with metrics, 24-month trend, player landscape, product opportunity, growth signal, and recommended action tabs.
- The market table now keeps only entry fields:
  - rank;
  - L2 industry;
  - annual GMV;
  - MoM;
  - CN GMV share;
  - Top 3 brands.
- Bottom-left player card now uses `中国玩家机会判断` instead of `结构判断`.
- Bottom-right `增长信号概览` is now a placeholder. Growth signals live in the right detail panel's `增长信号` tab.
- Fixed card frames remain, with tighter table rows, internal scroll on the right detail panel, and a wider right-side main visual area.

## Data Paths

Renderer:

```text
scripts/render_research_portal_pages_v0_3.js
```

Primary business content:

```text
C:\Users\wale.chen\Downloads\amazon_us_industry_master_v1.md
```

Generated page and assets:

```text
portal/pages/market/index.html
portal/assets/report_pages_v0_3.js
```

Data inputs:

```text
portal/data/market/amazon_market_facts_monthly.json
portal/data/players/amazon_players_monthly.json
portal/data/products/amazon_products_monthly.json
portal/data/research/amazon_us_industry_playbooks_v0_3.json
```

## Validation

Commands run:

```powershell
node scripts\render_research_portal_pages_v0_3.js
node scripts\validate_portal_pages_v0_1.js
node scripts\validate_intelligence_portal_contract_v0_1.js
```

Results:

```text
rendered research portal pages v0.3
portal/pages/market/index.html: inline_js_ok
portal/pages/players/index.html: inline_js_ok
portal/pages/products/index.html: inline_js_ok
portal/pages/leads/index.html: inline_js_ok
intelligence portal contract ok
```

Wide-screen QA:

```text
Viewport: 1440x900
Beauty page title: 核心趋势
Left entry rows: 10
Standard Beauty L2 count in contract: 11
Middle body columns: about 510px / 650px
Table and detail panel top/bottom aligned
Bottom row ends inside first viewport
Document horizontal overflow: false
Detail panel overflow-y: auto
```

The in-app browser was also opened to the target Beauty URL. Its visible viewport was narrow, so the page correctly entered the responsive single-column state.

## Remaining Limits

- Beauty split is based on processed market rows plus player `main_l3` and brand/category hints. It is not a full SKU/ASIN-level re-index.
- The split distributes the Beauty market by interpretable player/category weights; it should be revisited when SKU-level facts are available.
- External growth evidence is still curated seed evidence. K-Beauty, TYMO/Laifen/Wavytalk, Ulike/JOVS, and oral-care evidence still need targeted PR/news/TikTok/Google Trends verification.
- Product opportunity content remains category/opportunity level and must not pretend to be real SKU facts.
- Other L1 industries were intentionally not rebuilt with the Beauty standard taxonomy in this iteration.
