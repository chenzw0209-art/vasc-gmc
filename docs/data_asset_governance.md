# Data Asset Governance

## Final Asset Location

The governed data assets live in:

```text
C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal\data_assets
```

This folder is the master asset layer for the rebuilt market data. The web app reads generated copies under `portal/data`, but `portal/data` is only a consumer cache.

## Folder Roles

| Folder | Role |
|---|---|
| `data_assets/registry` | Market-level asset registry and seven-country coverage summary. |
| `data_assets/canonical_sources` | Canonical source list after dedupe, mapping, and source selection. |
| `data_assets/curated/market` | Future place for rebuilt market fact tables ready for portal/API consumption. |
| `data_assets/audit` | Unmapped assets, duplicate decisions, missing source checks, and other data quality issues. |
| `data_assets/runbooks` | Refresh playbooks: where to export raw data, how to name files, and how to rebuild. |

## Current Master Files

| File | Meaning |
|---|---|
| `data_assets/registry/ecommerce_market_asset_registry.json` | Seven-country market asset summary. |
| `data_assets/canonical_sources/ecommerce_market_canonical_sources.json` | Canonical source list for US/MX/JP/BR Amazon and MY/ID/VN Shopee. |
| `data_assets/audit/ecommerce_market_source_audit.json` | Audit issues and source coverage checks. |
| `data_assets/curated/market/amazon_market_facts_monthly.json` | Current Amazon-only governed market fact table for the active web sprint. |
| `data_assets/curated/market/amazon_market_story_v0_1.json` | Current Amazon-only story, KPI, and chart package for the active web sprint. |

## Raw Source Zones

Raw and historical files remain in Z drive. They are not the governed output layer.

| Zone | Path | Role |
|---|---|---|
| Gold mapping | `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx` | Standard category mapping. This decides `standard_l2`. |
| US Amazon | `Z:\主线任务2-天眼计划\行业专题研究\行研报告` | Historical and topic-specific bottom tables. Topic folders have priority over `3C-行业报告`. |
| MX/JP/BR Amazon | `Z:\外部数据库\Softtiem亚马逊月度数据\行业底表` | Processed Amazon raw-L2 market workbooks. |
| MY/ID/VN Shopee | `Z:\外部数据库\虾皮月度数据（近半年）` | Shopee monthly raw pages and, for MY/ID, processed L1 workbooks. |

## Governance Rules

1. The gold mapping workbook is the category truth source.
2. Market module grain is `standard_l2`.
3. Amazon canonical source grain is one processed raw-L2 workbook.
4. Shopee canonical source grain is one raw-L2 slice inside a processed raw-L1 workbook where available.
5. Shopee Vietnam currently has raw monthly pages directly under the country folder and no `数据处理表`; it needs a rebuild step before it can match MY/ID aggregation.
6. `standard_l1`, raw mapping details, listing counts, and mapping status are governance metadata and should not be displayed by default in the market UI.
7. Existing historical files are building blocks. New curated outputs should be written to `data_assets/curated/market`.

## Rebuild Command

From project root:

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_ecommerce_market_assets_v0_2.py
```

This scans the seven-country source zones and rewrites the registry/canonical/audit JSON files.

## Active Sprint: Amazon Only

The current active web sprint intentionally excludes Shopee and uses:

```text
US / MX / JP / BR Amazon
```

Refresh command:

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_amazon_market_package_v0_1.py
```

Latest verified Amazon-only output:

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

Country monthly GMV:

```text
US_Amazon: $38.55B
JP_Amazon: $2.80B
MX_Amazon: $0.92B
BR_Amazon: $0.51B
```

For the active sprint, data governance can be considered complete for Amazon market facts, because every selected Amazon source reads successfully and the output has a stable USD, period, and `standard_l2` grain.

Shopee governance is not complete. It remains phase 2 and needs a local intermediate processing layer before visualization:

```text
data_assets/intermediate/shopee/*_processed_l1_workbooks/
```
