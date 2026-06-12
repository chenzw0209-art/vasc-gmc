# Gaming 新游日历交付记录

更新时间：2026-06-12

## 当前交付

Gaming 新游日历已经作为 `Gaming` 一级行业主版面模块交付，不作为二级行业，也不恢复独立线索页。

页面入口：

```text
portal/pages/market/index.html?l1=Gaming
```

前端只读取 JSON：

```text
portal/data/gaming/new_game_calendar_2026_06_08.json
portal/data/gaming/gaming_calendar_targets_2026_06_09.json
```

## 交互口径

- 默认展示 6 个月窗口。
- 月份本身不作为详情触发对象。
- 月份内项目可点击，点击后右侧 `日历信息` 展示项目情况、事件、阶段、窗口、信源。
- 每个月默认展示 4 个项目；超过 4 个项目时显示剩余数量提示。
- 上方 `本周要闻` 也可点击项目，并联动 `日历信息`。
- `项目全表` 作为全量核查视图，不再叫“日历列表”。

## 底表收纳

底表已经收纳到中台 canonical source：

```text
data_assets/canonical_sources/gaming/raw_2026_06_09/calendar/新游日历目标游戏枚举_v0.2_20260608.xlsx
```

线索采集目录只保留移动指针：

```text
Z:\增长分析中台\线索采集\新游日历目标游戏枚举_v0.2_20260608.MOVED_TO_GROWTH_PORTAL.txt
```

索引：

```text
data_assets/registry/gaming_calendar_source_inventory_2026_06_12.json
```

## 生成与校验

重建 JSON：

```powershell
python scripts/build_gaming_calendar_from_xlsx_v0_1.py
```

校验：

```powershell
node scripts/validate_gaming_research_data_v0_1.js
node scripts/validate_portal_pages_v0_1.js
node scripts/validate_intelligence_portal_contract_v0_1.js
```
