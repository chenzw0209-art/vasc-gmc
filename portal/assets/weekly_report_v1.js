(function () {
  const state = { content: null, industrySupply: null, selected: null };
  const $ = (selector) => document.querySelector(selector);

  function safe(value, fallback = "待补") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function shortText(value, max = 24) {
    const text = safe(value, "").replace(/\s+/g, " ");
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function dateShort(value) {
    const text = safe(value, "");
    const match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[2]}-${match[3]}` : shortText(text.replace(/\s+至\s+/g, "-"), 10);
  }

  function qualityClass(value) {
    if (value === "A") return "tag-a";
    if (value === "B") return "tag-b";
    if (value === "C") return "tag-c";
    return "tag-warn";
  }

  function displayName(row) {
    return shortText(row.application_product_name, 18);
  }

  function ownerName(row) {
    return shortText(row.owner_company_brand, 14);
  }

  function channelName(row) {
    return shortText(row.target_market_channel, 10);
  }

  function summaryShort(row) {
    return shortText(row.dynamic_summary, 24);
  }

  function industryKey(row) {
    return `${safe(row.standard_l1)}|${safe(row.standard_l2)}`;
  }

  function industryBrief(row) {
    const key = industryKey(row || {});
    return (state.industrySupply?.industries || []).find((item) => item.industry_key === key)
      || (state.industrySupply?.industries || []).find((item) => item.secondary_industry === row?.standard_l2)
      || null;
  }

  function researchL1(row) {
    return shortText(industryBrief(row)?.primary_industry || row.standard_l1, 14);
  }

  function researchL2(row) {
    const brief = industryBrief(row);
    return shortText(brief?.mapped_research_industry || brief?.secondary_industry || row.standard_l2, 12);
  }

  function similarRows(candidateId) {
    return state.content.weekly_module_content.similar_customers_by_candidate[candidateId] || [];
  }

  function renderSalesFocus() {
    const weekly = state.content.weekly_module_content;
    const focusRows = weekly.focus_customers || [];
    const allRows = state.content.leads_module_content?.records || focusRows;
    const exhibitionRows = state.content.exhibition_window_content || [];
    const productCount = allRows.filter((row) => row.lead_type === "商品").length;
    const appCount = allRows.filter((row) => row.lead_type === "应用").length;
    const gradeACount = allRows.filter((row) => row.source_grade === "A").length;
    const cards = [
      ["本周关注客户数", allRows.length, "本周检索客户", "客", "tone-blue"],
      ["本周新增客户信号", weekly.kpis.new_customer_signal_count || allRows.length, "候选情报记录", "新", "tone-green"],
      ["商品候选", productCount, "实物商品方向", "商", "tone-orange"],
      ["应用候选", appCount, "App / 游戏 / 平台", "应", "tone-purple"],
      ["A级信源", gradeACount, "官方/硬证据", "A", "tone-green"],
      ["重点展会", exhibitionRows.length, "本周/下周窗口", "展", "tone-blue"],
    ];

    $("#sales-focus").innerHTML = `
      <article class="sales-focus-card">
        <h2 class="sales-focus-title">本周销售重点</h2>
        <div class="sales-focus-grid">
          ${cards.map(([label, value, sub, icon, tone]) => `
            <div class="focus-metric">
              <span class="focus-icon ${tone}">${icon}</span>
              <div class="focus-copy">
                <div class="focus-label">${label}</div>
                <div class="focus-value">${value}</div>
                <div class="focus-sub">${sub}</div>
              </div>
            </div>
          `).join("")}
          <div class="week-summary-box">
            <div class="week-summary-title">本周摘要</div>
            <div class="week-summary-text" title="${safe(weekly.top_summary)}">${safe(weekly.top_summary)}</div>
          </div>
        </div>
      </article>`;
  }

  function renderCustomerTable() {
    const rows = (state.content.weekly_module_content.focus_customers || []).slice(0, 10);
    const allRows = state.content.leads_module_content?.records || rows;
    const extraRows = allRows.slice(10);
    const extraSelect = $("#customer-extra-select");
    if (extraSelect) {
      extraSelect.innerHTML = `
        <option value="">其余客户（${extraRows.length}）</option>
        ${extraRows.map((row, index) => `<option value="${index}">${shortText(row.application_product_name, 22)}｜${researchL2(row)}</option>`).join("")}
      `;
      extraSelect.onchange = () => {
        const index = Number(extraSelect.value);
        if (Number.isFinite(index) && extraRows[index]) {
          state.selected = extraRows[index];
          renderIndustryBrief();
          renderSimilarCustomers();
        }
      };
    }
    $("#customer-table").innerHTML = `
      <div class="table-fit">
        <table class="data-table weekly-customer-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-name">应用/商品名称</th>
              <th class="col-company">供应商</th>
              <th class="col-industry">一级行业</th>
              <th class="col-category">二级行业</th>
              <th class="col-market">目标市场/渠道</th>
              <th class="col-type">动态类型</th>
              <th class="col-date">日期</th>
              <th class="col-summary">动态摘要</th>
              <th class="col-quality">信源</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, index) => `
              <tr data-index="${index}">
                <td class="num">${index + 1}</td>
                <td><div class="name-cell" title="${safe(row.application_product_name)}｜${safe(row.owner_company_brand)}">${displayName(row)}</div></td>
                <td><div class="company-cell" title="${safe(row.owner_company_brand)}">${ownerName(row)}</div></td>
                <td>${researchL1(row)}</td>
                <td><button class="industry-link" data-index="${index}" title="${safe(industryBrief(row)?.mapped_research_industry || row.standard_l2)}">${researchL2(row)}</button></td>
                <td title="${safe(row.target_market_channel)}">${channelName(row)}</td>
                <td>${shortText(row.dynamic_type, 8)}</td>
                <td>${dateShort(row.dynamic_date)}</td>
                <td>
                  <div class="event-summary" title="${safe(row.dynamic_type)}｜${safe(row.dynamic_summary)}">
                    <span class="inline-type">${shortText(row.dynamic_type, 6)}</span>${summaryShort(row)}
                  </div>
                </td>
                <td><span class="tag ${qualityClass(row.source_grade)}">${safe(row.source_grade)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>`;

    $("#customer-table").querySelectorAll("tbody tr, .industry-link").forEach((element) => {
      element.addEventListener("click", () => {
        const index = Number(element.dataset.index ?? element.closest("tr")?.dataset.index);
        state.selected = rows[index] || state.selected;
        renderIndustryBrief();
        renderSimilarCustomers();
      });
    });
  }

  function renderIndustryBrief() {
    const selected = state.selected || state.content.weekly_module_content.focus_customers[0] || {};
    const brief = industryBrief(selected);
    const secondary = safe(selected.standard_l2, "行业");
    const metrics = brief?.metrics || {};
    const signals = (brief?.growth_signals_short || ["行业材料待补齐", "增长信号待复核", "同类客户待核验"]).slice(0, 4);

    $("#industry-brief-title").textContent = `客户对应行业扫盲（${researchL2(selected)}）`;
    $("#industry-link").href = "./pages/market/";
    $("#industry-brief").innerHTML = `
      <div class="industry-brief-grid">
        <section class="brief-panel">
          <div class="brief-title">行业基础指标</div>
          <div class="brief-metric-label">行业GMV</div>
          <div class="brief-metric-value">${safe(metrics.gmv)}</div>
          <div class="brief-metric-label">YoY增长率</div>
          <div class="brief-metric-value small">${safe(metrics.yoy_growth)}</div>
          <div class="brief-metric-label">CN品牌GMV占比</div>
          <div class="brief-metric-value small">${safe(metrics.cn_gmv_share)}</div>
          <div class="brief-metric-label">Top中国玩家</div>
          <div class="brief-metric-value small">${safe(metrics.top_cn_player)}</div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">增长信号（近90天）</div>
          <div class="brief-list">
            ${signals.map((item) => `<div class="brief-list-item">${shortText(item, 24)}</div>`).join("")}
          </div>
        </section>
      </div>`;
  }

  function eventStartDate(row) {
    const match = safe(row.date, "").match(/\d{4}-\d{2}-\d{2}/);
    return match ? new Date(`${match[0]}T00:00:00`) : null;
  }

  function renderEventWindows() {
    const rows = state.content.exhibition_window_content || [];
    const eventSelect = $("#event-extra-select");
    const eventLink = $("#event-open-link");
    if (eventSelect) {
      eventSelect.innerHTML = `
        <option value="">全部展会（${rows.length}）</option>
        ${rows.map((row, index) => `<option value="${index}">${dateShort(row.date)}｜${shortText(row.event_name, 24)}</option>`).join("")}
      `;
      eventSelect.onchange = () => {
        const index = Number(eventSelect.value);
        if (eventLink && Number.isFinite(index) && rows[index]) {
          eventLink.href = rows[index].url || "#";
          eventLink.textContent = "打开链接";
        }
      };
      if (eventLink && rows[0]) eventLink.href = rows[0].url || "#";
    }
    const boundary = new Date("2026-06-09T00:00:00");
    const thisWeek = rows.filter((row) => {
      const date = eventStartDate(row);
      return date && date < boundary;
    });
    const nextWeek = rows.filter((row) => {
      const date = eventStartDate(row);
      return !date || date >= boundary;
    });

    function renderGroup(title, items) {
      return `
        <section class="event-group">
          <h3 class="event-group-title">${title}</h3>
          <div class="event-list">
            ${items.map((row) => `
              <a class="event-row" href="${safe(row.url, "#")}" target="_blank" rel="noreferrer" title="${safe(row.window_value)}">
                <b>${dateShort(row.date)}</b>
                <span title="${safe(row.event_name)}">${shortText(row.event_name, 14)}</span>
                <em>${shortText(row.location, 6)}</em>
                <i>${shortText(row.industry, 6)}</i>
                <strong class="tag ${qualityClass(row.source_grade)}">${safe(row.source_grade)}</strong>
              </a>
            `).join("") || "<div class=\"empty-line\">暂无展会记录</div>"}
          </div>
        </section>`;
    }

    $("#event-windows").innerHTML = `
      <div class="event-window-grid">
        ${renderGroup("本周展会（W23）", thisWeek)}
        ${renderGroup("下周展会（W24）", nextWeek)}
      </div>`;
  }

  function renderSimilarCustomers() {
    const selected = state.selected || state.content.weekly_module_content.focus_customers[0] || {};
    const rows = similarRows(selected.candidate_id).slice(0, 5);
    $("#similar-title").textContent = `同类客户（${shortText(selected.standard_l2, 10)}）`;
    $("#similar-customers").innerHTML = `
      <div class="table-fit">
        <table class="data-table similar-table">
          <thead>
            <tr><th>品牌/企业</th><th>国家</th><th>主营品类</th><th>最近事件</th><th>事件时间</th><th>信源</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><div class="brand-cell" title="${safe(row.owner_company_brand)}">${ownerName(row)}</div></td>
                <td>${/美国|US|Amazon/i.test(row.target_market_channel || "") ? "美国" : "全球"}</td>
                <td title="${safe(row.standard_l2)}">${shortText(row.standard_l2, 8)}</td>
                <td><div class="event-summary one-line" title="${safe(row.dynamic_summary)}">${summaryShort(row)}</div></td>
                <td>${dateShort(row.dynamic_date)}</td>
                <td><span class="tag ${qualityClass(row.source_grade)}">${safe(row.source_grade)}</span></td>
              </tr>
            `).join("") || "<tr><td colspan=\"6\">暂无同类客户</td></tr>"}
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
    const [content, industrySupply] = await Promise.all([
      loadJson("./data/weekly/weekly_leads_content_2026_W23.json"),
      loadJson("./data/weekly/industry_brief_supply_2026_W23.json"),
    ]);
    state.content = content;
    state.industrySupply = industrySupply;
    renderAll();
  }

  init().catch((error) => {
    $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${error.message}</p></article>`);
  });
})();
