# Growth Intelligence Portal

泛 VASC 增长情报门户工程。

本工程从 0 搭建，不直接继承历史行业报告代码。历史报告只作为可复用资产来源，用于缩小开发量，例如静态 HTML 生成经验、ECharts 图表模式、Python 数据聚合脚本、JS 避坑记录和历史中间数据。

## Product Positioning

本门户不是行业报告中心、知识库或静态数据看板。

它是一个增长情报系统：通过统一信源、统一标签、统一字段和统一页面结构，持续回答业务最关心的六个问题：

| Module | Question |
|---|---|
| Weekly | 本周发生了什么 |
| Leads | 什么时候打客户 |
| Market | 为什么做这个行业 |
| Players | 为什么打这个客户 |
| Products | 为什么打这个产品 |
| Creatives | 为什么这样打 |

## Current Scope

第一阶段只做电商体系 V1，覆盖 Amazon、Shopee、TikTok Shop 的电商类目、市场、玩家、产品和创意点分析。

AI、Gaming、Finance 等应用体系不进入当前电商体系。它们后续应作为独立应用增长情报体系建设。

## Directory

```text
growth-intelligence-portal/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── data_contract.md
│   ├── development_workflow.md
│   ├── iteration_log.md
│   ├── naming_conventions.md
│   ├── reuse_notes.md
│   └── source_registry.md
├── scripts/
│   ├── build_dictionaries_v0_1.py
│   └── generate_leads_v0_1.py
└── portal/
    ├── index.html
    ├── assets/
    │   ├── common.js
    │   └── portal.css
    ├── data/
    │   ├── dictionary/
    │   ├── sources/
    │   ├── leads/
    │   ├── amazon/
    │   ├── shopee/
    │   └── tiktok_shop/
    └── pages/
        └── leads/
            └── index.html
```

## Quick Start

Run from this project root:

```powershell
python scripts/generate_leads_v0_1.py
python -m http.server 8787 --directory portal
```

Then open:

```text
http://localhost:8787/
http://localhost:8787/pages/leads/
```

## Data Naming Rule

Use explicit source names. Avoid broad names such as `products.json`.

Examples:

```text
amazon_products_monthly.json
amazon_market_monthly.json
shopee_stores_monthly.json
tiktok_shop_creatives_weekly.json
lead_events.json
category_mapping_ecommerce.json
```

See [docs/naming_conventions.md](docs/naming_conventions.md).

## First Milestone

MVP focuses on Leads Center:

```text
portal/data/leads/lead_events.json
portal/pages/leads/index.html
scripts/generate_leads_v0_1.py
```

The Leads module answers: "什么时候打客户？"

