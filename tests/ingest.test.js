import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Runs the real script against a throwaway copy of the repo data.
function ingest(body) {
  const dir = mkdtempSync(join(tmpdir(), "gula-"));
  cpSync("data", join(dir, "data"), { recursive: true });
  cpSync("scripts", join(dir, "scripts"), { recursive: true });
  writeFileSync(join(dir, "data/ratings.json"), "{}\n");
  execFileSync(process.execPath, ["scripts/ingest-issue.js"], {
    cwd: dir,
    env: { ...process.env, ISSUE_BODY: body },
  });
  return {
    ratings: JSON.parse(readFileSync(join(dir, "data/ratings.json"), "utf8")),
    report: readFileSync(join(dir, "ingest-report.md"), "utf8"),
  };
}

test("a bare score sets taste and marks the shop visited", () => {
  const { ratings } = ingest("無敵家 3.0");
  assert.equal(ratings.mutekiya.stars.taste, 3);
  assert.equal(ratings.mutekiya.status, "visited");
});

test("axes, love, a date and notes parse off one line", () => {
  const { ratings } = ingest("開楽 4 solo=5 value=3 love 2026-09-16 memo=ジャンボ餃子がうまい");
  const r = ratings.kairaku;
  assert.deepEqual(r.stars, { taste: 4, solo: 5, value: 3 });
  assert.equal(r.love, true);
  assert.equal(r.visitedAt, "2026-09-16");
  assert.equal(r.memo, "ジャンボ餃子がうまい");
});

test("half stars survive", () => {
  const { ratings } = ingest("鬼金棒 3.5");
  assert.equal(ratings.kikanbo.stars.taste, 3.5);
});

test("a name with a branch suffix still resolves", () => {
  const { ratings } = ingest("麺処 花田 池袋店 4");
  assert.equal(ratings.hanada.stars.taste, 4);
});

test("an id works as well as a name", () => {
  const { ratings } = ingest("tasakaya todo");
  assert.equal(ratings.tasakaya.status, "todo");
});

test("several shops in one issue all land", () => {
  const { ratings } = ingest("無敵家 3\n開楽 5\n新珍味 love");
  assert.equal(ratings.mutekiya.stars.taste, 3);
  assert.equal(ratings.kairaku.stars.taste, 5);
  assert.equal(ratings.shinchinmi.love, true);
});

test("clear forgets a shop", () => {
  const { ratings } = ingest("無敵家 4\n無敵家 clear");
  assert.equal(ratings.mutekiya, undefined);
});

test("a json block from the app is merged", () => {
  const body = ['```json', '{"mutekiya":{"stars":{"taste":5,"solo":4},"status":"visited"}}', "```"].join("\n");
  const { ratings } = ingest(body);
  assert.deepEqual(ratings.mutekiya.stars, { taste: 5, solo: 4 });
});

test("an unknown shop is reported, not applied", () => {
  const { ratings, report } = ingest("存在しない店 4");
  assert.deepEqual(ratings, {});
  assert.match(report, /No shop called/);
});

test("prose without a score changes nothing", () => {
  const { ratings, report } = ingest("今日は何も食べてない");
  assert.deepEqual(ratings, {});
  assert.match(report, /Nothing to apply/);
});
