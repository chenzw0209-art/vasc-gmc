(function () {
  const state = { content: null, selected: null };
  const $ = (s) => document.querySelector(s);

  function safe(v, fallback = "待补充") {
    const s = String(v ?? "").trim();
    return s ? s : fallback;
  }

  function short(text, len = 64) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > len ? text.slice(0, len - 1) + "…" : text;
  }

  function qualityClass(q) {
    if (q === "A") return "tag-a";
    if (q === "B") return "tag-b";
    if (q === "C") return "tag-c";
    return "tag-warn";
  }

  function firstIndustry() {
    return state.selected?.standard_l2 || state.content.weekly_module_content.focus_customers[0]?.standard_l2 || "行业";
  }

  function evidence(candidateId) {
    return state.content.evidence_chain_detail_mapping[candidateId] || [];
  }

  function similarRows(candidateId) {
    return state.content.weekly_module_content.similar_customers_by_candidate[candidateId] || [];
  }

  function renderSalesFocus() {
    const weekly = state.content.weekly_module_content;
    const k = weekly.kpis;
    const cards = [
      ["重点关注客户数", k.focus_customer_count, "精选阅读池", "客", "tone-blue"],
      ["本周新增客户信号", k.new_customer_signal_count, "候选情报记录", "新", "tone-green"],
      ["本周重点展会", k.this_week_exhibition_count, "W23窗口", "展", "tone-orange"],
      ["下周重点展会", k.next_week_exhibition_count, "W24预告", "下", "tone-purple"],
    ];
    $("#sales-focus").innerHTML = `
      <article class="sales-focus-card">
        <h2 class="sales-focus-title">本周销售重点</h2>
        <div class="sales-focus-grid">
          ${cards.map(([label, value, sub, icon, tone]) => `
            <div class="focus-metric">
              <span class="focus-icon ${tone}">${icon}</span>
              <div><div class="focus-label">${label}</div><div class="focus-value">${value}</div><div class="focus-sub">${sub}</div></div>
            </div>
          `).join("")}
          <div class="week-summary-box">
            <div class="week-summary-title">本周摘要</div>
            <div class="week-summary-text">${weekly.top_summary}</div>
          </div>
        </div>
      </article>`;
  }

  function renderCustomerTable() {
    const rows = state.content.weekly_module_content.focus_customers;
    $("#customer-table").innerHTML = `
      <div class="table-fit">
        <table class="data-table weekly-customer-table">
          <thead><tr>
            <th class="col-rank">#</th><th class="col-brand">应用/商品</th><th class="col-owner">归属方</th><th class="col-type">线索</th>
            <th class="col-industry">行业</th><th class="col-channel">市场/渠道</th><th class="col-date">日期</th><th class="col-summary">动态摘要</th><th class="col-attention">关注点</th><th class="col-quality">信源</th>
          </tr></thead>
          <tbody>
            ${rows.map((x, i) => `
              <tr data-index="${i}">
                <td class="num">${i + 1}</td>
                <td><div class="brand-cell">${safe(x.application_product_name)}</div></td>
                <td><div class="brand-cell">${safe(x.owner_company_brand, "-")}</div></td>
                <td>${safe(x.lead_type)}</td>
                <td><button class="industry-link" data-index="${i}">${safe(x.standard_l2)}</button></td>
                <td>${short(x.target_market_channel, 18)}</td>
                <td>${safe(x.dynamic_date, "-")}</td>
                <td><div class="event-summary">${safe(x.dynamic_summary)}</div></td>
                <td><div class="event-summary">${safe(x.attention_point)}</div></td>
                <td><span class="tag ${qualityClass(x.source_grade)}">${safe(x.source_grade)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;
    $("#customer-table").querySelectorAll("tbody tr, .industry-link").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.dataset.index ?? el.closest("tr")?.dataset.index);
        state.selected = rows[index] || state.selected;
        renderIndustryBrief();
        renderSimilarCustomers();
      });
    });
  }

  function renderIndustryBrief() {
    const industry = firstIndustry();
    const brief = state.content.weekly_module_content.industry_brief_by_industry[industry] || { signals: [], dynamic_types: {}, top_applications: [] };
    const signals = brief.signals || [];
    const types = Object.entries(brief.dynamic_types || {}).slice(0, 4);
    const sources = evidence(state.selected?.candidate_id).slice(0, 3);
    $("#industry-brief-title").textContent = `客户对应行业扫盘（${industry}）`;
    $("#industry-link").href = "./pages/market/";
    $("#industry-brief").innerHTML = `
      <div class="industry-brief-grid">
        <section class="brief-panel">
          <div class="brief-title">行业候选概况</div>
          <div class="brief-value">${brief.lead_count || 0}</div>
          <div class="brief-list">
            ${types.map(([k, v]) => `<div class="brief-list-item">${k}：${v}条</div>`).join("") || "<div class=\"brief-list-item\">暂无结构化动态。</div>"}
          </div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">客户信号</div>
          <div class="brief-list">
            ${signals.map((x) => `<div class="brief-list-item"><b>${safe(x.application_product_name)}</b>：${safe(x.dynamic_summary)}</div>`).join("") || "<div class=\"brief-list-item\">暂无客户信号。</div>"}
          </div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">证据链</div>
          <div class="brief-list">
            ${sources.map((x) => `<div class="brief-list-item"><b>${safe(x.source_name)}</b>：${short(x.evidence_summary, 52)}</div>`).join("") || "<div class=\"brief-list-item\">点击左侧客户查看证据链。</div>"}
          </div>
        </section>
      </div>`;
  }

  function renderEventWindows() {
    const rows = state.content.exhibition_window_content || [];
    const groups = {
      "本周展会（W23）": rows.filter((x) => /本周|W23/i.test(x.event_window)),
      "下周展会（W24）": rows.filter((x) => /下周|W24/i.test(x.event_window)),
    };
    const renderGroup = (title, items) => `
      <section class="event-group">
        <h3 class="event-group-title">${title}</h3>
        <div class="event-list">
          ${(items.length ? items : rows.slice(0, 3)).map((x) => `
            <a class="event-row" href="${safe(x.url, "#")}" target="_blank" rel="noreferrer">
              <b>${safe(x.date, "-")}</b><span>${safe(x.event_name)}</span><em>${safe(x.location)}</em><i>${short(x.industry, 8)}</i>
            </a>
          `).join("") || "<div class=\"empty-line\">暂无结构化展会记录</div>"}
        </div>
      </section>`;
    $("#event-windows").innerHTML = `
      <div class="event-window-grid">
        ${Object.entries(groups).map(([title, items]) => renderGroup(title, items)).join("")}
      </div>`;
  }

  function renderSimilarCustomers() {
    const selected = state.selected || state.content.weekly_module_content.focus_customers[0] || {};
    const rows = similarRows(selected.candidate_id);
    $("#similar-title").textContent = `同类客户（${safe(selected.standard_l2)}）`;
    $("#similar-customers").innerHTML = `
      <div class="table-fit">
        <table class="data-table similar-table">
          <thead><tr><th>应用/商品</th><th>归属方</th><th>市场/渠道</th><th>最近动态</th><th>日期</th><th>信源</th></tr></thead>
          <tbody>
            ${rows.map((x) => `
              <tr>
                <td><div class="brand-cell">${safe(x.application_product_name)}</div></td>
                <td><div class="brand-cell">${safe(x.owner_company_brand, "-")}</div></td>
                <td>${short(x.target_market_channel, 16)}</td>
                <td><div class="event-summary">${safe(x.dynamic_summary)}</div></td>
                <td>${safe(x.dynamic_date, "-")}</td>
                <td><span class="tag ${qualityClass(x.source_grade)}">${safe(x.source_grade)}</span></td>
              </tr>
            `).join("") || "<tr><td colspan=\"6\">暂无同类客户。</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function renderAll() {
    state.selected = state.selected || state.content.weekly_module_content.focus_customers[0] || null;
    renderSalesFocus();
    renderCustomerTable();
    renderIndustryBrief();
    renderEventWindows();
    renderSimilarCustomers();
  }

  async function init() {
    state.content = await loadJson("./data/weekly/weekly_leads_content_2026_W23.json");
    renderAll();
  }

  init().catch((e) => {
    $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${e.message}</p></article>`);
  });
})();
