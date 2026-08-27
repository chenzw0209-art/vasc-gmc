const state = { data: null, category: "all", industry: "all" };
const $ = (selector, scope = document) => scope.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function unique(items) { return [...new Set(items)].sort((a, b) => a.localeCompare(b, "zh-CN")); }

function setOptions(selector, values) {
  const node = $(selector);
  values.forEach((value) => node.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`));
}

function filteredCards() {
  return state.data.cards.filter((card) => (state.category === "all" || card.business_category === state.category) && (state.industry === "all" || card.industry === state.industry));
}

function renderHealth(cards) {
  const latest = cards.map((item) => item.signal_date).sort().at(-1) || "—";
  $("#health-strip").innerHTML = [
    `<span>当前可行动 <b>${cards.length}</b> 条</span>`,
    `<span>最晚信号 <b>${latest}</b></span>`,
    `<span>销售解读 <b>${cards.length}</b> 条</span>`,
    `<span>演示样例，不以旧信号补位</span>`,
  ].join("");
}

function renderCards(cards) {
  const grid = $("#recommendation-grid");
  const template = $("#card-template");
  grid.replaceChildren();
  $("#empty-state").hidden = cards.length !== 0;
  cards.forEach((card) => {
    const fragment = template.content.cloneNode(true);
    $(".signal-tag", fragment).textContent = card.signal_type;
    $(".evidence", fragment).textContent = card.evidence;
    $("h3", fragment).textContent = card.headline;
    $(".metadata", fragment).textContent = `${card.entity} · ${card.business_category} / ${card.industry} · ${card.signal_date}`;
    $(".fact p", fragment).textContent = card.fact_statement;
    $(".growth p", fragment).textContent = card.growth_signal;
    $(".question p", fragment).textContent = card.opening_question;
    $(".judgment", fragment).textContent = card.sales_judgment;
    $(".next-action", fragment).textContent = card.next_action;
    $(".caveat", fragment).textContent = card.caveat;
    grid.append(fragment);
  });
  renderHealth(cards);
}

function renderRanking(selector, values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  $(selector).innerHTML = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")).map(([name, count]) => `<li>${escapeHtml(name)} <span class="ranking-score">${count} 条</span></li>`).join("");
}

function render() {
  const cards = filteredCards();
  renderCards(cards);
  renderRanking("#industry-ranking", cards.map((card) => card.industry));
  renderRanking("#type-ranking", cards.map((card) => card.signal_type));
}

async function boot() {
  const response = await fetch("data/weekly_sales_intelligence_demo.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法加载演示数据");
  state.data = await response.json();
  $("#as-of").textContent = `演示数据 · 截至 ${state.data.as_of_date}`;
  setOptions("#category-filter", unique(state.data.cards.map((card) => card.business_category)));
  setOptions("#industry-filter", unique(state.data.cards.map((card) => card.industry)));
  $("#category-filter").addEventListener("change", (event) => { state.category = event.target.value; render(); });
  $("#industry-filter").addEventListener("change", (event) => { state.industry = event.target.value; render(); });
  $("#reset-filter").addEventListener("click", () => { state.category = "all"; state.industry = "all"; $("#category-filter").value = "all"; $("#industry-filter").value = "all"; render(); });
  render();
}

boot().catch((error) => { $("#as-of").textContent = "演示数据加载失败"; $("#recommendation-grid").innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`; });
