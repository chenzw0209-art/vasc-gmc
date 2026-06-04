# Data Contract

## Shared Fields

All module data should use these shared fields when applicable:

| Field | Type | Meaning |
|---|---|---|
| `country` | string | Market/country code or name |
| `region` | string | Region |
| `platform` | string | Amazon / Shopee / TikTok Shop |
| `standard_l1` | string | Standard first-level industry |
| `standard_l2` | string | Standard second-level industry |
| `standard_l3` | string | Standard third-level category, optional |
| `period` | string | `YYYY-MM` or week label |
| `period_type` | string | `month` / `week` |
| `source_id` | string | Source registry ID |
| `source_url` | string | External URL, if available |
| `evidence` | string | Evidence excerpt or audit note |

## Leads: `lead_events.json`

The Leads module answers: "什么时候打客户？"

| Field | Required | Meaning |
|---|---|---|
| `lead_id` | yes | Unique ID |
| `publish_date` | yes | Event publish date |
| `company` | yes | Customer, company, brand or store |
| `parent_company` | no | Parent company |
| `country` | yes | Country |
| `region` | no | Region |
| `platform` | no | Source platform if platform-derived |
| `standard_l1` | yes | Standard first-level industry |
| `standard_l2` | yes | Standard second-level industry |
| `event_type` | yes | 新品发布 / 展会参展 / 招投标 / 融资 / 招聘 / PR |
| `signal_type` | yes | 营销窗口 / 预算释放 / 市场扩张 / 团队扩张 |
| `priority` | yes | A / B / C |
| `action` | yes | Suggested action |
| `source_id` | yes | Source registry ID |
| `source_name` | yes | Source name |
| `source_url` | no | Source URL |
| `summary` | yes | One-sentence summary |
| `evidence` | no | Evidence excerpt |
| `status` | yes | 未处理 / 已分发 / 已打标 / 已转商机 / 关闭 |

## Market Files

Examples:

```text
amazon_market_monthly.json
shopee_market_monthly.json
tiktok_shop_market_weekly.json
```

Fields:

```text
country, platform, standard_l1, standard_l2, period, period_type,
gmv, sales, store_count, brand_count, product_count, player_count,
growth_rate, cn_share, source_id
```

### Amazon US Governed L2 Payload

Current Amazon US market/player/product cache is generated from the governed bottom-table layer:

```text
Z:\主线任务2-天眼计划\行业专题研究\底表治理\聚合底表
```

Builder:

```text
scripts/build_governed_amazon_us_portal_assets_v0_1.py
```

App-facing cache:

```text
portal/data/market/amazon_market_facts_monthly.json
portal/data/players/amazon_players_monthly.json
portal/data/products/amazon_products_monthly.json
portal/data/research/beauty_l2_content_enrichment_v0_1.json
portal/data/sources/governed_amazon_us_l2_sources.json
```

Rules:

- Browser code must not split Beauty or Consumer Tech with player weights.
- Beauty uses the 10 governed labels from `category_mapping_v1.py`, not the old 11 front-end buckets.
- Market rows are standard L2 facts; product rows are L3 opportunity rows, not SKU/ASIN facts.
- Trend charts must use `monthly_trend` generated from each governed aggregate workbook.
- Deep-analysis markdown may enrich detail tabs, but it does not override governed facts.

### Amazon V0.1 Market Payload

`portal/data/amazon/us_amazon_market_canonical_monthly.json` is the active US Amazon market payload.

It is generated from `portal/data/sources/us_amazon_canonical_sources.json`, whose gold standard is `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx`.

Top-level shape:

```json
{
  "summary": {},
  "records": [],
  "raw_source_records": [],
  "read_failures": []
}
```

Active market page reads only `records`.

`records` grain:

```text
standard_l2
```

`records` fields:

```text
record_id, country, region, platform, period, period_type,
standard_l2, gmv, monthly_gmv, prev_monthly_gmv, growth_rate,
cn_monthly_gmv, cn_annual_gmv, cn_share,
raw_l2_count, raw_l2_values,
canonical_source_count, canonical_source_paths, top_brands
```

Governance/audit fields stay in `raw_source_records` and `read_failures`; they should not be shown in the market page by default.

Do not show these in the market module table:

```text
standard_l1, standard_l3, listing_count, mapping_status
```

### Amazon Four-Country Web Sprint Payload

The active web design sprint uses:

```text
data_assets/curated/market/amazon_market_facts_monthly.json
data_assets/curated/market/amazon_market_story_v0_1.json
```

App-facing cache:

```text
portal/data/market/amazon_market_facts_monthly.json
portal/data/market/amazon_market_story_v0_1.json
```

Scope:

```text
US / MX / JP / BR Amazon
```

Shopee is deferred to phase 2.

Source fact grain:

```text
country/platform/standard_l2
```

Market page display grain:

```text
standard_l2
```

The page aggregates the 151 country-level Amazon records into 50 `standard_l2` display rows. Country is a filter and auxiliary comparison dimension, not the market-detail table unit.

`amazon_market_story_v0_1.json` contains:

```text
summary, page_brief, kpis, country_cards, top_standard_l2,
category_matrix, chart_specs, insights, phase_2_deferred
```

## Player Files

Examples:

```text
amazon_players_monthly.json
shopee_stores_monthly.json
tiktok_shop_stores_weekly.json
```

Fields:

```text
company, brand, store_name, country, platform, standard_l1, standard_l2,
gmv, growth_rate, product_count, store_count, marketing_signal_count,
priority, source_id
```

## Product Files

Main first-phase product file:

```text
amazon_products_monthly.json
```

Fields:

```text
product_id, product_name, brand, company, country, platform,
standard_l1, standard_l2, standard_l3, price, rating, review_count,
monthly_sales, monthly_gmv, growth_rate, product_score,
marketing_score, source_url
```
