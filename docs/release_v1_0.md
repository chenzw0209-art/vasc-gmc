# Release Notes: v1.0

Date: 2026-06-04

## Summary

v1.0 confirms the first stable version of the Growth Intelligence Portal visual web project.

The key decision in this release is to stop treating the market page as a single overloaded report surface. The Industry Research page now uses three focused tabs:

- Industry Overview
- Category Structure
- Player Landscape

Growth signals are no longer an independent tab. They are embedded into the relevant market, category, and player modules.

## Major Changes

- Rebuilt the Beauty / Facial Skin Care industry research page into the v1.0 visual template.
- Replaced the previous all-in-one dashboard layout with three tab-specific surfaces.
- Added productized viewpoint card generation rules to avoid raw deep-analysis text, Markdown symbols, source-debug text, `$0`, `NaN`, `undefined`, and similar invalid display values.
- Kept eight KPI cards at the top of the page.
- Preserved the governed Amazon US data reading path.
- Updated the validation contract to require three research tabs instead of four.

## Validation

Run from the project root:

```powershell
node -c portal/assets/industry_research_page_v1.js
node scripts/validate_intelligence_portal_contract_v0_1.js
```

Expected result:

```text
intelligence portal contract ok
```

## Local Preview

Run:

```powershell
python -m http.server 8787 --directory portal
```

Open:

```text
http://localhost:8787/pages/market/?tab=overview
http://localhost:8787/pages/market/?tab=structure
http://localhost:8787/pages/market/?tab=players
```
