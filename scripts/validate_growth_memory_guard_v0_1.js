const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const memoryPath = "Z:\\增长中台统一规则与工作记忆.md";

const retiredEntrypoints = [
  "Z:\\增长分析中台\\agent分工与周报工作流_v1.md",
  "Z:\\增长分析中台\\线索采集\\客户动态检索规则_最新版.md",
  "Z:\\增长分析中台\\线索采集\\新游日历线索采集规则_增量版_v1.0.md",
  "Z:\\增长分析中台\\行研洞察\\底表治理\\当前有效规则_README.md",
  "Z:\\增长分析中台\\行研洞察\\底表治理",
  "Z:\\增长分析中台\\行研洞察\\深度分析",
  "Z:\\增长分析中台\\行研洞察\\Gaming",
  "Z:\\增长分析中台\\行研洞察\\行业分析\\Consumer Tech\\家用电器",
  path.join(repoRoot, "data_assets", "config", "customer_dynamics_search_rules_v0_1.json"),
  path.join(repoRoot, "data_assets", "runbooks", "customer_dynamics_weekly_refresh_runbook.md"),
];

const requiredAgreements = [
  "唯一总规则入口",
  "不得再新增分散的规则文档",
  "`家用电器` 概念彻底弃用",
  "Fashion：作为前台和线索采集的独立一级行业处理",
  "W24、W25 必须保留为独立周报快照",
  "node scripts/validate_growth_memory_guard_v0_1.js",
];

function assert(condition, message) {
  if (!condition) {
    console.error(`growth memory guard failed: ${message}`);
    process.exit(1);
  }
}

assert(fs.existsSync(memoryPath), `missing unified memory document: ${memoryPath}`);

const memory = fs.readFileSync(memoryPath, "utf8");
for (const phrase of requiredAgreements) {
  assert(memory.includes(phrase), `unified memory is missing required phrase: ${phrase}`);
}

const existingRetired = retiredEntrypoints.filter((file) => fs.existsSync(file));
assert(
  existingRetired.length === 0,
  `retired rule entrypoints still exist:\n${existingRetired.map((file) => `- ${file}`).join("\n")}`
);

console.log("growth memory guard ok");
console.log(`- unified memory: ${memoryPath}`);
console.log("- retired scattered rule entrypoints are absent");
