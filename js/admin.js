let campaigns = [];
let editingId = null;

/* =========================
   LOAD
========================= */

async function load() {
  const res = await fetch("data/campaigns.json");
  campaigns = await res.json();
  renderList();
}

document.addEventListener("DOMContentLoaded", load);

/* =========================
   HELPERS
========================= */

function toArr(v) {
  return (v || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

function toCSV(arr) {
  return (arr || []).join(", ");
}

/* =========================
   LIST
========================= */

function renderList() {
  const el = document.getElementById("list");
  el.innerHTML = "";

  campaigns.forEach(c => {
    const div = document.createElement("div");

    div.innerHTML = `
      <strong>${c.title}</strong><br>
      <small>${c.id}</small><br><br>

      <button onclick="edit('${c.id}')">Edit</button>
      <button onclick="removeCampaign('${c.id}')">Delete</button>
    `;

    el.appendChild(div);
  });
}

/* =========================
   NEW
========================= */

function addNew() {
  editingId = null;

  showForm({
    id: "",
    title: "",
    series: "",

    tagline: "",
    description: "",
	archivalNotes: "",
	installationNotes: "",
	credits: "",
    
    language: [],

    releaseDate: "",
    lastUpdated: "",

    image: "",

    author: [],
    team: [],
    year: [],
    starcraftVersion: [],
    campaignVersion: "",
    status: [],
    mod: [],
    broodWar: [],
    races: [],
    tags: [],

    missions: 0,

    originalLink: "",
    archiveLink: "",
    megaBackup: ""
  });
}

/* =========================
   EDIT
========================= */

function edit(id) {
  const c = campaigns.find(x => x.id === id);

  if (!c) {
    console.error("Campaign not found:", id);
    return;
  }

  editingId = id;
  showForm(c);
}

/* =========================
   FORM
========================= */

function showForm(c) {
  const el = document.getElementById("list");

  el.innerHTML = `
    <h2>${editingId ? "Edit" : "New"} Campaign</h2>

    <label>ID</label>
    <input id="id" value="${c.id || ""}">

    <label>Title</label>
    <input id="title" value="${c.title || ""}">

    <label>Series</label>
    <input id="series" value="${toCSV(c.series)}">

    <label>Tagline</label>
    <input id="tagline" value="${c.tagline || ""}">

    <label>Description</label>
    <textarea id="description">${c.description || ""}</textarea>
	
	<label>Archival Notes</label>
    <textarea id="archivalNotes">${c.archivalNotes || ""}</textarea>
	
    <label>Installation & Play</label>
    <textarea id="installationNotes">${c.installationNotes || ""}</textarea>
	
	<label>Credits</label>
    <textarea id="credits">${c.credits || ""}</textarea>
    
    <label>Language</label>
<input id="language" value="${toCSV(c.language)}">

    <label>Release Date</label>
    <input id="releaseDate" value="${c.releaseDate || ""}">

    <label>Last Updated</label>
    <input id="lastUpdated" value="${c.lastUpdated || ""}">

    <label>Missions</label>
    <input id="missions" type="number" value="${c.missions ?? 0}">

    <hr>

    <label>Main Image</label>
    <input id="image" value="${c.image || ""}">

    <hr>

    <h3>Metadata</h3>

    <label>Authors</label>
    <input id="author" value="${toCSV(c.author)}">

    <label>Team</label>
    <input id="team" value="${toCSV(c.team)}">

    <label>Year</label>
    <input id="year" value="${toCSV(c.year)}">

    <label>StarCraft Version (filterable)</label>
    <input id="starcraftVersion" value="${toCSV(c.starcraftVersion)}">

    <label>Campaign Version (internal)</label>
    <input id="campaignVersion" value="${c.campaignVersion || ""}">

    <label>Status</label>
    <input id="status" value="${toCSV(c.status)}">

    <label>Mod</label>
    <input id="mod" value="${toCSV(c.mod)}">

    <label>Brood War</label>
    <input id="broodWar" value="${toCSV(c.broodWar)}">

    <label>Races</label>
    <input id="races" value="${toCSV(c.races)}">

    <label>Tags</label>
    <input id="tags" value="${toCSV(c.tags)}">

    <label>Original Link</label>
    <input id="originalLink" value="${c.originalLink || ""}">
    
    <label>Archive Link</label>
    <input id="archiveLink" value="${c.archiveLink || ""}">
    
    <label>Mega Backup</label>
    <input id="megaBackup" value="${c.megaBackup || ""}">

    <br><br>

    <button onclick="save()">Save</button>
    <button onclick="renderList()">Cancel</button>
  `;
}

/* =========================
   SAVE
========================= */

function save() {
  const newCampaign = {
    id: document.getElementById("id").value,
    title: document.getElementById("title").value,
    series: toArr(document.getElementById("series").value),

    tagline: document.getElementById("tagline").value,
    description: document.getElementById("description").value,
	archivalNotes: document.getElementById("archivalNotes").value,
	installationNotes: document.getElementById("installationNotes").value,
	credits: document.getElementById("credits").value,
    
    language: toArr(document.getElementById("language").value),

    releaseDate: document.getElementById("releaseDate").value,
    lastUpdated: document.getElementById("lastUpdated").value,

    image: document.getElementById("image").value,

    missions: Number(document.getElementById("missions").value || 0),

    author: toArr(document.getElementById("author").value),
    team: toArr(document.getElementById("team").value),
    year: toArr(document.getElementById("year").value),

    starcraftVersion: toArr(document.getElementById("starcraftVersion").value),
    campaignVersion: document.getElementById("campaignVersion").value,

    status: toArr(document.getElementById("status").value),
    mod: toArr(document.getElementById("mod").value),
    broodWar: toArr(document.getElementById("broodWar").value),
    races: toArr(document.getElementById("races").value),
    tags: toArr(document.getElementById("tags").value),

    originalLink: document.getElementById("originalLink")?.value || "",
    archiveLink: document.getElementById("archiveLink")?.value || "",
    megaBackup: document.getElementById("megaBackup")?.value || ""
  };

  if (editingId) {
    const i = campaigns.findIndex(x => x.id === editingId);
    campaigns[i] = newCampaign;
  } else {
    campaigns.push(newCampaign);
  }

  renderList();
}

/* =========================
   DELETE
========================= */

function removeCampaign(id) {
  campaigns = campaigns.filter(c => c.id !== id);
  renderList();
}

/* =========================
   EXPORT
========================= */

function downloadJSON() {
  const blob = new Blob(
    [JSON.stringify(campaigns, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "campaigns.json";
  a.click();

  URL.revokeObjectURL(url);
}

window.edit = edit;
window.addNew = addNew;
window.save = save;
window.removeCampaign = removeCampaign;
window.downloadJSON = downloadJSON;