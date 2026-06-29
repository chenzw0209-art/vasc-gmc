(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { tab: "overview", content: null, selectedId: null };

  function safe(v, fallback = "待补充") {
    const s = String(v ?? "").trim();
    return s ? s : fallback;
  }

  function short(text, len = 72) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > len ? text.slice(0, len - 1) + "…" : text;
  }

  function qualityClass(q) {
    if (q === "A") return "tag-a";
    if (q === "B") return "tag-b";
    if (q === "C") return "tag-c";
    return "tag-pending";
  }

  function records() {
    return state.content.leads_module_content.records || [];
  }

  function evidence(candidateId) {
    return state.content.evidence_chain_detail_mapping[candidateId] || [];
  }

  function baseRows() {
    const q = ($("#search")?.value || "").toLowerCase().trim();
    const type = $("#type-filter")?.value || "";
    const industry = $("#industry-filter")?.value || "";
    const brand = $("#brand-filter")?.value || "";
    const eventType = $("#event-filter")?.value || "";
    const quality = $("#quality-filter")?.value || "";
    return records().filter((x) => {
      if (type && x.lead_type !== type) return false;
      if (industry && x.standard_l2 !== industry) return false;
      if (brand && x.application_product_name !== brand) return false;
      if (eventType && x.dynamic_type !== eventType) return false;
      if (quality && x.source_grade !== quality) return false;
      if (q && !JSON.stringify(x).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function tabRows() {
    const rows = baseRows();
    if (state.tab === "customers") return rows.filter((x) => x.lead_type !== "展会");
    if (state.tab === "events") return state.content.exhibition_window_content || [];
    if (state.tab === "tenders") return rows.filter((x) => /招|投/.test(x.dynamic_type));
    return rows;
  }

  function unique(rows, key) {
    return [...new Set(rows.map((x) => x[key]).filter(Boolean))].sort();
  }

  function fillFilters() {
    const rows = records();
    const opts = [
      ["type-filter", unique(rows, "lead_type")],
      ["industry-filter", unique(rows, "standard_l2")],
      ["brand-filter", unique(rows, "application_product_name")],
      ["event-filter", unique(rows, "dynamic_type")],
      ["quality-filter", unique(rows, "source_grade")],
    ];
    opts.forEach(([id, values]) => {
      const el = $("#" + id);
      if (!el) return;
      [...el.querySelectorAll("option:not(:first-child)")].forEach((x) => x.remove());
      values.forEach((v) => el.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`));
    });
  }

  function renderKpis(rows) {
    const all = records();
    const high = rows.filter((x) => x.source_grade === "A").length;
    const suggested = rows.filter((x) => x.warehouse_suggestion.includes("是")).length;
    const industries = new Set(rows.map((x) => x.standard_l2).filter(Boolean)).size;
    const apps = new Set(rows.map((x) => x.application_product_name).filter(Boolean)).size;
    const cards = [
      ["候选总数", all.length, "本周候选池", "tone-blue", "Σ"],
      ["当前筛选", rows.length, "可展示记录", "tone-green", "筛"],
      ["A类信源", high, "信源等级A", "tone-purple", "A"],
      ["建议入库", suggested, "复核后入库", "tone-orange", "入"],
      ["覆盖行业", industries, "二级行业", "tone-red", "业"],
      ["应用/商品", apps, "主键去重", "tone-blue", "品"],
    ];
    $("#kpis").innerHTML = cards.map(([k, v, note, tone, icon]) => `
      <article class="kpi-card">
        <div class="kpi-icon ${tone}">${icon}</div>
        <div><div class="kpi-label">${k}</div><div class="kpi-value">${v.toLocaleString("en-US")}</div><div class="kpi-sub">${note}</div></div>
      </article>`).join("");
  }

  function tableHead() {
    return `<tr>
      <th style="width:150px">应用/商品名称</th><th style="width:150px">归属方</th><th style="width:72px">线索</th>
      <th style="width:150px">一级/二级行业</th><th style="width:130px">目标市场/渠道</th><th style="width:86px">动态类型</th>
      <th style="width:86px">动态日期</th><th>动态摘要</th><th style="width:160px">建议关注点</th><th style="width:62px">信源</th><th style="width:78px">入库</th>
    </tr>`;
  }

  function renderTable(rows) {
    $("#signal-table").innerHTML = rows.slice(0, 80).map((x) => `
      <tr data-id="${x.candidate_id}">
        <td><div class="brand-cell">${safe(x.application_product_name)}</div></td>
        <td><div class="brand-cell">${safe(x.owner_company_brand, "-")}</div></td>
        <td><span class="tag tag-b">${safe(x.lead_type)}</span></td>
        <td class="industry-cell">${safe(x.standard_l1)}<br><b>${safe(x.standard_l2)}</b></td>
        <td>${short(x.target_market_channel, 24)}</td>
        <td>${safe(x.dynamic_type)}</td>
        <td>${safe(x.dynamic_date, "-")}</td>
        <td><div class="event-summary">${safe(x.dynamic_summary)}</div></td>
        <td><div class="event-summary">${safe(x.attention_point)}</div></td>
        <td><span class="tag ${qualityClass(x.source_grade)}">${safe(x.source_grade)}</span></td>
        <td>${safe(x.warehouse_suggestion)}</td>
      </tr>`).join("") || `<tr><td colspan="11" class="center">当前筛选下暂无候选线索</td></tr>`;
    $$("#signal-table tr[data-id]").forEach((tr) => tr.addEventListener("click", () => {
      state.selectedId = tr.dataset.id;
      renderDetail(rows.find((x) => x.candidate_id === state.selectedId));
    }));
  }

  function renderDetail(x) {
    x = x || baseRows()[0];
    if (!x) {
      $("#detail").innerHTML = `<div class="placeholder">暂无详情</div>`;
      return;
    }
    const sources = evidence(x.candidate_id);
    $("#detail").innerHTML = `
      <div class="intel-detail">
        <div class="detail-section">
          <b>${safe(x.application_product_name)}</b>
          <p>归属方：${safe(x.owner_company_brand, "-")}<br><span class="tag ${qualityClass(x.source_grade)}">${safe(x.source_grade)}</span> <span class="tag tag-b">${safe(x.lead_type)}</span></p>
        </div>
        <div class="detail-section"><b>事件摘要</b><p>${safe(x.dynamic_summary)}<br>建议关注点：${safe(x.attention_point)}</p></div>
        <div class="detail-section"><b>市场相关性</b><p>${safe(x.standard_l1)} / ${safe(x.standard_l2)}<br>${safe(x.target_market_channel)}<br>动态类型：${safe(x.dynamic_type)} · ${safe(x.dynamic_date)}</p></div>
        <div class="detail-section"><b>证据链</b>${sources.map((s) => `<p><b>${safe(s.source_name)}</b>：${short(s.evidence_summary, 88)}<br>${s.url ? `<a class="link-button" target="_blank" href="${s.url}">查看信源</a>` : ""}</p>`).join("") || "<p>暂无信源明细。</p>"}</div>
        <div class="detail-section"><b>复核记录</b><p>链接状态：${safe(x.link_status)}<br>是否建议入库：${safe(x.warehouse_suggestion)}<br>${safe(x.review_note, "")}</p></div>
      </div>`;
  }

  function renderBars(id, entries) {
    const obj = Object.fromEntries(entries);
    const max = Math.max(1, ...Object.values(obj));
    $("#" + id).innerHTML = entries.map(([k, v]) => `<div class="summary-bar"><span>${k}</span><i><b style="width:${v / max * 100}%"></b></i><strong>${v}</strong></div>`).join("");
  }

  function countBy(rows, key) {
    const obj = {};
    rows.forEach((x) => { const k = x[key] || "待补充"; obj[k] = (obj[k] || 0) + 1; });
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  }

  function renderOverview() {
    const rows = tabRows();
    renderKpis(rows);
    $("#tab-body").innerHTML = `
      <section class="leads-main">
        <div class="leads-row leads-row-1">
          <article class="card table-card-md"><h2>候选线索列表 <small>应用/商品为主键</small></h2><div class="table-scroll"><table class="data-table intel-table"><thead>${tableHead()}</thead><tbody id="signal-table"></tbody></table></div></article>
          <article class="card detail-card"><h2>线索详情 / 证据链</h2><div id="detail"></div></article>
        </div>
        <div class="leads-row leads-row-2">
          <article class="card chart-card-sm"><h2>线索类型分布</h2><div id="type-bars" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>信源等级分布</h2><div id="quality-bars" class="mini-bars"></div></article>
          <article class="card chart-card-sm"><h2>行业分布Top5</h2><div id="industry-bars" class="mini-bars"></div></article>
        </div>
      </section>`;
    renderTable(rows);
    renderDetail(rows[0]);
    renderBars("type-bars", countBy(rows, "lead_type"));
    renderBars("quality-bars", countBy(rows, "source_grade"));
    renderBars("industry-bars", countBy(rows, "standard_l2").slice(0, 5));
  }

  function renderEvents() {
    const rows = state.content.exhibition_window_content || [];
    renderKpis(baseRows());
    $("#tab-body").innerHTML = `
      <article class="card table-card-md"><h2>展会窗口 <small>独立于客户候选主列表</small></h2>
        <div class="table-scroll"><table class="data-table"><thead><tr><th>时间窗</th><th>展会/会议</th><th>地点</th><th>日期</th><th>行业</th><th>链接</th><th>信源</th></tr></thead><tbody>
        ${rows.map((x) => `<tr><td>${safe(x.event_window)}</td><td class="brand-cell">${safe(x.event_name)}</td><td>${safe(x.location)}</td><td>${safe(x.date)}</td><td>${safe(x.industry)}</td><td>${x.url ? `<a href="${safe(x.url)}" target="_blank" rel="noopener">打开</a>` : ""}</td><td><span class="tag ${qualityClass(x.source_grade)}">${safe(x.source_grade)}</span></td></tr>`).join("")}
        </tbody></table></div>
      </article>`;
  }

  function renderAll() {
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
    if (state.tab === "events") renderEvents();
    else renderOverview();
  }

  async function init() {
    state.content = await loadJson("../../data/weekly/weekly_leads_content_2026_W23.json");
    fillFilters();
    $$(".tab").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; renderAll(); }));
    ["search", "type-filter", "industry-filter", "brand-filter", "event-filter", "quality-filter"].forEach((id) => $("#" + id)?.addEventListener("input", renderAll));
    $("#reset")?.addEventListener("click", () => {
      ["search", "type-filter", "industry-filter", "brand-filter", "event-filter", "quality-filter"].forEach((id) => { const el = $("#" + id); if (el) el.value = ""; });
      renderAll();
    });
    renderAll();
  }

  init().catch((e) => {
    $("#tab-body").innerHTML = `<div class="card"><h2>加载失败</h2><p>${e.message}</p></div>`;
  });
})();
