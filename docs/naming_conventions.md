# Naming Conventions

## JSON Files

Use explicit names:

```text
{platform}_{entity}_{period_type}.json
```

For cross-platform or business-level files:

```text
{business_object}.json
{dictionary_name}_{system}.json
```

## Examples

| Name | Meaning |
|---|---|
| `amazon_products_monthly.json` | Amazon product-grain monthly data |
| `amazon_market_monthly.json` | Amazon category/industry monthly aggregation |
| `amazon_players_monthly.json` | Amazon brand/player monthly aggregation |
| `shopee_stores_monthly.json` | Shopee store-grain monthly data |
| `tiktok_shop_creatives_weekly.json` | TikTok Shop creative/video weekly data |
| `lead_events.json` | Unified lead events |
| `category_mapping_ecommerce.json` | Ecommerce category mapping dictionary |
| `industry_dictionary_ecommerce.json` | Ecommerce industry dictionary |

## Avoid

Avoid names that hide source or grain:

```text
products.json
market.json
players.json
data.json
report_data.json
```

These names become ambiguous once Amazon, Shopee and TikTok Shop coexist.

## Field Names

Use English snake_case field names in code and JSON.

Examples:

```text
standard_l1
standard_l2
source_url
period_type
event_type
signal_type
monthly_gmv
growth_rate
```

Chinese labels belong in UI or dictionary descriptions, not field names.

