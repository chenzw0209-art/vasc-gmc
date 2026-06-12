# Ecommerce 行业映射规则 v0.2

更新时间：2026-06-11

## 核心变更

Fashion 必须作为独立一级行业保留，不再被折叠到 Lifestyle。

## 当前一级行业规则

- `Fashion`：独立一级行业。服装、鞋履、箱包、珠宝、手表、配饰、童装、男装、女装、服装综合都保留在 Fashion 下。
- `Auto & Mobility`：当前电商前台仍折叠到 Lifestyle。
- `Gaming`：电商映射里的实体游戏卡/光盘等不进入电商行业研究入口；当前 Gaming 由应用/游戏研究链路单独承接。

## Fashion 二级行业

当前字典应至少保留：

- 女装
- 童装
- 服装综合
- 男装
- 箱包
- 配饰/珠宝/手表
- 鞋履

## 生成链路要求

1. `scripts/build_dictionaries_v0_1.py` 生成行业字典时，Fashion 不能被折叠。
2. `scripts/generate_us_amazon_market_canonical_v0_1.py` 聚合 US Amazon canonical market 时，必须按 `standard_l1 + standard_l2` 聚合，不能只按 `standard_l2` 聚合。
3. `scripts/validate_intelligence_portal_contract_v0_1.js` 必须校验 Fashion 在字典、类目映射、US Amazon canonical source 中保持独立。

## 注意

当前行业研究页主数据 `portal/data/market/amazon_market_facts_monthly.json` 来自 governed bottom-table 快照。若 Fashion 未出现在页面中，说明 governed 快照源清单缺 Fashion，不代表行业字典或映射规则缺 Fashion。页面恢复 Fashion 需要补齐 governed Fashion 聚合底表，再重新生成前台主表。
