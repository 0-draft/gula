// Validates data/*.json. Runs in CI and locally via `npm run lint:data`.
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

if (!Array.isArray(shops)) fail("shops.json must be an array");

const ids = new Set();
for (const [i, s] of shops.entries()) {
  const at = `shops[${i}] ${s.name || "(no name)"}`;
  if (!s.id) fail(`${at}: missing id`);
  if (ids.has(s.id)) fail(`${at}: duplicate id (${s.id})`);
  ids.add(s.id);
  if (!s.name) fail(`${at}: missing name`);
  if (!GENRES.includes(s.genre)) fail(`${at}: unknown genre (${s.genre})`);
  if (!AREAS.includes(s.area)) fail(`${at}: unknown area (${s.area})`);
  if (s.solo !== undefined && !(s.solo >= 1 && s.solo <= 5)) fail(`${at}: solo must be 1-5`);
  if (s.tabelog !== undefined && !(s.tabelog >= 1 && s.tabelog <= 5)) fail(`${at}: tabelog must be 1-5`);
  if (s.tags !== undefined && !Array.isArray(s.tags)) fail(`${at}: tags must be an array`);
  if ((s.lat === undefined) !== (s.lng === undefined)) fail(`${at}: lat and lng must come together`);
  if (s.lat !== undefined) {
    if (!(s.lat > 35.68 && s.lat < 35.78)) fail(`${at}: lat is out of range (${s.lat})`);
    if (!(s.lng > 139.65 && s.lng < 139.78)) fail(`${at}: lng is out of range (${s.lng})`);
  }
}

for (const [id, r] of Object.entries(ratings)) {
  const at = `ratings["${id}"]`;
  if (!ids.has(id)) fail(`${at}: id not present in shops.json`);
  if (!STATUSES.includes(r.status ?? null)) fail(`${at}: unknown status (${r.status})`);
  for (const [axis, v] of Object.entries(r.stars || {})) {
    if (!AXES.includes(axis)) fail(`${at}: unknown axis (${axis})`);
    if (!(v >= 0 && v <= 5 && Number.isInteger(v * 2))) fail(`${at}.stars.${axis}: must be 0-5 in steps of 0.5`);
  }
  if (r.visitedAt && !/^\d{4}-\d{2}-\d{2}$/.test(r.visitedAt)) fail(`${at}: visitedAt must be YYYY-MM-DD`);
  if (r.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(r.updatedAt)) fail(`${at}: updatedAt must be YYYY-MM-DD`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}

const placed = shops.filter((s) => s.lat).length;
console.log(`✓ ${shops.length} shops / ${placed} with coordinates / ${Object.keys(ratings).length} rated`);
