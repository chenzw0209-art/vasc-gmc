# Historical Reuse Notes

## Reuse

Historical report assets are useful for:

- Python data extraction patterns
- pandas aggregation code
- ECharts option patterns
- delayed chart initialization
- static HTML deployment discipline
- JS syntax bug checklist
- category deep-dive Markdown content
- existing processed JSON/CSV intermediates

## Do Not Reuse As-Is

Avoid copying these historical patterns into the new portal:

- giant single-file report HTML
- two-tab report framing
- hardcoded PR lead lists inside Python templates
- hardcoded business rules inside HTML
- market pages that absorb product, player and creative analysis
- broad file names like `report_data.json`

## Historical Bug Checklist

Known issues from old reports:

1. Avoid lookbehind regex in browser JS.
2. Escape Python-to-JS line breaks as `\\n`.
3. Avoid `\'` inside HTML event attributes; use safer event binding or HTML entities.
4. Initialize ECharts only after hidden containers become visible.
5. Keep DOM IDs deterministic and safe for category names with special characters.

