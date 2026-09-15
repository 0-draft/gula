import { t, genre, area, tag, setLang, getLang } from "./i18n.js";

const REPO = "0-draft/gula";
const LS_RATINGS = "gula/ratings/v1";
const LS_LANG = "gula/lang/v1";

const GENRE_ORDER = [
  "ramen", "teishoku", "chinese", "curry", "soba", "yoshoku", "yakiniku",
  "yakitori", "sushi", "ethnic", "korean", "kissa", "nomi", "late",
];

const AREA_ORDER = ["西口", "北口", "東口", "南池袋", "東池袋", "駅ナカ", "周縁"];

const AXES = [
  { key: "taste", w: 3 },
  { key: "solo", w: 2 },
  { key: "value", w: 1 },
  { key: "ease", w: 1 },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let shops = [];
let ratings = {};
let map = null;
let editing = null;
const filter = { q: "", genres: new Set(), areas: new Set(), onlyNew: false };

/* ---------- scoring ---------- */

function scoreOf(id) {
  const r = ratings[id];
  if (!r || !r.stars) return null;
  let sum = 0, weight = 0;
  for (const a of AXES) {
    const v = r.stars[a.key];
    if (v > 0) { sum += v * a.w; weight += a.w; }
  }
  return weight ? Math.round((sum / weight) * 10) / 10 : null;
}

function starRow(n, max = 5) {
  const full = Math.round(n);
  return `<span class="ticket__stars" aria-label="${t("stars.aria", n)}">`
    + "★".repeat(full)
    + `<span class="off">${"★".repeat(Math.max(0, max - full))}</span></span>`;
}

/* ---------- persistence ---------- */

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; }
  catch { return fallback; }
}

function writeLocal() {
  try { localStorage.setItem(LS_RATINGS, JSON.stringify(ratings)); }
  catch { /* private window or blocked storage: keep rendering anyway */ }
}

function mergeRatings(fromRepo, fromLocal) {
  const out = { ...fromRepo };
  for (const [id, local] of Object.entries(fromLocal)) {
    const repo = fromRepo[id];
    if (!repo || (local.updatedAt || "") >= (repo.updatedAt || "")) out[id] = local;
  }
  return out;
}

function touch(id) {
  ratings[id] = ratings[id] || { stars: {} };
  ratings[id].updatedAt = new Date().toISOString().slice(0, 10);
  writeLocal();
  renderAll();
}

/* ---------- meal-ticket card ---------- */

function noteOf(shop) {
  return (getLang() === "en" && shop.noteEn) || shop.note || "";
}

function ticket(shop) {
  const r = ratings[shop.id] || {};
  const s = scoreOf(shop.id);
  const visited = r.status === "visited";
  const note = noteOf(shop);
  const meta = [
    `<span class="ticket__tag ticket__tag--area">${area(shop.area)}</span>`,
    shop.price ? `<span class="ticket__tag">${shop.price}</span>` : "",
    shop.tabelog ? `<span class="ticket__tag ticket__tag--tabelog">${t("card.tabelog", shop.tabelog.toFixed(2))}</span>` : "",
    ...(shop.tags || []).slice(0, 2).map((x) => `<span class="ticket__tag">${tag(x)}</span>`),
  ].join("");

  return `
    <button type="button" class="ticket${visited ? " is-visited" : ""}" data-id="${shop.id}">
      <span class="ticket__genre">${genre(shop.genre)}</span>
      ${visited ? `<span class="ticket__stamp" aria-hidden="true">${t("card.stamp")}</span>` : ""}
      <span class="ticket__name">${shop.name}</span>
      <span class="ticket__meta">${meta}</span>
      ${note ? `<p class="ticket__note">${note}</p>` : ""}
      ${s !== null ? `<span class="ticket__score"><span class="ticket__num">${s.toFixed(1)}</span>${starRow(s)}</span>` : ""}
      ${r.love ? '<span class="ticket__love" aria-label="love">♥</span>' : ""}
    </button>`;
}

function grid(list, emptyMsg) {
  if (!list.length) return `<p class="empty">${emptyMsg}</p>`;
  return `<div class="grid">${list.map(ticket).join("")}</div>`;
}

/* ---------- filtering ---------- */

function passes(shop) {
  if (filter.genres.size && !filter.genres.has(shop.genre)) return false;
  if (filter.areas.size && !filter.areas.has(shop.area)) return false;
  if (filter.onlyNew && ratings[shop.id]?.status === "visited") return false;
  if (filter.q) {
    const hay = [shop.name, shop.area, area(shop.area), shop.note, shop.noteEn, shop.spot,
      ...(shop.tags || []), ...(shop.tags || []).map(tag)].join(" ").toLowerCase();
    if (!hay.includes(filter.q.toLowerCase())) return false;
  }
  return true;
}

function buildChips() {
  const counts = {};
  for (const s of shops) counts[s.genre] = (counts[s.genre] || 0) + 1;

  $("#chips-genre").innerHTML = GENRE_ORDER
    .filter((g) => counts[g])
    .map((g) => `<button type="button" class="chip${filter.genres.has(g) ? " is-on" : ""}" data-genre="${g}">${genre(g)}<span class="tab__n">${counts[g]}</span></button>`)
    .join("");

  $("#chips-area").innerHTML = AREA_ORDER
    .filter((a) => shops.some((s) => s.area === a))
    .map((a) => `<button type="button" class="chip${filter.areas.has(a) ? " is-on" : ""}" data-area="${a}">${area(a)}</button>`)
    .join("");
}

/* ---------- views ---------- */

function renderRank() {
  const rated = shops
    .filter((s) => scoreOf(s.id) !== null && passes(s))
    .sort((a, b) => scoreOf(b.id) - scoreOf(a.id));

  const list = $("#rank-list");
  list.innerHTML = rated.length
    ? rated.map((s, i) => `<li><span class="rank__place" aria-hidden="true">${i + 1}</span>${ticket(s)}</li>`).join("")
    : `<li class="rank__empty"><p class="empty">${t("rank.empty")}</p></li>`;
}

function renderTodo() {
  const list = shops.filter((s) => ratings[s.id]?.status === "todo" && passes(s));
  $("#view-todo").innerHTML = `<div class="view__lead"><p>${t("todo.lead")}</p></div>`
    + grid(list, t("todo.empty"));
}

function renderLove() {
  const list = shops
    .filter((s) => ratings[s.id]?.love && passes(s))
    .sort((a, b) => (scoreOf(b.id) ?? 0) - (scoreOf(a.id) ?? 0));
  $("#view-love").innerHTML = `<div class="view__lead"><p>${t("love.lead")}</p></div>`
    + grid(list, t("love.empty"));
}

function renderSheets() {
  $("#sheets").innerHTML = AREA_ORDER.map((a) => {
    const inArea = shops.filter((s) => s.area === a);
    if (!inArea.length) return "";
    const done = inArea.filter((s) => ratings[s.id]?.status === "visited");
    const pct = Math.round((done.length / inArea.length) * 100);
    const next = inArea.find((s) => ratings[s.id]?.status === "todo")
      || inArea.find((s) => !ratings[s.id]?.status);

    return `
      <section class="sheet">
        <div class="sheet__head">
          <h3 class="sheet__name">${area(a)}</h3>
          <span class="sheet__count">${t("sheet.count", done.length, inArea.length, pct)}</span>
        </div>
        <div class="meter"><div class="meter__fill" style="width:${pct}%"></div></div>
        <div class="sheet__dots">
          ${inArea.map((s) => {
            const on = ratings[s.id]?.status === "visited";
            return `<button type="button" class="dot${on ? " is-visited" : ""}" data-id="${s.id}" title="${s.name}"><span class="vh">${s.name}</span><span aria-hidden="true">${on ? t("card.stamp") : genre(s.genre).slice(0, 2)}</span></button>`;
          }).join("")}
        </div>
        <p class="sheet__next">${next ? t("sheet.next", next.name) : t("sheet.done")}</p>
      </section>`;
  }).join("");
}

function renderAll() {
  const list = shops.filter(passes);
  $("#view-all").innerHTML = `<div class="view__lead"><p>${t("all.lead", list.length, shops.length)}</p></div>`
    + grid(list, t("all.empty"));

  $("#n-all").textContent = shops.length;
  $("#n-todo").textContent = shops.filter((s) => ratings[s.id]?.status === "todo").length || "";
  $("#n-love").textContent = shops.filter((s) => ratings[s.id]?.love).length || "";

  renderRank();
  renderTodo();
  renderLove();
  renderSheets();
  renderMapRest();
  if (map) drawMarkers();
  updateExport();
}

/* ---------- outbound links ---------- */

function tabelogUrl(shop) {
  return `https://tabelog.com/rstLst/?sw=${encodeURIComponent(`${shop.name} 池袋`)}`;
}

function webUrl(shop) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(`${shop.name} 池袋 一人`)}`;
}

function mapsUrl(shop) {
  const query = shop.lat ? `${shop.lat},${shop.lng}` : `${shop.name} 豊島区`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/* ---------- map ---------- */

function initMap() {
  if (map || typeof L === "undefined") return;
  map = L.map("map", { scrollWheelZoom: false }).setView([35.7295, 139.7135], 15);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  map.markers = L.layerGroup().addTo(map);
  drawMarkers();
}

function drawMarkers() {
  map.markers.clearLayers();
  for (const s of shops.filter((x) => x.lat && passes(x))) {
    const status = ratings[s.id]?.status;
    const cls = status === "visited" ? "pin pin--visited" : status === "todo" ? "pin pin--todo" : "pin";
    const icon = L.divIcon({ className: "", html: `<div class="${cls}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
    L.marker([s.lat, s.lng], { icon, title: s.name })
      .addTo(map.markers)
      .bindPopup(`<b>${s.name}</b><br>${area(s.area)}　${s.price || ""}`);
  }
}

function renderMapRest() {
  const placed = shops.filter((s) => s.lat);
  const rest = shops.filter((s) => !s.lat);
  $("#map-count").textContent = t("map.lead", placed.length, rest.length);
  $("#map-rest").innerHTML = rest.length
    ? `<p>${t("map.unlisted")}</p><ul>${rest.map((s) => `<li><a href="${mapsUrl(s)}" target="_blank" rel="noopener">${s.name}</a></li>`).join("")}</ul>`
    : "";
}

/* ---------- rating dialog ---------- */

function openEditor(id) {
  const shop = shops.find((s) => s.id === id);
  if (!shop) return;
  editing = shop;
  const r = ratings[id] || { stars: {} };

  $("#ed-name").textContent = shop.name;
  $("#ed-meta").textContent = [area(shop.area), shop.spot, shop.price, shop.hours].filter(Boolean).join("　");
  $("#ed-note").textContent = noteOf(shop);

  $$(".pill", $("#editor")).forEach((p) => {
    p.classList.toggle("is-on", p.dataset.love ? !!r.love : r.status === p.dataset.status);
  });

  $("#ed-stars").innerHTML = AXES.map((a) => `
    <div class="axis">
      <span class="axis__label">${t(`axis.${a.key}`)}<small>${t(`axis.${a.key}.hint`)}　${t("axis.weight", a.w)}</small></span>
      <span class="axis__stars" role="group" aria-label="${t(`axis.${a.key}`)}">
        ${[1, 2, 3, 4, 5].map((n) =>
          `<button type="button" class="axis__star${(r.stars?.[a.key] || 0) >= n ? " is-on" : ""}" data-axis="${a.key}" data-n="${n}" aria-label="${t(`axis.${a.key}`)} ${n}">★</button>`
        ).join("")}
      </span>
    </div>`).join("");

  $("#ed-memo").value = r.memo || "";
  $("#ed-date").value = r.visitedAt || "";
  $("#ed-maps").href = mapsUrl(shop);
  $("#ed-tabelog").href = tabelogUrl(shop);
  $("#ed-web").href = webUrl(shop);
  updateIssueLink();

  const dialog = $("#editor");
  if (!dialog.open) dialog.showModal();
}

function updateIssueLink() {
  if (!editing) return;
  const r = ratings[editing.id] || { stars: {} };
  const s = scoreOf(editing.id);
  const body = [
    `Shop: ${editing.name} (\`${editing.id}\`)`,
    `Status: ${r.status || "—"}${r.love ? " / love" : ""}`,
    `Visited: ${r.visitedAt || "—"}`,
    "",
    ...AXES.map((a) => `- ${a.key}: ${r.stars?.[a.key] || "—"}`),
    `- overall: ${s === null ? "—" : s.toFixed(1)}`,
    "",
    `Notes: ${r.memo || ""}`,
    "",
    "```json",
    JSON.stringify({ [editing.id]: r }, null, 2),
    "```",
  ].join("\n");

  $("#ed-issue").href = `https://github.com/${REPO}/issues/new?labels=rating`
    + `&title=${encodeURIComponent(`[visit] ${editing.name}`)}`
    + `&body=${encodeURIComponent(body)}`;
}

function updateExport() {
  const link = $("#export-link");
  if (link.dataset.url) URL.revokeObjectURL(link.dataset.url);
  const url = URL.createObjectURL(new Blob([JSON.stringify(ratings, null, 2)], { type: "application/json" }));
  link.href = url;
  link.dataset.url = url;
}

/* ---------- view switching ---------- */

function show(next) {
  $$(".tab").forEach((tabEl) => {
    const on = tabEl.dataset.view === next;
    tabEl.classList.toggle("is-on", on);
    if (on) tabEl.setAttribute("aria-current", "page");
    else tabEl.removeAttribute("aria-current");
  });
  $$(".view").forEach((v) => { v.hidden = v.id !== `view-${next}`; });
  $("#sift").hidden = next === "sheet";
  if (next === "map") { initMap(); setTimeout(() => map && map.invalidateSize(), 0); }
}

function drawToday() {
  const todo = shops.filter((s) => ratings[s.id]?.status === "todo");
  const fresh = shops.filter((s) => !ratings[s.id]?.status);
  const pool = todo.length ? todo : fresh.length ? fresh : shops;
  $("#draw-slot").innerHTML = ticket(pool[Math.floor(Math.random() * pool.length)]);
}

/* ---------- language ---------- */

function applyLang() {
  document.title = t("doc.title");
  for (const el of $$("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of $$("[data-i18n-html]")) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of $$("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of $$("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  buildChips();
  renderAll();
  drawToday();
  if (editing) openEditor(editing.id);
}

function switchLang(next) {
  setLang(next);
  try { localStorage.setItem(LS_LANG, next); } catch { /* ignore */ }
  applyLang();
}

/* ---------- boot ---------- */

async function main() {
  const [shopData, ratingData] = await Promise.all([
    fetch("data/shops.json").then((r) => r.json()),
    fetch("data/ratings.json").then((r) => r.json()).catch(() => ({})),
  ]);
  shops = shopData;
  ratings = mergeRatings(ratingData, readJson(LS_RATINGS, {}));
  setLang(readJson(LS_LANG, null) || "en");

  applyLang();
  show("rank");
}

/* ---------- events ---------- */

document.addEventListener("click", (e) => {
  const tabEl = e.target.closest(".tab");
  if (tabEl) return show(tabEl.dataset.view);

  if (e.target.closest("#lang")) return switchLang(getLang() === "en" ? "ja" : "en");

  const card = e.target.closest(".ticket, .dot");
  if (card) return openEditor(card.dataset.id);

  const chip = e.target.closest(".chip");
  if (chip) {
    const set = chip.dataset.genre ? filter.genres : filter.areas;
    const key = chip.dataset.genre || chip.dataset.area;
    if (set.has(key)) set.delete(key); else set.add(key);
    chip.classList.toggle("is-on");
    return renderAll();
  }

  const star = e.target.closest(".axis__star");
  if (star && editing) {
    const r = (ratings[editing.id] = ratings[editing.id] || { stars: {} });
    r.stars = r.stars || {};
    const n = Number(star.dataset.n);
    r.stars[star.dataset.axis] = r.stars[star.dataset.axis] === n ? 0 : n;
    if (!r.status) r.status = "visited";
    touch(editing.id);
    return openEditor(editing.id);
  }

  const pill = e.target.closest(".pill");
  if (pill && editing) {
    const r = (ratings[editing.id] = ratings[editing.id] || { stars: {} });
    if (pill.dataset.love) r.love = !r.love;
    else r.status = r.status === pill.dataset.status ? null : pill.dataset.status;
    pill.classList.toggle("is-on");
    touch(editing.id);
    return updateIssueLink();
  }
});

$("#draw-again").addEventListener("click", drawToday);
$("#q").addEventListener("input", (e) => { filter.q = e.target.value.trim(); renderAll(); });
$("#only-new").addEventListener("change", (e) => { filter.onlyNew = e.target.checked; renderAll(); });

$("#ed-memo").addEventListener("input", (e) => {
  if (!editing) return;
  const r = (ratings[editing.id] = ratings[editing.id] || { stars: {} });
  r.memo = e.target.value;
  writeLocal();
  updateIssueLink();
});

$("#ed-date").addEventListener("change", (e) => {
  if (!editing) return;
  const r = (ratings[editing.id] = ratings[editing.id] || { stars: {} });
  r.visitedAt = e.target.value;
  if (e.target.value) r.status = "visited";
  touch(editing.id);
  openEditor(editing.id);
});

$("#ed-clear").addEventListener("click", () => {
  if (!editing) return;
  delete ratings[editing.id];
  writeLocal();
  renderAll();
  $("#editor").close();
});

$("#editor").addEventListener("close", () => { editing = null; });

main();
