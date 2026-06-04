const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function write(rel, text) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text, "utf8");
}

function money(n) {
  n = Number(n || 0);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function pct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function normalizeL1(x) {
  if (x === "Gaming") return "__DROP__";
  if (x === "Consumer Electronics") return "Consumer Tech";
  if (x === "Auto & Mobility") return "Lifestyle";
  return x || "未命名";
}

function normalizeL2(l1, l2) {
  const a = normalizeL1(l1);
  if (a === "Beauty") {
    if (["护肤与个护", "个人护理", "皮肤护理"].includes(l2)) return "护肤与个人护理";
    if (l2 === "美妆个护综合") return "口腔护理";
    if (l2 === "剃须和脱毛") return "脱毛与剃须";
    if (l2 === "头发护理") return "头发护理/造型";
    if (l2 === "足部、手部和指甲护理") return "美甲/手足护理";
    if (l2 === "彩妆" || l2 === "香水") return "彩妆/香水";
  }
  if (a === "Consumer Tech") {
    if (l2 === "电子部件") return "电子配件/元器件";
    if (l2 === "微胶囊") return "游戏外设/电脑周边";
    if (l2 === "消费电子综合") return "待拆消费电子";
  }
  return l2 || "未命名";
}

const market = readJson("portal/data/market/amazon_market_facts_monthly.json").records || [];
const research = readJson("portal/data/research/amazon_us_industry_playbooks_v0_3.json");
const evidence = research.evidence_notes || {};
const records = research.records || {};
const riskNotes = {
  FMCG: [
    "饮料/咖啡茶 may mix consumables with coffee appliances, mugs, heating/cooling tools.",
    "酒类 may include brewing, testing, lab or accessory rows; do not read it as pure beverage alcohol demand."
  ],
  "Consumer Tech": [
    "Legacy 消费电子综合 is split in frontend logic, but raw table still contains mixed office, audio, projection, security, and reader rows.",
    "手机与配件 mixes phones, cases, SIM cards, GPS trackers, computer accessories, storage and network devices."
  ],
  Lifestyle: [
    "Lifestyle contains both consumables and durable goods; seasonality matters more than single-month rank.",
    "Automotive rows are folded into Lifestyle and should not be interpreted as vehicle demand."
  ],
  Health: [
    "Health includes baby, OTC, supplements, devices and apparel spillover; compliance and trust must be separated from GMV."
  ]
};

const grouped = new Map();
for (const raw of market) {
  const l1 = normalizeL1(raw.standard_l1 || raw.normalized_l1);
  if (l1 === "__DROP__") continue;
  const l2 = normalizeL2(raw.standard_l1 || raw.normalized_l1, raw.standard_l2 || raw.normalized_l2);
  const key = `${l1}|||${l2}`;
  if (!grouped.has(key)) grouped.set(key, { l1, l2, monthly: 0, gmv: 0, cn: 0, prev: 0, raw: new Set(), brands: new Set() });
  const g = grouped.get(key);
  g.monthly += Number(raw.monthly_gmv || 0);
  g.gmv += Number(raw.gmv || 0);
  g.cn += Number(raw.cn_monthly_gmv || 0);
  g.prev += Number(raw.prev_monthly_gmv || 0);
  for (const r of raw.raw_l2_values || [raw.standard_l2].filter(Boolean)) g.raw.add(r);
  for (const b of raw.top_brands || []) g.brands.add(b);
}

const byL1 = new Map();
for (const row of grouped.values()) {
  if (!byL1.has(row.l1)) byL1.set(row.l1, []);
  byL1.get(row.l1).push(row);
}

const lines = [];
lines.push("# Industry Content Coverage Audit");
lines.push("");
lines.push(`Generated: 2026-06-03`);
lines.push("");
lines.push("Purpose: check whether the portal is behaving like an intelligence system, not just a data report.");
lines.push("");

for (const [l1, rows] of [...byL1.entries()].sort()) {
  const pb = records[l1] || {};
  const insights = (pb.insights || []).filter(x => !/^待补/.test(x.title || ""));
  const top = rows.sort((a, b) => b.monthly - a.monthly).slice(0, 8);
  const covered = top.filter(x => evidence[x.l2]?.length).length;
  lines.push(`## ${l1}`);
  lines.push("");
  lines.push(`- L1 frame: ${pb.frame ? "yes" : "missing"}`);
  lines.push(`- L1 insight count: ${insights.length}`);
  lines.push(`- Evidence coverage in top 8 L2: ${covered}/${top.length}`);
  if (riskNotes[l1]?.length) {
    lines.push(`- Scope risk: ${riskNotes[l1].join(" ")}`);
  }
  lines.push("");
  lines.push("| L2 | Monthly GMV | MoM | CN Share | Evidence | Top Brands |");
  lines.push("|---|---:|---:|---:|---|---|");
  for (const r of top) {
    const mom = r.prev ? (r.monthly - r.prev) / r.prev * 100 : 0;
    const cnShare = r.monthly ? r.cn / r.monthly * 100 : 0;
    const ev = evidence[r.l2]?.length ? `yes (${evidence[r.l2].length})` : "missing";
    lines.push(`| ${r.l2} | ${money(r.monthly)} | ${pct(mom)} | ${pct(cnShare)} | ${ev} | ${[...r.brands].slice(0, 4).join(", ")} |`);
  }
  const missing = top.filter(x => !evidence[x.l2]?.length).map(x => x.l2);
  if (missing.length) {
    lines.push("");
    lines.push(`Missing evidence priority: ${missing.join(" / ")}`);
  }
  lines.push("");
}

lines.push("## Next Evidence Priorities");
lines.push("");
lines.push("- Add external proof for top-L2 categories that are large but currently missing evidence.");
lines.push("- Be careful with categories polluted by equipment/accessory rows, especially FMCG and Consumer Tech legacy buckets.");
lines.push("- Evidence should explain mechanism: demand scene, brand structure, supply-chain capability, external event, or compliance risk.");
lines.push("");

write("docs/industry_content_coverage_audit_2026_06_03.md", lines.join("\n"));
console.log("wrote docs/industry_content_coverage_audit_2026_06_03.md");
