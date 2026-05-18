let currentScreenshots = [];
let currentIndex = 0;

/* =========================
   LOAD CAMPAIGN
========================= */

async function loadCampaign() {

  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get("id");

  if (!campaignId) {
    showError("No campaign ID provided.");
    return;
  }

  try {
    const response = await fetch("data/campaigns.json");

    if (!response.ok) {
      throw new Error("Failed to load campaigns.json");
    }

    const campaigns = await response.json();

    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) {
      showError("Campaign not found.");
      return;
    }

    renderCampaign(campaign);
    saveLastViewedCampaign();

  } catch (err) {
    console.error(err);
    showError("Error loading campaign data.");
  }
}

/* =========================
   FORMAT HELPERS
========================= */

function formatDate(dateStr) {
  if (!dateStr) return "";

  const d = new Date(dateStr);

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getRelativeTime(dateStr) {
  if (!dateStr) return "";

  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 1) return "today";
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

function formatList(arr = []) {
  const clean = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} and ${clean.at(-1)}`;
}

function asList(v) {
  return Array.isArray(v) ? v : (v ? [v] : []);
}

function filterLink(key, value) {
  if (!value) return "#";
  return `/index.html?${key}=${encodeURIComponent(value)}`;
}

function renderLinks(key, values) {
  const arr = Array.isArray(values)
    ? values
    : values
      ? [values]
      : [];

  return arr
    .filter(Boolean)
    .map(v => `<a href="${filterLink(key, v)}">${v}</a>`)
    .join(", ");
}

function loadScreenshotsFromFolder(campaign, max = 20) {
  return new Promise((resolve) => {
    const screenshots = [];
    let index = 1;

    const tryNext = () => {
      const num = String(index).padStart(2, "0");
      const src = `assets/${campaign.id}/${campaign.id}${num}.jpg`;

      const img = new Image();
      img.src = src;

      img.onload = () => {
        screenshots.push(src);
        index++;

        if (index > max) return resolve(screenshots);
        tryNext();
      };

      img.onerror = () => resolve(screenshots);
    };

    tryNext();
  });
}

/* =========================
   NEW IMAGE SYSTEM
========================= */

function getCoverImage(campaign) {
  // assets/odyssey/odyssey.jpg
  return `assets/${campaign.id}/${campaign.id}.jpg`;
}

function getScreenshotImage(campaign, index) {
  // assets/odyssey/odyssey01.jpg
  const num = String(index + 1).padStart(2, "0");
  return `assets/${campaign.id}/${campaign.id}${num}.jpg`;
}

/* =========================
   SAVE STATE
========================= */

function saveLastViewedCampaign() {
  const searchState = localStorage.getItem("sc_state");

  if (searchState) {
    localStorage.setItem("sc_last_results", searchState);
  }

  localStorage.setItem("sc_last_scroll", window.scrollY || 0);
}

/* =========================
   BACK BUTTON
========================= */

function goBackToResults() {
  const returnURL = sessionStorage.getItem("sc_return_url");

  if (returnURL) {
    window.location.href = returnURL;
    return;
  }

  window.location.href = "/index.html";
}

/* =========================
   RENDER CAMPAIGN
========================= */

async function renderCampaign(campaign) {

  document.title = `${campaign.title} | New Antioch`;

  const isRecentlyUpdated = campaign.lastUpdated &&
    (new Date() - new Date(campaign.lastUpdated)) <= 30 * 24 * 60 * 60 * 1000;

  const isNewCampaign = campaign.releaseDate &&
    (new Date() - new Date(campaign.releaseDate)) <= 365 * 24 * 60 * 60 * 1000;

/* =========================
   IMAGES (NEW SYSTEM)
========================= */

currentScreenshots = await loadScreenshotsFromFolder(campaign);

const links = [
  {
    key: "originalLink",
    label: "Original Link",
  },
  {
    key: "archiveLink",
    label: "Archive Link",
  },
  {
    key: "megaBackup",
    label: "DOWNLOAD (Backup)",
  }
];

const linkButtonsHTML = links
  .filter(l => campaign[l.key] && campaign[l.key].trim?.() !== "")
  .map(l => `
    <a class="download-button"
       href="${campaign[l.key]}"
       target="_blank"
       rel="noopener noreferrer">
      ${l.label}
    </a>
  `)
  .join("");

const screenshotsHTML = currentScreenshots
  .map((img, index) => `
    <img class="screenshot"
         loading="lazy" 
         src="${img}"
         onclick="openLightbox(${index})"
         alt="">
  `)
  .join("");

  const container = document.getElementById("campaignPage");

  const author = asList(campaign.author);
  const team = asList(campaign.team);

  const namePart = team.length ? formatList(team) : formatList(author);

  const subtitle = `
    by ${namePart}
    ${campaign.releaseDate ? "<br>" + formatDate(campaign.releaseDate) : ""}
  `;

  const linkFilter = (key, value) =>
    `<a href="/index.html?${key}=${encodeURIComponent(value)}">${value}</a>`;

  const tagsHTML = asList(campaign.tags)
    .map(tag => `<a class="tag" href="/index.html?tags=${encodeURIComponent(tag)}">${tag}</a>`)
    .join(" ");

  const racesHTML = asList(campaign.races)
    .map(race => `<a class="race" href="/index.html?races=${encodeURIComponent(race)}">${race}</a>`)
    .join(" ");

  container.innerHTML = `
<div class="back-bar">
  <button onclick="goBackToResults()">← Back to search results</button>
</div>

<div class="campaign-layout">

  <!-- LEFT -->
  <aside class="campaign-sidebar">

    <img class="campaign-cover"
         src="${getCoverImage(campaign)}"
         alt="${campaign.title}">

<div class="meta-bar">

<p class="tagline">${campaign.tagline || ""}</p>

  <span>
    <strong>Author:</strong>
    ${renderLinks("author", campaign.author)}
  </span>

  <span>
    <strong>Team:</strong>
    ${renderLinks("team", campaign.team)}
  </span>
  
  <span>
    <strong>Series:</strong>
    ${renderLinks("series", campaign.series)}
  </span>

  <span>
    <strong>StarCraft Version:</strong>
    ${renderLinks("starcraftVersion", campaign.starcraftVersion)}
  </span>

<span>
  <strong>Campaign Version:</strong> ${campaign.campaignVersion || ""}
</span>

  <span>
    <strong>Status:</strong>
    ${renderLinks("status", campaign.status)}
  </span>

  <span>
    <strong>Mod:</strong>
    ${renderLinks("mod", campaign.mod)}
  </span>

  <span>
    <strong>Brood War:</strong>
    ${renderLinks("broodWar", campaign.broodWar)}
  </span>

  <span>
    <strong>Year:</strong>
    ${renderLinks("year", campaign.year)}
  </span>

  <span>
    <strong>Missions:</strong>
    ${campaign.missions ?? ""}
  </span>
  
  <span>
  <strong>Language:</strong>
  ${renderLinks("language", campaign.language)}
</span>

  <span>
    <strong>Released:</strong>
    ${formatDate(campaign.releaseDate)}
  </span>

  <span>
    <strong>Updated:</strong>
    ${formatDate(campaign.lastUpdated)}
  </span>

</div>

    <div class="race-container">
      ${racesHTML}
    </div>

    <div class="tag-container">
      ${tagsHTML}
    </div>
    
    <div class="link-buttons">
  ${linkButtonsHTML}
</div>

  </aside>

  <!-- RIGHT -->
  <main class="campaign-content">

    <h1>
      ${campaign.title}
      ${isNewCampaign ? `<span class="badge new">NEW</span>` : ""}
      ${isRecentlyUpdated ? `<span class="badge updated">LISTING UPDATED</span>` : ""}
    </h1>

    <div class="subtitle">
      ${subtitle}
    </div>

    <section>
      <h2>Description</h2>
      <p style="white-space: pre-wrap;">${campaign.description || ""}</p>
    </section>

    <section>
      <h2>Screenshots</h2>

      <div class="screenshot-grid">
        ${screenshotsHTML}
      </div>
    </section>

  </main>

</div>

<div id="lightbox" class="lightbox" onclick="closeLightbox(event)">
  <span class="lightbox-close" onclick="closeLightbox()">×</span>
  <img id="lightbox-img" class="lightbox-img" />
  <button class="lightbox-prev" onclick="changeLightbox(-1)">‹</button>
  <button class="lightbox-next" onclick="changeLightbox(1)">›</button>
</div>
`;
}

/* =========================
   ERROR
========================= */

function showError(message) {
  document.getElementById("campaignPage")
    .innerHTML = `<h1>${message}</h1>`;
}

/* =========================
   LIGHTBOX (UNCHANGED)
========================= */

function openLightbox(index) {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");

  currentIndex = index;
  img.src = currentScreenshots[currentIndex];

  lightbox.classList.add("show");
}

function closeLightbox(event) {
  if (event && event.target !== event.currentTarget) return;

  document.getElementById("lightbox")
    .classList.remove("show");
}

function changeLightbox(direction) {
  currentIndex += direction;

  if (currentIndex < 0) {
    currentIndex = currentScreenshots.length - 1;
  }

  if (currentIndex >= currentScreenshots.length) {
    currentIndex = 0;
  }

  document.getElementById("lightbox-img").src =
    currentScreenshots[currentIndex];
}

/* =========================
   START
========================= */

loadCampaign();