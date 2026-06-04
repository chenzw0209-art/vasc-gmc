# Iteration Log

## v0.1 - 2026-06-02

Initial local engineering scaffold.

### Added

- Created project structure under `outputs/growth-intelligence-portal`.
- Added engineering documentation:
  - `README.md`
  - `docs/architecture.md`
  - `docs/data_contract.md`
  - `docs/development_workflow.md`
  - `docs/naming_conventions.md`
  - `docs/source_registry.md`
  - `docs/reuse_notes.md`
- Established explicit JSON naming rule, e.g. `amazon_products_monthly.json`.
- Established source boundary:
  - ecommerce V1: Amazon / Shopee / TikTok Shop
  - application system: Insight data, excluded from ecommerce V1
- Added first MVP target: Leads Center.

### Next

- Generate `source_registry.json`.
- Generate `category_mapping_ecommerce.json` from `类目匹配表_0602.xlsx`.
- Build Leads Center static MVP.
- Add basic validation script.

## v0.1.1 - 2026-06-02

Generated first local data and page MVP.

### Added

- Added dictionary build script: `scripts/build_dictionaries_v0_1.py`.
- Added leads MVP generator: `scripts/generate_leads_v0_1.py`.
- Generated `portal/data/dictionary/category_mapping_ecommerce.json` with 2060 records.
- Generated `portal/data/dictionary/industry_dictionary_ecommerce.json`.
- Generated `portal/data/sources/source_registry.json`.
- Generated `portal/data/leads/lead_events.json` with initial sample records from UI sketch.
- Added static portal home page.
- Added Leads Center static page.

### Changed

- Added local fallback bar rendering when ECharts CDN is unavailable.

### Validation

- JSON syntax validation passed for:
  - `lead_events.json`
  - `category_mapping_ecommerce.json`
  - `source_registry.json`
- Local HTTP validation passed:
  - `/`
  - `/pages/leads/`
  - `/data/leads/lead_events.json`
  - `/data/dictionary/category_mapping_ecommerce.json`

### Known Limitations

- Leads data is currently sample data from the UI sketch, not real PR or platform-derived signals.
- Browser screenshot validation was not completed because the local bundled Playwright install is missing `playwright-core`.

## v0.2 - 2026-06-02

Shifted active MVP priority from Leads Center to Market Center.

### Added

- Added Amazon market generator: `scripts/generate_amazon_market_v0_1.py`.
- Added report-based market generator: `scripts/generate_market_from_reports_v0_1.py`.
- Added Market Center page: `portal/pages/market/index.html`.
- Added explicit Amazon market payload contract to `docs/data_contract.md`.

### Data Source

- Main market adapter uses:
  - `Z:\主线任务2-天眼计划\行业专题研究\行研报告`
- Output:
  - `portal/data/amazon/amazon_market_reports_monthly.json`

### Notes

- The earlier external Amazon adapter is kept as exploration code, but is not the active market source.
- The active market source uses report intermediate data from 3C, Beauty, and Health/Family.
- Unmapped category records are preserved with `mapping_status = "unmapped"` instead of silently forced into a standard industry.
- GMV fields are normalized:
  - `gmv` = annual GMV
  - `monthly_gmv` = current month GMV
  - For 3C and Beauty report structures, annual GMV is computed from the latest 12 monthly values.
  - For Health/Family, annual GMV uses the existing `总年GMV` field.

### Validation

- Generated `amazon_market_reports_monthly.json` with 665 records.
- JSON syntax validation passed.
- Local HTTP validation passed for `/data/amazon/amazon_market_reports_monthly.json`.
- Current summary:
  - annual GMV: about $179.50B
  - monthly GMV: about $14.77B
  - weighted CN GMV share: about 25.83%
  - mapping status: 615 exact, 6 fuzzy, 44 fallback from report category

## v0.3 - 2026-06-02

Refocused work from market page display to US Amazon data governance.

### Direction

- Treat US Amazon / North America as the priority data governance scope.
- Stop using every historical export equally.
- Build an asset inventory first, then choose canonical source rules.

### Added

- Added US Amazon asset audit script:
  - `scripts/audit_us_amazon_assets_v0_1.py`
- Planned audit output:
  - `portal/data/sources/us_amazon_asset_audit.json`

### Governance Goal

- Unified source.
- Unified grain.
- Deduplicated market records.
- Market module aggregation grain should be second-level industry/category, not third-level product/player/detail.

## v0.4 - 2026-06-02

Confirmed canonical source rule.

### Rule

- Gold standard is `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx`.
- Historical bottom tables are reusable building blocks.
- Category mapping workbook decides final standard industry/category.
- Topic folders have priority over `3C-行业报告`.
- `3C-行业报告` is fallback for categories without a better topic folder source.

### Added

- Added canonical source builder:
  - `scripts/build_us_amazon_canonical_sources_v0_1.py`
- Added operator-friendly Markdown exporter:
  - `scripts/export_us_amazon_canonical_sources_md_v0_1.py`
- Planned output:
  - `portal/data/sources/us_amazon_canonical_sources.json`
  - `docs/us_amazon_canonical_sources.md`

### Required Fields For Refresh

Each canonical source record must show:

- `raw_l1_to_export`
- `raw_l2_to_export`
- `current_canonical_bottom_table`
- `recommended_output_folder`
- `recommended_file_pattern`
- `all_candidate_paths`

## v0.5 - 2026-06-02

Switched market data generation to canonical US Amazon sources.

### Added

- Added canonical market generator:
  - `scripts/generate_us_amazon_market_canonical_v0_1.py`
- Added active market payload:
  - `portal/data/amazon/us_amazon_market_canonical_monthly.json`

### Changed

- Market page now reads `us_amazon_market_canonical_monthly.json`.
- Market page displays only standard second-level industry rows.
- Removed first-level industry, third-level category, Listing and mapping status from market display.

### Active Market Grain

```text
standard_l2
```

### Validation

- Canonical source count: 288.
- Read success: 288.
- Read failures: 0.
- Aggregated standard second-level industries: 42.
- JSON syntax validation passed.
- Local HTTP validation passed for `/pages/market/`.

### Current Summary

- Annual GMV: about $305.63B.
- Monthly GMV: about $25.21B.
- Weighted CN GMV share: about 37.15%.
# 2026-06-02 V0.2 七国市场数据资产治理

## Scope

- Extended market data source governance from US Amazon to seven ecommerce markets:
  - US / MX / JP / BR Amazon
  - MY / ID / VN Shopee
- Created a governed master data asset layer under `data_assets`.
- Clarified that `portal/data` is a web-consumption cache, not the master data asset.

## Outputs

- `scripts/build_ecommerce_market_assets_v0_2.py`
- `data_assets/registry/ecommerce_market_asset_registry.json`
- `data_assets/canonical_sources/ecommerce_market_canonical_sources.json`
- `data_assets/audit/ecommerce_market_source_audit.json`
- `data_assets/runbooks/ecommerce_market_refresh_runbook.md`
- `docs/data_asset_governance.md`
- `docs/handoff_prompt_next_ai.md`

## Latest Run

```text
canonical_count: 2019
included_count: 1830
US Amazon: 288 sources, 288 included, 42 standard_l2
MX Amazon: 273 sources, 253 included, 37 standard_l2
JP Amazon: 329 sources, 289 included, 34 standard_l2
BR Amazon: 232 sources, 214 included, 38 standard_l2
MY Shopee: 295 sources, 258 included, 43 standard_l2
ID Shopee: 306 sources, 268 included, 43 standard_l2
VN Shopee: 296 sources, 260 included, 43 standard_l2
issue_count: 483
```

## Notes

- Amazon MX/JP/BR use processed raw-L2 bottom tables under `Z:\外部数据库\Softtiem亚马逊月度数据\行业底表`.
- Shopee MY/ID use processed raw-L1 workbooks under `数据处理表`; canonical grain is a raw-L2 slice in that workbook.
- Shopee VN currently has raw monthly pages directly under `Z:\外部数据库\虾皮月度数据（近半年）\越南` and no `数据处理表`; this is the main remaining data preparation step before VN market facts can be generated.
- Audit issues are preserved in `data_assets/audit/ecommerce_market_source_audit.json`; do not silently guess unresolved category mappings.

# 2026-06-02 V0.3 七国市场事实表聚合与Web展示

## Scope

- 完成七国电商市场事实表聚合，统一货币为 USD
- 升级 Web 市场页面支持多国家/平台筛选
- 处理亚马逊 MX/JP/BR 本币转美元、Shopee 最新月逻辑、US Amazon 两种列名格式

## Outputs

- `scripts/generate_ecommerce_market_facts_v0_2.py` — 七国市场事实表生成脚本
- `data_assets/curated/market/ecommerce_market_facts_monthly.json` — 主资产层市场事实表
- `portal/data/market/ecommerce_market_facts_monthly.json` — Web 应用缓存
- `portal/pages/market/index.html` — 升级后的市场页面（支持国家/平台筛选）

## 货币处理

所有金额字段统一为 USD：
- **Amazon US**: 已是 USD，FX = 1.0
- **Amazon MX/JP/BR**: 本币（MXN/JPY/BRL）× FX 转 USD
  - FX 汇率（2026-04 近似值，可配置）：
    - 1 USD ≈ 18 MXN → fx_to_usd = 0.0556
    - 1 USD ≈ 150 JPY → fx_to_usd = 0.0067
    - 1 USD ≈ 5.2 BRL → fx_to_usd = 0.1923
  - 每条原始记录保留 `native_monthly_gmv`、`native_annual_gmv`、`native_currency`、`fx_to_usd` 字段供核对
- **Shopee MY/ID**: 数据处理表中 `销售额USD` 已是 USD，FX = 1.0

## Amazon 列名格式处理

US Amazon 底表有两种列名格式：
1. 带 `($)` 后缀：`总月销额($)`、`总年GMV($)`
2. 不带后缀：`总月销额`、`总年GMV`

旧 US 脚本只认格式1，算出年GMV $305.6B。新脚本用 prefix 匹配两种都认，算出 $464.5B（增加 $158.9B）。**用户选择读全 $464.5B**，数据更完整。

## Shopee 聚合逻辑

- 数据粒度：店铺 × 月份（`年份`、`月份`、`销售额USD`）
- 月GMV：取最新 (年份, 月份) 的 `销售额USD` 汇总
- 上月GMV：取次新月份的汇总，用于计算环比
- 年GMV：最新月 × 12（年化 run-rate）
- 处理表缓存：每个 L1 工作簿只读一次，多个 raw_l2 共用

## 最新运行结果

```text
standard_l2 records: 229
raw source records: 1830
read ok / failed: 1413 / 417
total annual GMV:  $537,363,852,367
total monthly GMV: $44,407,827,458
CN share weighted: 31.7%

monthly GMV by market (USD):
  BR_Amazon    $     500,564,029   (38 standard_l2)
  ID_Shopee    $     520,787,867   (39 standard_l2)
  JP_Amazon    $   2,972,989,332   (34 standard_l2)
  MX_Amazon    $     891,976,170   (37 standard_l2)
  MY_Shopee    $     974,215,251   (39 standard_l2)
  US_Amazon    $  38,547,294,810   (42 standard_l2)

read failures:
  ID_Shopee_missing_source_workbook: 43
  ID_Shopee_no_matching_l2: 33
  MY_Shopee_missing_source_workbook: 33
  MY_Shopee_no_matching_l2: 48
  VN_Shopee_missing_source_workbook: 260
```

## Web 页面升级

市场页面 (`portal/pages/market/index.html`) 新增：
- 平台筛选下拉框（全部/Amazon/Shopee）
- 国家筛选下拉框（全部/US/MX/JP/BR/MY/ID/VN）
- 表格增加"国家"、"平台"列
- 动态更新页面副标题显示当前筛选范围
- KPI 卡片增加"市场数"（国家-平台组合数）

## 已知缺口

1. **VN Shopee (260 源)**: 无 `数据处理表`，只有原始月度页面，需先生成处理表才能聚合
2. **MY/ID Shopee `no_matching_l2` (81 源)**: 处理表中 `二级类目` 列的值与 canonical 中 `raw_l2` 对不上，可能是命名差异
3. **MY/ID Shopee `missing_source_workbook` (76 源)**: 金标准映射表期望的 L1 工作簿不存在

## 验证

- JSON 语法校验通过
- 本地 HTTP 服务器已启动：http://localhost:8080/pages/market/
- 七国数据聚合完成，货币统一为 USD
- Web 筛选功能正常
## 2026-06-02 V0.3.1 审查后修复交接

### 本轮审查结论

- 当前七国市场事实表 V0.3 可以复现，但不能判定“各国各平台底表数据库已经完全规整”。
- 主要缺口集中在 Shopee：
  - VN Shopee 260 个源没有处理表，旧结果为 0。
  - MY/ID Shopee 有 76 个 `missing_source_workbook`，主要是金标准 L1 与处理表文件名不同，例如 `书籍 _ 杂志` 对应实际 `书籍.xlsx`。
  - MY/ID Shopee 有 81 个 `no_matching_l2`，主要是金标准 L2 为组合名，而处理表 L2 为短名，例如 `斜挎包_单肩包` 对应实际 `斜挎包`。
- US Amazon 年 GMV 从 `$305.6B` 到 `$464.5B` 的原因可解释：新脚本用列名前缀匹配，读到了旧脚本漏读的无货币后缀列。但该新口径仍建议抽样核验 Top 增量行业是否存在层级重复计数。

### 已改动但尚未完成验证

已修改：

- `scripts/generate_ecommerce_market_facts_v0_2.py`

改动内容：

- 更新 FX 常量为 2026-04 参考汇率：
  - MX: `1 / 17.4433`
  - JP: `1 / 159.344`
  - BR: `1 / 5.153`
- 新增 Shopee L1 处理表自动解析：
  - `书籍 _ 杂志` -> `书籍.xlsx`
  - `旅行_行李箱` -> `旅行.xlsx`
  - `游戏 _ 电玩` -> `游戏.xlsx`
  - `电脑 _ 配件` -> `电脑.xlsx`
  - `相机 _ 无人机` -> `相机.xlsx`
  - `车辆备件和配件` -> `汽车类.xlsx`
- 新增 Shopee L2 规范化匹配：
  - exact
  - normalized
  - contained
  - reverse contained
- 新增 Shopee 原始分页读取兜底：
  - 当没有 `数据处理表` 或处理表无法解析时，从 `{raw_l1}_{raw_l2}_{month}月_第{page}页.xlsx` 读取。
  - 已识别 VN 原始分页表头在 Excel header row 8。
- 已通过语法检查：
  - `python -m py_compile scripts/generate_ecommerce_market_facts_v0_2.py`

尚未完成：

- 修复后长聚合命令被用户要求暂停，未跑完。
- 后台长聚合进程已停止，避免继续写半成品。
- 因此 `data_assets/curated/market/ecommerce_market_facts_monthly.json` 仍应视为 V0.3 旧结果，不能视为 V0.3.1 修复后结果。

### 下一步必须做

1. 重新运行：

```powershell
& 'C:\Users\wale.chen\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\generate_ecommerce_market_facts_v0_2.py
```

2. 验证失败数是否下降：

```text
目标：VN_Shopee 不再是 0；MY/ID missing_source_workbook 与 no_matching_l2 明显下降。
```

3. 检查新结果：

```text
data_assets/curated/market/ecommerce_market_facts_monthly.json
portal/data/market/ecommerce_market_facts_monthly.json
```

4. 如果 VN 读取过慢，下一步应独立生成本地治理层处理表，而不是直接写 Z 盘：

```text
data_assets/intermediate/shopee/vn_processed_l1_workbooks/
```

5. 若修复后仍有 Shopee 失败，输出一张人工确认表：

```text
data_assets/audit/shopee_unresolved_category_matches.csv
```
## 2026-06-02 V0.4 Amazon-only 网页设计准备

### Decision

- 本阶段先不纳入 Shopee 数据。
- 原因：Shopee 原始 Excel 量级极大，直接读取会拖慢数据闭环和网页设计节奏。
- 当前先用 Amazon 四国（US / MX / JP / BR）完成：
  - 数据治理
  - 市场呈现内容
  - 分析观点
  - 数据可视化输入

### Added

- `scripts/build_amazon_market_package_v0_1.py`
- `data_assets/curated/market/amazon_market_facts_monthly.json`
- `data_assets/curated/market/amazon_market_story_v0_1.json`
- `portal/data/market/amazon_market_facts_monthly.json`
- `portal/data/market/amazon_market_story_v0_1.json`
- `docs/amazon_market_web_design_brief.md`

### Changed

- `portal/pages/market/index.html` 已切换为 Amazon 四国临时页面。
- 页面不再展示 Shopee 筛选项。
- 页面读取：
  - `portal/data/market/amazon_market_facts_monthly.json`
  - `portal/data/market/amazon_market_story_v0_1.json`

### Verified Output

```text
amazon standard_l2 records: 151
amazon raw sources: 1044
read ok / failed: 1044 / 0
monthly GMV: $42.77B
annualized GMV: $517.41B
```

Country monthly GMV:

```text
US_Amazon: $38.55B
JP_Amazon: $2.80B
MX_Amazon: $0.92B
BR_Amazon: $0.51B
```

### Validation

- `scripts/build_amazon_market_package_v0_1.py` syntax check passed.
- Amazon facts/story JSON parse passed.
- `portal/pages/market/` HTTP 200.
- `portal/data/market/amazon_market_facts_monthly.json` HTTP 200.
- Market page inline JS syntax check passed.

### Phase 2 Deferred

Shopee remains in governance/audit records, but is not part of the current web design sprint.

Next Shopee prerequisite:

```text
Build local intermediate processed workbooks:
data_assets/intermediate/shopee/*_processed_l1_workbooks/
```

## 2026-06-02 V0.5 Amazon-only 市场页范式重构

### Decision

- 继续执行用户最新决策：当前先不接 Shopee。
- 当前冲刺范围固定为 US / MX / JP / BR Amazon。
- 目标从“数据概览”升级为“市场决策后台”，为下一步网页设计做准备。

### Added / Changed

- 重构 `portal/pages/market/index.html`：
  - 固定侧边栏 + 顶部筛选器 + 主内容区。
  - 第一屏包含核心判断、KPI、主图、国家辅助图、市场明细表。
  - 市场明细表的展示单位改为 `standard_l2`。
  - 国家只作为筛选器和辅助图，不再作为表格主粒度。
  - 点击 `standard_l2` 行打开右侧 420px 抽屉，展示证据、国家拆分、玩家线索和下一步动作。
- 更新 `docs/amazon_market_web_design_brief.md`。
- 重写 `docs/handoff_prompt_next_ai.md`，避免旧 Shopee 七国修复状态干扰当前主线。
- 更新 `docs/data_asset_governance.md` 和 `docs/data_contract.md`。
- 新增 `scripts/validate_amazon_market_package_v0_1.py`，用于验证主资产、网页缓存、币种、周期、读取失败数和页面展示粒度。

### Verified Output

```text
amazon_records: 151
amazon_raw_sources: 1044
read_ok/read_failed: 1044 / 0
monthly GMV: $42.77B
annualized GMV: $517.41B
display standard_l2 rows: 50
```

Country monthly GMV:

```text
US_Amazon: $38.55B
JP_Amazon: $2.80B
MX_Amazon: $0.92B
BR_Amazon: $0.51B
```

Top standard_l2 after four-country aggregation:

```text
厨房餐饮: $62.20B annualized GMV
手机与配件: $51.29B annualized GMV
护肤与个护: $42.89B annualized GMV
鞋履: $33.10B annualized GMV
健康管理综合: $26.95B annualized GMV
```

### Validation

- `scripts/build_amazon_market_package_v0_1.py` rerun successfully.
- `scripts/validate_amazon_market_package_v0_1.py` passed.
- Amazon facts/story JSON parse passed.
- Market page inline JS syntax check passed.
- Local HTTP validation passed for `/pages/market/`.
- Local HTTP validation passed for `/data/market/amazon_market_facts_monthly.json`.
- In-app browser validation could not run because the local browser plugin failed to start in the Windows sandbox; script and HTTP validation were used instead.

### Next

- Continue visual design polish on the market page.
- Build Amazon player module using brand/company facts.
- Build Amazon product module using product-level facts.
- Keep Shopee in phase 2 until local intermediate processed workbooks are created.

## 2026-06-02 V0.6 行研内容资产接入

### Scope

- 扫描 `Z:\主线任务2-天眼计划\行业专题研究`。
- 将历史行研报告作为“观点/证据/动作”增强层接入当前 Amazon 市场页。
- 不改变 Amazon 市场事实表口径；行研内容只作为支持证据和拓客解释层。

### Added

- `scripts/scan_industry_research_assets_v0_1.py`
- `data_assets/research/industry_research_asset_inventory.json`
- `docs/industry_research_content_integration_plan.md`
- `scripts/build_market_research_enrichment_v0_1.py`
- `data_assets/curated/research/market_research_enrichment.json`
- `portal/data/research/market_research_enrichment.json`

### Asset Inventory

```text
scanned assets: 653
bottom tables: 341
narrative reports: 113
supporting assets: 107
scripts: 66
intermediate data: 16
cross-industry decision tables: 10
report folders: 28
```

### Research Enrichment

Source:

```text
Z:\主线任务2-天眼计划\行业专题研究\全行业-值得做的行业和客户_行研视角_v1.2_new.xlsx
```

Output:

```text
research records: 912
Amazon records: 546
```

Fields retained:

```text
site, country, platform, industry_class, research_category,
heat_score, annual_gmv, mom, cagr, cn_share,
major_segments, representative_players, action_hint, evidence
```

### Web Integration

- Market page now loads `portal/data/research/market_research_enrichment.json`.
- Standard-l2 rows show research heat when matched.
- Right drawer shows historical research supplement:
  - site/category
  - heat score
  - research annual GMV
  - CN share
  - major segments
  - representative players
- Matching uses `standard_l2` plus hidden `raw_l2_values` aliases.
- Generic terms such as `配件/用品/产品/其他/综合/设备/工具` are filtered to reduce false matches.

### Validation

```text
fact_records: 151
display_standard_l2_rows: 50
research_matched_l2_rows: 41
raw_sources: 1044
read_ok/read_failed: 1044/0
```

### Remaining Work

- Mine standardized intermediate data from 3C / Health & Family / Beauty reports for richer trend and attribution blocks.
- Parse selected narrative reports into reusable insight cards, not long report text.
- Add a review table for unmatched or low-confidence research-category matches.
- Build player/product pages after the market page design is stable.

## 2026-06-02 V0.6.1 单市场大盘与增长原因口径修正

### User Feedback

- 市场大盘页面必须区分国家和平台，例如 Amazon US 是一个独立市场大盘。
- 不要把不同国家、区域、平台混在同一个市场明细里。
- 市场明细排序参考营业额 + 增速的热度降序，权重为 6:4，并在同一市场内归一。
- 市场明细字段要写人话。
- `平台`、`国家`、`信源数`、`纳入观察` 这类字段不应作为市场明细字段。
- 洞察主论调要解释细分行业增长原因、增长信号，而不是泛泛说主市场/大盘。

### Changed

- `portal/pages/market/index.html`
  - 默认页面变为 `Amazon 美国` 单市场大盘。
  - 顶部市场筛选为 `Amazon 美国 / Amazon 墨西哥 / Amazon 日本 / Amazon 巴西`。
  - 每次只展示一个国家 + 一个平台的数据。
  - 市场明细字段改为：
    - 标准二级行业
    - 年销售额
    - 当月销售额
    - 月环比增长
    - 中国品牌销售占比
    - 市场热度
    - 重点细分
    - 代表玩家
    - 增长信号
  - 市场热度现场计算：
    - `年销售额归一 * 0.6 + 月环比增长归一 * 0.4`
    - 归一范围为当前所选市场，不跨国家、不跨平台。
  - 月环比增长优先使用行研视角表中的 MoM；没有行研匹配时回退到底表增长。
  - 右侧抽屉改为：
    - 增长主论调
    - 市场证据
    - 增长信号
    - 重点细分与代表玩家
    - 行研热度证据

### Added

- `scripts/build_market_growth_signals_v0_1.py`
- `data_assets/curated/research/market_growth_signals.json`
- `portal/data/research/market_growth_signals.json`

Growth signals source:

```text
Z:\主线任务2-天眼计划\行业专题研究\信号追踪表.md
```

### Validation

- Page inline JS syntax passed.
- HTTP 200 for `/pages/market/`.
- Browser check passed:

```text
scope: Amazon · 美国 · 2026-04
rowCount: 42
headers:
  标准二级行业
  年销售额
  当月销售额
  月环比增长
  中国品牌销售占比
  市场热度
  重点细分
  代表玩家
  增长信号
```

## 2026-06-02 V0.7 玩家与产品模块 V1

### Scope

- 按 `市场 / 玩家 / 产品模块设计说明 v1.1` 补齐玩家页和产品页。
- 当前仍只做 Amazon，不强行接 Shopee/TikTok。
- 页面口径：
  - 市场：为什么做这个行业
  - 玩家：为什么打这个客户
  - 产品：为什么打这个产品

### Added

- `scripts/build_players_products_v0_1.py`
- `scripts/validate_portal_pages_v0_1.js`
- `data_assets/curated/players/amazon_players_monthly.json`
- `portal/data/players/amazon_players_monthly.json`
- `data_assets/curated/products/amazon_product_opportunities_monthly.json`
- `portal/data/products/amazon_product_opportunities_monthly.json`
- `portal/pages/players/index.html`
- `portal/pages/products/index.html`

### Data Output

```text
players: 1655
product opportunities: 231
```

### Player Page

- Default scope: Amazon US.
- Analysis grain: brand.
- Answers: why target this customer.
- Uses:
  - governed Amazon market facts
  - top brands from bottom-table aggregation
  - representative players from research table
  - growth reasons/signals from signal tracking table
- Browser check:

```text
title: Amazon 玩家中心
subtitle: Amazon 美国品牌池，回答为什么打这个客户。
decision cards: 3
kpi cards: 4
rendered rows: 80
```

### Product Page

- Default scope: Amazon US.
- Current grain: product opportunity cluster.
- Answers: why target this product.
- Important limitation:
  - This is not final SKU-level product facts yet.
  - It uses research categories and signal-tracking subtracks as product opportunities.
  - Next step is to ingest raw Amazon product tables and replace clusters with SKU/product rows.
- Browser check:

```text
title: Amazon 产品中心
subtitle: Amazon 美国产品机会，回答为什么打这个产品。
decision cards: 3
kpi cards: 4
rendered rows: 68
```

### Validation

- Inline JS syntax passed for:
  - market page
  - players page
  - products page
- JSON parse passed for player/product assets.
- HTTP 200 passed for:
  - `/`
  - `/pages/market/`
  - `/pages/players/`
  - `/pages/products/`
  - `/data/players/amazon_players_monthly.json`
  - `/data/products/amazon_product_opportunities_monthly.json`

### Next

- Ingest raw Amazon product-level tables to create `amazon_products_monthly.json`.
- Upgrade product page from opportunity clusters to SKU/product facts.
- Add player-company mapping where brand parent company can be identified.

## 2026-06-02 V0.8 Amazon US Processed Bottom-Table Rebase

### Decision

- Current scope changed to Amazon US only.
- Do not use the previous four-country raw Amazon source paths for this sprint.
- Active source is processed report bottom tables under:
  - `Z:\主线任务2-天眼计划\行业专题研究\行研报告`
- Exclude:
  - `AI-行业研究`
  - `Fintech-行业研究`
  - `3C-行业报告`
  - `tiktok市场研究`
- Category mapping uses:
  - `Z:\主线任务2-天眼计划\信息可视化\类目匹配表_0602.xlsx`

### Added

- `scripts/build_amazon_us_processed_portal_assets_v0_1.py`
- `docs/amazon_us_processed_portal_assets_v0_1.md`

### Changed

- Regenerated Amazon market, player, and product assets from processed Amazon US bottom tables.
- Market / player / product pages now keep only Amazon US in the market selector.
- Product page wording changed from SKU facts to product opportunities because the active source is processed category/brand/buying-point sheets, not raw SKU product sheets.
- Market page now renders an industry growth line chart from Sheet 4 monthly GMV trends.

### Latest Run

```text
workbooks scanned: 296
read ok: 295
market records: 53
player records: 5000
product opportunity records in web payload: 12000
Amazon US monthly GMV: $40.93B
Amazon US annual GMV: $494.22B
weighted CN GMV share: 33.1%
market monthly trend coverage: 24 months, 2024-05 to 2026-04
```

### Limitation

- Product page is opportunity-level, not SKU-level.
- 3C is excluded in this iteration per source rule; it can be reintroduced later with the same processed-bottom-table口径.
## 2026-06-03 V0.9 Report-Style Amazon US Page Layer

### User Feedback Addressed

- The user pointed out that the data download was present, but curves and analysis viewpoints were not synchronized into the visual pages.
- The page should not feel like a data dump. It should carry the report-delivery style: growth signals, practical analysis, comparison, and explicit answers to:
  - why do this industry;
  - why target this customer;
  - why target this product.

### Changed

- Re-rendered the three main pages with clean report-style UI and copy:
  - `portal/pages/market/index.html`
  - `portal/pages/players/index.html`
  - `portal/pages/products/index.html`
- Added a generation script:
  - `scripts/render_report_style_portal_pages_v0_2.js`
- Added industry playbook assets:
  - `data_assets/curated/research/amazon_us_industry_playbooks_v0_2.json`
  - `portal/data/research/amazon_us_industry_playbooks_v0_2.json`

### Page Scope

- Only Amazon US is exposed.
- The top tag set is:
  - standard L1 industry, default `Beauty`;
  - platform, default `Amazon`;
  - country, default `US / 美国`.
- No time-period tag is shown on the page. Current data remains `2026-04`.

### Page Content Logic

- The pages load:
  - `portal/data/market/amazon_market_facts_monthly.json`
  - `portal/data/players/amazon_players_monthly.json`
  - `portal/data/products/amazon_products_monthly.json`
- The industry growth curve uses monthly trend data from processed bottom-table Sheet 4.
- Insight cards combine:
  - scale;
  - MoM trend;
  - CN GMV share;
  - representative brands;
  - report-style industry playbooks.
- Default `Beauty` playbook explicitly covers K-Beauty / efficacy skincare, beauty devices, IPL hair removal, hair styling tools, oral care replacement cycles, nail care, and content-to-Amazon conversion.
- `Consumer Tech` playbook reuses the prior 3C report logic where applicable, especially power/charging and smart security camera `no subscription + local AI` positioning.

### Limits

- Product page remains opportunity/category-level; it does not claim true SKU facts.
- Live news scraping is not yet wired into the asset build. For industries not covered by prior reports, the current playbook is analyst judgment plus governed bottom-table evidence.

### Validation

```text
scripts/validate_portal_pages_v0_1.js
portal/pages/market/index.html: inline_js_ok
portal/pages/players/index.html: inline_js_ok
portal/pages/products/index.html: inline_js_ok

HTTP 200:
/pages/market/
/pages/players/
/pages/products/
```

## 2026-06-03 V1.0 Lead Import And Manual Category Normalization

### User Feedback Addressed

- The previous page copy was still too generic and generated-sounding.
- Beauty needed to explicitly discuss beauty/cosmetics, not only beauty devices.
- Category labels needed manual review:
  - `Consumer Electronics` and `Consumer Tech` are one system-level industry.
  - Beauty subcategories such as `护肤与个护`, `个人护理`, and `皮肤护理` should not be treated as unrelated markets.
  - `美妆个护综合` needed explanation; it is now treated as oral care based on raw category and brand evidence.
- Player page needed to foreground Chinese players, not Apple/HP style incumbents.

### Added

- `scripts/build_lead_events_from_research_workbooks_v0_2.py`
- `portal/assets/report_pages_v0_2.js`
- Updated `portal/data/leads/lead_events.json`
- Updated `data_assets/curated/leads/lead_events.json`

### Lead Sources

```text
Z:\主线任务2-天眼计划\行业专题研究\美妆个护_大区拓客线索_v1.5_TikTok校验版.xlsx
Z:\主线任务2-天眼计划\行业专题研究\行研报告\3C-行业报告\3C-值得做的行业和客户_行研视角.xlsx
```

### Lead Counts

```text
total leads: 85
Beauty: 30
Consumer Tech: 55
other industries: empty by design
default lead page: Beauty / US, 7 leads
```

### Changed

- Re-rendered:
  - `portal/pages/leads/index.html`
  - `portal/pages/market/index.html`
  - `portal/pages/players/index.html`
  - `portal/pages/products/index.html`
- Market/player/product pages now use normalized category labels in the UI.
- Market page shows three L1-level growth signals and L2-level signal blocks.
- Player page sorts by:
  - lead match;
  - Chinese-player flag;
  - GMV.
- Consumer Tech player priority now surfaces examples such as Anker, DJI, Lenovo, Hisense, TCL, aosu, Baseus, Phomemo, TESSAN, Govee.
- Beauty player priority now surfaces examples such as Ulike, beetles Gel Polish, TYMO, COSLUS, modelones, UEOFEN, Oclean/Soocas when lead data is present.

### Validation

```text
scripts/validate_portal_pages_v0_1.js
portal/pages/market/index.html: inline_js_ok
portal/pages/players/index.html: inline_js_ok
portal/pages/products/index.html: inline_js_ok

HTTP 200:
/pages/leads/
/pages/market/
/pages/players/
/pages/products/
/assets/report_pages_v0_2.js

Edge headless:
Beauty market renders normalized L2s: 护肤与个人护理, 口腔护理, 脱毛与剃须, 头发护理/造型, 美甲/手足护理.
Beauty leads default to US and render Laifen, Ulike, TYMO Beauty, JOVS, AMIRO, Oclean, Soocas.
```
## 2026-06-03 v0.3 市场页/线索页重构

- 按用户新原型重构市场页：从图表堆叠改为系统工作台。
  - 顶部：核心观点 + 年 GMV、月销售额、品牌数、中国品牌 GMV 占比、二级行业 KPI。
  - 主区：左侧标准二级行业机会排行表，右侧点击行刷新的类目详情。
  - 详情：类目画像、趋势图、Top 品牌、CN 占比与增长定位。
  - 底部：玩家格局概览、增长信号概览。
- 右上角/顶部口径保持三个 tag/控件：平台 Amazon、国家 美国站、一级行业；不展示时间周期。
- 线索页按手绘原型改为事件运营台，新增 KPI：本周新增线索、A级线索、新品发布、展会活动、招投标、融资动态；新增 Top 5 重点跟进卡、事件类型分布和筛选表格。
- Consumer Tech 口径修正：
  - Consumer Electronics 并入 Consumer Tech。
  - 前端不再展示“消费电子综合”作为行业。
  - 聚合口径按玩家主类目临时拆为办公打印/商用电子、电子阅读器、电视/投影/视听娱乐、智能安防/监控、音频/DJ/K歌。
- 研究内容修正：
  - 大盘洞察改为 4 条行业解释，不写 BD 指引。
  - Beauty 补充彩妆/香水、纯护肤壁垒、设备型个护、美甲/口腔复购逻辑。
  - Consumer Tech 补充电源储能、影像/创作者工具、智能安防、智能穿戴结构分化的外部事实解释。
- 验证：
  - `node scripts/validate_portal_pages_v0_1.js` 已通过。
  - 验证脚本已扩展到 leads 页和外部生成 JS。
  - HTTP 检查 `/pages/market/?l1=Consumer%20Tech` 与 `/pages/leads/` 返回 200。
- 限制：
  - Edge headless 在当前机器出现 GPU process failure，未能稳定输出截图；改用 HTTP、JS 语法校验和数据层抽样验证。
  - “消费电子综合”拆分仍为前端/玩家权重拆分，后续应回到 raw_l2 或 ASIN 层重算。

## 2026-06-03 v0.3.1 三块统一更新

- 市场板块设计：
  - 按“增长情报平台”视觉重构市场页，不再按 BI 报表堆图。
  - 页面结构为左侧导航、顶部筛选、主内容区、右侧详情面板。
  - 内容区占主屏宽度 90% 以上；右侧详情面板固定 500px；顶部指标卡统一 180px 高；详情趋势图 260px；表格行高 48px。
  - 主内容左侧为类目机会排行 + 玩家格局概览 + 增长信号概览；右侧详情包含类目概览、玩家格局、产品机会、增长信号、推荐动作。
  - 保持浅色背景、蓝色主色、12px 圆角、细边框、弱阴影。
- md 业务内容输入：
  - `scripts/render_research_portal_pages_v0_3.js` 现在读取 `C:\Users\wale.chen\Downloads\amazon_us_industry_master_v1.md`。
  - master 文档覆盖一级行业 frame、一级行业洞察、二级行业增长信号、外部补证字段。
  - 抽查已进入前端资产：Consumer Tech “后智能手机时代”、储能结构增量、Beauty 韩国功效护肤、Fashion 品牌化等内容。
- 线索更新：
  - `scripts/build_lead_events_from_research_workbooks_v0_2.py` 新增读取 `tmp_inputs/exhibitions_v2.xlsx`，来自 `Z:\主线任务2-天眼计划\外部数据库\展会_新产品上市资讯\电商\出海展会汇总_v2.0.xlsx`。
  - 展会字段入库：序号、展会名称、时间、地点、行业分类、报名/官网链接，并保留信源平台、优先级、跟进BD、获客目标、潜在客户清单、核查状态等扩展字段。
  - 展会统一作为 `event_type=展会活动`，并按行业分类/展会名称映射到 Beauty、Consumer Tech、Lifestyle、Fashion、Health、FMCG。
  - 线索页表格改为显示 `客户/展会`、`国家/地点`，Top 卡片展示展会地点和时间。
- 运行结果：
  - 线索总数 282，其中展会 197 条。
  - 行业分布：Beauty 31、Consumer Tech 165、Lifestyle 64、FMCG 13、Fashion 5、Health 4。
  - 页面 HTTP：`/pages/market/?l1=Consumer%20Tech` 200，`/pages/leads/` 200。
  - `node scripts/validate_portal_pages_v0_1.js` 全部通过。
## 2026-06-03 Beauty Market Page Rebuild

- Scope kept to `Beauty` only; other L1 industries were not expanded with the new taxonomy.
- `scripts/render_research_portal_pages_v0_3.js` now applies `expandBeautyMarket(expandLegacyMarket(...), playerData)` for Beauty.
- Beauty standard L2 taxonomy now contains 11 industries: 功效面部护肤, 身体/沐浴/除臭, 彩妆/卸妆, 香水/香氛, 口腔护理, 男士剃须/理容, 女性脱毛/IPL, 洗护/头皮/防脱, 造型工具/吹风, 美甲/手足护理, 美容工具/仪器.
- Top card changed from `核心观点` to `核心趋势`, with 3 Beauty-specific short trend bullets.
- Middle market body changed to a compact left opportunity entry table plus a wider right-side main visual detail panel.
- Left table now keeps only rank, L2, annual GMV, MoM, CN GMV share, and Top 3 brands, capped at 10 visible rows.
- Bottom player snapshot now uses `中国玩家机会判断`.
- Bottom growth-signal card is now a placeholder; facts and explanations live in the right detail panel `增长信号` tab.
- Contract validation updated for the new Beauty layout and taxonomy.

Validation:

```powershell
node scripts\render_research_portal_pages_v0_3.js
node scripts\validate_portal_pages_v0_1.js
node scripts\validate_intelligence_portal_contract_v0_1.js
```

Result:

```text
rendered research portal pages v0.3
portal/pages/market/index.html: inline_js_ok
portal/pages/players/index.html: inline_js_ok
portal/pages/products/index.html: inline_js_ok
portal/pages/leads/index.html: inline_js_ok
intelligence portal contract ok
```

Wide-screen QA at 1440x900 confirmed: no horizontal document overflow, table/detail aligned, left table 10 rows, Beauty title `核心趋势`, bottom row inside the first viewport.
