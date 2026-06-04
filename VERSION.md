# Growth Intelligence Portal Version

Current version: v1.0

Release date: 2026-06-04

## v1.0 Scope

This version freezes the first usable industry research portal structure for the Amazon US governed category dataset.

Core scope:

- Portal shell with Weekly, Leads, and Industry Research modules.
- Industry tree navigation based on governed Amazon US L1/L2 category facts.
- Beauty / Facial Skin Care page as the first validated visual template.
- Industry Research page with three fixed tabs:
  - Industry Overview
  - Category Structure
  - Player Landscape
- Eight KPI cards, four productized viewpoint cards, and BI-style card/table/chart components.
- Governed dataset contract validation through `scripts/validate_intelligence_portal_contract_v0_1.js`.

## Data Boundary

v1.0 keeps the data layer governed and avoids browser-side Beauty category expansion.

The market page reads these governed datasets:

- `portal/data/market/amazon_market_facts_monthly.json`
- `portal/data/players/amazon_players_monthly.json`
- `portal/data/products/amazon_products_monthly.json`
- `portal/data/research/beauty_l2_content_enrichment_v0_1.json`

## Visual Boundary

v1.0 establishes the current visual baseline:

- Light grey page background.
- White rounded cards with light borders and subtle shadow.
- Productized compact data tables.
- ECharts-based BI charts.
- No standalone Growth Signal tab.
- No Export / Share / Favorite buttons in the industry research header.
