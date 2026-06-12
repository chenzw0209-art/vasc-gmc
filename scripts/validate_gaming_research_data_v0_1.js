const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const calendarPath = path.join(ROOT, "portal", "data", "gaming", "gaming_calendar_targets_2026_06_09.json");
const legacyPath = path.join(ROOT, "portal", "data", "gaming", "new_game_calendar_2026_06_08.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required JSON: ${path.relative(ROOT, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNonEmptyString(value, message) {
  assert(typeof value === "string" && value.trim(), message);
}

function validateCalendarData(data) {
  assert(data.version === "v0.1", "gaming calendar schema version must be v0.1");
  assert(data.industry === "Gaming", "gaming calendar industry must be Gaming");
  assert(data.module === "new_game_calendar", "gaming calendar module must be new_game_calendar");
  assert(data.schema_role === "portal_consumption", "gaming calendar must be a portal consumption file");
  assert(data.governance?.frontend_reads_json_only === true, "frontend_reads_json_only must be true");
  assert(data.governance?.no_frontend_category_derivation === true, "no_frontend_category_derivation must be true");

  const modules = data.modules || {};
  assert(modules.core_thesis, "missing core_thesis module");
  assert(modules.calendar, "missing calendar module");
  assert(Array.isArray(modules.focus_cards), "focus_cards must be an array");
  assert(Array.isArray(modules.p0_cards), "p0_cards must be an array");
  assert(modules.focus_cards.length > 0, "focus_cards must not be empty");
  assert(modules.p0_cards.length > 0, "p0_cards must not be empty");

  const drawerIndex = modules.source_drawer_index || {};
  for (const card of modules.focus_cards) {
    assertNonEmptyString(card.id, "focus card missing id");
    assertNonEmptyString(card.game_name, `focus card ${card.id} missing game_name`);
    assertNonEmptyString(card.publisher, `focus card ${card.id} missing publisher`);
    assertNonEmptyString(card.bd_priority, `focus card ${card.id} missing bd_priority`);
    assert(["P0", "P1", "P2"].includes(card.bd_priority), `focus card ${card.id} has invalid bd_priority`);
    assertNonEmptyString(card.action_copy, `focus card ${card.id} missing action_copy`);
    assert(Array.isArray(card.evidence_refs), `focus card ${card.id} evidence_refs must be an array`);
    assert(card.source_drawer?.origin_type === "governed", `focus card ${card.id} source_drawer origin_type must be governed`);
    assert(drawerIndex[card.id], `source_drawer_index missing ${card.id}`);
  }

  const calendarDays = modules.calendar.calendar_days || {};
  const dayItems = Object.values(calendarDays).flat();
  assert(dayItems.length > 0, "calendar_days must contain dated items");
  for (const item of dayItems) {
    assertNonEmptyString(item.id, "calendar day item missing id");
    assertNonEmptyString(item.game_name, `calendar day item ${item.id} missing game_name`);
  }
}

function validateLegacyData(data) {
  assert(data.version === "v0.1", "legacy gaming calendar version must be v0.1");
  assert(data.industry === "Gaming", "legacy gaming calendar industry must be Gaming");
  assert(Array.isArray(data.calendar_items), "legacy calendar_items must be an array");
  assert(data.calendar_items.length > 0, "legacy calendar_items must not be empty");
}

function main() {
  validateCalendarData(readJson(calendarPath));
  validateLegacyData(readJson(legacyPath));
  console.log("gaming research data ok");
}

main();
