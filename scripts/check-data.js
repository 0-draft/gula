// Validates data/*.json. Runs in CI and locally via `npm run lint:data`.
import { readFileSync } from "node:fs";

const GENRES = [
  "ramen", "teishoku", "chinese", "curry", "soba", "yoshoku", "yakiniku",
  "yakitori", "sushi", "ethnic", "korean", "kissa", "nomi",
];
const AREAS = ["西口", "北口", "東口", "南池袋", "東池袋", "駅ナカ", "周縁"];

const errors = [];
const fail = (msg) => errors.push(msg);

const shops = JSON.parse(readFileSync("data/shops.json", "utf8"));
const ratings = JSON.parse(readFileSync("data/ratings.json", "utf8"));
const photos = JSON.parse(readFileSync("data/photos.json", "utf8"));

if (!Array.isArray(shops)) fail("shops.json must be an array");

const ids = new Set();
for (const [i, s] of shops.entries()) {
  const at = `shops[${i}] ${s.name || "(no name)"}`;
  if (!s.id) fail(`${at}: missing id`);
  if (ids.has(s.id)) fail(`${at}: duplicate id (${s.id})`);
  ids.add(s.id);
  if (!s.name) fail(`${at}: missing name`);
  if (!s.note) fail(`${at}: missing note`);
  if (!GENRES.includes(s.genre)) fail(`${at}: unknown genre (${s.genre})`);
  if (!AREAS.includes(s.area)) fail(`${at}: unknown area (${s.area})`);
  if (s.solo !== undefined && typeof s.solo !== "boolean") fail(`${at}: solo must be a boolean`);
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
  if (r.score !== undefined && !(r.score >= 0 && r.score <= 10 && Number.isInteger(r.score * 2))) {
    fail(`${at}.score: must be 0-10 in steps of 0.5`);
  }
  for (const field of ["visitedAt", "updatedAt"]) {
    if (r[field] && !/^\d{4}-\d{2}-\d{2}$/.test(r[field])) fail(`${at}: ${field} must be YYYY-MM-DD`);
  }
}

for (const id of photos) {
  if (!ids.has(id)) fail(`photos.json: "${id}" is not a shop id — rerun npm run photos`);
}

if (errors.length) {
  console.error(errors.map((e) => `x ${e}`).join("\n"));
  process.exit(1);
}

const placed = shops.filter((s) => s.lat).length;
const solo = shops.filter((s) => s.solo).length;
console.log(`ok: ${shops.length} shops, ${placed} plotted, ${solo} solo-friendly, ${photos.length} with photos, ${Object.keys(ratings).length} scored`);
