/* ============================================================================
   CARBambase — Cordillera Bamboo Database (Prototype)
   data.js — all demo/dummy data for the prototype.
   NOTE: This is illustrative dummy data for stakeholder presentation only.
   ========================================================================== */

(function () {
  "use strict";

  /* --- tiny seeded RNG so the "random" demo data is stable across loads --- */
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260602);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const jitter = (v, amt) => +(v + (rng() - 0.5) * amt).toFixed(5);

  /* ------------------------------------------------------------------ */
  /* SPECIES                                                            */
  /* ------------------------------------------------------------------ */
  const SPECIES = [
    {
      id: "blumeana",
      scientific: "Bambusa blumeana",
      author: "J.A. & J.H. Schult.",
      common: "Kawayan tinik (Spiny bamboo)",
      color: "#2e7d32",
      habit: "Sympodial (clumping)",
      culmHeight: "15–25 m",
      culmDiameter: "8–15 cm",
      uses: "Construction, furniture, banking/erosion control, engineered bamboo",
      description:
        "A large, thorny, densely-tufted clumping bamboo and the most widely distributed native species in the Philippines. Recognised by curved spines on the lower branches. Favoured for heavy construction, engineered-bamboo boards, and riverbank stabilisation.",
    },
    {
      id: "vulgaris",
      scientific: "Bambusa vulgaris",
      author: "Schrad. ex J.C. Wendl.",
      common: "Kawayan kiling (Common bamboo)",
      color: "#f9a825",
      habit: "Sympodial (clumping)",
      culmHeight: "10–20 m",
      culmDiameter: "4–10 cm",
      uses: "Handicraft, furniture, construction, fish pens",
      description:
        "A fast-growing, open clump bamboo with smooth, glossy culms; the golden ('Vittata') form is widely planted as an ornamental. Easily propagated from cuttings, making it a staple of nursery production across the region.",
    },
    {
      id: "asper",
      scientific: "Dendrocalamus asper",
      author: "(Schult.) Backer",
      common: "Giant bamboo (Bayog)",
      color: "#6a1b9a",
      habit: "Sympodial (clumping)",
      culmHeight: "20–30 m",
      culmDiameter: "12–20 cm",
      uses: "Construction, engineered bamboo, edible shoots",
      description:
        "One of the largest cultivated bamboos, with thick-walled culms prized for structural use and laminated bamboo products. Its young shoots are edible and marketable, making it a priority species for plantation development.",
    },
    {
      id: "levis",
      scientific: "Gigantochloa levis",
      author: "(Blanco) Merr.",
      common: "Bolo (Kayali)",
      color: "#00838f",
      habit: "Sympodial (clumping)",
      culmHeight: "15–20 m",
      culmDiameter: "8–13 cm",
      uses: "Furniture, handicraft, edible shoots, construction",
      description:
        "A robust native clumping bamboo with straight, smooth culms and sweet edible shoots. Widely used for furniture and split-bamboo handicrafts in northern Luzon.",
    },
    {
      id: "lumampao",
      scientific: "Schizostachyum lumampao",
      author: "(Blanco) Merr.",
      common: "Buho (Philippine bamboo)",
      color: "#c62828",
      habit: "Sympodial (clumping)",
      culmHeight: "8–12 m",
      culmDiameter: "3–6 cm",
      uses: "Weaving, sawali, baskets, musical instruments, arrows",
      description:
        "A thin-walled, long-internode native bamboo central to Cordilleran weaving traditions (sawali, baskets). Lightweight and flexible, it is a key raw material for handicraft livelihoods.",
    },
    {
      id: "philippinensis",
      scientific: "Bambusa philippinensis",
      author: "(Gamble) McClure",
      common: "Laak",
      color: "#1565c0",
      habit: "Sympodial (clumping)",
      culmHeight: "8–15 m",
      culmDiameter: "4–8 cm",
      uses: "Handicraft, light construction, poles",
      description:
        "An endemic Philippine clumping bamboo with slender, erect culms suited to light construction and craftwork. Of conservation interest as a native genetic resource.",
    },
    {
      id: "latiflorus",
      scientific: "Dendrocalamus latiflorus",
      author: "Munro",
      common: "Sweet bamboo (Machiku)",
      color: "#ad1457",
      habit: "Sympodial (clumping)",
      culmHeight: "14–25 m",
      culmDiameter: "8–20 cm",
      uses: "Edible shoots (premium), construction, pulp",
      description:
        "Cultivated chiefly for its large, sweet, low-bitterness shoots, an important agroforestry and food-security species. Also yields good structural culms.",
    },
    {
      id: "multiplex",
      scientific: "Bambusa multiplex",
      author: "(Lour.) Raeusch. ex Schult.",
      common: "Hedge bamboo (Kawayang-tsina)",
      color: "#558b2f",
      habit: "Sympodial (clumping)",
      culmHeight: "3–7 m",
      culmDiameter: "1–3 cm",
      uses: "Hedges, ornamental, slope stabilisation",
      description:
        "A small, dense ornamental bamboo commonly planted as living fences and for landscaping. Useful for soil binding on road cuts and slopes in upland barangays.",
    },
    {
      id: "siamensis",
      scientific: "Thyrsostachys siamensis",
      author: "Gamble",
      common: "Thai monastery bamboo",
      color: "#ef6c00",
      habit: "Sympodial (clumping)",
      culmHeight: "7–13 m",
      culmDiameter: "3–8 cm",
      uses: "Umbrella handles, furniture, ornamental, edible shoots",
      description:
        "A tidy, drought-tolerant clumping bamboo with persistent culm sheaths. Introduced for ornamental avenues and cottage-industry products.",
    },
    {
      id: "aurea",
      scientific: "Phyllostachys aurea",
      author: "Carrière ex Rivière & C.Rivière",
      common: "Golden bamboo",
      color: "#9e9d24",
      habit: "Monopodial (running)",
      culmHeight: "5–10 m",
      culmDiameter: "2–5 cm",
      uses: "Ornamental, garden stakes, walking sticks",
      description:
        "A temperate running bamboo trialled in the higher, cooler municipalities of Benguet and Mountain Province. Distinctive compressed basal internodes ('tortoise-shell').",
    },
    {
      id: "atter",
      scientific: "Gigantochloa atter",
      author: "(Hassk.) Kurz",
      common: "Sweet black bamboo (Ater)",
      color: "#00695c",
      habit: "Sympodial (clumping)",
      culmHeight: "15–22 m",
      culmDiameter: "7–12 cm",
      uses: "Edible shoots, furniture, musical instruments",
      description:
        "A productive clumping bamboo grown for both quality shoots and straight culms. Under evaluation in regional bambusetums for adaptability.",
    },
    {
      id: "luconiae",
      scientific: "Dinochloa luconiae",
      author: "(Munro) Merr.",
      common: "Climbing bamboo (Bikal)",
      color: "#4e342e",
      habit: "Scrambling / climbing",
      culmHeight: "Climbing, 10–20 m",
      culmDiameter: "1–3 cm",
      uses: "Binding/tying material, traditional cordage",
      description:
        "A native climbing bamboo of forest margins, traditionally used as flexible tying material. Documented in the program for biodiversity and conservation records.",
    },
  ];
  const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

  /* ------------------------------------------------------------------ */
  /* MUNICIPALITIES (real CAR towns w/ approx. coordinates & base elev.) */
  /* ------------------------------------------------------------------ */
  const TOWNS = [
    // Benguet
    { name: "La Trinidad", province: "Benguet", lat: 16.455, lon: 120.588, elev: 1300 },
    { name: "Baguio City", province: "Benguet", lat: 16.402, lon: 120.596, elev: 1470 },
    { name: "Itogon", province: "Benguet", lat: 16.366, lon: 120.683, elev: 900 },
    { name: "Tuba", province: "Benguet", lat: 16.355, lon: 120.56, elev: 1100 },
    { name: "Atok", province: "Benguet", lat: 16.58, lon: 120.69, elev: 2000 },
    { name: "Buguias", province: "Benguet", lat: 16.74, lon: 120.83, elev: 1800 },
    { name: "Mankayan", province: "Benguet", lat: 16.86, lon: 120.79, elev: 1500 },
    { name: "Kapangan", province: "Benguet", lat: 16.58, lon: 120.6, elev: 1200 },
    // Abra
    { name: "Bangued", province: "Abra", lat: 17.598, lon: 120.617, elev: 180 },
    { name: "Lagangilang", province: "Abra", lat: 17.61, lon: 120.73, elev: 250 },
    { name: "Dolores", province: "Abra", lat: 17.64, lon: 120.7, elev: 200 },
    { name: "Bucay", province: "Abra", lat: 17.53, lon: 120.72, elev: 220 },
    // Apayao
    { name: "Kabugao", province: "Apayao", lat: 18.018, lon: 121.182, elev: 300 },
    { name: "Conner", province: "Apayao", lat: 17.78, lon: 121.3, elev: 200 },
    { name: "Luna", province: "Apayao", lat: 18.32, lon: 121.36, elev: 60 },
    { name: "Pudtol", province: "Apayao", lat: 18.15, lon: 121.25, elev: 150 },
    // Ifugao
    { name: "Lagawe", province: "Ifugao", lat: 16.797, lon: 121.122, elev: 700 },
    { name: "Banaue", province: "Ifugao", lat: 16.917, lon: 121.058, elev: 1200 },
    { name: "Kiangan", province: "Ifugao", lat: 16.78, lon: 121.08, elev: 900 },
    { name: "Lamut", province: "Ifugao", lat: 16.65, lon: 121.22, elev: 300 },
    { name: "Mayoyao", province: "Ifugao", lat: 16.97, lon: 121.27, elev: 1000 },
    // Kalinga
    { name: "Tabuk City", province: "Kalinga", lat: 17.454, lon: 121.444, elev: 250 },
    { name: "Rizal", province: "Kalinga", lat: 17.62, lon: 121.45, elev: 200 },
    { name: "Pinukpuk", province: "Kalinga", lat: 17.61, lon: 121.3, elev: 300 },
    { name: "Lubuagan", province: "Kalinga", lat: 17.35, lon: 121.18, elev: 800 },
    { name: "Tinglayan", province: "Kalinga", lat: 17.2, lon: 121.13, elev: 900 },
    // Mountain Province
    { name: "Bontoc", province: "Mountain Province", lat: 17.09, lon: 120.976, elev: 900 },
    { name: "Sagada", province: "Mountain Province", lat: 17.083, lon: 120.9, elev: 1500 },
    { name: "Bauko", province: "Mountain Province", lat: 16.99, lon: 120.86, elev: 1600 },
    { name: "Tadian", province: "Mountain Province", lat: 16.95, lon: 120.8, elev: 1400 },
    { name: "Sabangan", province: "Mountain Province", lat: 17.02, lon: 120.93, elev: 1100 },
    { name: "Barlig", province: "Mountain Province", lat: 17.06, lon: 121.1, elev: 1500 },
  ];

  const RECORDERS = [
    "BSU Bamboo R&D Team",
    "Provincial ENRO Team",
    "IFSU Forestry Dept.",
    "KSU Agriculture Dept.",
    "MPSPC Research Office",
    "ASIST Botany Team",
    "Apayao State College",
    "DENR-CAR Field Unit",
    "LGU Forester",
    "Community Bamboo Group",
  ];

  /* ------------------------------------------------------------------ */
  /* OCCURRENCES (generated, stable)                                     */
  /* ------------------------------------------------------------------ */
  // Which species realistically occur where (lowland vs highland leanings).
  function plausibleSpeciesFor(town) {
    if (town.elev >= 1500) return ["aurea", "multiplex", "lumampao", "blumeana", "luconiae", "siamensis"];
    if (town.elev >= 900)
      return ["blumeana", "vulgaris", "lumampao", "levis", "luconiae", "multiplex", "philippinensis", "atter"];
    return ["blumeana", "vulgaris", "asper", "levis", "latiflorus", "lumampao", "philippinensis", "atter", "siamensis"];
  }

  const OCCURRENCES = [];
  let occId = 1000;
  TOWNS.forEach((town) => {
    const n = randInt(1, 3); // 1–3 records per town => ~ 55 total
    const candidates = plausibleSpeciesFor(town);
    for (let i = 0; i < n; i++) {
      const sp = SPECIES_BY_ID[pick(candidates)];
      const year = randInt(2022, 2025);
      const month = String(randInt(1, 12)).padStart(2, "0");
      const day = String(randInt(1, 28)).padStart(2, "0");
      OCCURRENCES.push({
        id: "OCC-" + occId++,
        speciesId: sp.id,
        scientific: sp.scientific,
        common: sp.common,
        municipality: town.name,
        province: town.province,
        culms: randInt(8, 480),
        lon: jitter(town.lon, 0.05),
        lat: jitter(town.lat, 0.05),
        elevation: Math.max(40, town.elev + randInt(-120, 160)),
        date: `${year}-${month}-${day}`,
        recorder: pick(RECORDERS),
        basis: pick(["Field observation", "Living specimen", "Plot inventory", "Geo-tagged photo"]),
      });
    }
  });
  OCCURRENCES.sort((a, b) => (a.date < b.date ? 1 : -1));

  /* ------------------------------------------------------------------ */
  /* ESTABLISHMENTS (matrix)                                             */
  /* ------------------------------------------------------------------ */
  const EST_TYPES = ["Nursery", "Bambusetum / Garden", "Demo Farm", "Natural Stand", "Plantation"];
  const ESTABLISHMENTS = [
    { id: "EST-01", type: "Bambusetum / Garden", name: "BSU Bambusetum", municipality: "La Trinidad", province: "Benguet", area: "2.5 ha", species: ["blumeana", "vulgaris", "asper", "levis", "atter", "aurea"], year: 2021, manager: "Benguet State University" },
    { id: "EST-02", type: "Nursery", name: "BSU Central Bamboo Nursery", municipality: "La Trinidad", province: "Benguet", area: "0.8 ha", species: ["blumeana", "vulgaris", "asper", "latiflorus"], year: 2021, manager: "Benguet State University" },
    { id: "EST-03", type: "Demo Farm", name: "Tublay Bamboo Demo Farm", municipality: "Itogon", province: "Benguet", area: "1.2 ha", species: ["asper", "latiflorus", "levis"], year: 2022, manager: "LGU Itogon / BSU" },
    { id: "EST-04", type: "Plantation", name: "Tuba Riverbank Plantation", municipality: "Tuba", province: "Benguet", area: "5.0 ha", species: ["blumeana", "levis"], year: 2022, manager: "DENR-CAR" },
    { id: "EST-05", type: "Natural Stand", name: "Tinglayan Buho Stand", municipality: "Tinglayan", province: "Kalinga", area: "12.0 ha", species: ["lumampao", "luconiae"], year: 2020, manager: "Community / KSU" },
    { id: "EST-06", type: "Nursery", name: "KSU Bamboo Nursery", municipality: "Tabuk City", province: "Kalinga", area: "0.6 ha", species: ["blumeana", "vulgaris", "asper"], year: 2022, manager: "Kalinga State University" },
    { id: "EST-07", type: "Bambusetum / Garden", name: "IFSU Bamboo Germplasm Garden", municipality: "Lamut", province: "Ifugao", area: "1.8 ha", species: ["blumeana", "levis", "atter", "latiflorus", "philippinensis"], year: 2021, manager: "Ifugao State University" },
    { id: "EST-08", type: "Plantation", name: "Banaue Slope Plantation", municipality: "Banaue", province: "Ifugao", area: "3.5 ha", species: ["blumeana", "multiplex"], year: 2023, manager: "LGU Banaue / IFSU" },
    { id: "EST-09", type: "Demo Farm", name: "Bauko Highland Demo Farm", municipality: "Bauko", province: "Mountain Province", area: "1.0 ha", species: ["aurea", "multiplex", "siamensis"], year: 2023, manager: "MPSPC" },
    { id: "EST-10", type: "Nursery", name: "MPSPC Bamboo Nursery", municipality: "Bontoc", province: "Mountain Province", area: "0.5 ha", species: ["lumampao", "blumeana", "aurea"], year: 2022, manager: "Mountain Province State Polytechnic College" },
    { id: "EST-11", type: "Bambusetum / Garden", name: "ASIST Bambusetum", municipality: "Lagangilang", province: "Abra", area: "2.0 ha", species: ["blumeana", "vulgaris", "asper", "levis", "siamensis"], year: 2021, manager: "Abra State Institute of Sci. & Tech." },
    { id: "EST-12", type: "Plantation", name: "Bangued Industrial Plantation", municipality: "Bangued", province: "Abra", area: "8.0 ha", species: ["asper", "blumeana"], year: 2022, manager: "DTI-CAR / ASIST" },
    { id: "EST-13", type: "Natural Stand", name: "Apayao Riverine Bamboo", municipality: "Conner", province: "Apayao", area: "20.0 ha", species: ["blumeana", "vulgaris", "luconiae"], year: 2019, manager: "DENR-CAR" },
    { id: "EST-14", type: "Nursery", name: "Apayao SC Bamboo Nursery", municipality: "Luna", province: "Apayao", area: "0.7 ha", species: ["asper", "latiflorus", "vulgaris"], year: 2023, manager: "Apayao State College" },
    { id: "EST-15", type: "Demo Farm", name: "Kiangan Agroforestry Demo", municipality: "Kiangan", province: "Ifugao", area: "1.5 ha", species: ["latiflorus", "atter", "levis"], year: 2023, manager: "IFSU" },
    { id: "EST-16", type: "Plantation", name: "Pinukpuk Bamboo Plantation", municipality: "Pinukpuk", province: "Kalinga", area: "6.5 ha", species: ["asper", "blumeana"], year: 2024, manager: "LGU Pinukpuk" },
    { id: "EST-17", type: "Bambusetum / Garden", name: "Baguio Botanical Bamboo Garden", municipality: "Baguio City", province: "Benguet", area: "0.4 ha", species: ["aurea", "multiplex", "lumampao", "philippinensis"], year: 2024, manager: "LGU Baguio City" },
    { id: "EST-18", type: "Natural Stand", name: "Sagada Forest Margin Stand", municipality: "Sagada", province: "Mountain Province", area: "9.0 ha", species: ["lumampao", "luconiae", "multiplex"], year: 2018, manager: "Community / MPSPC" },
    { id: "EST-19", type: "Demo Farm", name: "Mankayan Erosion-Control Demo", municipality: "Mankayan", province: "Benguet", area: "2.2 ha", species: ["blumeana", "multiplex"], year: 2024, manager: "BSU / LGU Mankayan" },
    { id: "EST-20", type: "Plantation", name: "Rizal Lowland Plantation", municipality: "Rizal", province: "Kalinga", area: "7.0 ha", species: ["asper", "latiflorus", "vulgaris"], year: 2024, manager: "DA-CAR" },
  ];

  /* ------------------------------------------------------------------ */
  /* NURSERY MONITORING (matrix)                                         */
  /* ------------------------------------------------------------------ */
  const NURSERIES = [
    { id: "NUR-01", nursery: "BSU Central Bamboo Nursery", municipality: "La Trinidad", province: "Benguet", speciesId: "asper", count: 1850, type: "Produced", provenance: "BSU mother plants", date: "2024-02-15", status: "Maintained", lastMonitored: "2026-05-20" },
    { id: "NUR-02", nursery: "BSU Central Bamboo Nursery", municipality: "La Trinidad", province: "Benguet", speciesId: "blumeana", count: 2400, type: "Produced", provenance: "Itogon natural stand", date: "2024-03-02", status: "Planted", lastMonitored: "2026-05-20" },
    { id: "NUR-03", nursery: "KSU Bamboo Nursery", municipality: "Tabuk City", province: "Kalinga", speciesId: "vulgaris", count: 900, type: "Procured", provenance: "ERDB Region II", date: "2024-06-10", status: "Maintained", lastMonitored: "2026-04-28" },
    { id: "NUR-04", nursery: "KSU Bamboo Nursery", municipality: "Tabuk City", province: "Kalinga", speciesId: "asper", count: 1200, type: "Produced", provenance: "KSU mother clump", date: "2024-07-22", status: "Maintained", lastMonitored: "2026-04-28" },
    { id: "NUR-05", nursery: "IFSU Germplasm Garden", municipality: "Lamut", province: "Ifugao", speciesId: "latiflorus", count: 650, type: "Donated", provenance: "DA-BPI Los Baños", date: "2024-01-30", status: "Donated", lastMonitored: "2026-03-15" },
    { id: "NUR-06", nursery: "IFSU Germplasm Garden", municipality: "Lamut", province: "Ifugao", speciesId: "levis", count: 780, type: "Produced", provenance: "Kiangan natural stand", date: "2024-04-18", status: "Maintained", lastMonitored: "2026-05-02" },
    { id: "NUR-07", nursery: "MPSPC Bamboo Nursery", municipality: "Bontoc", province: "Mountain Province", speciesId: "lumampao", count: 1100, type: "Produced", provenance: "Sagada forest margin", date: "2024-05-05", status: "Planted", lastMonitored: "2026-05-11" },
    { id: "NUR-08", nursery: "MPSPC Bamboo Nursery", municipality: "Bontoc", province: "Mountain Province", speciesId: "aurea", count: 320, type: "Procured", provenance: "BPI Baguio Stn.", date: "2024-08-14", status: "Maintained", lastMonitored: "2026-05-11" },
    { id: "NUR-09", nursery: "ASIST Bambusetum Nursery", municipality: "Lagangilang", province: "Abra", speciesId: "blumeana", count: 2050, type: "Produced", provenance: "Abra riverbanks", date: "2024-02-28", status: "Planted", lastMonitored: "2026-04-09" },
    { id: "NUR-10", nursery: "ASIST Bambusetum Nursery", municipality: "Lagangilang", province: "Abra", speciesId: "siamensis", count: 410, type: "Donated", provenance: "DENR-CAR", date: "2024-09-01", status: "Maintained", lastMonitored: "2026-04-09" },
    { id: "NUR-11", nursery: "Apayao SC Bamboo Nursery", municipality: "Luna", province: "Apayao", speciesId: "asper", count: 1350, type: "Produced", provenance: "Conner mother plants", date: "2024-06-25", status: "Maintained", lastMonitored: "2026-05-18" },
    { id: "NUR-12", nursery: "Apayao SC Bamboo Nursery", municipality: "Luna", province: "Apayao", speciesId: "latiflorus", count: 540, type: "Procured", provenance: "DA-CAR", date: "2024-10-12", status: "Maintained", lastMonitored: "2026-05-18" },
    { id: "NUR-13", nursery: "Tuba Plantation Nursery", municipality: "Tuba", province: "Benguet", speciesId: "levis", count: 960, type: "Produced", provenance: "Tuba demo farm", date: "2025-01-20", status: "Planted", lastMonitored: "2026-05-25" },
    { id: "NUR-14", nursery: "Banaue LGU Nursery", municipality: "Banaue", province: "Ifugao", speciesId: "multiplex", count: 1500, type: "Produced", provenance: "IFSU mother plants", date: "2025-02-09", status: "Maintained", lastMonitored: "2026-05-03" },
    { id: "NUR-15", nursery: "Pinukpuk Plantation Nursery", municipality: "Pinukpuk", province: "Kalinga", speciesId: "asper", count: 2200, type: "Produced", provenance: "KSU mother clump", date: "2025-03-15", status: "Planted", lastMonitored: "2026-05-22" },
    { id: "NUR-16", nursery: "Baguio Botanical Garden Nursery", municipality: "Baguio City", province: "Benguet", speciesId: "philippinensis", count: 180, type: "Donated", provenance: "PNH herbarium accession", date: "2025-04-01", status: "Maintained", lastMonitored: "2026-05-28" },
    { id: "NUR-17", nursery: "Mankayan Demo Nursery", municipality: "Mankayan", province: "Benguet", speciesId: "blumeana", count: 870, type: "Produced", provenance: "BSU nursery", date: "2025-02-26", status: "Planted", lastMonitored: "2026-05-19" },
    { id: "NUR-18", nursery: "Rizal Lowland Nursery", municipality: "Rizal", province: "Kalinga", speciesId: "latiflorus", count: 1280, type: "Procured", provenance: "DA-BPI Los Baños", date: "2025-03-30", status: "Maintained", lastMonitored: "2026-05-24" },
  ];

  /* ------------------------------------------------------------------ */
  /* SUITABILITY ZONES (rough illustrative polygons over CAR)            */
  /* ------------------------------------------------------------------ */
  // [lat, lon] rings — simplified, for prototype visualisation only.
  const SUITABILITY_ZONES = [
    {
      name: "Lower Abra–Apayao River Valleys",
      level: "High",
      note: "Warm lowland river valleys, ideal for Dendrocalamus asper & Bambusa blumeana plantations.",
      polygon: [[17.45, 120.55], [18.4, 121.0], [18.4, 121.45], [17.7, 121.5], [17.4, 120.95]],
    },
    {
      name: "Kalinga–Lamut Lowlands",
      level: "High",
      note: "Tabuk plain and Ifugao foothills; strong potential for industrial bamboo.",
      polygon: [[17.25, 121.2], [17.7, 121.35], [17.55, 121.6], [16.6, 121.45], [16.7, 121.15]],
    },
    {
      name: "Mid-elevation Ifugao–Kalinga Slopes",
      level: "Moderate",
      note: "700–1,200 m; suited to native clumping species & agroforestry.",
      polygon: [[16.7, 120.95], [17.25, 121.1], [17.2, 121.25], [16.7, 121.15]],
    },
    {
      name: "Benguet Mid-slopes",
      level: "Moderate",
      note: "Erosion-control and ornamental species along the Cordillera Central.",
      polygon: [[16.3, 120.5], [16.65, 120.6], [16.6, 120.75], [16.3, 120.72]],
    },
    {
      name: "High Cordillera (Atok–Buguias–Sagada)",
      level: "Low",
      note: ">1,500 m; limited to cold-tolerant running & ornamental bamboo trials.",
      polygon: [[16.55, 120.65], [17.1, 120.85], [17.05, 121.0], [16.7, 120.92], [16.55, 120.8]],
    },
  ];

  /* ------------------------------------------------------------------ */
  /* PRODUCTS                                                            */
  /* ------------------------------------------------------------------ */
  const PRODUCTS = [
    { name: "Engineered Bamboo Panels", maker: "BSU–DTI Shared Facility", location: "La Trinidad, Benguet", species: "Dendrocalamus asper", tag: "Construction", desc: "Laminated bamboo boards for furniture and interior finishing produced at the regional shared service facility." },
    { name: "Bamboo Charcoal & Vinegar", maker: "Itogon Bamboo Cooperative", location: "Itogon, Benguet", species: "Bambusa blumeana", tag: "Energy / Agri", desc: "Pyrolised bamboo charcoal briquettes and wood-vinegar by-product for soil conditioning." },
    { name: "Woven Sawali Panels", maker: "Tinglayan Weavers' Assn.", location: "Tinglayan, Kalinga", species: "Schizostachyum lumampao", tag: "Handicraft", desc: "Traditional split-bamboo wall panels woven by Cordilleran communities." },
    { name: "Bamboo Furniture Set", maker: "Bangued Furniture Makers", location: "Bangued, Abra", species: "Gigantochloa levis", tag: "Furniture", desc: "Sala sets and chairs from treated bolo culms." },
    { name: "Bamboo Shoots (Labong)", maker: "Lamut Agroforestry Farm", location: "Lamut, Ifugao", species: "Dendrocalamus latiflorus", tag: "Food", desc: "Fresh and bottled sweet bamboo shoots for local markets." },
    { name: "Bamboo Bike Frame", maker: "BSU Design & Innovation Lab", location: "La Trinidad, Benguet", species: "Bambusa blumeana", tag: "Innovation", desc: "Prototype lightweight bamboo bicycle frame showcased at regional fairs." },
    { name: "Handwoven Baskets", maker: "Sagada Craft Circle", location: "Sagada, Mountain Province", species: "Schizostachyum lumampao", tag: "Handicraft", desc: "Carrying baskets (kayabang) and décor for the tourism market." },
    { name: "Bamboo Musical Instruments", maker: "Kalinga Sound Heritage", location: "Lubuagan, Kalinga", species: "Gigantochloa atter", tag: "Culture", desc: "Tongatong, saggeypo, and bamboo flutes for cultural performances." },
    { name: "Bamboo Slats & Poles", maker: "Pinukpuk Plantation Co-op", location: "Pinukpuk, Kalinga", species: "Dendrocalamus asper", tag: "Construction", desc: "Graded poles and treated slats for the construction supply chain." },
    { name: "Bamboo Eco-Straws & Tumblers", maker: "Benguet Green Crafts", location: "La Trinidad, Benguet", species: "Bambusa vulgaris", tag: "Lifestyle", desc: "Reusable bamboo straws, cups, and utensils for the zero-waste market." },
    { name: "Decorative Bamboo Fencing", maker: "Mankayan Livelihood Group", location: "Mankayan, Benguet", species: "Bambusa multiplex", tag: "Landscaping", desc: "Garden screens and fences for resorts and households." },
    { name: "Bamboo Activated Carbon", maker: "ASIST Research Spin-off", location: "Lagangilang, Abra", species: "Bambusa blumeana", tag: "Innovation", desc: "Activated carbon for water filtration, an R&D product under field testing." },
  ];

  /* ------------------------------------------------------------------ */
  /* PUBLICATIONS                                                        */
  /* ------------------------------------------------------------------ */
  const PUBLICATIONS = [
    { title: "Bamboo Propagation Manual for the Cordillera", type: "Technical Manual", author: "Cordillera Bamboo Program / BSU", year: 2024, desc: "Step-by-step protocols for branch-cutting, marcotting, and tissue-culture propagation of priority species." },
    { title: "Bamboo Species of the Cordillera: A Field Guide", type: "Field Guide", author: "BSU & IFSU", year: 2024, desc: "Illustrated identification guide to native and introduced bamboos of the CAR." },
    { title: "Nursery Establishment & Management Module", type: "Training Module", author: "Cordillera Bamboo Program", year: 2023, desc: "Instructional module used in regional training-of-trainers workshops." },
    { title: "Suitability Mapping of Bamboo in CAR", type: "Research Paper", author: "BSU GIS Laboratory", year: 2025, desc: "Land-suitability analysis combining climate, slope, and soil layers for plantation siting." },
    { title: "Engineered Bamboo Value-Chain Study", type: "Policy Brief", author: "DTI-CAR & Cordillera Bamboo Program", year: 2024, desc: "Market and value-chain assessment for engineered-bamboo enterprises." },
    { title: "Indigenous Bamboo Crafts of the Cordillera", type: "Monograph", author: "MPSPC", year: 2023, desc: "Documentation of weaving traditions and craft livelihoods using Schizostachyum lumampao." },
    { title: "Carbon Sequestration Potential of Bamboo Stands", type: "Research Paper", author: "KSU & DENR-CAR", year: 2025, desc: "Biomass and carbon estimates from monitored bamboo plots across the region." },
    { title: "Cordillera Bamboo Program Primer (IEC Material)", type: "IEC / Primer", author: "Program Secretariat", year: 2023, desc: "Public information primer on the program's goals, partners, and milestones." },
    { title: "Bamboo Pest & Disease Management Guide", type: "Technical Manual", author: "Apayao State College", year: 2025, desc: "Identification and management of common bamboo pests in nursery and field settings." },
  ];

  /* ------------------------------------------------------------------ */
  /* NEWS / ENGAGEMENTS                                                  */
  /* ------------------------------------------------------------------ */
  const NEWS = [
    { title: "Regional Bamboo Summit 2026", category: "Event", date: "2026-04-22", location: "Baguio City", desc: "CAR SUCs, LGUs, and industry partners convened to align the regional bamboo roadmap." },
    { title: "Training of Trainers: Bamboo Propagation", category: "Training", date: "2026-03-12", location: "La Trinidad, Benguet", desc: "40 extension workers trained on nursery and propagation techniques." },
    { title: "Bamboo Tech Demo in Tabuk", category: "Tech Demo", date: "2026-02-28", location: "Tabuk City, Kalinga", desc: "Live demonstration of bamboo treatment and engineered-bamboo fabrication." },
    { title: "Stakeholder Consultation Workshop", category: "Workshop", date: "2026-02-05", location: "Lagawe, Ifugao", desc: "Community consultation on plantation siting and benefit-sharing." },
    { title: "MOU Signing with LGU Partners", category: "Meeting", date: "2026-01-18", location: "Bontoc, Mountain Province", desc: "Memorandum of understanding signed for nursery and plantation support." },
    { title: "Bamboo Planting Caravan", category: "Event", date: "2025-11-09", location: "Tuba, Benguet", desc: "Riverbank rehabilitation planting with volunteers and student groups." },
    { title: "Women in Bamboo Crafts Workshop", category: "Workshop", date: "2025-10-21", location: "Sagada, Mountain Province", desc: "Skills upgrading for women weavers' associations." },
    { title: "Bamboo R&D Forum", category: "Meeting", date: "2025-09-15", location: "Baguio City", desc: "Researchers presented findings on growth performance and carbon studies." },
    { title: "Field Validation in Apayao", category: "Tech Demo", date: "2025-08-30", location: "Luna, Apayao", desc: "On-site validation of nursery protocols and survival monitoring." },
    { title: "Inter-SUC Coordination Meeting", category: "Meeting", date: "2025-07-12", location: "Lamut, Ifugao", desc: "Quarterly coordination among the seven CAR state universities and colleges." },
    { title: "Bamboo Enterprise Trade Fair", category: "Event", date: "2025-06-20", location: "Bangued, Abra", desc: "Showcase of community bamboo products and market linkaging." },
    { title: "School-on-the-Air: Bamboo Livelihoods", category: "Training", date: "2025-05-10", location: "Region-wide (radio)", desc: "Radio-based extension program on bamboo livelihoods reaching upland barangays." },
  ];

  /* ------------------------------------------------------------------ */
  /* PARTNERS / PUBLISHERS                                               */
  /* ------------------------------------------------------------------ */
  const PARTNERS = {
    sucs: [
      { name: "Benguet State University", abbr: "BSU", role: "Lead implementing SUC", location: "La Trinidad, Benguet" },
      { name: "Ifugao State University", abbr: "IFSU", role: "Germplasm & agroforestry", location: "Lamut, Ifugao" },
      { name: "Kalinga State University", abbr: "KSU", role: "Plantation & nursery R&D", location: "Tabuk City, Kalinga" },
      { name: "Mountain Province State Polytechnic College", abbr: "MPSPC", role: "Crafts & highland trials", location: "Bontoc, Mountain Province" },
      { name: "Abra State Institute of Science and Technology", abbr: "ASIST", role: "Bambusetum & enterprise", location: "Lagangilang, Abra" },
      { name: "Apayao State College", abbr: "ASC", role: "Lowland nursery & validation", location: "Luna, Apayao" },
    ],
    partners: [
      { name: "DENR – Cordillera", abbr: "DENR-CAR", role: "Natural stands & reforestation" },
      { name: "DOST – Cordillera", abbr: "DOST-CAR", role: "R&D funding & innovation" },
      { name: "DTI – Cordillera", abbr: "DTI-CAR", role: "Enterprise & value chains" },
      { name: "Dept. of Agriculture – CAR", abbr: "DA-CAR", role: "Planting materials & extension" },
      { name: "Philippine Bamboo Industry Dev. Council", abbr: "PBIDC", role: "National policy & standards" },
      { name: "Local Government Units (CAR)", abbr: "LGUs", role: "Site provision & community mobilisation" },
    ],
  };

  /* ------------------------------------------------------------------ */
  /* SUMMARY STATS (for hero)                                            */
  /* ------------------------------------------------------------------ */
  const STATS = {
    occurrences: OCCURRENCES.length,
    species: SPECIES.length,
    establishments: ESTABLISHMENTS.length,
    nurseries: NURSERIES.length,
    provinces: 6,
    seedlings: NURSERIES.reduce((s, n) => s + n.count, 0),
  };

  /* ------------------------------------------------------------------ */
  window.DATA = {
    SPECIES,
    SPECIES_BY_ID,
    TOWNS,
    OCCURRENCES,
    ESTABLISHMENTS,
    EST_TYPES,
    NURSERIES,
    SUITABILITY_ZONES,
    PRODUCTS,
    PUBLICATIONS,
    NEWS,
    PARTNERS,
    STATS,
  };
})();
