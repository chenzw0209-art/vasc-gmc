const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "deliverables", "Beauty_Market_Page_Standalone_2026_06_03.html");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

function safeScript(text) {
  return String(text).replace(/<\/script/gi, "<\\/script");
}

function main() {
  let html = read("portal/pages/market/index.html");
  const portalCss = read("portal/assets/portal.css");
  const reportJs = read("portal/assets/report_pages_v0_3.js");
  const data = {
    "../../data/market/amazon_market_facts_monthly.json": readJson("portal/data/market/amazon_market_facts_monthly.json"),
    "../../data/players/amazon_players_monthly.json": readJson("portal/data/players/amazon_players_monthly.json"),
    "../../data/products/amazon_products_monthly.json": readJson("portal/data/products/amazon_products_monthly.json"),
    "../../data/leads/lead_events.json": readJson("portal/data/leads/lead_events.json"),
    "../../data/research/beauty_l2_content_enrichment_v0_1.json": readJson("portal/data/research/beauty_l2_content_enrichment_v0_1.json"),
  };

  html = html.replace(
    /<link rel="stylesheet" href="\.\.\/\.\.\/assets\/portal\.css" \/>/,
    `<style>\n${portalCss}\n</style>`
  );

  const inlineData = `
<script>
window.__PORTABLE_DATA__ = ${safeScript(JSON.stringify(data))};
async function loadJson(file) {
  if (!window.__PORTABLE_DATA__[file]) throw new Error("Portable data missing: " + file);
  return window.__PORTABLE_DATA__[file];
}
</script>
<script>
${safeScript(reportJs)}
</script>`;

  html = html.replace(
    /<script src="\.\.\/\.\.\/assets\/common\.js"><\/script><script src="\.\.\/\.\.\/assets\/report_pages_v0_3\.js"><\/script>/,
    inlineData
  );

  html = html.replace(
    /<title>[^<]+<\/title>/,
    "<title>Beauty Market Intelligence Portal - Standalone</title>"
  );

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, "utf8");
  console.log(out);
}

main();
