# Ecommerce Market Refresh Runbook

## Asset Layer

Master governed assets are under:

```text
C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal\data_assets
```

Use `portal/data` only as the web app cache.

## Seven Markets

| Market | Platform | Current Source Type | Raw / Processed Path |
|---|---|---|---|
| US | Amazon | Historical topic-priority processed bottom tables | `Z:\主线任务2-天眼计划\行业专题研究\行研报告` |
| MX | Amazon | Processed raw-L2 bottom tables | `Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon墨西哥所有二级类目底表（已处理）` |
| JP | Amazon | Processed raw-L2 bottom tables | `Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon日本所有二级类目底表（已处理）` |
| BR | Amazon | Processed raw-L2 bottom tables | `Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon巴西所有二级类目底表（已处理）` |
| MY | Shopee | Processed raw-L1 workbooks with raw-L2 rows | `Z:\外部数据库\虾皮月度数据（近半年）\马来\数据处理表` |
| ID | Shopee | Processed raw-L1 workbooks with raw-L2 rows | `Z:\外部数据库\虾皮月度数据（近半年）\印尼\数据处理表` |
| VN | Shopee | Raw monthly page exports only in current version | `Z:\外部数据库\虾皮月度数据（近半年）\越南` |

## Amazon Refresh Rule

For MX/JP/BR, export from Sorftime/Amazon by country, raw L1, raw L2:

```text
{raw_l2}竞品分析底表-市场大盘v{version}.xlsx
```

Save it under:

```text
Z:\外部数据库\Softtiem亚马逊月度数据\行业底表\amazon{国家}所有二级类目底表（已处理）\{raw_l1}\
```

For US, keep the current rule: specialized topic folders in `行研报告` have priority, and `3C-行业报告` is fallback. The canonical file stores all candidate paths and the selected canonical path.

## Shopee Refresh Rule

For MY/ID, raw monthly pages should follow:

```text
{raw_l1}_{raw_l2}_{month}月_第{page}页.xlsx
```

Raw pages are stored under:

```text
Z:\外部数据库\虾皮月度数据（近半年）\{国家}\数据底表
```

Then rebuild the processed L1 workbook:

```text
Z:\外部数据库\虾皮月度数据（近半年）\{国家}\数据处理表\{raw_l1}.xlsx
```

Required processed fields include:

```text
国家, 一级类目, 二级类目, 年份, 月份, 店铺ID, 店铺名称, 产品数量, 有销量的产品数量, 销量, 销售额USD
```

For VN, current files are raw monthly pages directly under:

```text
Z:\外部数据库\虾皮月度数据（近半年）\越南
```

Next step is to generate `越南\数据处理表\{raw_l1}.xlsx` so VN aligns with MY/ID.

## Rebuild Governance Assets

Run:

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_ecommerce_market_assets_v0_2.py
```

Review:

```text
data_assets/registry/ecommerce_market_asset_registry.json
data_assets/canonical_sources/ecommerce_market_canonical_sources.json
data_assets/audit/ecommerce_market_source_audit.json
```

## Current Known Gaps

1. VN Shopee has no processed L1 workbooks yet.
2. Some Amazon MX/JP/BR processed bottom tables do not match the gold mapping exactly and are listed as `unmapped_processed_bottom_table`.
3. MY/ID Shopee have some processed L1 workbook names that do not map one-to-one with the gold `原始一级类目`.
4. Market fact aggregation for MX/JP/BR/MY/ID/VN has not yet been generated into `data_assets/curated/market`.
