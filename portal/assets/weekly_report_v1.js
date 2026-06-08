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

  const nameAlias = {
    "UGREEN Game Day Kit": "Game Day Kit",
    "UGREEN Nexode / MagFlow Air Editions": "Nexode / MagFlow",
    "Dreame Aero Pro Steam Vacuum Mop": "Aero Pro Steam",
    "Roborock Saros 20 Sonic": "Saros 20",
    "Tineco GO HammerHead MessDetect Mop&Vacuum": "GO HammerHead",
    "BLUETTI FridgePower": "FridgePower",
    "HKC Shield C83U60": "Shield C83U60",
    "ANTGAMER 1000Hz/1080Hz esports monitors": "ANTGAMER esports",
  };

  const supplierAlias = {
    "Manjuu / Yostar": "Manjuu/Yostar",
    "Alibaba International Digital Commerce Group": "Alibaba",
    "Dreame Technology": "Dreame",
    "ANTGAMER / HKC": "ANTGAMER",
  };

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
    return shortText(nameAlias[row.application_product_name] || row.application_product_name, 30);
  }

  function ownerName(row) {
    const raw = safe(row.owner_company_brand, "-");
    if (/Dreame/i.test(raw)) return "Dreame";
    if (/Roborock/i.test(raw)) return "Roborock";
    if (/Tineco/i.test(raw)) return "Tineco";
    if (/Alibaba|AliExpress/i.test(raw)) return "AliExpress";
    if (/Manjuu|Yostar/i.test(raw)) return "Yostar";
    if (/ANTGAMER|HKC/i.test(raw)) return raw.includes("HKC") ? "ANTGAMER/HKC" : "ANTGAMER";
    return shortText(supplierAlias[raw] || raw, 22);
  }

  function channelName(row) {
    const raw = safe(row.target_market_channel, "");
    const cleaned = raw
      .replace(/\/全球/g, "")
      .replace(/全球\//g, "")
      .replace(/全球零售/g, "零售")
      .replace(/Amazon\//g, "Amazon · ")
      .replace(/官方店\//g, "官方店 · ");
    return shortText(cleaned, 42);
  }

  function summaryShort(row) {
    return shortText(row.dynamic_summary, 82);
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
      ["重点展会", exhibitionRows.length, "W24/W25窗口", "展", "tone-blue"],
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
            <div class="week-summary-text" title="W24建议关注智能追踪器、充电配件、清洁电器与电竞显示器方向；本周客户信号集中在新品发布、展会曝光和渠道活动，同步关注W24/W25展会窗口。">W24建议关注智能追踪器、充电配件、清洁电器与电竞显示器方向；本周客户信号集中在新品发布、展会曝光和渠道活动，同步关注W24/W25展会窗口。</div>
          </div>
        </div>
      </article>`;
  }

  function renderCustomerTable() {
    const rows = (state.content.weekly_module_content.focus_customers || []).slice(0, 10);
    const allRows = state.content.leads_module_content?.records || rows;
    const extraRows = allRows.slice(10);
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
                <td><span class="l1-pill">${researchL1(row)}</span></td>
                <td><button class="industry-link" data-index="${index}" title="${safe(industryBrief(row)?.mapped_research_industry || row.standard_l2)}">${researchL2(row)}</button></td>
                <td class="market-cell" title="${safe(row.target_market_channel)}">${channelName(row)}</td>
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
    const extraPanel = $("#customer-extra-panel");
    const extraList = $("#customer-extra-list");
    if (extraPanel && extraList) {
      extraPanel.querySelector("summary").textContent = `其余客户（${extraRows.length}）`;
      extraList.innerHTML = extraRows.map((row, index) => `
        <button class="extra-customer-row" data-index="${index}">
          <span>${displayName(row)}</span>
          <b>${ownerName(row)}</b>
          <em>${researchL1(row)} / ${researchL2(row)}</em>
          <i>${dateShort(row.dynamic_date)}</i>
        </button>
      `).join("");
      extraList.querySelectorAll(".extra-customer-row").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.index);
          state.selected = extraRows[index] || state.selected;
          renderIndustryBrief();
          renderSimilarCustomers();
        });
      });
    }

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
    const signals = (brief?.growth_signals_short || ["待录入"]).slice(0, 4);
    const conclusion = brief?.industry_conclusion || (brief ? "行业结论待补充" : "待录入");

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
          <div class="brief-conclusion">${shortText(conclusion, 60)}</div>
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
    $("#event-windows").innerHTML = `
      <div class="table-fit event-table-fit">
        <table class="data-table event-table">
          <thead>
            <tr><th>开展时间</th><th>展会名称</th><th>展会地点</th><th>领域</th><th>报名通道</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${safe(row.date)}</td>
                <td title="${safe(row.event_name)}">${safe(row.event_name)}</td>
                <td>${safe(row.location)}</td>
                <td>${safe(row.industry)}</td>
                <td><a class="inline-link" href="${safe(row.url, "#")}" target="_blank" rel="noreferrer">跳转</a></td>
              </tr>
            `).join("") || "<tr><td colspan=\"5\">暂无展会记录</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function renderSimilarCustomers() {
    const selected = state.selected || state.content.weekly_module_content.focus_customers[0] || {};
    const rows = similarRows(selected.candidate_id).slice(0, 5);
    $("#similar-title").textContent = `同类客户（${researchL2(selected)}）`;
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
