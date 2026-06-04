# Beauty Market Rebuild Todo - 2026-06-03

## 0. 当前目标

先只重构 `Beauty` 行业的市场页。不要一次性铺开 7 个一级行业。

目标不是 BI 报表，而是 B2B 增长情报中台：用户首屏要能判断：

- 为什么 Beauty 这个行业值得做；
- 为什么某些细分行业更值得下钻；
- 中国玩家在这些结构里到底有没有可打的优势；
- 哪些趋势是已被数据验证，哪些还需要 PR、新闻、展会、Google Trends 继续补证。

当前项目路径：

```text
C:\Users\wale.chen\Documents\Codex\2026-06-02\z-2\outputs\growth-intelligence-portal
```

核心业务输入：

```text
C:\Users\wale.chen\Downloads\amazon_us_industry_master_v1.md
```

目标页面：

```text
http://127.0.0.1:8787/pages/market/?l1=Beauty
```

主要代码入口：

```text
scripts/render_research_portal_pages_v0_3.js
portal/assets/report_pages_v0_3.js
portal/pages/market/index.html
portal/data/market/amazon_market_facts_monthly.json
portal/data/players/amazon_players_monthly.json
```

## 1. 本轮必须先改的方向

### 1.1 顶部核心观点改为核心趋势

页面顶部左上卡片标题从 `核心观点` 改为 `核心趋势`。

只保留 3 条，每条要短，但必须有信息密度。不要小作文，也不要只写数据口径。

Beauty 的 3 条建议先按这个方向落：

1. `K-Beauty 与功效护肤接管内容入口`  
   原因：medicube、ANUA、Beauty of Joseon 等不是简单品牌增长，而是 TikTok/Instagram 内容教育、成分功效验证、Amazon 评价闭环共同降低了用户决策成本。韩国品牌成为变量的后半句必须讲清楚：它们把“护肤功效证据”变成了可被内容平台传播的消费理由。

2. `设备型个护把美妆消费电子化`  
   原因：IPL 脱毛、美容仪、吹风/造型、声波牙刷/水牙线等细分更容易用参数、前后对比、测评视频、价格带做差异。这里是中国供应链与内容营销更容易结合的区域。

3. `耗材与复购细分分化中国机会`  
   原因：美甲、口腔耗材、头发护理、香氛等不是同一种机会。美甲中国品牌强，口腔和造型工具有设备/耗材联动机会；纯功效护肤和香水更依赖品牌心智、功效背书和审美叙事，中国品牌短期不宜被粗暴乐观化。

### 1.2 KPI 卡片趋势图要有真实感

年GMV、月销售额、品牌数、中国品牌GMV占比、二级行业这些卡片目前右下角 sparkline 太弱，像装饰。

改法：

- 使用当前筛选下的 `monthly_trend` 聚合生成真实趋势线；
- 同一行 KPI 卡片高度固定，但内部内容要合理排布；
- 趋势线至少占卡片底部 36-44px，不要挤成一条小折线；
- 卡片里只放一个主要数字 + 一个短解释 + 趋势线，不要塞长文本。

注意：固定框是可取的，但框内内容不能被挤占。数字、解释、趋势线必须按垂直节奏分配。

### 1.3 类目机会排行改成左侧入口

`类目机会排行` 不再占整行大宽表，而是只占中部左半边，类似行业导航。

要求：

- 最多展示 10 行；
- 行高可以降低到 38-42px，确保首屏容纳；
- 表格字段精简，建议：
  - 排名
  - 二级行业
  - 年GMV
  - MoM
  - CN GMV占比
  - TOP 3品牌
- 产品数、品牌数、月销售额等细项放到右侧详情卡，不要全部挤在左表。

### 1.4 中右侧详情卡变成主视觉区域

中部右侧不是附属小面板，而是市场页的主视觉。用户点击左侧二级行业后，这里必须承载大部分解释。

建议布局：

- 中部区域使用两列 grid：

```css
.market-body {
  display: grid;
  grid-template-columns: minmax(420px, 0.88fr) minmax(640px, 1.12fr);
  gap: 16px;
  min-height: 0;
}
```

- 右侧详情卡固定在中部行内，高度与左表一致，内部滚动：

```css
.detail-panel {
  height: 100%;
  overflow-y: auto;
}
```

- 右侧详情卡顶部要有：
  - 二级行业名；
  - 3-5 个标签，例如 `内容驱动`、`设备型`、`复购耗材`、`高CN渗透`、`品牌壁垒高`；
  - 核心指标卡：年GMV、月GMV、MoM、CN占比、Top品牌数/中国品牌数；
  - 近 24 个月趋势图；
  - 行业解释、待补证、玩家/产品/信号 tab。

## 2. Beauty 二级行业重拆规则

现状 Beauty 只有约 6-8 个粗类，`护肤与个护` 被合并得过大，已经不适合情报页。

原则：

- 年GMV >= `$0.5B` 的可独立拆分；
- 低于 `$0.5B` 的细碎类目可以合并到相邻逻辑类；
- 拆分依据优先用处理后 US 底表中的 raw L2/L3、玩家主类目、品牌分布；
- 不要为了凑数硬拆，但 Beauty 至少应有 10 个标准二级行业。

建议 Beauty 标准二级行业：

1. `功效面部护肤`  
   包括 face skincare、serum、cream、acne、sun care、eye care 等。代表：medicube、ANUA、Beauty of Joseon、La Roche-Posay、CeraVe、EltaMD。

2. `身体/沐浴/除臭`  
   包括 body care、bath、deodorant、body scrub、body lotion 等。代表：Dove、Native、NIVEA 等。

3. `彩妆/卸妆`  
   包括 face makeup、lip makeup、eye makeup、makeup remover。注意它不是 Beauty 最大增量，但要从护肤里拆出来。

4. `香水/香氛`  
   包括 fragrance、fragrance sets、hair fragrance。代表：Lattafa、Armaf、Dossier、Sol de Janeiro。

5. `口腔护理`  
   包括 toothbrush、toothpaste、floss、mouthwash、whitening、water flosser、orthodontic care。代表：Philips Sonicare、Oral-B、Crest、Waterpik、COSLUS、Oclean。

6. `男士剃须/理容`  
   包括 men shaving、razor、trimmer、barber tools。代表：Norelco、Gillette、Braun、Wahl。

7. `女性脱毛/IPL`  
   包括 women hair removal、IPL、epilator、waxing。代表：Ulike、Braun、JOVS、Gillette Venus。

8. `洗护/头皮/防脱`  
   包括 shampoo、conditioner、hair loss、scalp care、hair oil/mask。代表：REDKEN、Nizoral、Nutrafol、OUAI。

9. `造型工具/吹风`  
   包括 hair dryer、straightener、curling iron、hot air brush。代表：Dyson、Shark、TYMO、Laifen、Wavytalk。

10. `美甲/手足护理`  
   包括 nail gel、polish、nail tools、foot/hand care。代表：beetles、modelones、MelodySusie、OPI、COSLUS。

11. `美容工具/仪器`  
   包括 LED mask、microcurrent、skin care tools、salon/spa equipment、massage/beauty devices。代表：medicube AGE-R、FOREO、NuFACE、AMIRO、RENPHO。

可选合并：

- 如果 `婴儿/敏感护理` 在当前底表年GMV不足 `$0.5B`，先并入 `身体/沐浴/除臭` 或 `功效面部护肤`，不要单独展示。
- 如果 `沙龙设备` 不足 `$0.5B`，并入 `美容工具/仪器`。

## 3. 玩家格局概览改法

底部左侧保留 `玩家格局概览`，但不要再写空泛“结构判断”。

模块拆成：

1. `TOP品牌`  
   排序不只按 GMV。建议用 `GMV + 增速` 归一热度值：
   - `hot_score = log(estimated_gmv + 1) * 0.7 + normalized_growth * 0.3`
   - 若玩家数据没有明确增速，先用二级行业 MoM 作为代理。

2. `中国品牌TOP5`  
   同样使用 GMV + 增速归一热度值。Beauty 里重点关注：beetles、modelones、TYMO、Ulike、COSLUS、Oclean、Laifen、Wavytalk 等。

3. `中国玩家机会判断`  
   这里不是写“中国品牌占比 X%”就结束，而是解释中国玩家在该结构下能不能打：

   建议初版文案：

   ```text
   Beauty 的中国机会不在纯护肤头部，而在可参数化、教程化、耗材化的细分：美甲、造型工具、IPL/脱毛、口腔护理和部分美容仪。beetles/modelones 证明美甲供给与内容运营强；TYMO/Ulike/COSLUS/Oclean 说明设备和耗材更容易用测评、参数、价格带建立差异。纯功效护肤和香水 CN 占比低，品牌心智、功效证据和审美叙事壁垒更高。
   ```

如果自动生成困难，输出一个中间 MD 给内容同事补：

```text
docs/beauty_player_data_for_content_review_2026_06_03.md
```

内容包括：

- 海外品牌 / 中国品牌；
- GMV；
- 所属二级行业；
- MoM 或代理增速；
- CN flag；
- 备注：品牌优势 / 供应链优势 / 内容驱动 / 待补证。

## 4. 底部右侧增长信号概览

底部右侧 `增长信号概览` 暂时留空做占位，不要再重复增长信号。

原因：增长信号应该归入中右侧详情卡的 `增长信号` Tab，而不是页面底部再做一块重复列表。

占位建议：

```text
增长信号工作台
点击左侧二级行业后，在右侧详情卡的“增长信号”Tab 查看事实型信号、行业解释和待补证。
```

视觉上保留卡片，但内容少、干净，不要出现列表溢出或被底部裁切。

## 5. 右侧详情 Tab 信息归位

Tab 必须严格归位，不要混写。

### 类目概览

只放：

- GMV；
- 月销售额；
- MoM；
- CN GMV占比；
- 品牌数/中国品牌数；
- 近 24 个月趋势图；
- 3-5 个类目标签。

### 玩家格局

只放：

- Top 品牌；
- 中国品牌；
- 竞争结构；
- 中国玩家是否有品牌/供应链/内容能力优势。

### 产品机会

只放：

- 高潜品类；
- 产品方向；
- 服务切入点；
- 不要冒充真实 SKU。

### 增长信号

只放事实型信号卡片，格式：

```text
信号类型 | 品牌/品类 | 信号内容 | 指标 | 状态
```

示例：

```text
品类增长 | 女性脱毛/IPL | 设备型个护仍有内容测评驱动 | MoM / CN占比 | 已验证
中国品牌 | Ulike / JOVS | 中国品牌在 IPL 脱毛具备可见度 | CN品牌GMV | 已验证
场景需求 | 家庭美容 | 院线美容替代和居家护理趋势需外部证据 | 待补证 | 待补证
内容趋势 | TikTok Beauty | 内容种草对 Amazon 转化需追踪 | 待补证 | 待补证
```

### 推荐动作

只放：

- BD 动作按钮；
- 下一步跟进建议；
- 补证任务；
- 不要塞行业解释。

## 6. 固定框内信息呈现规范

用户明确认可“框固定”，但框里的信息必须合理呈现。避免截图中那种内容被底部裁切、列表挤出卡片的问题。

实现原则：

- 固定高度卡片内部使用 `display: grid` 或 `display: flex; flex-direction: column;`；
- 标题区固定高度；
- 主体区 `min-height: 0`；
- 长列表区域使用内部滚动；
- 小卡片不要超过 2 行文字；
- 需要长解释时进入右侧详情 Tab，不塞进底部卡片；
- 表格最多 10 行，超出滚动或分页，不撑破页面；
- 所有卡片同一行必须同高、同顶、同底；
- 右侧详情卡可内部滚动，但不能撑破中部 grid；
- 不要用绝对定位堆叠。

推荐 CSS 模式：

```css
.fixed-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.fixed-card__body {
  min-height: 0;
  overflow: auto;
}

.compact-list {
  display: grid;
  gap: 6px;
}

.compact-row {
  min-height: 34px;
  overflow: hidden;
}
```

## 7. 视觉验收标准

在 1440px、1920px 宽屏下都要自查：

- 页面不是报表感，而是现代 SaaS 情报平台；
- 主内容区宽度利用率高，内容区占屏幕宽度 90% 以上；
- 顶部核心趋势和 KPI 卡片同高、同顶、同底；
- 中部左表与右侧详情卡同高、同顶、同底；
- 类目排行只占左半边；
- 右侧详情卡是主视觉，不再是窄小附栏；
- 底部玩家格局与增长信号占位卡同高对齐；
- 无明显底部大片空白；
- 无文字裁切、错位、重叠；
- 固定框内若内容过多，内部滚动或精简，不允许挤爆。

## 8. 推荐执行步骤

1. 在 `scripts/render_research_portal_pages_v0_3.js` 中新增 Beauty 二级行业拆分函数，例如：

```text
classifyBeautyByL3()
expandBeautyMarket()
```

2. 在 `init()` 中把：

```text
marketData = expandLegacyMarket(...)
```

改为：

```text
marketData = expandBeautyMarket(expandLegacyMarket(...), playerData)
```

3. Beauty 特殊化 `coreBullets()` 或新增 `beautyCoreTrends()`，让页面显示 `核心趋势`。

4. 改 `renderKpis()`，让 sparkline 使用当前筛选的聚合 `monthly_trend`。

5. 改 CSS：

- `.market-body` 改成左窄右宽；
- 表格行高降到 38-42px；
- `.detail-panel` 内部滚动；
- 底部卡片主体内部滚动或占位。

6. 改 `renderMarketTable()`，左表只保留导航字段。

7. 改 `renderMarketTabContent()`，让右侧详情按 Tab 归位。

8. 改 `renderPlayerSnapshot()`，把 `结构判断` 改成 `中国玩家机会判断`。

9. 改 `renderMarketSignals()`，底部右侧只留占位，不再渲染信号列表。

10. 生成页面并验证。

## 9. 验证命令

每轮修改后运行：

```powershell
node scripts/render_research_portal_pages_v0_3.js
node scripts/validate_portal_pages_v0_1.js
node scripts/validate_intelligence_portal_contract_v0_1.js
```

如果 contract 脚本仍按旧版 `380px` 右侧详情栏校验，需要同步更新 contract，让它接受 Beauty 新版“右侧详情为主视觉”的布局规则。

建议再用浏览器打开：

```text
http://127.0.0.1:8787/pages/market/?l1=Beauty
```

检查：

- 首屏是否出现底部留白；
- 右侧详情是否被挤压；
- 底部卡片是否裁切文字；
- 切换右侧 Tab 是否交互正常；
- 左侧点击不报错；
- Beauty 标准二级行业是否至少 10 个；
- `护肤与个护` 是否已经拆细。

## 10. 需要记录回 docs 的内容

完成后更新：

```text
docs/iteration_log.md
docs/nightly_self_check_2026_06_03.md
```

新增或更新：

```text
docs/beauty_market_rebuild_result_2026_06_03.md
```

记录：

- Beauty 二级行业拆分规则；
- 使用的数据路径；
- 使用的业务内容路径；
- 页面布局变动；
- 验证命令与结果；
- 剩余限制，例如：
  - Beauty 拆分仍是基于处理后底表和玩家主类目推断，不等于 SKU 全量索引；
  - 增长事件仍需 PR/新闻/展会继续补证；
  - 产品页仍不能冒充真实 SKU；
  - 其他 6 个一级行业暂未按 Beauty 新标准重构。

