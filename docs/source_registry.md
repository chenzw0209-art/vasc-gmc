# Source Registry

This document is the human-readable source registry. Machine-readable source metadata should live in:

```text
portal/data/sources/source_registry.json
```

## Registry Fields

| Field | Meaning |
|---|---|
| `source_id` | Stable source identifier |
| `source_name` | Human-readable source name |
| `source_path` | Local source path |
| `platform` | Amazon / Shopee / TikTok Shop / Insight / Historical |
| `system` | ecommerce / application / historical |
| `country_scope` | Covered countries or markets |
| `period_type` | week / month / mixed / none |
| `grain` | product / brand / store / category / content / report |
| `target_modules` | weekly / leads / market / players / products / creatives |
| `update_frequency` | weekly / monthly / ad hoc |
| `note` | Important caveats |

## Current Source Map

| Source ID | Platform | System | Grain | Target Modules | Path |
|---|---|---|---|---|---|
| `amazon_softtime_monthly` | Amazon | ecommerce | category / brand / product | market / players / products | `Z:\外部数据库\Softtiem亚马逊月度数据` |
| `shopee_monthly_recent_half_year` | Shopee | ecommerce | category / store | market / players | `Z:\外部数据库\虾皮月度数据（近半年）` |
| `shopee_zhixia_monthly` | Shopee | ecommerce | category / store / product-like | market / players | `Z:\外部数据库\知虾shopee数据` |
| `tiktok_shop_kalodata_weekly` | TikTok Shop | ecommerce | store / category / content | weekly / market / players / creatives | `Z:\外部数据库\kalodata周度数据` |
| `insight_application_data` | Insight | application | app / publisher / country / platform | out of ecommerce V1 | `Z:\外部数据库\insight应用数据` |
| `historical_industry_reports` | Historical | historical | report / processed data | reference only | `Z:\主线任务2-天眼计划\行业专题研究\行研报告` |

## Important Boundary

`insight_application_data` does not enter ecommerce V1. It should be reserved for a later application intelligence system.

