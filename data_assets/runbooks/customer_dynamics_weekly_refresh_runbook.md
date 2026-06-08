# Customer Dynamics Weekly Refresh Runbook

## Scope

每周抓取全行业近 2 周客户动态，统一输出到 `lead_events.json`，供售前线索页按标准一级/二级行业筛选。

行业标准沿用：

```text
portal/data/dictionary/industry_dictionary_ecommerce.json
```

规则配置：

```text
data_assets/config/customer_dynamics_search_rules_v0_1.json
```

## Current Source Inputs

| Source | Purpose |
|---|---|
| `Z:\主线任务2-天眼计划\外部数据库\展会_新产品上市资讯` | 展会、周投标、活动线索 |
| `Z:\主线任务2-天眼计划\行业专题研究\美妆个护_大区拓客线索_v1.5_TikTok校验版.xlsx` | Beauty 客户动态与 TikTok 校验 |
| `Z:\主线任务2-天眼计划\行业专题研究\行研报告\3C-行业报告\3C-值得做的行业和客户_行研视角.xlsx` | Consumer Tech 客户动态 |
| `Z:\主线任务2-天眼计划\行业专题研究\行研报告\游戏-行研报告\游戏出海新游拓客日历_v0.1.xlsx` | Gaming 新游上线/测试动态 |

## Weekly Flow

1. 以 `customer_dynamics_search_rules_v0_1.json` 的 `collection_window.default_lookback_days = 14` 作为抓取窗口。
2. 按 `industry_rules` 展开一级行业、二级行业和关键词组。
3. 按 `signal_taxonomy` 识别事件类型：新品发布、渠道扩张、展会参展、招投标、融资/战略合作、招聘/团队扩张、游戏测试/上线窗口。
4. 按 `source_tiers` 判定证据等级，优先保留 P0/P1 信源。
5. 用 `incremental_key` 去重；无 URL 时用 `dedupe_fallback_key` 兜底。
6. 所有结果写入 `lead_events.json` 前，必须校验 `standard_l1/standard_l2` 是否存在于行业字典。

## Rebuild Existing Workbook Leads

当前脚本已对 Beauty、Consumer Tech、Gaming 和展会线索做标准行业映射：

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_lead_events_from_research_workbooks_v0_2.py
```

输出：

```text
portal/data/leads/lead_events.json
data_assets/curated/leads/lead_events.json
```

## Automation Handoff

后续定时任务建议：

```text
frequency: weekly
timezone: Asia/Shanghai
lookback_days: 14
primary_config: data_assets/config/customer_dynamics_search_rules_v0_1.json
rebuild_script: scripts/build_lead_events_from_research_workbooks_v0_2.py
```

定时任务只负责抓新动态和重建缓存；人工复核仍应聚焦 A/B 优先级、出海营销相关性、报名截止日期和客户是否已触达。
