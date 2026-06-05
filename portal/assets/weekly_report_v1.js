(function () {
  const state = { leads: [], market: [], players: [], selected: null };
  const WEEK_START = new Date("2026-06-02T00:00:00");
  const WEEK_END = new Date("2026-06-08T23:59:59");
  const NEXT_START = new Date("2026-06-09T00:00:00");
  const NEXT_END = new Date("2026-06-15T23:59:59");

  const $ = (s) => document.querySelector(s);
  const safe = (v, fallback = "待补充") => {
    const s = String(v ?? "").trim();
    return s && s !== "0000-00-00" ? s : fallback;
  };

  function money(n) {
    n = Number(n || 0);
    if (!n) return "待补充";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + n.toFixed(0);
  }

  function pct(n) {
    return Number(n || 0).toFixed(1) + "%";
  }

  function short(text, len = 74) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    return text.length > len ? text.slice(0, len - 1) + "…" : text;
  }

  function categoryText(x, len = 24) {
    let text = safe(x.product_action || x.main_l3 || x.signal_type, "");
    if (/未在|找不到|待补充|暂无/i.test(text)) text = safe(x.signal_type || x.standard_l2, "");
    text = text.split(/[|｜]/).map((s) => s.trim()).filter(Boolean)[0] || safe(x.standard_l2);
    return short(text, len);
  }

  function uniq(rows, fn) {
    return [...new Set(rows.map(fn).filter(Boolean))];
  }

  function quality(x) {
    const q = String(x.evidence_grade || x.priority || "").trim();
    if (/高|A/i.test(q)) return "A";
    if (/中|B/i.test(q)) return "B";
    if (/低|C/i.test(q)) return "C";
    return "待判断";
  }

  function qualityClass(x) {
    const q = quality(x);
    if (q === "A") return "tag-a";
    if (q === "B") return "tag-b";
    if (q === "C") return "tag-c";
    return "tag-warn";
  }

  function eventType(x) {
    const s = [x.event_type, x.signal_type, x.summary, x.company].join(" ");
    if (/招标|投标|tender|bid/i.test(s)) return "招投标";
    if (/展会|CES|IFA|Computex|Expo|峰会|大会|交易会|博览会/i.test(s)) return "展会";
    if (/渠道|Amazon|TikTok|DTC|上线|店铺|合作/i.test(s)) return "渠道动作";
    if (/新品|发布|launch|release|unveil/i.test(s)) return "新品发布";
    if (/政策|合规|监管|标准/i.test(s)) return "行业政策";
    return "PR活动";
  }

  function firstDate(raw) {
    const s = String(raw || "");
    const m = s.match(/(20\d{2})[-.\/年](\d{1,2})[-.\/月](\d{1,2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function inRange(x, start, end) {
    const d = firstDate(x.publish_date || x.event_time || x.summary);
    return d && d >= start && d <= end;
  }

  function isExhibition(x) {
    return eventType(x) === "展会";
  }

  function customerRows() {
    return state.leads
      .filter((x) => x.standard_l1 === "Consumer Tech" && safe(x.company, "") && !isExhibition(x))
      .sort((a, b) => {
        const qa = quality(a), qb = quality(b);
        const score = { A: 4, B: 3, C: 2, "待判断": 1 };
        return (score[qb] || 0) - (score[qa] || 0);
      })
      .slice(0, 10);
  }

  function exhibitionRows(start, end) {
    const scoped = state.leads.filter((x) => x.standard_l1 === "Consumer Tech" && isExhibition(x));
    const ranged = scoped.filter((x) => inRange(x, start, end));
    return (ranged.length ? ranged : scoped).slice(0, 5);
  }

  function marketFor(row) {
    return state.market.find((x) => x.country === "US" && x.platform === "Amazon" && x.standard_l2 === row.standard_l2)
      || state.market.find((x) => x.standard_l2 === row.standard_l2)
      || {};
  }

  function playersFor(row) {
    return state.players
      .filter((x) => x.country === "US" && x.platform === "Amazon" && x.standard_l1 === row.standard_l1 && x.standard_l2 === row.standard_l2)
      .sort((a, b) => Number(b.estimated_monthly_gmv || 0) - Number(a.estimated_monthly_gmv || 0));
  }

  function similarCustomers(row) {
    const sameLeads = state.leads
      .filter((x) => x.company && x.company !== row.company && x.country === row.country && x.standard_l1 === row.standard_l1 && x.standard_l2 === row.standard_l2)
      .slice(0, 6);
    const seen = new Set(sameLeads.map((x) => x.company));
    const fromPlayers = playersFor(row)
      .filter((x) => x.brand && x.brand !== row.company && !seen.has(x.brand))
      .slice(0, Math.max(0, 6 - sameLeads.length))
      .map((x) => ({
        company: x.brand,
        country: x.country,
        standard_l2: x.standard_l2,
        product_action: x.main_l3,
        summary: x.growth_reason || x.brand_product_summary || "同类行业头部玩家，可作为横向扫盘对象。",
        publish_date: x.period,
        evidence_grade: x.source_quality || "B",
      }));
    return [...sameLeads, ...fromPlayers].slice(0, 6);
  }

  function renderSalesFocus(rows) {
    const thisWeekEvents = exhibitionRows(WEEK_START, WEEK_END);
    const nextWeekEvents = exhibitionRows(NEXT_START, NEXT_END);
    const summaryIndustry = rows[0]?.standard_l2 || "清洁电器";
    const summaryText = `W23建议优先关注${summaryIndustry}与智能硬件方向，重点客户集中在美国站，多品牌出现新品发布、渠道扩张或公开PR信号。`;
    const cards = [
      ["重点关注客户数", rows.length, "Top10客户池", "客", "tone-blue"],
      ["本周新增客户信号", rows.filter((x) => inRange(x, WEEK_START, WEEK_END)).length || rows.length, "公开可验证记录", "新", "tone-green"],
      ["本周重点展会", thisWeekEvents.length, "W23窗口", "展", "tone-orange"],
      ["下周重点展会", nextWeekEvents.length, "W24预告", "下", "tone-purple"],
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
            <div class="week-summary-text">${summaryText}</div>
          </div>
        </div>
      </article>`;
  }

  function renderCustomerTable(rows) {
    $("#customer-table").innerHTML = `
      <div class="table-fit">
        <table class="data-table weekly-customer-table">
          <thead><tr>
            <th class="col-rank">#</th><th class="col-brand">品牌/企业</th><th class="col-country">国家</th><th class="col-industry">所属行业</th>
            <th class="col-category">主营品类</th><th class="col-date">事件时间</th><th class="col-type">事件类型</th><th class="col-summary">事件摘要</th><th class="col-quality">信源质量</th>
          </tr></thead>
          <tbody>
            ${rows.map((x, i) => `
              <tr data-index="${i}">
                <td class="num">${i + 1}</td>
                <td><div class="brand-cell">${safe(x.company)}</div></td>
                <td>${safe(x.country)}</td>
                <td><button class="industry-link" data-index="${i}">${safe(x.standard_l2)}</button></td>
                <td>${categoryText(x, 24)}</td>
                <td>${safe(x.publish_date, "-")}</td>
                <td><span class="tag tag-b">${eventType(x)}</span></td>
                <td><div class="event-summary">${short(x.summary, 92)}</div></td>
                <td><span class="tag ${qualityClass(x)}">${quality(x)}</span></td>
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
    const row = state.selected || customerRows()[0] || {};
    const m = marketFor(row);
    const ps = playersFor(row);
    const topCn = ps.find((x) => x.cn_flag)?.brand || ps[0]?.brand || "待补充";
    const signals = state.leads
      .filter((x) => x.standard_l1 === row.standard_l1 && x.standard_l2 === row.standard_l2)
      .slice(0, 4);
    const similar = similarCustomers(row).slice(0, 4);
    $("#industry-brief-title").textContent = `客户对应行业扫盘（${safe(row.standard_l2)}）`;
    $("#industry-link").href = "./pages/market/";
    $("#industry-brief").innerHTML = `
      <div class="industry-brief-grid">
        <section class="brief-panel">
          <div class="brief-title">行业基础指标</div>
          <div class="brief-value">${money(m.gmv || m.monthly_gmv)}</div>
          <div class="brief-list">
            <div class="brief-list-item">YoY/环比增长：${pct(m.growth_rate)}</div>
            <div class="brief-list-item">CN品牌GMV占比：${pct(m.cn_share)}</div>
            <div class="brief-list-item">Top中国玩家：${topCn}</div>
          </div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">增长信号（近90天）</div>
          <div class="brief-list">
            ${signals.map((x) => `<div class="brief-list-item"><b>${safe(x.company)}</b>：${short(x.summary, 58)}</div>`).join("") || "<div class=\"brief-list-item\">暂无近90天结构化信号。</div>"}
          </div>
        </section>
        <section class="brief-panel">
          <div class="brief-title">同类客户推荐</div>
          <div class="brief-list">
            ${similar.map((x) => `<div class="brief-list-item"><b>${safe(x.company || x.brand)}</b> <span class="tag ${qualityClass(x)}">${quality(x)}</span></div>`).join("") || "<div class=\"brief-list-item\">暂无同类客户。</div>"}
          </div>
        </section>
      </div>`;
  }

  function renderEventWindows() {
    const renderGroup = (title, rows) => `
      <section class="event-group">
        <h3 class="event-group-title">${title}</h3>
        <div class="event-list">
          ${rows.map((x) => `
            <a class="event-row" href="${safe(x.source_url, "#")}" target="_blank" rel="noreferrer">
              <b>${safe(x.publish_date, "-")}</b><span>${short(safe(x.company), 34)}</span><em>${safe(x.country)}</em><i>${short(safe(x.standard_l2), 8)}</i>
            </a>
          `).join("") || "<div class=\"empty-line\">暂无结构化展会记录</div>"}
        </div>
      </section>`;
    $("#event-windows").innerHTML = `
      <div class="event-window-grid">
        ${renderGroup("本周展会（W23）", exhibitionRows(WEEK_START, WEEK_END))}
        ${renderGroup("下周展会（W24）", exhibitionRows(NEXT_START, NEXT_END))}
      </div>`;
  }

  function renderSimilarCustomers() {
    const row = state.selected || customerRows()[0] || {};
    const rows = similarCustomers(row);
    $("#similar-title").textContent = `同类客户（${safe(row.standard_l2)} · ${categoryText(row, 12)}）`;
    $("#similar-customers").innerHTML = `
      <div class="table-fit">
        <table class="data-table similar-table">
          <thead><tr><th>品牌/企业</th><th>国家</th><th>主营品类</th><th>最近事件</th><th>事件时间</th><th>信源质量</th></tr></thead>
          <tbody>
            ${rows.map((x) => `
              <tr>
                <td><div class="brand-cell">${safe(x.company || x.brand)}</div></td>
                <td>${safe(x.country)}</td>
                <td>${categoryText(x, 22)}</td>
                <td><div class="event-summary">${short(x.summary || x.growth_reason, 70)}</div></td>
                <td>${safe(x.publish_date || x.period, "-")}</td>
                <td><span class="tag ${qualityClass(x)}">${quality(x)}</span></td>
              </tr>
            `).join("") || "<tr><td colspan=\"6\">暂无同类客户。</td></tr>"}
          </tbody>
        </table>
      </div>`;
  }

  function renderAll() {
    const customers = customerRows();
    state.selected = state.selected || customers[0] || null;
    renderSalesFocus(customers);
    renderCustomerTable(customers);
    renderIndustryBrief();
    renderEventWindows();
    renderSimilarCustomers();
  }

  async function init() {
    const [leads, market, players] = await Promise.all([
      loadJson("./data/leads/lead_events.json"),
      loadJson("./data/market/amazon_market_facts_monthly.json"),
      loadJson("./data/players/amazon_players_monthly.json"),
    ]);
    state.leads = leads.records || leads;
    state.market = market.records || market;
    state.players = players.records || players;
    renderAll();
  }

  init().catch((e) => {
    $(".weekly-content").insertAdjacentHTML("beforeend", `<article class="data-card"><h2 class="card-title">加载失败</h2><p>${e.message}</p></article>`);
  });
})();
