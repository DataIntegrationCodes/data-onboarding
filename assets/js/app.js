(function () {
  "use strict";

  const state = { data: null, filtered: [], view: "cards", sortKey: "progression", sortDir: "desc" };

  const el = (sel) => document.querySelector(sel);

  function fmtPct(v) {
    if (v === null || v === undefined) return "—";
    return Math.round(v * 100) + "%";
  }

  function progressClass(v) {
    if (v === null || v === undefined) return "badge-muted";
    if (v >= 0.8) return "badge-green";
    if (v >= 0.4) return "badge-amber";
    return "badge-red";
  }

  function progressColorVar(v) {
    if (v >= 0.8) return "var(--green)";
    if (v >= 0.4) return "var(--amber)";
    return "var(--red)";
  }

  function activeBadge(v) {
    if (v === "Yes") return '<span class="badge badge-green">Active</span>';
    if (v === "No") return '<span class="badge badge-amber">Pending</span>';
    return '<span class="badge badge-muted">' + (v || "—") + "</span>";
  }

  function daysLabel(d) {
    if (d === null || d === undefined || d === "n/a") return "n/a";
    if (typeof d === "number") {
      return d < 0 ? Math.abs(d) + "d since COD" : d + "d to COD";
    }
    return d;
  }

  async function loadData() {
    const res = await fetch("data/tracker.json");
    state.data = await res.json();
  }

  function populateFilters() {
    const portfolios = [...new Set(state.data.projects.map((p) => p.portfolio))].sort();
    const techs = [...new Set(state.data.projects.map((p) => p.technology))].sort();
    const pSel = el("#portfolioFilter");
    const tSel = el("#techFilter");
    portfolios.forEach((p) => {
      const o = document.createElement("option");
      o.value = p; o.textContent = p; pSel.appendChild(o);
    });
    techs.forEach((t) => {
      const o = document.createElement("option");
      o.value = t; o.textContent = t; tSel.appendChild(o);
    });
  }

  function renderSummary() {
    const projects = state.data.projects;
    const total = projects.length;
    const activeCount = projects.filter((p) => p.activeOnNsight === "Yes").length;
    const avgProgress = projects.reduce((s, p) => s + (p.progression || 0), 0) / total;
    const portfolios = new Set(projects.map((p) => p.portfolio)).size;
    const totalMW = projects.reduce((s, p) => {
      const v = typeof p.capacityMW === "number" ? p.capacityMW : parseFloat(String(p.capacityMW)) || 0;
      return s + v;
    }, 0);
    const byTech = {};
    projects.forEach((p) => { byTech[p.technology] = (byTech[p.technology] || 0) + 1; });
    const techSummary = Object.entries(byTech).map(([k, v]) => `${k}: ${v}`).join(" · ");

    const tiles = [
      { label: "Total Projects", value: total, sub: `${portfolios} portfolios` },
      { label: "Active on Nsight", value: activeCount + " / " + total, sub: "live monitoring" },
      { label: "Avg. Onboarding Progress", value: fmtPct(avgProgress), sub: "across portfolio" },
      { label: "Total Capacity", value: Math.round(totalMW) + " MW", sub: "nameplate (approx.)" },
      { label: "Technology Mix", value: Object.keys(byTech).length + " types", sub: techSummary },
    ];

    el("#summaryGrid").innerHTML = tiles.map((t) => `
      <div class="tile">
        <div class="tile-label">${t.label}</div>
        <div class="tile-value">${t.value}</div>
        <div class="tile-sub">${t.sub}</div>
      </div>
    `).join("");

    el("#generatedAt").textContent = "Data as of " + state.data.generatedAt;
  }

  function applyFilters() {
    const q = el("#searchInput").value.trim().toLowerCase();
    const portfolio = el("#portfolioFilter").value;
    const tech = el("#techFilter").value;
    const active = el("#activeFilter").value;

    state.filtered = state.data.projects.filter((p) => {
      if (portfolio && p.portfolio !== portfolio) return false;
      if (tech && p.technology !== tech) return false;
      if (active && p.activeOnNsight !== active) return false;
      if (q) {
        const hay = [p.project, p.comments, p.portfolio, p.technology].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    sortFiltered();
    renderCards();
    renderTable();
  }

  function sortFiltered() {
    const { sortKey, sortDir } = state;
    state.filtered.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av === null || av === undefined) av = -Infinity;
      if (bv === null || bv === undefined) bv = -Infinity;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  function renderCards() {
    el("#cardsView").innerHTML = state.filtered.map((p) => `
      <div class="card" data-code="${p.code}">
        <div class="card-top">
          <div>
            <p class="card-name">${p.project}</p>
            <p class="card-portfolio">${p.portfolio} · ${p.technology}</p>
          </div>
          ${activeBadge(p.activeOnNsight)}
        </div>
        <div class="card-meta-row">
          <span>${p.capacityMW} MW</span>
          <span>Est. COD: ${p.estCOD || "—"}</span>
          <span>${daysLabel(p.daysTillCOD)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${(p.progression || 0) * 100}%; background:${progressColorVar(p.progression || 0)}"></div>
        </div>
        <div class="progress-label">
          <span>${p.tasksCompletedCount}/${p.tasksTotalCount} tasks complete</span>
          <span>${fmtPct(p.progression)}</span>
        </div>
        ${p.comments ? `<p class="card-comment">${p.comments}</p>` : ""}
      </div>
    `).join("") || `<p class="empty-note">No projects match the current filters.</p>`;

    el("#cardsView").querySelectorAll(".card").forEach((c) => {
      c.addEventListener("click", () => openDetail(c.dataset.code));
    });
  }

  function renderTable() {
    el("#tableBody").innerHTML = state.filtered.map((p) => `
      <tr data-code="${p.code}">
        <td>${p.portfolio}</td>
        <td>${p.project}</td>
        <td>${p.technology}</td>
        <td>${p.capacityMW}</td>
        <td>${p.estCOD || "—"}</td>
        <td><span class="badge ${progressClass(p.progression)}">${fmtPct(p.progression)}</span></td>
        <td>${activeBadge(p.activeOnNsight)}</td>
        <td class="comments-cell">${p.comments || "—"}</td>
      </tr>
    `).join("");

    el("#tableBody").querySelectorAll("tr").forEach((r) => {
      r.addEventListener("click", () => openDetail(r.dataset.code));
    });
  }

  function taskIndentClass(label) {
    if (/^\s*-/.test(label)) return "sub";
    if (/^\s*\*/.test(label)) return "sub";
    return "";
  }

  function renderTaskRow(task, value) {
    let statusClass = "pending", statusIcon = "○", note = "";
    if (value === true) { statusClass = "done"; statusIcon = "✓"; }
    else if (value === false || value === null || value === undefined) { statusClass = "pending"; statusIcon = "○"; }
    else if (typeof value === "string") { statusClass = "note"; statusIcon = "!"; note = value; }

    return `
      <div class="task-row ${taskIndentClass(task.label)}">
        <div class="task-status ${statusClass}">${statusIcon}</div>
        <div class="task-body">
          <div class="task-label">${task.label}</div>
          ${task.team ? `<div class="task-team">${task.team}${task.responsible ? " · " + task.responsible : ""}</div>` : ""}
          ${note ? `<div class="task-note">${note}</div>` : task.note ? `<div class="task-note">${task.note}</div>` : ""}
        </div>
      </div>
    `;
  }

  function renderDocGrid(docFiles) {
    const entries = Object.entries(docFiles || {});
    if (!entries.length) return `<p class="empty-note">No technical documentation folder found yet for this project.</p>`;
    return `<div class="doc-grid">${entries.map(([name, count]) => `
      <div class="doc-tile">
        <div class="doc-tile-name">${name}</div>
        <div class="doc-tile-count" style="color:${count > 0 ? "var(--green)" : "var(--text-muted)"}">${count} file${count === 1 ? "" : "s"}</div>
      </div>
    `).join("")}</div>`;
  }

  function openDetail(code) {
    const p = state.data.projects.find((x) => x.code === code);
    if (!p) return;

    const fields = [
      ["Interconnectivity (RDL & Manu)", p.interconnectivity],
      ["Tag + Breaking List Review", p.tagReview],
      ["MyNsights Onboarding", p.myNsightsOnboarding],
      ["Est. Onboarding Timeline", p.estOnboardingTimeline],
      ["Est. Production Date", p.estProductionDate],
      ["Current Perf. Monitoring", p.currentPerfMonitoring],
      ["OCC Onboarding", p.occOnboarding],
      ["eDC Onboarding", p.edcOnboarding],
      ["Nsight Internal Training", p.nsightInternalTraining],
      ["Country Lead", p.countryLead],
    ];

    const taskRows = state.data.tasks.map((t) => renderTaskRow(t, p.taskCompletion[String(t.row)])).join("");

    el("#detailContent").innerHTML = `
      <div class="detail-header">
        <h2>${p.project}</h2>
        <p class="card-portfolio">${p.portfolio} · ${p.technology} · ${p.capacityMW} MW</p>
      </div>
      <div class="progress-track" style="margin-top:14px;">
        <div class="progress-fill" style="width:${(p.progression || 0) * 100}%; background:${progressColorVar(p.progression || 0)}"></div>
      </div>
      <div class="progress-label"><span>${p.tasksCompletedCount}/${p.tasksTotalCount} tasks complete</span><span>${fmtPct(p.progression)}</span></div>

      <div class="detail-grid">
        ${fields.map(([label, val]) => `
          <div>
            <div class="detail-field-label">${label}</div>
            <div class="detail-field-value">${val ?? "—"}</div>
          </div>
        `).join("")}
      </div>

      ${p.comments ? `<div class="section-title">Comments</div><p>${p.comments}</p>` : ""}

      <div class="section-title">Onboarding Checklist</div>
      <div class="task-list">${taskRows}</div>

      <div class="section-title">Technical Documentation on File</div>
      ${renderDocGrid(p.docFiles)}
    `;

    el("#detailOverlay").classList.remove("hidden");
  }

  function closeDetail() {
    el("#detailOverlay").classList.add("hidden");
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    el("#cardsView").classList.toggle("hidden", view !== "cards");
    el("#tableView").classList.toggle("hidden", view !== "table");
  }

  function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const current = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    el("#themeToggle").textContent = current === "dark" ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon();
  }

  function bindEvents() {
    el("#searchInput").addEventListener("input", applyFilters);
    el("#portfolioFilter").addEventListener("change", applyFilters);
    el("#techFilter").addEventListener("change", applyFilters);
    el("#activeFilter").addEventListener("change", applyFilters);
    document.querySelectorAll(".view-btn").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
    el("#closeDetail").addEventListener("click", closeDetail);
    el("#detailOverlay").addEventListener("click", (e) => { if (e.target.id === "detailOverlay") closeDetail(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDetail(); });
    el("#themeToggle").addEventListener("click", toggleTheme);
    document.querySelectorAll("#projectsTable th[data-key]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = key; state.sortDir = "desc"; }
        applyFilters();
      });
    });
  }

  async function init() {
    initTheme();
    bindEvents();
    await loadData();
    populateFilters();
    renderSummary();
    applyFilters();
  }

  init();
})();
