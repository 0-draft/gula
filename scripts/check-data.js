// data/*.json が壊れていないかを確かめる。CI とローカルの両方で走らせる。
import { readFileSync } from "node:fs";

const GENRES = [
  "ramen", "teishoku", "chinese", "curry", "soba", "yoshoku", "yakiniku",
  "yakitori", "sushi", "ethnic", "korean", "kissa", "nomi", "late",
];
const AREAS = ["西口", "北口", "東口", "南池袋", "東池袋", "駅ナカ", "周縁"];
const AXES = ["taste", "solo", "value", "ease"];
const STATUSES = ["todo", "visited", null];

const errors = [];
const fail = (msg) => errors.push(msg);

const shops = JSON.parse(readFileSync("data/shops.json", "utf8"));
const ratings = JSON.parse(readFileSync("data/ratings.json", "utf8"));

if (!Array.isArray(shops)) fail("shops.json は配列であること");

const ids = new Set();
for (const [i, s] of shops.entries()) {
  const at = `shops[${i}] ${s.name || "(no name)"}`;
  if (!s.id) fail(`${at}: id がない`);
  if (ids.has(s.id)) fail(`${at}: id が重複 (${s.id})`);
  ids.add(s.id);
  if (!s.name) fail(`${at}: name がない`);
  if (!GENRES.includes(s.genre)) fail(`${at}: 未知の genre (${s.genre})`);
  if (!AREAS.includes(s.area)) fail(`${at}: 未知の area (${s.area})`);
  if (s.solo !== undefined && !(s.solo >= 1 && s.solo <= 5)) fail(`${at}: solo は 1〜5`);
  if (s.tabelog !== undefined && !(s.tabelog >= 1 && s.tabelog <= 5)) fail(`${at}: tabelog は 1〜5`);
  if (s.tags !== undefined && !Array.isArray(s.tags)) fail(`${at}: tags は配列`);
  if ((s.lat === undefined) !== (s.lng === undefined)) fail(`${at}: lat と lng は両方そろえる`);
  if (s.lat !== undefined) {
    if (!(s.lat > 35.68 && s.lat < 35.78)) fail(`${at}: lat が池袋から離れすぎ (${s.lat})`);
    if (!(s.lng > 139.65 && s.lng < 139.78)) fail(`${at}: lng が池袋から離れすぎ (${s.lng})`);
  }
}

for (const [id, r] of Object.entries(ratings)) {
  const at = `ratings["${id}"]`;
  if (!ids.has(id)) fail(`${at}: shops.json にない id`);
  if (!STATUSES.includes(r.status ?? null)) fail(`${at}: 未知の status (${r.status})`);
  for (const [axis, v] of Object.entries(r.stars || {})) {
    if (!AXES.includes(axis)) fail(`${at}: 未知の軸 (${axis})`);
    if (!Number.isInteger(v) || v < 0 || v > 5) fail(`${at}.stars.${axis}: 0〜5 の整数`);
  }
  if (r.visitedAt && !/^\d{4}-\d{2}-\d{2}$/.test(r.visitedAt)) fail(`${at}: visitedAt は YYYY-MM-DD`);
  if (r.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(r.updatedAt)) fail(`${at}: updatedAt は YYYY-MM-DD`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}

const placed = shops.filter((s) => s.lat).length;
console.log(`✓ ${shops.length} 軒 / 座標あり ${placed} 軒 / 評価済み ${Object.keys(ratings).length} 軒`);
