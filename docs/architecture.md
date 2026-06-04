# Architecture

## Principle

Keep the first engineering phase static and data-driven:

```text
Source Excel / JSON / Markdown
  -> Python normalization scripts
  -> module JSON files
  -> static HTML + shared CSS/JS + ECharts
```

Do not introduce a backend database until data volume or collaboration needs justify it.

## Layers

### 1. Source Layer

External source folders remain read-only inputs:

| Source | Role |
|---|---|
| `Z:\外部数据库\Softtiem亚马逊月度数据` | Amazon monthly market, players, products |
| `Z:\外部数据库\虾皮月度数据（近半年）` | Shopee monthly market and stores |
| `Z:\外部数据库\知虾shopee数据` | Shopee category/store/product-like supplemental data |
| `Z:\外部数据库\kalodata周度数据` | TikTok Shop weekly market, stores, content |
| `Z:\外部数据库\insight应用数据` | Application system only, not ecommerce V1 |
| `Z:\主线任务2-天眼计划\行业专题研究\行研报告` | Historical report assets and processed data |

### 2. Normalization Layer

Scripts convert scattered sources into stable module JSON files.

No HTML page should read random Excel files directly.

### 3. Dictionary Layer

Dictionary files are shared by every module:

```text
category_mapping_ecommerce.json
industry_dictionary_ecommerce.json
country_dictionary.json
signal_dictionary.json
field_dictionary.json
```

### 4. Module Data Layer

Each module uses explicit source and grain names:

```text
amazon_market_monthly.json
amazon_players_monthly.json
amazon_products_monthly.json
shopee_market_monthly.json
shopee_stores_monthly.json
tiktok_shop_market_weekly.json
tiktok_shop_stores_weekly.json
tiktok_shop_creatives_weekly.json
lead_events.json
```

### 5. Presentation Layer

The portal is made of static pages:

```text
portal/index.html
portal/pages/weekly/index.html
portal/pages/leads/index.html
portal/pages/market/index.html
portal/pages/players/index.html
portal/pages/products/index.html
portal/pages/creatives/index.html
```

MVP only includes `index.html` and `pages/leads/index.html`.

## Historical Reuse

Reusable:

- Python + pandas extraction and aggregation patterns
- ECharts delayed initialization patterns
- JS syntax validation checklist
- Static HTML deployment workflow
- Existing category deep-dive data as supporting evidence

Not reusable as-is:

- Two-tab report structure
- Giant single-file HTML output
- Hardcoded business rules inside HTML
- Report-first navigation and "专题" framing

