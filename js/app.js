let campaigns = [];

let filters = {
  search: "",
  sort: "newest",

  starcraftVersion: [],
  status: [],
  language: [],

  author: [],
  team: [],
  series: [],
  year: [],
  mod: [],
  broodWar: [],
  tags: [],
  races: []
};

/* =========================
   BOOT STATE (CRITICAL FIX)
========================= */

let bootReady = false;

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("campaignContainer")) return;

  initUI();
  loadCampaigns();
});

/* =========================
   LOAD
========================= */

async function loadCampaigns() {
  const response = await fetch("/data/campaigns.json", {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  campaigns = await response.json();

  populateAuthorDropdown();
  populateChips();

  // allow DOM to flush updates
  await new Promise(requestAnimationFrame);

  bootReady = true;

  renderFromURL();
}

const TAG_WEIGHTS = {
  universe: 5,
  timeline: 5,
  event: 4,

  gameplay: 4,

  theme: 3,
  mechanic: 3,

  mod: 2.5,
  presentation: 2,

  visual: 1.5,
  audio: 1.5,

  difficulty: 1,
  quality: 1,

  contest: 0.5,
  website: 0.5,
  badge: 0.5
};

/* =========================
   URL STATE
========================= */

function getFiltersFromURL() {
  const p = new URLSearchParams(location.search);

  const parse = k =>
    p.get(k) ? p.get(k).split(",").filter(Boolean) : [];

  return {
    search: p.get("search") || "",
    sort: p.get("sort") || "newest",

    starcraftVersion: parse("starcraftVersion"),
    status: parse("status"),

    author: parse("author"),
    team: parse("team"),
    series: parse("series"),
    year: parse("year"),
    mod: parse("mod"),
    broodWar: parse("broodWar"),
    language: parse("language"),
    tags: parse("tags"),
    races: parse("races")
  };
}

function setURL(f) {
  const p = new URLSearchParams();

  if (f.search) p.set("search", f.search);
  if (f.sort) p.set("sort", f.sort);

  const add = (k) => {
    if (f[k]?.length) p.set(k, f[k].join(","));
  };

  [
    "starcraftVersion","status","author","team","series","year",
    "mod","broodWar","language","tags","races"
  ].forEach(add);

  history.replaceState(
    {},
    "",
    p.toString() ? `?${p}` : location.pathname
  );

  // IMPORTANT: only render AFTER boot is complete
  if (bootReady) {
    renderFromURL();
  }
}

/* =========================
   RENDER PIPELINE
========================= */

function renderFromURL() {
  if (!bootReady) return;

  filters = getFiltersFromURL();
  syncUI();
  applyFilters();
}

/* =========================
   FILTER ENGINE
========================= */

function applyFilters() {
  let list = [...campaigns];
  const f = filters;

  if (f.search) {
    const s = f.search.toLowerCase();

    list = list.filter(c =>
      c.title?.toLowerCase().includes(s) ||
      c.tagline?.toLowerCase().includes(s) ||
      (c.author || []).some(a => a.toLowerCase().includes(s))
    );
  }

  const multi = (key, field) => {
    if (!f[key]?.length) return;
    list = list.filter(c =>
      (c[field] || []).some(v => f[key].includes(v))
    );
  };

  multi("starcraftVersion", "starcraftVersion");
  multi("status", "status");

  multi("author", "author");
  multi("team", "team");
  multi("series", "series");
  multi("year", "year");
  multi("mod", "mod");
  multi("broodWar", "broodWar");
  multi("language", "language");
  multi("tags", "tags");
  multi("races", "races");

  list.sort((a, b) => {
    switch (f.sort) {
      case "newest":
        return new Date(b.releaseDate) - new Date(a.releaseDate);
      case "oldest":
        return new Date(a.releaseDate) - new Date(b.releaseDate);
      case "updated":
        return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
      case "longest":
        return (b.missions || 0) - (a.missions || 0);
      case "shortest":
        return (a.missions || 0) - (b.missions || 0);
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      case "author":
        return (a.author?.[0] || "").localeCompare(b.author?.[0] || "");
      default:
        return 0;
    }
  });

  updateResultsCount(list.length, campaigns.length);
  renderCampaigns(list);
}

/* =========================
   RENDER RESULTS
========================= */

function renderCampaigns(list) {
  const el = document.getElementById("campaignContainer");
  if (!el) return;

  el.innerHTML = "";

  list.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <a class="card-link" href="campaign.html?id=${c.id}">
        <img src="assets/${c.id}/${c.image}" loading="lazy">
        <div class="card-content">
          <h2>${c.title}</h2>
          <p>${(c.author || []).join(", ")}</p>
          <p>${c.tagline || ""}</p>
        </div>
      </a>
    `;

    el.appendChild(div);
  });
}

/* =========================
   DROPDOWN
========================= */

function populateAuthorDropdown() {
  const el = document.getElementById("authorFilter");
  if (!el) return;

  const set = new Set();

  campaigns.forEach(c => {
    (c.author || []).forEach(a => set.add(a));
  });

  el.innerHTML = `<option value="">All Authors</option>`;

  [...set].sort().forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    el.appendChild(opt);
  });
}

/* =========================
   CHIPS (FIXED SAFE VERSION)
========================= */

function populateChips() {
  const build = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;

    const set = new Set();

    campaigns.forEach(c => {
      (c[key] || []).forEach(v => set.add(v));
    });

    const values = [...set].sort();

    el.innerHTML = values.map(v =>
      `<button class="chip" data-key="${key}" data-value="${v}">${v}</button>`
    ).join("");
  };

  build("starcraftVersionFilters", "starcraftVersion");
  build("statusFilters", "status");
  build("authorFilters", "author");
  build("teamFilters", "team");
  build("seriesFilters", "series");
  build("yearFilters", "year");
  build("modFilters", "mod");
  build("broodWarFilters", "broodWar");
  build("languageFilters", "language");
  build("tagFilters", "tags");
  build("raceFilters", "races");

  document.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      toggle(btn.dataset.key, btn.dataset.value);
    });
  });
}

/* =========================
   CHIP TOGGLE
========================= */

function toggle(key, value) {
  const f = getFiltersFromURL();

  if (!f[key]) f[key] = [];

  if (f[key].includes(value)) {
    f[key] = f[key].filter(v => v !== value);
  } else {
    f[key].push(value);
  }

  setURL(f);
}

/* =========================
   UI SYNC
========================= */

function syncUI() {
  const search = document.getElementById("searchInput");
  const sort = document.getElementById("sortSelect");

  if (search) search.value = filters.search;
  if (sort) sort.value = filters.sort;

  document.querySelectorAll(".chip").forEach(btn => {
    const k = btn.dataset.key;
    const v = btn.dataset.value;

    btn.classList.toggle(
      "active",
      (filters[k] || []).includes(v)
    );
  });
}

/* =========================
   RESULTS COUNT
========================= */

function updateResultsCount(filtered, total) {
  const el = document.getElementById("resultsCount");
  if (!el) return;

  el.textContent =
    filtered === total
      ? `${total} total campaigns`
      : `Showing ${filtered} of ${total} campaigns`;
}

/* =========================
   EVENTS
========================= */

document.getElementById("searchInput")
?.addEventListener("input", e => {
  const f = getFiltersFromURL();
  f.search = e.target.value;
  setURL(f);
});

document.getElementById("sortSelect")
?.addEventListener("change", e => {
  const f = getFiltersFromURL();
  f.sort = e.target.value;
  setURL(f);
});

document.getElementById("clearFilters")
?.addEventListener("click", () => {
  history.replaceState({}, "", location.pathname);
  renderFromURL();
});

/* =========================
   MOBILE UI
========================= */

function initUI() {
  const drawer = document.getElementById("filterDrawer");
  const overlay = document.getElementById("filterOverlay");

  document.getElementById("openFilters")
  ?.addEventListener("click", () => {
    drawer?.classList.add("open");
    overlay?.classList.add("active");
  });

  overlay?.addEventListener("click", () => {
    drawer?.classList.remove("open");
    overlay.classList.remove("active");
  });

  document.querySelector(".filter-close")
  ?.addEventListener("click", () => {
    drawer?.classList.remove("open");
    overlay.classList.remove("active");
  });
}