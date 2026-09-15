import { test, expect } from "@playwright/test";

const CANDIDATES = 72;

test("candidates are listed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#view-candidates .card")).toHaveCount(CANDIDATES);
});

test("scoring a place moves it to the ranking", async ({ page }) => {
  await page.goto("/");
  await page.locator('.card[data-id="mutekiya"]').click();
  await page.locator('.step[data-score="8"]').click();
  await expect(page.locator("#ed-score")).toHaveText("8.0");
  await page.locator(".editor__close").click();

  await expect(page.locator("#view-candidates .card")).toHaveCount(CANDIDATES - 1);
  await page.locator('.tab[data-view="rank"]').click();
  const top = page.locator("#view-rank .card").first();
  await expect(top).toContainText("無敵家");
  await expect(top.locator(".card__score")).toHaveText("8.0");
});

test("the ranking sorts by score", async ({ page }) => {
  await page.goto("/");
  await page.locator('.card[data-id="mutekiya"]').click();
  await page.locator('.step[data-score="6"]').click();
  await page.locator(".editor__close").click();
  await page.locator('.card[data-id="kairaku"]').click();
  await page.locator('.step[data-score="9"]').click();
  await page.locator(".editor__close").click();

  await page.locator('.tab[data-view="rank"]').click();
  const cards = page.locator("#view-rank .card");
  await expect(cards.nth(0)).toContainText("開楽");
  await expect(cards.nth(1)).toContainText("無敵家");
});

test("genre filter narrows the list", async ({ page }) => {
  await page.goto("/");
  await page.locator('.chip[data-genre="curry"]').click();
  const cards = page.locator("#view-candidates .card");
  await expect(cards).toHaveCount(await cards.count());
  await expect(page.locator('#view-candidates .card[data-id="mutekiya"]')).toHaveCount(0);
  await expect(page.locator('#view-candidates .card[data-id="kasei-curry"]')).toHaveCount(1);
});

test("search matches an English note", async ({ page }) => {
  await page.goto("/");
  await page.locator("#q").fill("biryani");
  await expect(page.locator("#view-candidates .card")).toHaveCount(1);
});

test("map renders markers", async ({ page }) => {
  await page.goto("/");
  await page.locator('.tab[data-view="map"]').click();
  await expect(page.locator("#map .leaflet-marker-icon").first()).toBeVisible();
});

test("language toggle switches the chrome and back", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('.tab[data-view="candidates"]')).toHaveText(/Candidates/);

  await page.locator("#lang").click();
  await expect(page.locator('.tab[data-view="candidates"]')).toHaveText(/候補/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  await page.locator("#lang").click();
  await expect(page.locator('.tab[data-view="candidates"]')).toHaveText(/Candidates/);
});
