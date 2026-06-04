const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "data_assets", "curated", "beauty", "l2_bottom_tables_2026_06_03");

const BEAUTY_L2_ORDER = [
  "功效面部护肤",
  "身体/沐浴/除臭",
  "彩妆/卸妆",
  "香水/香氛",
  "口腔护理",
  "男士剃须/理容",
  "女性脱毛/IPL",
  "洗护/头皮/防脱",
  "造型工具/吹风",
  "美甲/手足护理",
  "美容工具/仪器"
];

const SLUGS = {
  "功效面部护肤": "01_effective_face_skincare",
  "身体/沐浴/除臭": "02_body_bath_deodorant",
  "彩妆/卸妆": "03_makeup_makeup_remover",
  "香水/香氛": "04_fragrance",
  "口腔护理": "05_oral_care",
  "男士剃须/理容": "06_mens_shaving_grooming",
  "女性脱毛/IPL": "07_womens_hair_removal_ipl",
  "洗护/头皮/防脱": "08_hair_scalp_anti_loss",
  "造型工具/吹风": "09_styling_tools_hair_dryer",
  "美甲/手足护理": "10_nail_hand_foot_care",
  "美容工具/仪器": "11_beauty_tools_devices"
};

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function mkdir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(rel, text) {
  const full = path.join(root, rel);
  mkdir(path.dirname(full));
  fs.writeFileSync(full, text, "utf8");
}

function classifyBeautyByL3(input) {
  const s = String(input || "").toLowerCase();
  if (/tooth|oral|dental|floss|water flosser|mouth|牙|口腔|牙线|冲牙|牙刷|漱口/.test(s)) return "口腔护理";
  if (/shav|razor|trimmer|beard|groom|剃须|理容|胡须|男士/.test(s)) return "男士剃须/理容";
  if (/ipl|hair removal|epilator|脱毛|光子/.test(s)) return "女性脱毛/IPL";
  if (/nail|gel polish|manicure|pedicure|uv lamp|美甲|甲油|手足/.test(s)) return "美甲/手足护理";
  if (/dryer|styler|curl|straighten|flat iron|blow|造型|吹风|卷发|直发/.test(s)) return "造型工具/吹风";
  if (/shampoo|conditioner|scalp|hair loss|hair care|头皮|防脱|洗发|护发/.test(s)) return "洗护/头皮/防脱";
  if (/fragrance|perfume|cologne|aroma|scent|香水|香氛|香薰/.test(s)) return "香水/香氛";
  if (/makeup|cosmetic|lip|mascara|foundation|concealer|eyeshadow|blush|卸妆|彩妆|口红|粉底|睫毛|眼影/.test(s)) return "彩妆/卸妆";
  if (/body|bath|deodor|soap|lotion|wash|沐浴|身体|除臭|止汗|润肤/.test(s)) return "身体/沐浴/除臭";
  if (/device|facial tool|microcurrent|led mask|steamer|美容仪|洁面仪|射频|面罩|工具|仪器/.test(s)) return "美容工具/仪器";
  return "功效面部护肤";
}

function csvValue(value) {
  if (Array.isArray(value)) value = value.join(" | ");
  if (value && typeof value === "object") value = JSON.stringify(value);
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((col) => csvValue(row[col])).join(","))
  ].join("\n");
}

function summarizeMarket(beautyRows, players) {
  const totalMonthly = beautyRows.reduce((s, x) => s + Number(x.monthly_gmv || 0), 0);
  const totalAnnual = beautyRows.reduce((s, x) => s + Number(x.gmv || 0), 0);
  const totalPrev = beautyRows.reduce((s, x) => s + Number(x.prev_monthly_gmv || 0), 0);
  const allTrend = {};
  beautyRows.forEach((row) => {
    Object.entries(row.monthly_trend || {}).forEach(([month, value]) => {
      allTrend[month] = (allTrend[month] || 0) + Number(value || 0);
    });
  });

  const buckets = Object.fromEntries(BEAUTY_L2_ORDER.map((l2) => [l2, []]));
  players.forEach((player) => {
    const l2 = classifyBeautyByL3([player.standard_l2, player.main_l3, player.brand, player.brand_product_summary].join(" "));
    buckets[l2].push(player);
  });

  const weights = Object.fromEntries(
    BEAUTY_L2_ORDER.map((l2) => [
      l2,
      buckets[l2].reduce((sum, player) => sum + Number(player.estimated_gmv || 0), 0)
    ])
  );
  const minWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0) * 0.012;
  BEAUTY_L2_ORDER.forEach((l2) => {
    if (!weights[l2]) weights[l2] = minWeight;
  });
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0) || 1;

  return BEAUTY_L2_ORDER.map((l2, index) => {
    const bucket = buckets[l2].slice().sort((a, b) => Number(b.estimated_gmv || 0) - Number(a.estimated_gmv || 0));
    const share = weights[l2] / totalWeight;
    const bucketGmv = bucket.reduce((sum, player) => sum + Number(player.estimated_gmv || 0), 0);
    const cnGmv = bucket.filter((player) => player.cn_flag).reduce((sum, player) => sum + Number(player.estimated_gmv || 0), 0);
    const monthlyTrend = {};
    Object.entries(allTrend).forEach(([month, value]) => {
      monthlyTrend[month] = value * share;
    });
    return {
      index: index + 1,
      l1: "Beauty",
      standard_l2: l2,
      classification_rule: "classifyBeautyByL3(standard_l2/main_l3/brand/brand_product_summary)",
      annual_gmv_estimated: totalAnnual * share,
      monthly_gmv_estimated: totalMonthly * share,
      prev_monthly_gmv_estimated: totalPrev * share,
      mom_estimated: totalPrev ? ((totalMonthly * share - totalPrev * share) / (totalPrev * share)) * 100 : 0,
      cn_share_from_player_rows: bucketGmv ? (cnGmv / bucketGmv) * 100 : 0,
      player_row_count: bucket.length,
      cn_player_row_count: bucket.filter((player) => player.cn_flag).length,
      top_brands_from_player_rows: bucket.slice(0, 8).map((player) => player.brand),
      source_market_rows: beautyRows.map((row) => row.standard_l2),
      source_market_raw_l2_values: beautyRows.flatMap((row) => row.raw_l2_values || []),
      monthly_trend: monthlyTrend
    };
  });
}

function main() {
  mkdir(outRoot);
  const marketRows = readJson("portal/data/market/amazon_market_facts_monthly.json").records || [];
  const playerRows = readJson("portal/data/players/amazon_players_monthly.json").records || [];
  const productRows = readJson("portal/data/products/amazon_products_monthly.json").records || [];

  const beautyMarketRows = marketRows.filter((row) => row.standard_l1 === "Beauty");
  const beautyPlayers = playerRows
    .filter((row) => row.standard_l1 === "Beauty")
    .map((row) => ({
      ...row,
      beauty_standard_l2: classifyBeautyByL3([row.standard_l2, row.main_l3, row.brand, row.brand_product_summary].join(" "))
    }));
  const beautyProducts = productRows
    .filter((row) => row.standard_l1 === "Beauty")
    .map((row) => ({
      ...row,
      beauty_standard_l2: classifyBeautyByL3([row.standard_l2, row.standard_l3, row.raw_l2, row.product_name, row.brand].join(" "))
    }));
  const summary = summarizeMarket(beautyMarketRows, beautyPlayers);

  const outRel = "data_assets/curated/beauty/l2_bottom_tables_2026_06_03";
  write(`${outRel}/beauty_l2_market_summary.json`, JSON.stringify({ version: "2026-06-03", records: summary }, null, 2));
  write(`${outRel}/beauty_l2_player_rows.json`, JSON.stringify({ version: "2026-06-03", records: beautyPlayers }, null, 2));
  write(`${outRel}/beauty_l2_product_rows.json`, JSON.stringify({ version: "2026-06-03", records: beautyProducts }, null, 2));

  write(
    `${outRel}/beauty_l2_market_summary.csv`,
    toCsv(summary, [
      "index",
      "standard_l2",
      "classification_rule",
      "annual_gmv_estimated",
      "monthly_gmv_estimated",
      "mom_estimated",
      "cn_share_from_player_rows",
      "player_row_count",
      "cn_player_row_count",
      "top_brands_from_player_rows",
      "source_market_rows",
      "source_market_raw_l2_values"
    ])
  );

  const playerColumns = [
    "beauty_standard_l2",
    "brand",
    "company",
    "nationality",
    "cn_flag",
    "standard_l2",
    "main_l3",
    "estimated_gmv",
    "estimated_monthly_gmv",
    "monthly_sales",
    "listing_count",
    "weighted_price",
    "brand_product_summary",
    "source_file"
  ];
  const productColumns = [
    "beauty_standard_l2",
    "product_name",
    "standard_l2",
    "standard_l3",
    "raw_l2",
    "brand",
    "monthly_gmv_usd",
    "monthly_sales",
    "product_count",
    "brand_count",
    "cn_share",
    "growth_rate",
    "representative_players",
    "source_file"
  ];
  write(`${outRel}/beauty_l2_player_rows.csv`, toCsv(beautyPlayers, playerColumns));
  write(`${outRel}/beauty_l2_product_rows.csv`, toCsv(beautyProducts, productColumns));

  const handoffLines = [
    "# Beauty L2 Bottom Table Handoff - 2026-06-03",
    "",
    "These files use the same Beauty L2 classification rules as the market-page rebuild. They are intended for external L2 research enrichment.",
    "",
    "## Data Files",
    "",
    `- Market summary: ${outRel}/beauty_l2_market_summary.csv`,
    `- Player rows: ${outRel}/beauty_l2_player_rows.csv`,
    `- Product rows: ${outRel}/beauty_l2_product_rows.csv`,
    `- JSON versions: ${outRel}/beauty_l2_market_summary.json, ${outRel}/beauty_l2_player_rows.json, ${outRel}/beauty_l2_product_rows.json`,
    "",
    "## Source Inputs",
    "",
    "- portal/data/market/amazon_market_facts_monthly.json",
    "- portal/data/players/amazon_players_monthly.json",
    "- portal/data/products/amazon_products_monthly.json",
    "",
    "## L2 Groups",
    "",
    ...summary.map((row) => `- ${row.index}. ${row.standard_l2}: ${row.player_row_count} player rows, ${row.cn_player_row_count} CN rows, top brands: ${row.top_brands_from_player_rows.slice(0, 5).join(", ") || "n/a"}`),
    "",
    "## Research Rule",
    "",
    "Use these bottom tables as the factual input. Do not treat growth_reason, signal_keyword, or action_hint as final research conclusions."
  ];
  write("docs/beauty_l2_bottom_table_handoff_2026_06_03.md", handoffLines.join("\n"));

  console.log(`exported Beauty L2 bottom tables to ${path.relative(root, outRoot)}`);
}

main();
