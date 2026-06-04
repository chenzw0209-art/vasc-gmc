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
const industryJs = read("portal/assets/industry_research_page_v1.js");
const reportJs = read("portal/assets/report_pages_v0_3.js");
const playersHtml = read("portal/pages/players/index.html");
const productsHtml = read("portal/pages/products/index.html");
const market = json("portal/data/market/amazon_market_facts_monthly.json");
const players = json("portal/data/players/amazon_players_monthly.json");
const products = json("portal/data/products/amazon_products_monthly.json");
const enrichment = json("portal/data/research/beauty_l2_content_enrichment_v0_1.json");

const beautyRows = market.records.filter((x) => x.standard_l1 === "Beauty");
const beautyLabels = beautyRows.map((x) => x.standard_l2).sort();
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
assert("Beauty has real monthly trends", beautyRows.every((x) => Object.keys(x.monthly_trend || {}).length >= 20));
assert("players are rebuilt from governed brand rows", players.records.length > 10000 && players.records.every((x) => x.source_quality === "governed_bottom_table"));
assert("products remain governed L3 structure rows", products.records.length > 1000 && products.records.every((x) => x.source_quality === "governed_l3_opportunity"));
assert("enrichment covers governed L2 rows", enrichment.records.length === market.records.length);

assert("market page uses industry research renderer", /industry_research_page_v1\.js/.test(marketHtml));
assert("market page no longer loads legacy report renderer", !/report_pages_v0_3\.js/.test(marketHtml));
assert("market page exposes three portal modules", /app-nav/.test(marketHtml) && !/>玩家</.test(marketHtml) && !/>产品</.test(marketHtml) && !/>创意</.test(marketHtml));
assert("market page has industry tree and research surface", /industry-tree/.test(marketHtml) && /research-main/.test(marketHtml));
assert("market page keeps three research tabs", /行业概览/.test(industryJs) && /玩家格局/.test(industryJs) && /类目结构/.test(industryJs) && !/增长信号/.test(industryJs));
assert("market page removed recommendation/action tab", !/推荐动作|data-tab=\"actions\"|currentTab === \"actions\"/.test(industryJs + marketHtml));
assert("industry renderer does not expand Beauty in browser", !/expandBeautyMarket|classifyBeautyByL3|BEAUTY_L2_ORDER/.test(industryJs + reportJs));
assert("industry renderer reads governed datasets", /amazon_market_facts_monthly\.json/.test(industryJs) && /amazon_players_monthly\.json/.test(industryJs) && /amazon_products_monthly\.json/.test(industryJs));
assert("standalone player/product pages still load shared report JS", /report_pages_v0_3\.js/.test(playersHtml) && /report_pages_v0_3\.js/.test(productsHtml));

if (failures.length) {
  console.error("intelligence portal contract failed:");
  for (const f of failures) console.error(`- ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  process.exit(1);
}

console.log("intelligence portal contract ok");
for (const p of passes) console.log(`- ${p}`);
