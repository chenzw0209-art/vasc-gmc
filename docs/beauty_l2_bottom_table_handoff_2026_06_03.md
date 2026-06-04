# Beauty L2 Bottom Table Handoff - 2026-06-03

These files use the same Beauty L2 classification rules as the market-page rebuild. They are intended for external L2 research enrichment.

## Data Files

- Market summary: data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_market_summary.csv
- Player rows: data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_player_rows.csv
- Product rows: data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_product_rows.csv
- JSON versions: data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_market_summary.json, data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_player_rows.json, data_assets/curated/beauty/l2_bottom_tables_2026_06_03/beauty_l2_product_rows.json

## Source Inputs

- portal/data/market/amazon_market_facts_monthly.json
- portal/data/players/amazon_players_monthly.json
- portal/data/products/amazon_products_monthly.json

## L2 Groups

- 1. 功效面部护肤: 210 player rows, 13 CN rows, top brands: La Roche-Posay, La Roche-Posay, La Roche-Posay, medicube, medicube
- 2. 身体/沐浴/除臭: 149 player rows, 1 CN rows, top brands: CeraVe, CeraVe, CeraVe, Dove, Dove
- 3. 彩妆/卸妆: 44 player rows, 3 CN rows, top brands: L‘Oreal Paris, Clinique, It Cosmetics, MAYBELLINE, tarte
- 4. 香水/香氛: 6 player rows, 0 CN rows, top brands: Sol de Janeiro, Touchland, Victoria‘s Secret, PHLUR, Billie Eilish
- 5. 口腔护理: 95 player rows, 5 CN rows, top brands: Oral-B, Oral-B, Oral-B, Philips Sonicare, Philips Sonicare
- 6. 男士剃须/理容: 99 player rows, 7 CN rows, top brands: Norelco, Braun, Gillette, Norelco, Norelco
- 7. 女性脱毛/IPL: 1 player rows, 0 CN rows, top brands: Tweezerman
- 8. 洗护/头皮/防脱: 59 player rows, 0 CN rows, top brands: Nutrafol, REDKEN, COLOR WOW, Moroccanoil, Olaplex
- 9. 造型工具/吹风: 19 player rows, 2 CN rows, top brands: Dyson, Shark, TYMO, wavytalk, Conair
- 10. 美甲/手足护理: 19 player rows, 12 CN rows, top brands: beetles Gel Polish, modelones, beetles Gel Polish, MelodySusie, OPI
- 11. 美容工具/仪器: 16 player rows, 1 CN rows, top brands: grace & stella, MR.SIGA, Good Molecules, Good Molecules, Dr.Althea

## Research Rule

Use these bottom tables as the factual input. Do not treat growth_reason, signal_keyword, or action_hint as final research conclusions.