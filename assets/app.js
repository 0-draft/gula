const REPO = "0-draft/gula";
const LS_KEY = "gula/ratings/v1";

const GENRES = {
  ramen: "麺", teishoku: "定食", chinese: "中華", curry: "カレー", soba: "そば",
  yoshoku: "洋食", yakiniku: "焼肉", yakitori: "焼鳥", sushi: "寿司",
  ethnic: "アジア", korean: "韓国", kissa: "喫茶", nomi: "呑み", late: "深夜",
};

const AREA_ORDER = ["西口", "北口", "東口", "南池袋", "東池袋", "駅ナカ", "周縁"];

const AXES = [
  { key: "taste", label: "うまい",       hint: "また食べたい味か",   w: 3 },
  { key: "solo",  label: "ひとり居心地", hint: "一人で浮かないか",   w: 2 },
  { key: "value", label: "安い",         hint: "払った額に対して",   w: 1 },
  { key: "ease",  label: "入りやすい",   hint: "並ばず座れるか",     w: 1 },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let shops = [];
let ratings = {};
let map = null;
const filter = { q: "", genres: new Set(), areas: new Set(), onlyNew: false };

/* ---------- 星の計算 ---------- */

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
  return `<span class="ticket__stars" aria-label="5段階で${n}">`
    + "★".repeat(full)
    + `<span class="off">${"★".repeat(Math.max(0, max - full))}</span></span>`;
}

/* ---------- 保存 ---------- */

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

function writeLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ratings)); }
  catch { /* プライベートウィンドウなど。表示は続行する */ }
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

/* ---------- 食券カード ---------- */

function ticket(shop) {
  const r = ratings[shop.id] || {};
  const s = scoreOf(shop.id);
  const visited = r.status === "visited";
  const meta = [
    `<span class="ticket__tag ticket__tag--area">${shop.area}</span>`,
    shop.price ? `<span class="ticket__tag">${shop.price}</span>` : "",
    shop.tabelog ? `<span class="ticket__tag ticket__tag--tabelog">食べログ ${shop.tabelog.toFixed(2)}</span>` : "",
    ...(shop.tags || []).slice(0, 2).map((t) => `<span class="ticket__tag">${t}</span>`),
  ].join("");

  return `
    <button type="button" class="ticket${visited ? " is-visited" : ""}" data-id="${shop.id}">
      <span class="ticket__genre">${GENRES[shop.genre] || shop.genre}</span>
      ${visited ? '<span class="ticket__stamp" aria-hidden="true">済</span>' : ""}
      <span class="ticket__name">${shop.name}</span>
      <span class="ticket__meta">${meta}</span>
      ${shop.note ? `<p class="ticket__note">${shop.note}</p>` : ""}
      ${s !== null ? `<span class="ticket__score"><span class="ticket__num">${s.toFixed(1)}</span>${starRow(s)}</span>` : ""}
      ${r.love ? '<span class="ticket__love" aria-label="好き">♥</span>' : ""}
    </button>`;
}

function grid(list, emptyMsg) {
  if (!list.length) return `<p class="empty">${emptyMsg}</p>`;
  return `<div class="grid">${list.map((s) => ticket(s)).join("")}</div>`;
}

/* ---------- 絞り込み ---------- */

function passes(shop) {
  if (filter.genres.size && !filter.genres.has(shop.genre)) return false;
  if (filter.areas.size && !filter.areas.has(shop.area)) return false;
  if (filter.onlyNew && ratings[shop.id]?.status === "visited") return false;
  if (filter.q) {
    const hay = [shop.name, shop.area, shop.note, shop.spot, ...(shop.tags || [])].join(" ").toLowerCase();
    if (!hay.includes(filter.q.toLowerCase())) return false;
  }
  return true;
}

function buildChips() {
  const genreCounts = {};
  for (const s of shops) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1;

  $("#chips-genre").innerHTML = Object.keys(GENRES)
    .filter((g) => genreCounts[g])
    .map((g) => `<button type="button" class="chip" data-genre="${g}">${GENRES[g]}<span class="tab__n">${genreCounts[g]}</span></button>`)
    .join("");

  $("#chips-area").innerHTML = AREA_ORDER
    .filter((a) => shops.some((s) => s.area === a))
    .map((a) => `<button type="button" class="chip" data-area="${a}">${a}</button>`)
    .join("");
}

/* ---------- 各ビュー ---------- */

function renderRank() {
  const rated = shops
    .filter((s) => scoreOf(s.id) !== null && passes(s))
    .sort((a, b) => scoreOf(b.id) - scoreOf(a.id));

  const list = $("#rank-list");
  if (!rated.length) {
    list.innerHTML = `<li class="rank__empty"><p class="empty">まだ一枚も星がついていない。カードを押して、うまかったところに星を入れるとここに並ぶ。</p></li>`;
    return;
  }
  list.innerHTML = rated
    .map((s, i) => `<li><span class="rank__place" aria-hidden="true">${i + 1}</span>${ticket(s)}</li>`)
    .join("");
}

function renderTodo() {
  const list = shops.filter((s) => ratings[s.id]?.status === "todo" && passes(s));
  $("#view-todo").innerHTML =
    `<div class="view__lead"><p>次に行く店。カードを押して「行った」に変えると制覇台紙にハンコが押される。</p></div>`
    + grid(list, "行きたい店がまだない。「ぜんぶ」から気になる店を選んで「行きたい」を押す。");
}

function renderLove() {
  const list = shops
    .filter((s) => ratings[s.id]?.love && passes(s))
    .sort((a, b) => (scoreOf(b.id) ?? 0) - (scoreOf(a.id) ?? 0));
  $("#view-love").innerHTML =
    `<div class="view__lead"><p>また行く店。迷ったらここから選ぶ。</p></div>`
    + grid(list, "まだない。通いたくなった店に「好き」を押す。");
}

function renderAll() {
  const list = shops.filter(passes);
  $("#view-all").innerHTML =
    `<div class="view__lead"><p>${list.length} 軒 / 全 ${shops.length} 軒</p></div>`
    + grid(list, "その条件だと一軒も残らない。");

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

function renderSheets() {
  const html = AREA_ORDER.map((area) => {
    const inArea = shops.filter((s) => s.area === area);
    if (!inArea.length) return "";
    const done = inArea.filter((s) => ratings[s.id]?.status === "visited");
    const pct = Math.round((done.length / inArea.length) * 100);
    const next = inArea.find((s) => ratings[s.id]?.status === "todo")
      || inArea.find((s) => !ratings[s.id]?.status);

    return `
      <section class="sheet">
        <div class="sheet__head">
          <h3 class="sheet__name">${area}</h3>
          <span class="sheet__count">${done.length} / ${inArea.length} 軒　${pct}%</span>
        </div>
        <div class="meter"><div class="meter__fill" style="width:${pct}%"></div></div>
        <div class="sheet__dots">
          ${inArea.map((s) => {
            const on = ratings[s.id]?.status === "visited";
            return `<button type="button" class="dot${on ? " is-visited" : ""}" data-id="${s.id}" title="${s.name}"><span class="vh">${s.name}</span><span aria-hidden="true">${on ? "済" : GENRES[s.genre] || "◦"}</span></button>`;
          }).join("")}
        </div>
        ${next ? `<p class="sheet__next">次の一軒：${next.name}</p>` : `<p class="sheet__next">この台紙は満了。</p>`}
      </section>`;
  }).join("");

  $("#sheets").innerHTML = html;
}

/* ---------- 地図 ---------- */

function tabelogUrl(shop) {
  return `https://tabelog.com/rstLst/?sw=${encodeURIComponent(shop.name + " 池袋")}`;
}

function webUrl(shop) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(shop.name + " 池袋 一人")}`;
}

function mapsUrl(shop) {
  if (shop.lat) return `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " 豊島区")}`;
}

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
    const st = ratings[s.id]?.status;
    const cls = st === "visited" ? "pin pin--visited" : st === "todo" ? "pin pin--todo" : "pin";
    const icon = L.divIcon({ className: "", html: `<div class="${cls}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
    L.marker([s.lat, s.lng], { icon, title: s.name })
      .addTo(map.markers)
      .bindPopup(`<b>${s.name}</b><br>${s.area}　${s.price || ""}<br><a href="#" data-open="${s.id}">星をつける</a>`);
  }
}

function renderMapRest() {
  const placed = shops.filter((s) => s.lat);
  const rest = shops.filter((s) => !s.lat);
  $("#map-count").textContent = `座標がわかっているのは ${placed.length} 軒。残り ${rest.length} 軒はまだ地図に載っていないので、名前から地図アプリを開く。`;
  $("#map-rest").innerHTML = rest.length
    ? `<p>地図未登録の店</p><ul>${rest.map((s) => `<li><a href="${mapsUrl(s)}" target="_blank" rel="noopener">${s.name}</a></li>`).join("")}</ul>`
    : "";
}

/* ---------- 記入ダイアログ ---------- */

let editing = null;

function openEditor(id) {
  const shop = shops.find((s) => s.id === id);
  if (!shop) return;
  editing = shop;
  const r = ratings[id] || { stars: {} };

  $("#ed-name").textContent = shop.name;
  $("#ed-meta").textContent = [shop.area, shop.spot, shop.price, shop.hours].filter(Boolean).join("　");
  $("#ed-note").textContent = shop.note || "";

  $$(".pill", $("#editor")).forEach((p) => {
    const on = p.dataset.love ? !!r.love : r.status === p.dataset.status;
    p.classList.toggle("is-on", on);
  });

  $("#ed-stars").innerHTML = AXES.map((a) => `
    <div class="axis">
      <span class="axis__label">${a.label}<small>${a.hint}　重み×${a.w}</small></span>
      <span class="axis__stars" role="group" aria-label="${a.label}">
        ${[1, 2, 3, 4, 5].map((n) =>
          `<button type="button" class="axis__star${(r.stars?.[a.key] || 0) >= n ? " is-on" : ""}" data-axis="${a.key}" data-n="${n}" aria-label="${a.label} ${n}">★</button>`
        ).join("")}
      </span>
    </div>`).join("");

  $("#ed-memo").value = r.memo || "";
  $("#ed-date").value = r.visitedAt || "";
  $("#ed-maps").href = mapsUrl(shop);
  $("#ed-tabelog").href = tabelogUrl(shop);
  $("#ed-web").href = webUrl(shop);
  updateIssueLink();
  const dlg = $("#editor");
  if (!dlg.open) dlg.showModal();
}

function updateIssueLink() {
  if (!editing) return;
  const r = ratings[editing.id] || { stars: {} };
  const s = scoreOf(editing.id);
  const body = [
    `店: ${editing.name} (\`${editing.id}\`)`,
    `状態: ${r.status === "visited" ? "行った" : r.status === "todo" ? "行きたい" : "—"}${r.love ? " / 好き" : ""}`,
    `行った日: ${r.visitedAt || "—"}`,
    "",
    ...AXES.map((a) => `- ${a.label}: ${r.stars?.[a.key] || "—"}`),
    `- 総合: ${s === null ? "—" : s.toFixed(1)}`,
    "",
    `メモ: ${r.memo || ""}`,
    "",
    "```json",
    JSON.stringify({ [editing.id]: r }, null, 2),
    "```",
  ].join("\n");

  $("#ed-issue").href = `https://github.com/${REPO}/issues/new?labels=rating`
    + `&title=${encodeURIComponent(`[記録] ${editing.name}`)}`
    + `&body=${encodeURIComponent(body)}`;
}

function updateExport() {
  const blob = new Blob([JSON.stringify(ratings, null, 2)], { type: "application/json" });
  const link = $("#export-link");
  if (link.dataset.url) URL.revokeObjectURL(link.dataset.url);
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.dataset.url = url;
}

/* ---------- 画面の切り替え ---------- */

function show(next) {
  $$(".tab").forEach((t) => {
    const on = t.dataset.view === next;
    t.classList.toggle("is-on", on);
    if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  });
  $$(".view").forEach((v) => { v.hidden = v.id !== `view-${next}`; });
  $("#sift").hidden = next === "sheet";
  if (next === "map") { initMap(); setTimeout(() => map && map.invalidateSize(), 0); }
}

function drawToday() {
  const pool = shops.filter((s) => ratings[s.id]?.status === "todo");
  const fallback = shops.filter((s) => !ratings[s.id]?.status);
  const from = pool.length ? pool : fallback.length ? fallback : shops;
  const pick = from[Math.floor(Math.random() * from.length)];
  $("#draw-slot").innerHTML = ticket(pick);
}

/* ---------- 起動 ---------- */

async function main() {
  const [shopRes, ratingRes] = await Promise.all([
    fetch("data/shops.json").then((r) => r.json()),
    fetch("data/ratings.json").then((r) => r.json()).catch(() => ({})),
  ]);
  shops = shopRes;
  ratings = mergeRatings(ratingRes, readLocal());

  buildChips();
  renderAll();
  drawToday();
  show("rank");
}

/* ---------- 操作 ---------- */

document.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (tab) return show(tab.dataset.view);

  const card = e.target.closest(".ticket, .dot");
  if (card) return openEditor(card.dataset.id);

  const popupLink = e.target.closest("[data-open]");
  if (popupLink) { e.preventDefault(); return openEditor(popupLink.dataset.open); }

  const chip = e.target.closest(".chip");
  if (chip) {
    const set = chip.dataset.genre ? filter.genres : filter.areas;
    const key = chip.dataset.genre || chip.dataset.area;
    set.has(key) ? set.delete(key) : set.add(key);
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
    openEditor(editing.id);
    return;
  }

  const pill = e.target.closest(".pill");
  if (pill && editing) {
    const r = (ratings[editing.id] = ratings[editing.id] || { stars: {} });
    if (pill.dataset.love) r.love = !r.love;
    else r.status = r.status === pill.dataset.status ? null : pill.dataset.status;
    pill.classList.toggle("is-on");
    touch(editing.id);
    updateIssueLink();
    return;
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
