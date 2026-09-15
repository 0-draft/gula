import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Runs the real script against a throwaway copy of the repo data.
function ingest(body) {
  const dir = mkdtempSync(join(tmpdir(), "i-ate-out-"));
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

test("a bare number becomes the score", () => {
  const { ratings } = ingest("無敵家 8.5");
  assert.equal(ratings.mutekiya.score, 8.5);
  assert.equal(ratings.mutekiya.updatedAt.length, 10);
});

test("ten is allowed and eleven is not", () => {
  assert.equal(ingest("無敵家 10").ratings.mutekiya.score, 10);
  assert.deepEqual(ingest("無敵家 11").ratings, {});
});

test("a date and notes parse off the same line", () => {
  const { ratings } = ingest("開楽 7 2026-09-16 memo=ジャンボ餃子がうまい");
  assert.deepEqual(ratings.kairaku, {
    score: 7,
    visitedAt: "2026-09-16",
    memo: "ジャンボ餃子がうまい",
    updatedAt: ratings.kairaku.updatedAt,
  });
});

test("halves survive, thirds are rounded to the nearest half", () => {
  assert.equal(ingest("鬼金棒 7.5").ratings.kikanbo.score, 7.5);
  assert.equal(ingest("鬼金棒 7.3").ratings.kikanbo.score, 7.5);
});

test("a name with a branch suffix still resolves", () => {
  assert.equal(ingest("麺処 花田 池袋店 9").ratings.hanada.score, 9);
});

test("an id works as well as a name", () => {
  assert.equal(ingest("tasakaya 8").ratings.tasakaya.score, 8);
});

test("several places in one issue all land", () => {
  const { ratings } = ingest("無敵家 6\n開楽 9\n新珍味 7.5");
  assert.equal(ratings.mutekiya.score, 6);
  assert.equal(ratings.kairaku.score, 9);
  assert.equal(ratings.shinchinmi.score, 7.5);
});

test("clear forgets a place", () => {
  const { ratings } = ingest("無敵家 8\n無敵家 clear");
  assert.equal(ratings.mutekiya, undefined);
});

test("a json block from the app is merged", () => {
  const body = ['```json', '{"mutekiya":{"score":9.5,"memo":"late"}}', "```"].join("\n");
  const { ratings } = ingest(body);
  assert.equal(ratings.mutekiya.score, 9.5);
  assert.equal(ratings.mutekiya.memo, "late");
});

test("an unknown place is reported, not applied", () => {
  const { ratings, report } = ingest("存在しない店 4");
  assert.deepEqual(ratings, {});
  assert.match(report, /No place called/);
});

test("prose without a number changes nothing", () => {
  const { ratings, report } = ingest("今日は何も食べてない");
  assert.deepEqual(ratings, {});
  assert.match(report, /Nothing to apply/);
});
