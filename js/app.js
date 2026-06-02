/* ============================================================================
   CARBambase — app.js
   Routing, rendering, search, galleries, tables, modal, and inline SVG art.
   ========================================================================== */

window.App = (function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let searchScope = "occurrences";
  let homeRendered = false;

  /* --------------------------------------------------------------------- */
  /* Inline SVG "photo" generator — keeps the prototype fully offline.      */
  /* --------------------------------------------------------------------- */
  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * pct); g = Math.round(g + (255 - g) * pct); b = Math.round(b + (255 - b) * pct);
    return `rgb(${r},${g},${b})`;
  }
  function darken(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * (1 - pct)); g = Math.round(g * (1 - pct)); b = Math.round(b * (1 - pct));
    return `rgb(${r},${g},${b})`;
  }

  // Draw a stylised bamboo grove illustration tinted to `color`, with an
  // optional emblem (emoji-free, vector) and a caption strip.
  function artSVG(color, caption, kind) {
    const W = 400, H = 300;
    const sky1 = shade(color, 0.72), sky2 = shade(color, 0.5);
    const culm = color, culmDark = darken(color, 0.22), leaf = darken(color, 0.1);
    const culms = [];
    const xs = [70, 130, 195, 250, 320];
    xs.forEach((x, i) => {
      const w = 12 + (i % 3) * 5;
      const top = 40 + (i % 4) * 14;
      let segs = "";
      for (let y = top; y < 250; y += 34) {
        segs += `<line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="${culmDark}" stroke-width="2.5"/>`;
      }
      culms.push(
        `<g opacity="${0.55 + (i % 3) * 0.15}">
           <rect x="${x - w / 2}" y="${top}" width="${w}" height="${250 - top}" rx="${w / 2}" fill="${culm}"/>
           ${segs}
           <path d="M${x} ${top} q -26 -12 -40 -34 q 30 6 40 30 q 10 -24 40 -30 q -14 22 -40 34 z" fill="${leaf}" opacity=".85"/>
         </g>`
      );
    });

    let emblem = "";
    if (kind === "product")
      emblem = `<g transform="translate(330,55)" opacity=".85"><circle r="22" fill="rgba(255,255,255,.85)"/><path d="M-9 -2 L0 -11 L9 -2 L9 9 L-9 9 Z" fill="${culmDark}"/></g>`;
    else if (kind === "publication")
      emblem = `<g transform="translate(330,55)" opacity=".9"><circle r="22" fill="rgba(255,255,255,.85)"/><rect x="-10" y="-11" width="20" height="22" rx="2" fill="${culmDark}"/><line x1="0" y1="-11" x2="0" y2="11" stroke="#fff" stroke-width="1.6"/></g>`;
    else if (kind === "news")
      emblem = `<g transform="translate(330,55)" opacity=".9"><circle r="22" fill="rgba(255,255,255,.85)"/><circle r="7" fill="${culmDark}"/><g stroke="${culmDark}" stroke-width="2.4"><line x1="0" y1="-16" x2="0" y2="-11"/><line x1="0" y1="11" x2="0" y2="16"/><line x1="-16" y1="0" x2="-11" y2="0"/><line x1="11" y1="0" x2="16" y2="0"/></g></g>`;

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#g)"/>
        <ellipse cx="200" cy="300" rx="260" ry="60" fill="${darken(color, 0.3)}" opacity=".25"/>
        ${culms.join("")}
        ${emblem}
        <rect x="0" y="248" width="${W}" height="52" fill="rgba(31,61,23,.55)"/>
        <text x="18" y="280" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700" fill="#fff">${esc(
          caption
        ).slice(0, 34)}</text>
      </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const TAG_COLORS = {
    Construction: "#6a4f2a", "Energy / Agri": "#558b2f", Handicraft: "#c62828", Furniture: "#8a6d3b",
    Food: "#ef6c00", Innovation: "#1565c0", Culture: "#ad1457", Lifestyle: "#00838f", Landscaping: "#2e7d32",
    "Agri / Energy": "#558b2f",
  };
  const PUBTYPE_COLORS = {
    "Technical Manual": "#3d6b27", "Field Guide": "#00838f", "Training Module": "#ef6c00",
    "Research Paper": "#1565c0", "Policy Brief": "#6a1b9a", Monograph: "#ad1457", "IEC / Primer": "#8a6d3b",
  };
  const NEWS_COLORS = {
    Event: "#2e7d32", Training: "#ef6c00", "Tech Demo": "#1565c0", Workshop: "#ad1457", Meeting: "#6a1b9a",
  };

  /* --------------------------------------------------------------------- */
  /* Routing                                                                */
  /* --------------------------------------------------------------------- */
  const ROUTES = ["home", "occurrences", "species", "establishments", "nurseries", "about", "contribute", "contact"];

  function go(route, pane) {
    if (!ROUTES.includes(route)) route = "home";
    $$(".view").forEach((v) => v.classList.remove("active"));
    $("#view-" + route).classList.add("active");

    // hero only on home
    $("#hero").style.display = route === "home" ? "" : "none";

    // nav highlight
    $$("#mainnav a").forEach((a) => a.classList.toggle("active", a.dataset.route === route && (route !== "home" || !pane)));

    // lazy render
    if (route === "home") {
      renderHome();
      if (pane) switchHomeTab(pane);
    } else if (route === "occurrences") renderOccurrences();
    else if (route === "species") renderSpecies();
    else if (route === "establishments") renderEstablishments();
    else if (route === "nurseries") renderNurseries();
    else if (route === "about") renderAbout();
    else if (route === "contribute") renderContribute();
    else if (route === "contact") renderContact();

    window.scrollTo({ top: route === "home" ? 0 : 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* --------------------------------------------------------------------- */
  /* Search                                                                 */
  /* --------------------------------------------------------------------- */
  function setupSearch() {
    $$("#searchtabs .search-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("#searchtabs .search-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        searchScope = btn.dataset.tab;
        const ph = {
          occurrences: "Search bamboo occurrences in the Cordillera…",
          species: "Search bamboo species…",
          establishments: "Search establishments (nurseries, gardens, plantations)…",
          nurseries: "Search nursery monitoring records…",
        }[searchScope];
        $("#heroSearch").placeholder = ph;
      });
    });
    const run = () => doSearch($("#heroSearch").value.trim());
    $("#heroSearchBtn").addEventListener("click", run);
    $("#heroSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  }

  function doSearch(term) {
    pendingSearch[searchScope] = term;
    go(searchScope);
  }
  function quick(term) {
    searchScope = "occurrences";
    pendingSearch.occurrences = term;
    go("occurrences");
  }
  const pendingSearch = { occurrences: "", species: "", establishments: "", nurseries: "" };

  /* --------------------------------------------------------------------- */
  /* HOME — tabs                                                            */
  /* --------------------------------------------------------------------- */
  function renderHome() {
    if (homeRendered) return;
    homeRendered = true;
    renderStatsBand();
    renderMapPane();
    renderStatistics();
    renderProducts();
    renderPublications();
    renderNews();
    renderPartners();
    renderRequestForm();

    $$("#hometabs button").forEach((b) =>
      b.addEventListener("click", () => switchHomeTab(b.dataset.pane))
    );

    // Map is the default-active home tab, so initialise it now (switchHomeTab
    // isn't fired for the already-active tab on first load).
    const activePane = $("#hometabs button.active");
    if (activePane && activePane.dataset.pane === "map") {
      requestAnimationFrame(() => BamMap.init());
    }
  }

  function switchHomeTab(pane) {
    $$("#hometabs button").forEach((b) => b.classList.toggle("active", b.dataset.pane === pane));
    $$(".tabpane").forEach((p) => p.classList.remove("active"));
    const el = $("#pane-" + pane);
    if (el) el.classList.add("active");
    if (pane === "map") BamMap.init();
    document.querySelector("#hometabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderStatsBand() {
    const s = DATA.STATS;
    // Hectares planted = total establishment area excluding natural stands.
    const hectares = DATA.ESTABLISHMENTS
      .filter((e) => e.type !== "Natural Stand")
      .reduce((a, e) => a + (parseFloat(e.area) || 0), 0);
    // Trees planted = planting materials from nursery records already out-planted.
    const treesPlanted = DATA.NURSERIES
      .filter((n) => n.status === "Planted")
      .reduce((a, n) => a + n.count, 0);
    const items = [
      [s.occurrences, "Occurrences"],
      [s.species, "Species"],
      [s.nurseries, "Nursery records"],
      [s.seedlings.toLocaleString(), "Planting materials"],
      [treesPlanted.toLocaleString(), "Trees planted"],
      [Math.round(hectares).toLocaleString(), "Hectares planted"],
    ];
    $("#statsBand").innerHTML =
      `<div class="stats-band-card">
        <div class="stats-band-eyebrow">The database at a glance</div>
        <div class="stats-band-grid">
          ${items.map(([n, l]) => `<div class="stat"><span class="num">${n}</span><span class="lbl">${l}</span></div>`).join("")}
        </div>
      </div>`;
  }

  /* ---- Map pane ---- */
  function renderMapPane() {
    const legend = DATA.SPECIES.map(
      (sp) =>
        `<div class="legend-item" data-sp="${sp.id}">
           <span class="dot" style="background:${sp.color}"></span>
           <span><span class="sci">${esc(sp.scientific)}</span></span>
         </div>`
    ).join("");

    const zones = Object.entries(BamMap.ZONE_COLORS)
      .map(
        ([lvl, c]) =>
          `<div class="legend-item"><span class="legend-swatch" style="background:${c};opacity:.5"></span>${lvl} suitability</div>`
      )
      .join("");

    const estLegend = Object.entries(BamMap.EST_TYPE_COLORS)
      .map(
        ([type, c]) =>
          `<div class="legend-item"><span class="est-diamond" style="background:${c}"></span>${esc(type)}</div>`
      )
      .join("");

    const chev = '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    const panel = (title, body, collapsed) =>
      `<div class="map-panel${collapsed ? " collapsed" : ""}">
        <button class="map-panel-head" type="button"><span>${title}</span>${chev}</button>
        <div class="map-panel-body">${body}</div>
      </div>`;

    $("#pane-map").innerHTML = `
      <h2 class="section-title">Distribution &amp; Suitability Map</h2>
      <p class="section-sub">Point distribution of bamboo occurrences across the Cordillera, color-coded by species, with shaded land-suitability zones.</p>
      <div class="map-layout">
        <div id="map"></div>
        <div class="map-side">
          ${panel("Map Layers",
            `<label class="layer-toggle"><input type="checkbox" id="tgZones" checked> Suitability zones</label>
             <label class="layer-toggle"><input type="checkbox" id="tgPoints" checked> Species occurrences</label>
             <label class="layer-toggle"><input type="checkbox" id="tgEst"> Establishments</label>`, true)}
          ${panel("Suitability", zones, true)}
          ${panel("Establishment types", estLegend, true)}
          ${panel("Species — click to isolate",
            `<div style="font-size:.78rem;margin:0 0 8px" class="muted">Click a name to show only that species · <a id="showAllSp" style="cursor:pointer">show all</a></div>${legend}`)}
        </div>
      </div>`;

    // collapsible panels
    $$("#pane-map .map-panel-head").forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("collapsed"))
    );

    // wire up after insertion
    $("#tgZones").addEventListener("change", (e) => BamMap.toggleZones(e.target.checked));
    $("#tgEst").addEventListener("change", (e) => BamMap.toggleEstablishments(e.target.checked));
    $("#tgPoints").addEventListener("change", (e) => {
      DATA.SPECIES.forEach((sp) => BamMap.toggleSpecies(sp.id, e.target.checked));
      $$("#pane-map .legend-item[data-sp]").forEach((li) => li.classList.toggle("off", !e.target.checked));
    });
    $$("#pane-map .legend-item[data-sp]").forEach((li) => {
      li.addEventListener("click", () => {
        BamMap.focusSpecies(li.dataset.sp);
        $$("#pane-map .legend-item[data-sp]").forEach((x) => x.classList.toggle("off", x !== li));
        $("#tgPoints").checked = true;
      });
    });
    $("#showAllSp").addEventListener("click", () => {
      DATA.SPECIES.forEach((sp) => BamMap.toggleSpecies(sp.id, true));
      $$("#pane-map .legend-item[data-sp]").forEach((x) => x.classList.remove("off"));
      $("#tgPoints").checked = true;
    });
  }

  /* ---- Carousel helper ---- */
  function carousel(cards) {
    const id = "car" + Math.random().toString(36).slice(2, 7);
    return `
      <div class="carousel">
        <button class="carousel-btn prev" data-car="${id}">‹</button>
        <div class="carousel-track" id="${id}">${cards}</div>
        <button class="carousel-btn next" data-car="${id}">›</button>
      </div>`;
  }
  function wireCarousels(root = document) {
    $$(".carousel-btn", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = document.getElementById(btn.dataset.car);
        if (track) track.scrollBy({ left: btn.classList.contains("next") ? 340 : -340, behavior: "smooth" });
      });
    });
  }

  /* ---- Products ---- */
  function renderProducts() {
    const cards = DATA.PRODUCTS.map((p) => {
      const color = TAG_COLORS[p.tag] || "#3d6b27";
      return `<div class="card wide" onclick='App.modalProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
        <img class="thumb" src="${artSVG(color, p.name, "product")}" alt="${esc(p.name)}"/>
        <div class="body">
          <span class="pill" style="background:${shade(color,.78)};color:${darken(color,.2)}">${esc(p.tag)}</span>
          <h3>${esc(p.name)}</h3>
          <div class="meta">📍 ${esc(p.location)}</div>
          <div class="desc">${esc(p.desc)}</div>
        </div>
      </div>`;
    }).join("");
    $("#pane-products").innerHTML = `
      <h2 class="section-title">Bamboo Products of the Cordillera</h2>
      <p class="section-sub">Community enterprises and value-added products, with their locations across the region.</p>
      ${carousel(cards)}`;
    wireCarousels($("#pane-products"));
  }

  /* ---- Publications ---- */
  function renderPublications() {
    const cards = DATA.PUBLICATIONS.map((p) => {
      const color = PUBTYPE_COLORS[p.type] || "#3d6b27";
      return `<div class="card wide" onclick='App.modalPublication(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
        <img class="thumb" src="${artSVG(color, p.title, "publication")}" alt="${esc(p.title)}"/>
        <div class="body">
          <span class="pill" style="background:${shade(color,.8)};color:${darken(color,.2)}">${esc(p.type)}</span>
          <h3>${esc(p.title)}</h3>
          <div class="meta">${esc(p.author)} · ${p.year}</div>
          <div class="desc">${esc(p.desc)}</div>
        </div>
      </div>`;
    }).join("");
    $("#pane-publications").innerHTML = `
      <h2 class="section-title">Publications &amp; Manuals</h2>
      <p class="section-sub">Manuals, modules, field guides, and research outputs produced under the program.</p>
      ${carousel(cards)}`;
    wireCarousels($("#pane-publications"));
  }

  /* ---- News ---- */
  function renderNews() {
    const cards = DATA.NEWS.map((p) => {
      const color = NEWS_COLORS[p.category] || "#3d6b27";
      return `<div class="card wide" onclick='App.modalNews(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
        <img class="thumb" src="${artSVG(color, p.title, "news")}" alt="${esc(p.title)}"/>
        <div class="body">
          <span class="pill" style="background:${shade(color,.8)};color:${darken(color,.2)}">${esc(p.category)}</span>
          <h3>${esc(p.title)}</h3>
          <div class="meta">🗓 ${esc(p.date)} · ${esc(p.location)}</div>
          <div class="desc">${esc(p.desc)}</div>
        </div>
      </div>`;
    }).join("");
    $("#pane-news").innerHTML = `
      <h2 class="section-title">News &amp; Engagements</h2>
      <p class="section-sub">Meetings, trainings, workshops, technology demonstrations, and events of the program.</p>
      ${carousel(cards)}`;
    wireCarousels($("#pane-news"));
  }

  /* ---- Partners ---- */
  function renderPartners() {
    const sucs = DATA.PARTNERS.sucs
      .map(
        (p) => `<div class="partner-card">
          <div class="partner-badge">${esc(p.abbr)}</div>
          <div><div class="pname">${esc(p.name)}</div><div class="prole">${esc(p.role)}</div><div class="prole">📍 ${esc(p.location)}</div></div>
        </div>`
      )
      .join("");
    const partners = DATA.PARTNERS.partners
      .map(
        (p) => `<div class="partner-card">
          <div class="partner-badge tan">${esc(p.abbr)}</div>
          <div><div class="pname">${esc(p.name)}</div><div class="prole">${esc(p.role)}</div></div>
        </div>`
      )
      .join("");
    $("#pane-partners").innerHTML = `
      <h2 class="section-title">Publishers, Partners &amp; Stakeholders</h2>
      <p class="section-sub">The consortium of Cordillera State Universities and Colleges and partner agencies driving the Cordillera Bamboo Program.</p>
      <h3 style="color:var(--forest-700);margin-top:10px">State Universities &amp; Colleges (CAR)</h3>
      <div class="partner-grid" style="margin-bottom:30px">${sucs}</div>
      <h3 style="color:var(--forest-700)">Partner Agencies &amp; Stakeholders</h3>
      <div class="partner-grid">${partners}</div>`;
  }

  /* --------------------------------------------------------------------- */
  /* STATISTICS — province-level summary + charts + report                 */
  /* --------------------------------------------------------------------- */
  function provinceSummary() {
    const provs = {};
    const ensure = (p) =>
      provs[p] || (provs[p] = { province: p, occ: 0, culms: 0, est: 0, nur: 0, seedlings: 0, species: new Set() });
    DATA.OCCURRENCES.forEach((o) => { const r = ensure(o.province); r.occ++; r.culms += o.culms; r.species.add(o.speciesId); });
    DATA.ESTABLISHMENTS.forEach((e) => { ensure(e.province).est++; });
    DATA.NURSERIES.forEach((n) => { const r = ensure(n.province); r.nur++; r.seedlings += n.count; });
    return Object.values(provs)
      .map((r) => ({ ...r, speciesCount: r.species.size }))
      .sort((a, b) => b.occ - a.occ);
  }

  function barChart(title, items, color) {
    const max = Math.max(...items.map((i) => i.value), 1);
    const rows = items
      .map(
        (i) => `<div class="bar-row">
          <div class="bar-label" title="${esc(i.label)}">${esc(i.label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${((i.value / max) * 100).toFixed(1)}%;background:${i.color || color}"></div></div>
          <div class="bar-val">${i.value.toLocaleString()}</div>
        </div>`
      )
      .join("");
    return `<div class="chart-card"><h4>${esc(title)}</h4>${rows}</div>`;
  }

  function municipalitySummary(province) {
    const towns = {};
    const ensure = (m) => towns[m] || (towns[m] = { municipality: m, occ: 0, culms: 0, est: 0, seedlings: 0, species: new Set() });
    DATA.OCCURRENCES.filter((o) => o.province === province).forEach((o) => { const r = ensure(o.municipality); r.occ++; r.culms += o.culms; r.species.add(o.speciesId); });
    DATA.ESTABLISHMENTS.filter((e) => e.province === province).forEach((e) => { ensure(e.municipality).est++; });
    DATA.NURSERIES.filter((n) => n.province === province).forEach((n) => { const r = ensure(n.municipality); r.seedlings += n.count; });
    return Object.values(towns).map((r) => ({ ...r, speciesCount: r.species.size })).sort((a, b) => b.occ - a.occ);
  }

  function renderStatistics() {
    const provinces = provinceSummary().map((r) => r.province).sort();
    $("#pane-statistics").innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px">
        <div>
          <h2 class="section-title">Regional Statistics</h2>
          <p class="section-sub" style="margin-bottom:0">Summary of bamboo occurrences, establishments, and planting materials across the Cordillera.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label style="font-size:.88rem;font-weight:600;color:var(--muted)">Province
            <select id="statProvince" style="margin-left:6px;font-family:var(--font-body);font-size:.92rem;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:#fff">
              <option value="">All provinces (CAR)</option>
              ${provinces.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("")}
            </select>
          </label>
          <button class="btn-primary" onclick="App.generateReport()">⤓ Generate Summary Report</button>
        </div>
      </div>
      <div class="kpi-row" id="statKpis"></div>
      <div id="statTable"></div>
      <div class="chart-grid" id="statCharts"></div>`;

    $("#statProvince").addEventListener("change", (e) => applyStats(e.target.value));
    applyStats("");
  }

  function applyStats(province) {
    const kpiRow = (items) =>
      items.map(([n, l]) => `<div class="kpi"><div class="kpi-num">${n}</div><div class="kpi-lbl">${l}</div></div>`).join("");

    if (!province) {
      // ---- region-wide view ----
      const ps = provinceSummary();
      const s = DATA.STATS;
      $("#statKpis").innerHTML = kpiRow([
        [s.occurrences, "Occurrence records"],
        [s.species, "Species documented"],
        [s.establishments, "Establishments"],
        [s.seedlings.toLocaleString(), "Planting materials"],
      ]);
      $("#statTable").innerHTML = `<div class="table-wrap" style="margin:8px 0 26px"><table class="data">
        <thead><tr><th>Province</th><th>Occurrences</th><th>Culms recorded</th><th>Species</th><th>Establishments</th><th>Nursery records</th><th>Planting materials</th></tr></thead>
        <tbody>${ps.map((r) => `<tr><td><strong>${esc(r.province)}</strong></td><td>${r.occ}</td><td>${r.culms.toLocaleString()}</td><td>${r.speciesCount}</td><td>${r.est}</td><td>${r.nur}</td><td>${r.seedlings.toLocaleString()}</td></tr>`).join("")}</tbody>
      </table></div>`;
      const spCounts = DATA.SPECIES.map((sp) => ({ label: sp.scientific, value: DATA.OCCURRENCES.filter((o) => o.speciesId === sp.id).length, color: sp.color })).sort((a, b) => b.value - a.value);
      $("#statCharts").innerHTML =
        barChart("Occurrences by province", ps.map((r) => ({ label: r.province, value: r.occ })), "#4a7c2f") +
        barChart("Planting materials by province", ps.map((r) => ({ label: r.province, value: r.seedlings })), "#c9a86a") +
        barChart("Culms recorded by province", ps.map((r) => ({ label: r.province, value: r.culms })), "#3d6b27") +
        barChart("Occurrences by species", spCounts, "#4a7c2f");
      return;
    }

    // ---- single-province view (breakdown by municipality) ----
    const ms = municipalitySummary(province);
    const occ = DATA.OCCURRENCES.filter((o) => o.province === province);
    const est = DATA.ESTABLISHMENTS.filter((e) => e.province === province);
    const nur = DATA.NURSERIES.filter((n) => n.province === province);
    const speciesHere = new Set(occ.map((o) => o.speciesId));
    const seedlings = nur.reduce((a, n) => a + n.count, 0);

    $("#statKpis").innerHTML = kpiRow([
      [occ.length, "Occurrences in " + province],
      [speciesHere.size, "Species recorded"],
      [est.length, "Establishments"],
      [seedlings.toLocaleString(), "Planting materials"],
    ]);

    if (!ms.length) {
      $("#statTable").innerHTML = `<div class="disclaimer" style="margin:8px 0 26px">No municipal records for ${esc(province)} in this prototype dataset.</div>`;
      $("#statCharts").innerHTML = "";
      return;
    }

    $("#statTable").innerHTML = `<div class="table-wrap" style="margin:8px 0 26px"><table class="data">
      <thead><tr><th>Municipality</th><th>Occurrences</th><th>Culms recorded</th><th>Species</th><th>Establishments</th><th>Planting materials</th></tr></thead>
      <tbody>${ms.map((r) => `<tr><td><strong>${esc(r.municipality)}</strong></td><td>${r.occ}</td><td>${r.culms.toLocaleString()}</td><td>${r.speciesCount}</td><td>${r.est}</td><td>${r.seedlings.toLocaleString()}</td></tr>`).join("")}</tbody>
    </table></div>`;

    const spCounts = DATA.SPECIES.map((sp) => ({ label: sp.scientific, value: occ.filter((o) => o.speciesId === sp.id).length, color: sp.color }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    $("#statCharts").innerHTML =
      barChart("Occurrences by municipality", ms.map((r) => ({ label: r.municipality, value: r.occ })), "#4a7c2f") +
      barChart("Planting materials by municipality", ms.map((r) => ({ label: r.municipality, value: r.seedlings })), "#c9a86a") +
      barChart("Culms recorded by municipality", ms.map((r) => ({ label: r.municipality, value: r.culms })), "#3d6b27") +
      barChart(`Occurrences by species in ${province}`, spCounts, "#4a7c2f");
  }

  /* ---- Printable / PDF summary report (opens in a new tab) ---- */
  function generateReport() {
    const ps = provinceSummary();
    const s = DATA.STATS;
    const now = new Date();
    const stamp = now.toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" });

    const estByType = {};
    DATA.ESTABLISHMENTS.forEach((e) => (estByType[e.type] = (estByType[e.type] || 0) + 1));
    const nurByStatus = {};
    DATA.NURSERIES.forEach((n) => (nurByStatus[n.status] = (nurByStatus[n.status] || 0) + 1));

    const provRows = ps
      .map(
        (r) => `<tr><td>${r.province}</td><td>${r.occ}</td><td>${r.culms.toLocaleString()}</td>
          <td>${r.speciesCount}</td><td>${r.est}</td><td>${r.nur}</td><td>${r.seedlings.toLocaleString()}</td></tr>`
      )
      .join("");
    const totals = ps.reduce(
      (a, r) => ({ occ: a.occ + r.occ, culms: a.culms + r.culms, est: a.est + r.est, nur: a.nur + r.nur, seed: a.seed + r.seedlings }),
      { occ: 0, culms: 0, est: 0, nur: 0, seed: 0 }
    );

    const spRows = DATA.SPECIES.map((sp) => {
      const occ = DATA.OCCURRENCES.filter((o) => o.speciesId === sp.id);
      const culms = occ.reduce((a, o) => a + o.culms, 0);
      return `<tr><td><em>${sp.scientific}</em></td><td>${sp.common}</td><td>${occ.length}</td><td>${culms.toLocaleString()}</td></tr>`;
    }).join("");

    const estRows = Object.entries(estByType).map(([t, n]) => `<tr><td>${t}</td><td>${n}</td></tr>`).join("");
    const nurRows = Object.entries(nurByStatus).map(([t, n]) => `<tr><td>${t}</td><td>${n}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cordillera Bamboo Database — Summary Report</title>
      <style>
        @page { margin: 18mm; }
        body { font-family: "Segoe UI", system-ui, sans-serif; color:#2b2b26; max-width:900px; margin:0 auto; padding:24px; }
        h1 { color:#2f5320; margin-bottom:2px; } h2 { color:#3d6b27; border-bottom:2px solid #e6ddcb; padding-bottom:5px; margin-top:30px; }
        .sub { color:#6f6e62; } .stamp { color:#6f6e62; font-size:.85rem; }
        table { width:100%; border-collapse:collapse; margin-top:10px; font-size:.9rem; }
        th,td { border:1px solid #e0d8c4; padding:7px 9px; text-align:left; } th { background:#e8f0dd; color:#1f3d17; }
        tfoot td { font-weight:700; background:#faf7f0; }
        .kpis { display:flex; gap:10px; flex-wrap:wrap; margin:14px 0; }
        .k { border:1px solid #e6ddcb; border-radius:8px; padding:10px 16px; min-width:120px; }
        .k b { font-size:1.5rem; color:#2f5320; display:block; } .k span { font-size:.78rem; color:#6f6e62; }
        .note { background:#efe6d3; border:1px dashed #c9a86a; color:#8a6d3b; padding:8px 12px; border-radius:6px; font-size:.82rem; margin:14px 0; }
        .toolbar { position:sticky; top:0; background:#fff; padding:10px 0; border-bottom:1px solid #e6ddcb; margin-bottom:10px; }
        .toolbar button { background:#3d6b27; color:#fff; border:none; padding:9px 18px; border-radius:7px; font-weight:700; cursor:pointer; font-size:.9rem; }
        @media print { .toolbar { display:none; } }
      </style></head><body>
      <div class="toolbar"><button onclick="window.print()">⤓ Print / Save as PDF</button></div>
      <h1>Cordillera Bamboo Database</h1>
      <div class="sub">Regional Summary Report — Cordillera Bamboo Program</div>
      <div class="stamp">Generated ${stamp}</div>
      <div class="note">Prototype report — all figures below are illustrative dummy data for presentation purposes.</div>

      <div class="kpis">
        <div class="k"><b>${s.occurrences}</b><span>Occurrence records</span></div>
        <div class="k"><b>${s.species}</b><span>Species documented</span></div>
        <div class="k"><b>${s.establishments}</b><span>Establishments</span></div>
        <div class="k"><b>${s.nurseries}</b><span>Nursery records</span></div>
        <div class="k"><b>${s.seedlings.toLocaleString()}</b><span>Planting materials</span></div>
      </div>

      <h2>Summary by Province</h2>
      <table>
        <thead><tr><th>Province</th><th>Occurrences</th><th>Culms</th><th>Species</th><th>Establishments</th><th>Nursery records</th><th>Planting materials</th></tr></thead>
        <tbody>${provRows}</tbody>
        <tfoot><tr><td>Total (CAR)</td><td>${totals.occ}</td><td>${totals.culms.toLocaleString()}</td><td>${s.species}</td><td>${totals.est}</td><td>${totals.nur}</td><td>${totals.seed.toLocaleString()}</td></tr></tfoot>
      </table>

      <h2>Species Recorded</h2>
      <table><thead><tr><th>Scientific name</th><th>Common name</th><th>Occurrences</th><th>Culms recorded</th></tr></thead><tbody>${spRows}</tbody></table>

      <h2>Establishments by Type</h2>
      <table><thead><tr><th>Type</th><th>Count</th></tr></thead><tbody>${estRows}</tbody></table>

      <h2>Nursery Records by Status</h2>
      <table><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${nurRows}</tbody></table>

      <p class="stamp" style="margin-top:30px">© 2026 Cordillera Bamboo Program · CAR State Universities and Colleges · CARBambase prototype.</p>
      </body></html>`;

    const w = window.open("", "_blank");
    if (!w) { alert("Please allow pop-ups to view the summary report."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /* --------------------------------------------------------------------- */
  /* REQUEST DATA — form                                                    */
  /* --------------------------------------------------------------------- */
  function renderRequestForm() {
    const datasets = ["Occurrences", "Species", "Establishments", "Nurseries", "Map / spatial layers"];
    $("#pane-request").innerHTML = `
      <h2 class="section-title">Request Data</h2>
      <p class="section-sub">Researchers, agencies, and partners may request access to bamboo datasets. Complete the form and the data management team will respond.</p>
      <div class="disclaimer">⚠ Prototype — this form does not transmit data. Submissions are simulated for the demo.</div>

      <div class="request-layout">
        <form id="reqForm" class="req-form" novalidate>
          <div class="field-row">
            <label>Full name *<input type="text" name="name" required placeholder="Juan Dela Cruz"></label>
            <label>Email *<input type="email" name="email" required placeholder="name@example.com"></label>
          </div>
          <div class="field-row">
            <label>Organization / Affiliation *<input type="text" name="org" required placeholder="University / Agency / LGU"></label>
            <label>Contact number<input type="text" name="phone" placeholder="+63 9xx xxx xxxx"></label>
          </div>

          <label class="block-label">Datasets requested *</label>
          <div class="checks">
            ${datasets.map((d) => `<label class="chk"><input type="checkbox" name="datasets" value="${esc(d)}"> ${esc(d)}</label>`).join("")}
          </div>

          <div class="field-row">
            <label>Preferred format
              <select name="format"><option>CSV</option><option>Microsoft Excel (.xlsx)</option><option>GeoJSON / shapefile</option><option>PDF report</option></select>
            </label>
            <label>Intended use *
              <select name="useType" required>
                <option value="">Select…</option>
                <option>Academic research</option><option>Government / policy</option>
                <option>Conservation / NGO</option><option>Commercial / enterprise</option><option>Education</option><option>Other</option>
              </select>
            </label>
          </div>

          <label class="block-label">Purpose / description of request *
            <textarea name="purpose" rows="4" required placeholder="Briefly describe how the data will be used…"></textarea>
          </label>

          <label class="chk" style="margin:6px 0 14px"><input type="checkbox" name="agree" required> I agree to use the data responsibly and to cite the Cordillera Bamboo Program as the source. *</label>

          <div class="form-error" id="reqError" style="display:none"></div>
          <button type="submit" class="btn-primary">Submit Request</button>
        </form>

        <aside class="req-aside">
          <h4>How requests are handled</h4>
          <ol class="req-steps">
            <li>Submit this form with your intended use.</li>
            <li>The data management team reviews the request (typically 3–5 working days).</li>
            <li>Approved datasets are shared in your preferred format with usage terms.</li>
          </ol>
          <p class="muted" style="font-size:.85rem">For urgent or bulk requests, coordinate directly with the lead implementing SUC.</p>
        </aside>
      </div>`;

    $("#reqForm").addEventListener("submit", submitRequest);
  }

  function submitRequest(e) {
    e.preventDefault();
    const f = e.target;
    const el = (n) => f.elements[n];
    const data = {
      name: el("name").value.trim(),
      email: el("email").value.trim(),
      org: el("org").value.trim(),
      phone: el("phone").value.trim(),
      datasets: $$('input[name="datasets"]:checked', f).map((c) => c.value),
      format: el("format").value,
      useType: el("useType").value,
      purpose: el("purpose").value.trim(),
      agree: el("agree").checked,
    };
    const errEl = $("#reqError");
    const problems = [];
    if (!data.name) problems.push("full name");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) problems.push("a valid email");
    if (!data.org) problems.push("organization");
    if (!data.datasets.length) problems.push("at least one dataset");
    if (!data.useType) problems.push("intended use");
    if (!data.purpose) problems.push("purpose");
    if (!data.agree) problems.push("agreement to the usage terms");
    if (problems.length) {
      errEl.style.display = "block";
      errEl.textContent = "Please provide: " + problems.join(", ") + ".";
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const ref = "REQ-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const body = encodeURIComponent(
      `Data Request ${ref}\n\nName: ${data.name}\nEmail: ${data.email}\nOrganization: ${data.org}\nContact: ${data.phone || "—"}\n` +
        `Datasets: ${data.datasets.join(", ")}\nFormat: ${data.format}\nIntended use: ${data.useType}\n\nPurpose:\n${data.purpose}\n`
    );
    const mailto = `mailto:data@cordillerabamboo.ph?subject=${encodeURIComponent("Bamboo Data Request " + ref)}&body=${body}`;

    $("#pane-request").innerHTML = `
      <div class="request-success">
        <div class="success-check">✓</div>
        <h2>Request submitted</h2>
        <p class="muted">Thank you, ${esc(data.name)}. Your data request has been recorded.</p>
        <div class="ref-badge">Reference no. <strong>${ref}</strong></div>
        <table class="taxon-table" style="max-width:520px;margin:18px auto 0;text-align:left">
          <tr><td>Organization</td><td>${esc(data.org)}</td></tr>
          <tr><td>Email</td><td>${esc(data.email)}</td></tr>
          <tr><td>Datasets</td><td>${esc(data.datasets.join(", "))}</td></tr>
          <tr><td>Format</td><td>${esc(data.format)}</td></tr>
          <tr><td>Intended use</td><td>${esc(data.useType)}</td></tr>
        </table>
        <div class="disclaimer" style="max-width:520px;margin:18px auto">⚠ Prototype — no data was actually transmitted. In production this request would be routed to the data management team.</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="btn-primary" href="${mailto}">✉ Email this request</a>
          <button class="btn-ghost" onclick="App.resetRequest()">Submit another request</button>
        </div>
      </div>`;
  }

  function resetRequest() { renderRequestForm(); }

  /* --------------------------------------------------------------------- */
  /* Table row -> map focus                                                 */
  /* --------------------------------------------------------------------- */
  function showOccurrenceOnMap(id) {
    go("home", "map");
    setTimeout(() => BamMap.focusOccurrence(id), 420);
  }
  function showEstablishmentOnMap(id) {
    go("home", "map");
    const cb = $("#tgEst");
    if (cb) cb.checked = true;
    setTimeout(() => BamMap.focusEstablishment(id), 420);
  }

  /* --------------------------------------------------------------------- */
  /* ABOUT                                                                  */
  /* --------------------------------------------------------------------- */
  function renderAbout() {
    const objectives = [
      ["🗺️", "Document &amp; map biodiversity", "Build a georeferenced inventory of native and introduced bamboo species across the Cordillera."],
      ["🌱", "Quality planting materials", "Establish nurseries and propagation systems to supply healthy, traceable seedlings."],
      ["🌾", "Demonstration &amp; plantations", "Set up demo farms and plantations that model good agronomic and conservation practice."],
      ["🏭", "Enterprise &amp; value chains", "Strengthen community enterprises and value-added bamboo products and markets."],
      ["🎓", "Capacity &amp; conservation", "Train communities and partners while safeguarding bamboo genetic resources."],
      ["📊", "Open data &amp; decisions", "Consolidate program data into an open resource for planning and research."],
    ].map(([icon, t, d]) => `<div class="feature-card"><div class="feature-icon">${icon}</div><h3>${t}</h3><p>${d}</p></div>`).join("");

    const timeline = [
      ["2021", "Inception &amp; baseline", "Program established; baseline biodiversity and site assessments begin."],
      ["2022", "Nurseries &amp; germplasm", "Nursery establishment and germplasm collection across partner SUCs."],
      ["2023", "Demo farms &amp; training", "Demonstration farms set up; training-of-trainers rolled out region-wide."],
      ["2024", "Enterprise development", "Value-chain studies and community enterprise support scaled up."],
      ["2025", "Scaling &amp; monitoring", "Plantation expansion, monitoring, and database development."],
      ["2026", "Consolidation", "Data consolidation and broad stakeholder engagement."],
    ].map(([y, t, d]) => `<div class="tl-item"><div class="tl-year">${y}</div><div class="tl-body"><strong>${t}</strong><p>${d}</p></div></div>`).join("");

    const provinces = ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"]
      .map((p) => `<span class="chip-lg">${p}</span>`).join("");

    $("#about-root").innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › About</div>
      <h1 class="page-title">About the Program</h1>
      <p class="page-sub">The Cordillera Bamboo Program is a collaborative initiative of the State Universities and Colleges (SUCs) of the Cordillera Administrative Region to advance bamboo industry development and environmental conservation.</p>

      <div class="about-intro">
        <p>Bamboo is a fast-growing, climate-resilient resource with the potential to support upland livelihoods, restore degraded watersheds, and build a sustainable green industry in the Cordillera. The program unites the region's SUCs and partner agencies to document bamboo resources, produce quality planting materials, develop enterprises, and conserve native species — and to make the resulting knowledge openly available through this database.</p>
      </div>

      <h2 class="section-title" style="margin-top:36px">Program Objectives</h2>
      <div class="feature-grid">${objectives}</div>

      <h2 class="section-title" style="margin-top:44px">Program Timeline</h2>
      <div class="timeline">${timeline}</div>

      <h2 class="section-title" style="margin-top:44px">Coverage</h2>
      <p class="section-sub">Implemented across the six provinces of the Cordillera Administrative Region.</p>
      <div class="chip-row">${provinces}</div>

      <div class="cta-band">
        <div>
          <h3 style="color:#fff;margin:0 0 4px">Powered by a regional consortium</h3>
          <p style="margin:0;color:rgba(243,239,228,.85)">Six State Universities and Colleges and partner agencies drive the program forward.</p>
        </div>
        <button class="btn-ghost" onclick="App.go('home','partners')">Meet the partners →</button>
      </div>`;
  }

  /* --------------------------------------------------------------------- */
  /* CONTRIBUTE DATA                                                        */
  /* --------------------------------------------------------------------- */
  function renderContribute() {
    const types = ["Occurrence records", "Species information", "Establishment", "Nursery monitoring", "Products", "Publications", "Other"];
    const provinces = ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"];
    $("#contribute-root").innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Contribute</div>
      <h1 class="page-title">Contribute Data</h1>
      <p class="page-sub">Partner SUCs, agencies, LGUs, and community groups can submit bamboo data to be included in the database. Every contribution helps build a complete regional picture.</p>

      <div class="review-note">
        <span class="review-ico">🛡️</span>
        <div><strong>All submissions are reviewed before publishing.</strong> Contributed data undergoes validation and quality review by the program's data management team. Records are only published on the site once verified — this keeps the database accurate and trustworthy.</div>
      </div>

      <div class="request-layout">
        <form id="contribForm" class="req-form" novalidate>
          <div class="field-row">
            <label>Contributor name *<input type="text" name="name" required placeholder="Juan Dela Cruz"></label>
            <label>Email *<input type="email" name="email" required placeholder="name@example.com"></label>
          </div>
          <div class="field-row">
            <label>Organization / SUC *<input type="text" name="org" required placeholder="University / Agency / LGU"></label>
            <label>Role / position<input type="text" name="role" placeholder="e.g. Researcher, Forester"></label>
          </div>
          <div class="field-row">
            <label>Type of data *
              <select name="dtype" required><option value="">Select…</option>${types.map((t) => `<option>${esc(t)}</option>`).join("")}</select>
            </label>
            <label>Province covered
              <select name="province"><option value="">Region-wide / N/A</option>${provinces.map((p) => `<option>${esc(p)}</option>`).join("")}</select>
            </label>
          </div>
          <div class="field-row">
            <label>Municipality / locality<input type="text" name="locality" placeholder="e.g. Tabuk City"></label>
            <label>Approx. number of records<input type="text" name="count" placeholder="e.g. 25"></label>
          </div>

          <label class="block-label">Description of the dataset *
            <textarea name="desc" rows="4" required placeholder="Describe what the data contains, how and when it was collected, and any methods or sources…"></textarea>
          </label>

          <label class="block-label">Attach data file (CSV / Excel) — optional
            <input type="file" name="file" accept=".csv,.xlsx,.xls,.zip,.geojson">
          </label>

          <label class="chk" style="margin:6px 0 14px"><input type="checkbox" name="agree" required> I confirm the data is accurate to the best of my knowledge and consent to its review and possible publication, with attribution to the source. *</label>

          <div class="form-error" id="contribError" style="display:none"></div>
          <button type="submit" class="btn-primary">Submit for Review</button>
        </form>

        <aside class="req-aside">
          <h4>Review process</h4>
          <ol class="req-steps">
            <li><strong>Submit</strong> your dataset using this form.</li>
            <li><strong>Review &amp; validation</strong> by the data management team (typically 5–10 working days).</li>
            <li><strong>Publication</strong> on the site once verified — you'll be credited as the source.</li>
          </ol>
          <p class="muted" style="font-size:.85rem">Need a standard template? Request the data-contribution format from the <a onclick="App.go('contact')">program office</a>.</p>
        </aside>
      </div>`;

    $("#contribForm").addEventListener("submit", submitContribute);
  }

  function submitContribute(e) {
    e.preventDefault();
    const f = e.target;
    const el = (n) => f.elements[n];
    const data = {
      name: el("name").value.trim(),
      email: el("email").value.trim(),
      org: el("org").value.trim(),
      dtype: el("dtype").value,
      province: el("province").value || "Region-wide / N/A",
      desc: el("desc").value.trim(),
      file: (el("file").files && el("file").files[0]) ? el("file").files[0].name : "—",
      agree: el("agree").checked,
    };
    const problems = [];
    if (!data.name) problems.push("contributor name");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) problems.push("a valid email");
    if (!data.org) problems.push("organization");
    if (!data.dtype) problems.push("type of data");
    if (!data.desc) problems.push("a description");
    if (!data.agree) problems.push("the confirmation checkbox");
    const errEl = $("#contribError");
    if (problems.length) {
      errEl.style.display = "block";
      errEl.textContent = "Please provide: " + problems.join(", ") + ".";
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const ref = "SUB-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    $("#contribute-root").innerHTML = `
      <div class="request-success">
        <div class="success-check">🛡️</div>
        <h2>Submitted for review</h2>
        <p class="muted">Thank you, ${esc(data.name)}. Your contribution has been received and is now queued for validation.</p>
        <div class="ref-badge">Submission no. <strong>${ref}</strong> · <span style="color:var(--clay-800)">Status: Pending review</span></div>
        <table class="taxon-table" style="max-width:520px;margin:18px auto 0;text-align:left">
          <tr><td>Organization</td><td>${esc(data.org)}</td></tr>
          <tr><td>Data type</td><td>${esc(data.dtype)}</td></tr>
          <tr><td>Coverage</td><td>${esc(data.province)}</td></tr>
          <tr><td>Attached file</td><td>${esc(data.file)}</td></tr>
        </table>
        <div class="review-note" style="max-width:560px;margin:18px auto;text-align:left"><span class="review-ico">🛡️</span><div>Your data <strong>will be reviewed and validated before publishing</strong> on the site. The team will contact you at <strong>${esc(data.email)}</strong> if clarification is needed.</div></div>
        <div class="disclaimer" style="max-width:520px;margin:0 auto 18px">⚠ Prototype — no data was actually transmitted or stored.</div>
        <button class="btn-ghost" onclick="App.resetContribute()">Submit another contribution</button>
      </div>`;
  }
  function resetContribute() { renderContribute(); }

  /* --------------------------------------------------------------------- */
  /* CONTACT                                                                */
  /* --------------------------------------------------------------------- */
  function renderContact() {
    const cards = [
      ["🏛️", "Program Office", "Ifugao State University (lead SUC)", "Lamut, Ifugao", "president@ifsu.edu.ph", "(074) 422-XXXX"],
      ["📊", "Data Management", "Database &amp; data requests", "Center for Geoinformatics, BSU", "geoinformatics@bsu.edu.ph", "(074) 422-XXXX"],
      ["🤝", "Partnerships &amp; Media", "Engagements &amp; inquiries", "Cordillera Bamboo Program", "mail@email.com", "(074) 422-XXXX"],
    ].map(([ico, t, sub, addr, email, phone]) =>
      `<div class="contact-card"><div class="contact-ico">${ico}</div><h3>${t}</h3><p class="muted">${sub}</p>
        <p>📍 ${addr}<br>📧 <a href="mailto:${email}">${email}</a><br>📞 ${phone}</p></div>`
    ).join("");

    $("#contact-root").innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Contact</div>
      <h1 class="page-title">Contact Us</h1>
      <p class="page-sub">Get in touch with the Cordillera Bamboo Program for inquiries, collaboration, data, or media engagements.</p>

      <div class="contact-grid">${cards}</div>

      <div class="request-layout" style="margin-top:30px">
        <form id="contactForm" class="req-form" novalidate>
          <div class="field-row">
            <label>Name *<input type="text" name="name" required placeholder="Your name"></label>
            <label>Email *<input type="email" name="email" required placeholder="name@example.com"></label>
          </div>
          <label>Subject *<input type="text" name="subject" required placeholder="How can we help?"></label>
          <label class="block-label">Message *
            <textarea name="message" rows="5" required placeholder="Write your message…"></textarea>
          </label>
          <div class="form-error" id="contactError" style="display:none"></div>
          <button type="submit" class="btn-primary">Send Message</button>
        </form>
        <aside class="req-aside">
          <h4>Office hours</h4>
          <p style="font-size:.9rem;color:#5a4f3a;margin-top:0">Monday – Friday<br>8:00 AM – 5:00 PM (PHT)</p>
          <h4 style="margin-top:16px">Quick links</h4>
          <p style="font-size:.9rem">
            <a onclick="App.go('about')">About the Program</a><br>
            <a onclick="App.go('contribute')">Contribute Data</a><br>
            <a onclick="App.go('home','request')">Request Data</a><br>
            <a onclick="App.go('home','partners')">Partners &amp; SUCs</a>
          </p>
        </aside>
      </div>`;

    $("#contactForm").addEventListener("submit", submitContact);
  }

  function submitContact(e) {
    e.preventDefault();
    const f = e.target;
    const el = (n) => f.elements[n];
    const data = { name: el("name").value.trim(), email: el("email").value.trim(), subject: el("subject").value.trim(), message: el("message").value.trim() };
    const problems = [];
    if (!data.name) problems.push("your name");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) problems.push("a valid email");
    if (!data.subject) problems.push("a subject");
    if (!data.message) problems.push("a message");
    const errEl = $("#contactError");
    if (problems.length) {
      errEl.style.display = "block";
      errEl.textContent = "Please provide: " + problems.join(", ") + ".";
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const mailto = `mailto:info@cordillerabamboo.ph?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.message + "\n\n— " + data.name + " (" + data.email + ")")}`;
    $("#contact-root").innerHTML = `
      <div class="request-success">
        <div class="success-check">✓</div>
        <h2>Message sent</h2>
        <p class="muted">Thank you, ${esc(data.name)}. We'll respond to <strong>${esc(data.email)}</strong> as soon as we can.</p>
        <div class="disclaimer" style="max-width:520px;margin:18px auto">⚠ Prototype — no message was actually transmitted. You can also email us directly below.</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="btn-primary" href="${mailto}">✉ Email us directly</a>
          <button class="btn-ghost" onclick="App.resetContact()">Send another message</button>
        </div>
      </div>`;
  }
  function resetContact() { renderContact(); }

  /* --------------------------------------------------------------------- */
  /* Generic sortable table                                                 */
  /* --------------------------------------------------------------------- */
  function buildTable(container, columns, rows, options) {
    options = options || {};
    const state = { key: null, dir: 1 };
    function render() {
      let data = rows.slice();
      if (state.key) {
        const col = columns.find((c) => c.key === state.key);
        data.sort((a, b) => {
          const va = col.sortVal ? col.sortVal(a) : a[state.key];
          const vb = col.sortVal ? col.sortVal(b) : b[state.key];
          if (va < vb) return -1 * state.dir;
          if (va > vb) return 1 * state.dir;
          return 0;
        });
      }
      const head = columns
        .map(
          (c) =>
            `<th data-k="${c.key}">${esc(c.label)} ${
              state.key === c.key ? `<span class="arrow">${state.dir === 1 ? "▲" : "▼"}</span>` : ""
            }</th>`
        )
        .join("");
      const clickable = typeof options.onRowClick === "function";
      const body = data
        .map((r, i) => `<tr${clickable ? ` class="row-link" data-i="${i}" tabindex="0"` : ""}>` + columns.map((c) => `<td>${c.render(r)}</td>`).join("") + "</tr>")
        .join("");
      container.innerHTML = `<div class="table-wrap"><table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      $$("th", container).forEach((th) =>
        th.addEventListener("click", () => {
          const k = th.dataset.k;
          if (state.key === k) state.dir *= -1;
          else { state.key = k; state.dir = 1; }
          render();
        })
      );
      if (clickable) {
        $$("tr.row-link", container).forEach((tr) => {
          const row = data[+tr.dataset.i];
          tr.addEventListener("click", () => options.onRowClick(row));
          tr.addEventListener("keydown", (e) => { if (e.key === "Enter") options.onRowClick(row); });
        });
      }
    }
    render();
  }

  function spName(scientific, common, color) {
    return `<span class="sp-dot" style="background:${color}"></span><span class="sci-name">${esc(scientific)}</span><br><span class="muted" style="font-size:.85em">${esc(common)}</span>`;
  }

  /* --------------------------------------------------------------------- */
  /* OCCURRENCES                                                            */
  /* --------------------------------------------------------------------- */
  function renderOccurrences() {
    const root = $("#occ-root");
    const provinces = [...new Set(DATA.OCCURRENCES.map((o) => o.province))].sort();
    root.innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Occurrences</div>
      <h1 class="page-title">Occurrences</h1>
      <p class="page-sub">Geo-referenced bamboo occurrence records across the Cordillera Administrative Region.</p>
      <div class="disclaimer">⚠ Prototype — all records below are illustrative dummy data for presentation.</div>
      <div class="explorer-head">
        <div class="filters">
          <input type="search" id="occSearch" placeholder="Search species, town, recorder…"/>
          <select id="occSpecies"><option value="">All species</option>${DATA.SPECIES.map(
            (s) => `<option value="${s.id}">${esc(s.scientific)}</option>`
          ).join("")}</select>
          <select id="occProvince"><option value="">All provinces</option>${provinces
            .map((p) => `<option value="${esc(p)}">${esc(p)}</option>`)
            .join("")}</select>
        </div>
        <div class="result-count" id="occCount"></div>
      </div>
      <div class="map-tip">📍 Tip: click any row to view that occurrence on the interactive map.</div>
      <div id="occTable"></div>`;

    const columns = [
      { key: "scientific", label: "Scientific name", render: (r) => spName(r.scientific, r.common, DATA.SPECIES_BY_ID[r.speciesId].color) },
      { key: "municipality", label: "Municipality", render: (r) => esc(r.municipality) },
      { key: "province", label: "Province", render: (r) => esc(r.province) },
      { key: "culms", label: "# Culms", sortVal: (r) => r.culms, render: (r) => r.culms.toLocaleString() },
      { key: "lon", label: "Longitude", sortVal: (r) => r.lon, render: (r) => r.lon.toFixed(4) },
      { key: "lat", label: "Latitude", sortVal: (r) => r.lat, render: (r) => r.lat.toFixed(4) },
      { key: "elevation", label: "Elev. (m)", sortVal: (r) => r.elevation, render: (r) => r.elevation },
      { key: "date", label: "Date observed", render: (r) => r.date },
    ];

    function apply() {
      const q = $("#occSearch").value.toLowerCase().trim();
      const sp = $("#occSpecies").value;
      const pr = $("#occProvince").value;
      const rows = DATA.OCCURRENCES.filter((o) => {
        if (sp && o.speciesId !== sp) return false;
        if (pr && o.province !== pr) return false;
        if (q && !`${o.scientific} ${o.common} ${o.municipality} ${o.recorder} ${o.province}`.toLowerCase().includes(q))
          return false;
        return true;
      });
      $("#occCount").textContent = `${rows.length} of ${DATA.OCCURRENCES.length} records`;
      buildTable($("#occTable"), columns, rows, { onRowClick: (r) => showOccurrenceOnMap(r.id) });
    }
    $("#occSearch").addEventListener("input", apply);
    $("#occSpecies").addEventListener("change", apply);
    $("#occProvince").addEventListener("change", apply);

    if (pendingSearch.occurrences) { $("#occSearch").value = pendingSearch.occurrences; pendingSearch.occurrences = ""; }
    apply();
  }

  /* --------------------------------------------------------------------- */
  /* SPECIES — gallery + carousel + detail modal                            */
  /* --------------------------------------------------------------------- */
  function renderSpecies() {
    const root = $("#sp-root");
    const cards = DATA.SPECIES.map(
      (s) => `<div class="card wide" onclick="App.modalSpecies('${s.id}')">
        <img class="thumb" src="${artSVG(s.color, s.scientific, "species")}" alt="${esc(s.scientific)}"/>
        <div class="body">
          <h3 class="sci-name">${esc(s.scientific)}</h3>
          <div class="meta">${esc(s.common)}</div>
          <span class="pill tan">${esc(s.habit)}</span>
          <div class="desc">${esc(s.description.slice(0, 95))}…</div>
        </div>
      </div>`
    ).join("");

    const grid = DATA.SPECIES.map(
      (s) => `<div class="card" onclick="App.modalSpecies('${s.id}')">
        <img class="thumb" src="${artSVG(s.color, s.scientific, "species")}" alt="${esc(s.scientific)}"/>
        <div class="body">
          <h3 class="sci-name">${esc(s.scientific)}</h3>
          <div class="meta">${esc(s.common)}</div>
          <span class="pill tan">${esc(s.habit)}</span>
        </div>
      </div>`
    ).join("");

    root.innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Species</div>
      <h1 class="page-title">Bamboo Species</h1>
      <p class="page-sub">Bamboo species documented in the Cordillera, with taxonomic notes. Click any species for details.</p>
      <div class="disclaimer">⚠ Prototype — species illustrations are generated placeholders; descriptions are indicative.</div>
      <h3 style="color:var(--forest-700)">Featured gallery</h3>
      ${carousel(cards)}
      <h3 style="color:var(--forest-700);margin-top:34px">All species</h3>
      <div class="grid cols-4" style="margin-top:6px">${grid}</div>`;
    wireCarousels(root);

    if (pendingSearch.species) {
      const q = pendingSearch.species.toLowerCase();
      pendingSearch.species = "";
      const hit = DATA.SPECIES.find((s) => (s.scientific + " " + s.common + " " + s.id).toLowerCase().includes(q));
      if (hit) setTimeout(() => modalSpecies(hit.id), 120);
    }
  }

  /* --------------------------------------------------------------------- */
  /* ESTABLISHMENTS — matrix                                                */
  /* --------------------------------------------------------------------- */
  function renderEstablishments() {
    const root = $("#est-root");
    const provinces = [...new Set(DATA.ESTABLISHMENTS.map((e) => e.province))].sort();
    root.innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Establishments</div>
      <h1 class="page-title">Establishments</h1>
      <p class="page-sub">Bamboo establishments across the region — nurseries, bambuseta/gardens, demo farms, natural stands, and plantations.</p>
      <div class="disclaimer">⚠ Prototype — illustrative dummy data for presentation.</div>
      <div class="explorer-head">
        <div class="filters">
          <input type="search" id="estSearch" placeholder="Search name, municipality, manager…"/>
          <select id="estType"><option value="">All types</option>${DATA.EST_TYPES.map(
            (t) => `<option value="${esc(t)}">${esc(t)}</option>`
          ).join("")}</select>
          <select id="estProvince"><option value="">All provinces</option>${provinces
            .map((p) => `<option value="${esc(p)}">${esc(p)}</option>`)
            .join("")}</select>
        </div>
        <div class="result-count" id="estCount"></div>
      </div>
      <div class="map-tip">📍 Tip: click any row to locate that establishment on the interactive map.</div>
      <div id="estTable"></div>`;

    const columns = [
      { key: "type", label: "Type", render: (r) => `<span class="tag-cell" style="background:var(--forest-100);color:var(--forest-800)">${esc(r.type)}</span>` },
      { key: "name", label: "Establishment", render: (r) => `<strong>${esc(r.name)}</strong><br><span class="muted" style="font-size:.85em">${esc(r.manager)}</span>` },
      { key: "municipality", label: "Municipality", render: (r) => esc(r.municipality) },
      { key: "province", label: "Province", render: (r) => esc(r.province) },
      { key: "area", label: "Size / Area", sortVal: (r) => parseFloat(r.area), render: (r) => esc(r.area) },
      { key: "species", label: "Species", render: (r) => `<div class="species-mini">${r.species.map((id) => `<span class="chip">${esc(DATA.SPECIES_BY_ID[id].scientific)}</span>`).join("")}</div>` },
      { key: "year", label: "Est.", sortVal: (r) => r.year, render: (r) => r.year },
    ];

    function apply() {
      const q = $("#estSearch").value.toLowerCase().trim();
      const t = $("#estType").value, pr = $("#estProvince").value;
      const rows = DATA.ESTABLISHMENTS.filter((e) => {
        if (t && e.type !== t) return false;
        if (pr && e.province !== pr) return false;
        if (q && !`${e.name} ${e.municipality} ${e.manager} ${e.province}`.toLowerCase().includes(q)) return false;
        return true;
      });
      $("#estCount").textContent = `${rows.length} of ${DATA.ESTABLISHMENTS.length} establishments`;
      buildTable($("#estTable"), columns, rows, { onRowClick: (r) => showEstablishmentOnMap(r.id) });
    }
    $("#estSearch").addEventListener("input", apply);
    $("#estType").addEventListener("change", apply);
    $("#estProvince").addEventListener("change", apply);
    if (pendingSearch.establishments) { $("#estSearch").value = pendingSearch.establishments; pendingSearch.establishments = ""; }
    apply();
  }

  /* --------------------------------------------------------------------- */
  /* NURSERIES — monitoring matrix                                          */
  /* --------------------------------------------------------------------- */
  function renderNurseries() {
    const root = $("#nur-root");
    root.innerHTML = `
      <div class="breadcrumb"><a onclick="App.go('home')">Home</a> › Nurseries</div>
      <h1 class="page-title">Nursery Monitoring</h1>
      <p class="page-sub">Monitoring of bamboo planting materials — counts, source type, provenance, status, and last monitoring date.</p>
      <div class="disclaimer">⚠ Prototype — illustrative dummy data for presentation.</div>
      <div class="explorer-head">
        <div class="filters">
          <input type="search" id="nurSearch" placeholder="Search nursery, municipality, provenance…"/>
          <select id="nurType"><option value="">All source types</option><option>Procured</option><option>Produced</option><option>Donated</option></select>
          <select id="nurStatus"><option value="">All status</option><option>Maintained</option><option>Planted</option><option>Donated</option></select>
          <select id="nurSpecies"><option value="">All species</option>${DATA.SPECIES.map(
            (s) => `<option value="${s.id}">${esc(s.scientific)}</option>`
          ).join("")}</select>
        </div>
        <div class="result-count" id="nurCount"></div>
      </div>
      <div id="nurTable"></div>`;

    const columns = [
      { key: "nursery", label: "Nursery", render: (r) => `<strong>${esc(r.nursery)}</strong><br><span class="muted" style="font-size:.85em">${esc(r.municipality)}, ${esc(r.province)}</span>` },
      { key: "speciesId", label: "Species", sortVal: (r) => DATA.SPECIES_BY_ID[r.speciesId].scientific, render: (r) => spName(DATA.SPECIES_BY_ID[r.speciesId].scientific, DATA.SPECIES_BY_ID[r.speciesId].common, DATA.SPECIES_BY_ID[r.speciesId].color) },
      { key: "count", label: "# Bamboo", sortVal: (r) => r.count, render: (r) => `<strong>${r.count.toLocaleString()}</strong>` },
      { key: "type", label: "Type", render: (r) => `<span class="tag-cell" style="background:var(--clay-100);color:var(--clay-800)">${esc(r.type)}</span>` },
      { key: "provenance", label: "Provenance", render: (r) => esc(r.provenance) },
      { key: "date", label: "Date", render: (r) => r.date },
      { key: "status", label: "Status", render: (r) => `<span class="tag-cell status-${r.status}">${esc(r.status)}</span>` },
      { key: "lastMonitored", label: "Last monitored", render: (r) => r.lastMonitored },
    ];

    function apply() {
      const q = $("#nurSearch").value.toLowerCase().trim();
      const t = $("#nurType").value, st = $("#nurStatus").value, sp = $("#nurSpecies").value;
      const rows = DATA.NURSERIES.filter((n) => {
        if (t && n.type !== t) return false;
        if (st && n.status !== st) return false;
        if (sp && n.speciesId !== sp) return false;
        if (q && !`${n.nursery} ${n.municipality} ${n.provenance} ${n.province}`.toLowerCase().includes(q)) return false;
        return true;
      });
      const total = rows.reduce((s, n) => s + n.count, 0);
      $("#nurCount").textContent = `${rows.length} records · ${total.toLocaleString()} planting materials`;
      buildTable($("#nurTable"), columns, rows);
    }
    $("#nurSearch").addEventListener("input", apply);
    $("#nurType").addEventListener("change", apply);
    $("#nurStatus").addEventListener("change", apply);
    $("#nurSpecies").addEventListener("change", apply);
    if (pendingSearch.nurseries) { $("#nurSearch").value = pendingSearch.nurseries; pendingSearch.nurseries = ""; }
    apply();
  }

  /* --------------------------------------------------------------------- */
  /* MODALS                                                                 */
  /* --------------------------------------------------------------------- */
  function openModal(html) {
    $("#modalBody").innerHTML = html;
    $("#modalBg").classList.add("open");
  }
  function closeModal() { $("#modalBg").classList.remove("open"); }

  function modalSpecies(id) {
    const s = DATA.SPECIES_BY_ID[id];
    const occ = DATA.OCCURRENCES.filter((o) => o.speciesId === id);
    const towns = [...new Set(occ.map((o) => o.municipality))];
    openModal(`
      <div class="species-detail">
        <div>
          <div class="photo"><img src="${artSVG(s.color, s.scientific, "species")}" alt="${esc(s.scientific)}"/></div>
          <div style="margin-top:10px"><span class="pill" style="background:${shade(s.color,.78)};color:${darken(s.color,.2)}">${esc(s.habit)}</span></div>
        </div>
        <div>
          <h2 class="sci-name" style="font-size:1.7rem;margin-bottom:0">${esc(s.scientific)}</h2>
          <div class="muted" style="margin-bottom:10px">${esc(s.author)} · ${esc(s.common)}</div>
          <p>${esc(s.description)}</p>
          <table class="taxon-table">
            <tr><td>Growth habit</td><td>${esc(s.habit)}</td></tr>
            <tr><td>Culm height</td><td>${esc(s.culmHeight)}</td></tr>
            <tr><td>Culm diameter</td><td>${esc(s.culmDiameter)}</td></tr>
            <tr><td>Primary uses</td><td>${esc(s.uses)}</td></tr>
            <tr><td>Records in database</td><td>${occ.length} occurrence(s)</td></tr>
            <tr><td>Recorded municipalities</td><td>${towns.length ? esc(towns.join(", ")) : "—"}</td></tr>
          </table>
          <button style="margin-top:14px;border:none;background:var(--forest-700);color:#fff;padding:11px 18px;border-radius:8px;cursor:pointer;font-weight:700;font-family:var(--font-body);font-size:.92rem" onclick="App.closeModal();App.quickSpecies('${id}')">View occurrences in table →</button>
        </div>
      </div>`);
  }
  function quickSpecies(id) {
    pendingSearch.occurrences = DATA.SPECIES_BY_ID[id].scientific;
    go("occurrences");
  }

  function modalProduct(p) {
    const color = TAG_COLORS[p.tag] || "#3d6b27";
    openModal(`
      <img src="${artSVG(color, p.name, "product")}" style="width:100%;border-radius:10px;margin-bottom:16px"/>
      <span class="pill" style="background:${shade(color,.78)};color:${darken(color,.2)}">${esc(p.tag)}</span>
      <h2 style="margin-top:8px">${esc(p.name)}</h2>
      <p class="muted">📍 ${esc(p.location)} · Maker: ${esc(p.maker)}</p>
      <p>${esc(p.desc)}</p>
      <table class="taxon-table"><tr><td>Bamboo species</td><td class="sci-name">${esc(p.species)}</td></tr>
      <tr><td>Category</td><td>${esc(p.tag)}</td></tr><tr><td>Location</td><td>${esc(p.location)}</td></tr></table>`);
  }
  function modalPublication(p) {
    const color = PUBTYPE_COLORS[p.type] || "#3d6b27";
    openModal(`
      <img src="${artSVG(color, p.title, "publication")}" style="width:100%;border-radius:10px;margin-bottom:16px"/>
      <span class="pill" style="background:${shade(color,.8)};color:${darken(color,.2)}">${esc(p.type)}</span>
      <h2 style="margin-top:8px">${esc(p.title)}</h2>
      <p class="muted">${esc(p.author)} · ${p.year}</p>
      <p>${esc(p.desc)}</p>
      <p class="muted" style="font-size:.85rem">Prototype entry — document not attached in this demo.</p>`);
  }
  function modalNews(p) {
    const color = NEWS_COLORS[p.category] || "#3d6b27";
    openModal(`
      <img src="${artSVG(color, p.title, "news")}" style="width:100%;border-radius:10px;margin-bottom:16px"/>
      <span class="pill" style="background:${shade(color,.8)};color:${darken(color,.2)}">${esc(p.category)}</span>
      <h2 style="margin-top:8px">${esc(p.title)}</h2>
      <p class="muted">🗓 ${esc(p.date)} · 📍 ${esc(p.location)}</p>
      <p>${esc(p.desc)}</p>`);
  }

  /* --------------------------------------------------------------------- */
  function init() {
    setupSearch();
    renderHome();
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  }

  return {
    init, go, quick, quickSpecies,
    modalSpecies, modalProduct, modalPublication, modalNews, closeModal,
    generateReport, resetRequest, resetContribute, resetContact,
    showOccurrenceOnMap, showEstablishmentOnMap,
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
