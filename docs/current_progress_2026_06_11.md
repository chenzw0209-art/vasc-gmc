# 增长情报门户当前进度汇报

更新时间：2026-06-11

## 1. 当前入口

当前前台入口只保留：

- 周报
- 行业研究

独立的线索、玩家、产品、创意页仍作为历史资产存在，但不作为当前开发入口。行业研究页内部可以有“玩家格局”“类目结构”等研究视角，但不恢复历史独立模块。

## 2. 行业字典与 Fashion

已更正：

- Fashion 作为独立一级行业保留。
- Fashion 不再折叠进 Lifestyle。
- 行业研究 Web 的行业树改为读取 `industry_dictionary_ecommerce.json`，再叠加已有市场事实数据。
- 如果某个行业在字典里存在、但 `amazon_market_facts_monthly.json` 尚无 governed 市场事实，页面展示“市场数据待治理”，不再显示假 0 值。

当前状态：

- 字典中 Fashion 有 7 个二级行业：女装、童装、服装综合、男装、箱包、配饰/珠宝/手表、鞋履。
- 类目映射中 Fashion 有 300+ 条映射。
- US Amazon canonical sources 中 Fashion 保留 10+ 条来源。
- 当前 governed 前台市场主表仍缺 Fashion 行，因此 Fashion 页面现在是“字典已接入，市场事实待治理”。

下一步：

- 补齐 Fashion governed 聚合底表源清单。
- 重生成 `amazon_market_facts_monthly.json`、`amazon_players_monthly.json`、`amazon_products_monthly.json`。
- 让 Fashion 从待治理页自动切换为完整行研页。

## 3. Gaming 主版面

已完成：

- Gaming 作为一级行业主版面，不设二级行业入口。
- 新游日历数据已迁入中台 canonical source。
- 新游日历已由 Excel 治理成 JSON，前端只读 `portal/data/gaming`。
- 已实现 Gaming 行研页的本周要闻、日历信息、月级窗口视图。
- 已删除原“日历列表”模块，避免与后续市场概览冲突。

已定方案：

- Gaming 市场概览使用 Insight 周数据。
- 周数据不是市场规模，而是买量与素材活动温度计。
- 曝光预估不能解释为收入、下载或预算。
- 国家/平台明细是创意计数，不能解释为曝光份额。

已摸清周数据：

- 原始周榜行数：117,396
- 游戏过滤后行数：62,961
- 覆盖周次：66 周
- 起止：2025-01-06 至 2026-04-06
- 最新周：2026-04-06
- 最新周游戏曝光预估：1,674,379,867
- 最新周活跃应用：924
- 最新周活跃开发者：450
- 最新周在投素材：35,110
- `2026-03-14` 是两天残周，趋势默认应标注或剔除。

下一步：

- 生成 `portal/data/gaming/gaming_market_weekly_overview_2026_04_06.json`。
- 接入 Gaming 市场概览模块，替代日历列表位置。
- 做连续周表、类型拆解、App 榜单、国家/平台创意分布。

## 4. 周报 W24

已做：

- W24 周报结构已进入当前门户。
- 已按要求做过 2880x1800、2560x1440、1440x900 的挤压检查与多轮样式修正。
- `portal/data/weekly/industry_brief_supply_2026_W24.json` 标记为内容侧供给，不由本工程覆盖。

当前提醒：

- W24 的内容供给和页面样式是两条线。
- 内容侧 JSON 不要在技术执行侧直接覆盖。

## 5. 数据治理规则

已明确：

- 前端只读 `portal/data` 下 JSON。
- 不直接读取 Excel。
- 不在前端临时定义行业事实或临时拆分类目。
- 行业事实必须来自治理脚本输出。
- 研报信息作为验证源、解释框架和深度文档材料，不替代结构化底表。

已新增/更新的关键文档：

- `docs/ecommerce_industry_mapping_policy_v0_2.md`
- `docs/gaming_market_overview_weekly_data_plan_v0_1.md`
- `docs/gaming_main_page_product_blueprint_v0_1.md`
- `Z:\增长分析中台\行研洞察-agent\Gaming\02_底表治理\Gaming周度市场概览治理方案_v0_1.md`

## 6. 当前风险

1. governed Amazon US 主表缺 Fashion

规则已经更正，但当前前台主表缺 Fashion 数据，需要补 governed 聚合底表后再生成。

2. 历史页面仍在仓库

`portal/pages/players`、`portal/pages/products`、`report_pages_v0_*` 等仍存在，是历史资产。当前入口不应链接它们。

3. Gaming 市场概览还未生成 JSON

周数据口径已摸清，方案已定，但还没生成前端消费 JSON。

4. 行业深度文档尚未进入正式批量生产

接下来应从 Gaming/Fashion/Beauty 等重点行业开始，把底表事实、研报验证和页面模块串成深度文档。

## 7. 建议下一阶段顺序

1. 先补 Fashion governed 数据，让行业树与页面事实一致。
2. 生成 Gaming 市场概览 JSON，并接入 Web。
3. 开始抓行业深度文档，优先顺序建议：
   - Gaming：从新游窗口、买量周数据、研报验证切入。
   - Fashion：从服饰/鞋履/箱包/配饰的供应链、内容爆款、CN 占比切入。
   - Beauty：已有数据最完整，可作为文档范式样板。
4. 每个深度文档都按统一结构沉淀：
   - 市场事实
   - 玩家格局
   - 产品结构
   - 增长信号
   - 研报验证
   - 待验证假设
   - 页面可视化字段
