async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "未知";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
}

function formatDate(value) {
  return value || "";
}

function priorityClass(priority) {
  return `priority-${String(priority || "c").toLowerCase()}`;
}

