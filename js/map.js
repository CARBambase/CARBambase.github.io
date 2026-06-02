/* ============================================================================
   CARBambase — map.js
   Leaflet interactive map: species occurrence points (color-coded) +
   shaded suitability zones + a toggleable establishments layer.
   Includes basemap switching, fullscreen, and focus-from-table helpers.
   ========================================================================== */

window.BamMap = (function () {
  "use strict";

  let map = null;
  const speciesLayers = {};   // speciesId -> L.layerGroup
  const occMarkers = {};      // occurrence id -> marker
  const estMarkers = {};      // establishment id -> marker
  let zoneLayer = null;
  let estLayer = null;
  let initialized = false;

  const ZONE_COLORS = { High: "#2f7a36", Moderate: "#bd8a55", Low: "#a98a64" };
  const EST_TYPE_COLORS = {
    "Nursery": "#2f7a36",
    "Bambusetum / Garden": "#6a8a2f",
    "Demo Farm": "#bd8a55",
    "Natural Stand": "#3f7a6a",
    "Plantation": "#8a5d33",
  };

  // municipality -> {lat, lon} lookup from the canonical town list
  const TOWN_COORDS = {};
  (DATA.TOWNS || []).forEach((t) => (TOWN_COORDS[t.name] = { lat: t.lat, lon: t.lon }));

  function estDivIcon(color) {
    return L.divIcon({
      className: "est-pin",
      html: `<span style="display:block;width:14px;height:14px;background:${color};border:1.6px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);transform:rotate(45deg);border-radius:2px"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  function baseLayers() {
    return {
      "Light": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO",
      }),
      "Terrain": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17, subdomains: "abc",
        attribution: "Map data: &copy; OpenStreetMap, SRTM | &copy; OpenTopoMap (CC-BY-SA)",
      }),
      "Streets": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
      }),
      "Satellite": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" }
      ),
    };
  }

  /* ---- custom fullscreen control (browser Fullscreen API) ---- */
  function addFullscreenControl(m) {
    const expand =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
    const compress =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3a1 1 0 0 0 1-1V4M20 8h-3a1 1 0 0 1-1-1V4M4 16h3a1 1 0 0 1 1 1v3M20 16h-3a1 1 0 0 0-1 1v3"/></svg>';
    const Ctl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        const c = L.DomUtil.create("div", "leaflet-bar leaflet-control bam-fs");
        const a = L.DomUtil.create("a", "", c);
        a.href = "#"; a.title = "Toggle fullscreen"; a.setAttribute("role", "button");
        a.innerHTML = expand;
        const container = m.getContainer();
        const isFs = () => document.fullscreenElement || document.webkitFullscreenElement;
        L.DomEvent.on(a, "click", L.DomEvent.stop).on(a, "click", () => {
          if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          else (container.requestFullscreen || container.webkitRequestFullscreen).call(container);
        });
        const sync = () => { a.innerHTML = isFs() ? compress : expand; setTimeout(() => m.invalidateSize(), 120); };
        document.addEventListener("fullscreenchange", sync);
        document.addEventListener("webkitfullscreenchange", sync);
        return c;
      },
    });
    m.addControl(new Ctl());
  }

  function init() {
    if (initialized) { setTimeout(() => map && map.invalidateSize(), 60); return; }
    if (typeof L === "undefined") {
      const el = document.getElementById("map");
      if (el) el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;color:#6c6a5b">The map library could not be loaded. Please check your internet connection and refresh.</div>';
      return;
    }
    initialized = true;

    const bases = baseLayers();
    map = L.map("map", { scrollWheelZoom: true, zoomControl: true, layers: [bases.Light] }).setView([17.2, 121.0], 8);
    L.control.layers(bases, null, { position: "topright" }).addTo(map);
    addFullscreenControl(map);

    // ---- suitability zones ----
    zoneLayer = L.layerGroup();
    DATA.SUITABILITY_ZONES.forEach((z) => {
      const poly = L.polygon(z.polygon, {
        color: ZONE_COLORS[z.level], weight: 1.5, fillColor: ZONE_COLORS[z.level],
        fillOpacity: z.level === "High" ? 0.28 : z.level === "Moderate" ? 0.2 : 0.14,
        dashArray: z.level === "Low" ? "5,5" : null,
      });
      poly.bindPopup(`<strong>${z.name}</strong><br><em>Suitability: ${z.level}</em><br>${z.note}`);
      poly.bindTooltip(`${z.level} suitability`, { sticky: true });
      zoneLayer.addLayer(poly);
    });
    zoneLayer.addTo(map);

    // ---- species occurrence points ----
    DATA.SPECIES.forEach((sp) => (speciesLayers[sp.id] = L.layerGroup().addTo(map)));
    DATA.OCCURRENCES.forEach((o) => {
      const sp = DATA.SPECIES_BY_ID[o.speciesId];
      const r = 4 + Math.min(10, Math.sqrt(o.culms) / 2.2);
      const m = L.circleMarker([o.lat, o.lon], { radius: r, color: "#fff", weight: 1.2, fillColor: sp.color, fillOpacity: 0.9 });
      m.bindPopup(
        `<strong class="sci">${o.scientific}</strong><br><span style="color:#666">${o.common}</span><br><br>` +
        `<b>${o.municipality}</b>, ${o.province}<br>Culms: <b>${o.culms.toLocaleString()}</b><br>` +
        `Elevation: ${o.elevation} m<br>Observed: ${o.date}<br>` +
        `<span style="color:#888;font-size:.85em">${o.lat.toFixed(4)}, ${o.lon.toFixed(4)} · ${o.recorder}</span>`
      );
      speciesLayers[o.speciesId].addLayer(m);
      occMarkers[o.id] = m;
    });

    // ---- establishments layer (off by default) ----
    estLayer = L.layerGroup();
    const townCount = {};
    DATA.ESTABLISHMENTS.forEach((e) => {
      const base = TOWN_COORDS[e.municipality];
      if (!base) return;
      const i = (townCount[e.municipality] = (townCount[e.municipality] || 0) + 1) - 1;
      // small deterministic offset so multiple establishments in one town don't stack
      const lat = base.lat + (i % 3 - 1) * 0.018 + (i >= 3 ? 0.02 : 0);
      const lon = base.lon + (Math.floor(i / 3) % 2 ? -0.02 : 0.02) * ((i % 3) + 1) * 0.6;
      const color = EST_TYPE_COLORS[e.type] || "#8a5d33";
      const m = L.marker([lat, lon], { icon: estDivIcon(color) });
      const speciesList = e.species.map((id) => `<em>${DATA.SPECIES_BY_ID[id].scientific}</em>`).join(", ");
      m.bindPopup(
        `<span style="display:inline-block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:${color};padding:2px 8px;border-radius:999px">${e.type}</span><br>` +
        `<strong>${e.name}</strong><br><span style="color:#666">${e.manager}</span><br><br>` +
        `<b>${e.municipality}</b>, ${e.province}<br>Area: <b>${e.area}</b> · Est. ${e.year}<br>` +
        `<span style="font-size:.85em">Species: ${speciesList}</span>`
      );
      m.bindTooltip(`${e.type}: ${e.name}`, { sticky: true });
      estLayer.addLayer(m);
      estMarkers[e.id] = m;
    });

    setTimeout(() => map.invalidateSize(), 80);
  }

  function toggleSpecies(id, on) {
    const layer = speciesLayers[id];
    if (!layer) return;
    if (on) layer.addTo(map); else map.removeLayer(layer);
  }
  function toggleZones(on) { if (zoneLayer) { on ? zoneLayer.addTo(map) : map.removeLayer(zoneLayer); } }
  function toggleEstablishments(on) { if (estLayer) { on ? estLayer.addTo(map) : map.removeLayer(estLayer); } }
  function establishmentsVisible() { return !!(estLayer && map && map.hasLayer(estLayer)); }

  function focusSpecies(id) { Object.keys(speciesLayers).forEach((k) => toggleSpecies(k, k === id)); }

  function focusOccurrence(id) {
    const o = DATA.OCCURRENCES.find((x) => x.id === id);
    if (!o) return;
    toggleSpecies(o.speciesId, true);
    const m = occMarkers[id];
    if (!m) return;
    map.setView([o.lat, o.lon], 12, { animate: true });
    setTimeout(() => m.openPopup(), 350);
  }
  function focusEstablishment(id) {
    toggleEstablishments(true);
    const m = estMarkers[id];
    if (!m) return;
    map.setView(m.getLatLng(), 12, { animate: true });
    setTimeout(() => m.openPopup(), 350);
  }

  return {
    init, toggleSpecies, toggleZones, toggleEstablishments, establishmentsVisible,
    focusSpecies, focusOccurrence, focusEstablishment, ZONE_COLORS, EST_TYPE_COLORS,
  };
})();
