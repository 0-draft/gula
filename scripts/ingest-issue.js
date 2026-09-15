// Turns an issue into scores.
//
// One place per line. The name is matched loosely against data/shops.json, so
// "無敵家", "mutekiya" and "無敵家 池袋" all resolve to the same entry.
//
//   無敵家 8.5                        -> score 8.5 out of 10
//   開楽 7 2026-09-16                 -> score plus the date you went
//   新珍味 9 memo=ターロー飯がうまい
//   無敵家 clear                      -> forget this place
//
// A ```json fenced block, as produced by the app's "Save as an issue" button,
// is merged as-is and wins over the line grammar.

import { readFileSync, writeFileSync } from "node:fs";

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
    problems.push(`\`${label}\` matches ${hits.length} places (${hits.map((h) => h.name).join(", ")}). Use the id.`);
    return null;
  }
  problems.push(`No place called \`${label}\`. Open an "Add a place" issue if it is missing.`);
  return null;
}

/* ---------- a fenced json block wins ---------- */

const fenced = body.match(/```json\s*([\s\S]*?)```/);
if (fenced) {
  try {
    const payload = JSON.parse(fenced[1]);
    for (const [id, entry] of Object.entries(payload)) {
      if (!byId.has(id)) { problems.push(`JSON block: unknown id \`${id}\`.`); continue; }
      ratings[id] = { ...entry, updatedAt: entry.updatedAt || TODAY };
      applied.push(`**${byId.get(id).name}** from the JSON block`);
    }
  } catch {
    problems.push("The ```json block is not valid JSON, so it was skipped.");
  }
}

/* ---------- line grammar ---------- */

const parseScore = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
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
    const isOp = /^clear$/i.test(w)
      || /^\d{4}-\d{2}-\d{2}$/.test(w)
      || (nameParts.length && parseScore(w) !== null);
    if (isOp) ops.push(w); else nameParts.push(w);
  }

  if (!nameParts.length || (!ops.length && memo === null)) continue;

  const shop = resolve(nameParts.join(" "));
  if (!shop) continue;

  if (ops.some((o) => o.toLowerCase() === "clear")) {
    delete ratings[shop.id];
    applied.push(`**${shop.name}** cleared`);
    continue;
  }

  const entry = ratings[shop.id] || {};
  const changes = [];

  for (const op of ops) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(op)) {
      entry.visitedAt = op;
      changes.push(`visited ${op}`);
      continue;
    }
    const n = parseScore(op);
    if (n === null) { problems.push(`\`${op}\` on ${shop.name} was ignored.`); continue; }
    entry.score = n;
    changes.push(`${n.toFixed(1)} / 10`);
  }

  if (memo !== null) { entry.memo = memo; changes.push("notes"); }
  if (!changes.length) continue;
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
  report.push("Nothing to apply. One place per line, for example:", "", "```text",
    "無敵家 8.5", "開楽 7 2026-09-16", "新珍味 9 memo=ターロー飯がうまい", "```");
}
if (problems.length) report.push("", "Skipped:", "", ...problems.map((p) => `- ${p}`));

writeFileSync("ingest-report.md", `${report.join("\n")}\n`);
console.log(report.join("\n"));
console.log(`\nchanged=${applied.length > 0}`);
