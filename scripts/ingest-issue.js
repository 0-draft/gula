// Turns an issue into rating data.
//
// One shop per line. The name is matched loosely against data/shops.json, so
// "無敵家", "mutekiya" and "無敵家 池袋" all resolve to the same shop.
//
//   無敵家 3.0                        -> taste 3.0
//   開楽 4 solo=5 value=3             -> taste 4, solo comfort 5, value 3
//   新珍味 love memo=ターロー飯がうまい
//   田坂屋 todo
//   無敵家 2026-09-16
//   無敵家 clear                      -> forget this shop
//
// A ```json fenced block, as produced by the app's "Save as an issue" button,
// is merged as-is and wins over the line grammar.

import { readFileSync, writeFileSync } from "node:fs";

const AXES = { taste: "taste", solo: "solo", value: "value", ease: "ease" };
const TODAY = new Date().toISOString().slice(0, 10);

const shops = JSON.parse(readFileSync("data/shops.json", "utf8"));
const ratings = JSON.parse(readFileSync("data/ratings.json", "utf8"));

const body = (process.env.ISSUE_BODY || "").replace(/\r/g, "");
const applied = [];
const problems = [];

/* ---------- shop lookup ---------- */

const normalise = (s) => s
  .toLowerCase()
  .replace(/[\s　]/g, "")
  .replace(/[（(].*?[)）]/g, "")
  .replace(/(池袋本店|池袋東口店|池袋西口店|池袋南口店|池袋店|東口店|西口店|南池袋店|西池袋店|本店|池袋)$/g, "");

const byId = new Map(shops.map((s) => [s.id, s]));
const byName = new Map();
for (const s of shops) {
  byName.set(normalise(s.name), s);
  byName.set(normalise(s.id), s);
}

function resolve(label) {
  const key = normalise(label);
  if (byId.has(label)) return byId.get(label);
  if (byName.has(key)) return byName.get(key);
  const hits = shops.filter((s) => normalise(s.name).includes(key) || key.includes(normalise(s.name)));
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    problems.push(`\`${label}\` matches ${hits.length} shops (${hits.map((h) => h.name).join(", ")}). Use the id.`);
    return null;
  }
  problems.push(`No shop called \`${label}\`. Open an "Add a shop" issue if it is missing.`);
  return null;
}

/* ---------- a fenced json block wins ---------- */

const fenced = body.match(/```json\s*([\s\S]*?)```/);
let mergedJson = false;
if (fenced) {
  try {
    const payload = JSON.parse(fenced[1]);
    for (const [id, entry] of Object.entries(payload)) {
      if (!byId.has(id)) { problems.push(`JSON block: unknown id \`${id}\`.`); continue; }
      ratings[id] = { ...entry, updatedAt: entry.updatedAt || TODAY };
      applied.push(`**${byId.get(id).name}** from the JSON block`);
      mergedJson = true;
    }
  } catch {
    problems.push("The ```json block is not valid JSON, so it was skipped.");
  }
}

/* ---------- line grammar ---------- */

const star = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 5) return null;
  return Math.round(n * 2) / 2;
};

const lines = body
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#") && !l.startsWith(">") && !l.startsWith("```"))
  .filter((l) => !/^(_No response_|None|N\/A)$/i.test(l))
  .map((l) => l.replace(/^[-*]\s+/, ""));

for (const line of lines) {
  if (fenced && line.includes("{")) continue;

  // memo= swallows the rest of the line, so pull it off first.
  let rest = line;
  let memo = null;
  const memoAt = rest.match(/\bmemo=/);
  if (memoAt) {
    memo = rest.slice(memoAt.index + 5).trim();
    rest = rest.slice(0, memoAt.index).trim();
  }

  const words = rest.split(/[\s　]+/).filter(Boolean);
  const nameParts = [];
  const ops = [];
  for (const w of words) {
    if (/^(love|unlove|todo|visited|clear)$/i.test(w)
      || /^\d{4}-\d{2}-\d{2}$/.test(w)
      || /^(taste|solo|value|ease)=/.test(w)
      || (nameParts.length && star(w) !== null)) {
      ops.push(w);
    } else {
      nameParts.push(w);
    }
  }

  if (!nameParts.length || (!ops.length && memo === null)) continue;

  const shop = resolve(nameParts.join(" "));
  if (!shop) continue;
  if (mergedJson && ratings[shop.id]?.updatedAt === TODAY && !ops.length) continue;

  if (ops.some((o) => o.toLowerCase() === "clear")) {
    delete ratings[shop.id];
    applied.push(`**${shop.name}** cleared`);
    continue;
  }

  const entry = ratings[shop.id] || { stars: {} };
  entry.stars = entry.stars || {};
  const changes = [];

  for (const op of ops) {
    const lower = op.toLowerCase();
    const kv = op.match(/^(taste|solo|value|ease)=(.+)$/);
    if (kv) {
      const n = star(kv[2]);
      if (n === null) { problems.push(`\`${op}\` on ${shop.name} is not a number between 0 and 5.`); continue; }
      entry.stars[AXES[kv[1]]] = n;
      changes.push(`${kv[1]} ${n}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(op)) {
      entry.visitedAt = op;
      entry.status = "visited";
      changes.push(`visited ${op}`);
    } else if (lower === "love") {
      entry.love = true;
      changes.push("loved");
    } else if (lower === "unlove") {
      entry.love = false;
      changes.push("unloved");
    } else if (lower === "todo" || lower === "visited") {
      entry.status = lower;
      changes.push(lower);
    } else {
      const n = star(op);
      if (n === null) { problems.push(`\`${op}\` on ${shop.name} was ignored.`); continue; }
      entry.stars.taste = n;
      changes.push(`taste ${n}`);
    }
  }

  if (memo !== null) { entry.memo = memo; changes.push("notes"); }
  if (!changes.length) continue;
  if (!entry.status) entry.status = "visited";
  entry.updatedAt = TODAY;
  ratings[shop.id] = entry;
  applied.push(`**${shop.name}** — ${changes.join(", ")}`);
}

/* ---------- write out ---------- */

const sorted = Object.fromEntries(Object.entries(ratings).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync("data/ratings.json", `${JSON.stringify(sorted, null, 2)}\n`);

const report = [];
if (applied.length) {
  report.push("Applied:", "", ...applied.map((a) => `- ${a}`));
} else {
  report.push("Nothing to apply. One shop per line, for example:", "", "```text", "無敵家 3.0", "開楽 4 solo=5 value=3", "新珍味 love memo=ターロー飯がうまい", "田坂屋 todo", "```");
}
if (problems.length) report.push("", "Skipped:", "", ...problems.map((p) => `- ${p}`));

writeFileSync("ingest-report.md", `${report.join("\n")}\n`);
console.log(report.join("\n"));
console.log(`\nchanged=${applied.length > 0}`);
