const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const passes = [];
const failures = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function json(rel) {
  return JSON.parse(read(rel));
}

function assert(name, ok, detail = "") {
  if (ok) passes.push(name);
  else failures.push({ name, detail });
}

const marketHtml = read("portal/pages/market/index.html");
const weeklyHtml = read("portal/index.html");
const weeklyJs = read("portal/assets/weekly_report_v1.js");
const industryJs = read("portal/assets/industry_research_page_v1.js");
const reportJs = read("portal/assets/report_pages_v0_3.js");
const playersHtml = read("portal/pages/players/index.html");
const productsHtml = read("portal/pages/products/index.html");
const market = json("portal/data/market/amazon_market_facts_monthly.json");
const players = json("portal/data/players/amazon_players_monthly.json");
const products = json("portal/data/products/amazon_products_monthly.json");
const enrichment = json("portal/data/research/beauty_l2_content_enrichment_v0_1.json");
const ecommerceDictionary = json("portal/data/dictionary/industry_dictionary_ecommerce.json");
const ecommerceMapping = json("portal/data/dictionary/category_mapping_ecommerce.json");
const usAmazonCanonicalSources = json("portal/data/sources/us_amazon_canonical_sources.json");
const weeklyW25 = json("portal/data/weekly/weekly_leads_content_2026_W25.json");
const weeklyW26 = json("portal/data/weekly/weekly_leads_content_2026_W26.json");
const weeklyW27 = json("portal/data/weekly/weekly_leads_content_2026_W27.json");
const weeklyW28 = json("portal/data/weekly/weekly_leads_content_2026_W28.json");
const weeklyW29 = json("portal/data/weekly/weekly_leads_content_2026_W29.json");
const weeklyW30 = json("portal/data/weekly/weekly_leads_content_2026_W30.json");
const weeklyW31 = json("portal/data/weekly/weekly_leads_content_2026_W31.json");
const weeklyW32 = json("portal/data/weekly/weekly_leads_content_2026_W32.json");
const weeklyW33 = json("portal/data/weekly/weekly_leads_content_2026_W33.json");

const beautyRows = market.records.filter((x) => x.standard_l1 === "Beauty");
const beautyLabels = beautyRows.map((x) => x.standard_l2).sort();
const fashionDictionaryRows = ecommerceDictionary.filter((x) => x.standard_l1 === "Fashion");
const fashionMappingRows = ecommerceMapping.filter((x) => x.standard_l1 === "Fashion");
const fashionCanonicalSources = (usAmazonCanonicalSources.canonical_sources || []).filter((x) => x.standard_l1 === "Fashion");
const ecommerceL2ByL1 = new Map();
const agL1 = new Set(["Gaming", "AI应用", "Fintech", "工具", "平台", "泛娱乐"]);
for (const row of ecommerceDictionary) {
  if (!ecommerceL2ByL1.has(row.standard_l1)) ecommerceL2ByL1.set(row.standard_l1, new Set());
  ecommerceL2ByL1.get(row.standard_l1).add(row.standard_l2);
}
function weeklyTaxonomyErrors(records, options = {}) {
  const errors = [];
  for (const row of records) {
    if (row.titan_category === "AG") {
      if (!options.allowLegacyAgL1 && !agL1.has(row.standard_l1)) errors.push(`${row.candidate_id}: AG一级行业不在字典：${row.standard_l1}`);
      if (row.standard_l2 !== "-") errors.push(`${row.candidate_id}: AG二级行业应为-，实际为${row.standard_l2}`);
      continue;
    }
    if (row.titan_category !== "EC") continue;
    const valid = ecommerceL2ByL1.get(row.standard_l1);
    if (!valid) errors.push(`${row.candidate_id}: EC一级行业不在字典：${row.standard_l1}`);
    else if (!valid.has(row.standard_l2)) errors.push(`${row.candidate_id}: EC二级行业不在字典：${row.standard_l1}/${row.standard_l2}`);
  }
  return errors;
}
function assertWeeklySnapshot(week, data, options = {}) {
  const minCustomers = options.minCustomers;
  const customers = data.weekly_module_content.focus_customers || [];
  const taxonomyErrors = weeklyTaxonomyErrors(customers);
  assert(`${week} weekly leads obey governed industry dictionary`, taxonomyErrors.length === 0, taxonomyErrors.join("; "));
  if (Number.isFinite(minCustomers)) assert(`${week} weekly snapshot keeps at least ${minCustomers} customer signals`, customers.length >= minCustomers, `got ${customers.length}`);
  if (Number(week.replace(/\D/g, "")) >= 29) {
    const ownerCounts = new Map();
    customers.forEach((row) => {
      const owner = String(row.owner_company_brand || "").trim();
      if (owner) ownerCounts.set(owner, (ownerCounts.get(owner) || 0) + 1);
    });
    const duplicateOwners = [...ownerCounts.entries()].filter(([, count]) => count > 1);
    assert(`${week} weekly snapshot keeps one row per customer`, duplicateOwners.length === 0, duplicateOwners.map(([owner, count]) => `${owner}×${count}`).join("; "));
    if (Number.isFinite(minCustomers)) assert(`${week} weekly snapshot keeps at least ${minCustomers} unique customers`, ownerCounts.size >= minCustomers, `got ${ownerCounts.size}`);
  }

  const highlights = (data.weekly_module_content.top_summary || "").split("\n").filter(Boolean);
  const namedEntities = [
    ...customers.map((x) => x.owner_company_brand),
    ...(data.exhibition_window_content || []).map((x) => x.event_name),
    ...(data.tender_opportunity_content || []).flatMap((x) => [x.publisher, x.project_name]),
  ].filter(Boolean);
  assert(`${week} weekly summary keeps exactly three highlights`, highlights.length === 3, highlights.join(" | "));
  assert(`${week} highlights each name a company or exhibition`, highlights.every((line) => namedEntities.some((name) => line.includes(name))), highlights.join(" | "));
  assert(`${week} highlights state an event and attention reason`, highlights.every((line) => line.includes("：") && line.includes("；")), highlights.join(" | "));
  assert(`${week} highlights are not module-count report recaps`, highlights.every((line) => !/新增\d+条|客户侧|展会侧|招投标侧|行业分布/.test(line)), highlights.join(" | "));
}
const expectedBeauty = [
  "剃须脱毛产品",
  "口腔护理",
  "头发护理",
  "彩妆",
  "指甲与足部护理",
  "美容工具与配件",
  "身体与防晒护理",
  "除臭与个护小品",
  "面部护理",
  "香水",
].sort();

assert("market data parses and uses governed summary", /governed standard L2 bottom tables/.test(market.summary.scope));
assert("market records are governed US Amazon L2 rows", market.records.length === 72, `got ${market.records.length}`);
assert("Beauty has ten governed standard L2 labels", JSON.stringify(beautyLabels) === JSON.stringify(expectedBeauty), beautyLabels.join(", "));
assert("Beauty rows carry governed source workbook paths", beautyRows.every((x) => /聚合底表/.test(x.source_file || "")));
assert("ecommerce dictionary keeps Fashion as independent L1", fashionDictionaryRows.length >= 6 && fashionDictionaryRows.every((x) => x.standard_l1 === "Fashion"), `got ${fashionDictionaryRows.length}`);
assert("ecommerce mapping keeps Fashion rows separate", fashionMappingRows.length > 300, `got ${fashionMappingRows.length}`);
assert("US Amazon canonical sources keep Fashion separate", fashionCanonicalSources.length >= 10, `got ${fashionCanonicalSources.length}`);
const weeklyW25TaxonomyErrors = weeklyTaxonomyErrors(weeklyW25.weekly_module_content.focus_customers || [], { allowLegacyAgL1: true });
assert("W25 weekly leads obey EC dictionary and AG secondary industry rule", weeklyW25TaxonomyErrors.length === 0, weeklyW25TaxonomyErrors.join("; "));
assertWeeklySnapshot("W26", weeklyW26, { minCustomers: 50 });
assertWeeklySnapshot("W27", weeklyW27, { minCustomers: 50 });
assertWeeklySnapshot("W28", weeklyW28, { minCustomers: 50 });
assertWeeklySnapshot("W29", weeklyW29, { minCustomers: 50 });
assertWeeklySnapshot("W30", weeklyW30);
assertWeeklySnapshot("W31", weeklyW31);
assertWeeklySnapshot("W32", weeklyW32);
assertWeeklySnapshot("W33", weeklyW33);
assert("weekly page registers W32/W33 JSON files", /weekly_leads_content_2026_W32\.json/.test(weeklyJs) && /weekly_leads_content_2026_W33\.json/.test(weeklyJs));
assert("weekly page defaults to W33", /activeWeek:\s*"W33"/.test(weeklyJs) && /\bW33:\s*\{/.test(weeklyJs) && /value="W33" selected/.test(weeklyHtml));
assert("weekly selector preserves historical W24-W27 options", /value="W24"/.test(weeklyHtml) && /value="W25"/.test(weeklyHtml) && /value="W26"/.test(weeklyHtml) && /value="W27"/.test(weeklyHtml));
for (const rel of [
  "portal/data/weekly/weekly_leads_content_2026_W24.json",
  "portal/data/weekly/weekly_leads_content_2026_W25.json",
  "portal/data/weekly/weekly_leads_content_2026_W26.json",
  "portal/data/weekly/weekly_leads_content_2026_W27.json",
]) {
  assert(`historical weekly file preserved: ${rel}`, fs.existsSync(path.join(root, rel)));
}
const w28EventDates = (weeklyW28.exhibition_window_content || []).map((x) => new Date(x.date));
assert("W28 exhibition window uses future near-14-day dates", w28EventDates.length > 0 && w28EventDates.every((d) => d >= new Date("2026-07-06") && d <= new Date("2026-07-20")), w28EventDates.map((d) => d.toISOString().slice(0, 10)).join(", "));
assert("W28 tender module includes current valid opportunities", Array.isArray(weeklyW28.tender_opportunity_content) && weeklyW28.tender_opportunity_content.length >= 6, String((weeklyW28.tender_opportunity_content || []).length));
assert("weekly exhibition table does not render subjective window value", !/展会窗口价值/.test(weeklyJs));
assert("Beauty has real monthly trends", beautyRows.every((x) => Object.keys(x.monthly_trend || {}).length >= 20));
assert("players are rebuilt from governed brand rows", players.records.length > 10000 && players.records.every((x) => x.source_quality === "governed_bottom_table"));
assert("products remain governed L3 structure rows", products.records.length > 1000 && products.records.every((x) => x.source_quality === "governed_l3_opportunity"));
assert("enrichment covers governed L2 rows", enrichment.records.length === market.records.length);

assert("market page uses industry research renderer", /industry_research_page_v1\.js/.test(marketHtml));
assert("market page no longer loads legacy report renderer", !/report_pages_v0_3\.js/.test(marketHtml));
assert("market page exposes only weekly and industry research entries", /app-nav/.test(marketHtml) && />周报</.test(marketHtml) && />行业研究</.test(marketHtml) && !/>线索</.test(marketHtml) && !/>玩家</.test(marketHtml) && !/>产品</.test(marketHtml) && !/>创意</.test(marketHtml));
assert("market page has industry tree and research surface", /industry-tree/.test(marketHtml) && /research-main/.test(marketHtml));
assert("market page keeps three research tabs", /行业概览/.test(industryJs) && /玩家格局/.test(industryJs) && /类目结构/.test(industryJs) && !/增长信号/.test(industryJs));
assert("market page removed recommendation/action tab", !/推荐动作|data-tab=\"actions\"|currentTab === \"actions\"/.test(industryJs + marketHtml));
assert("industry renderer does not expand Beauty in browser", !/expandBeautyMarket|classifyBeautyByL3|BEAUTY_L2_ORDER/.test(industryJs + reportJs));
assert("industry renderer reads governed datasets and industry dictionary", /amazon_market_facts_monthly\.json/.test(industryJs) && /amazon_players_monthly\.json/.test(industryJs) && /amazon_products_monthly\.json/.test(industryJs) && /industry_dictionary_ecommerce\.json/.test(industryJs));
assert("standalone player/product pages remain historical assets", /report_pages_v0_3\.js/.test(playersHtml) && /report_pages_v0_3\.js/.test(productsHtml));

if (failures.length) {
  console.error("intelligence portal contract failed:");
  for (const f of failures) console.error(`- ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  process.exit(1);
}

console.log("intelligence portal contract ok");
for (const p of passes) console.log(`- ${p}`);
