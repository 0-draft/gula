import { test, expect } from "@playwright/test";

test("店が全部出る", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^ぜんぶ/ }).click();
  const cards = page.locator("#view-all .ticket");
  await expect(cards).toHaveCount(119);
});

test("星をつけると番付に並ぶ", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^ぜんぶ/ }).click();
  await page.locator('#view-all .ticket[data-id="mutekiya"]').click();

  // うまい5・入りやすい2 → (5*3 + 2*1) / (3+1) = 4.25 → 4.3
  await page.locator('.axis__star[data-axis="taste"][data-n="5"]').click();
  await page.locator('.axis__star[data-axis="ease"][data-n="2"]').click();
  await page.locator(".editor__close").click();

  await page.getByRole("button", { name: "番付" }).click();
  const top = page.locator("#rank-list > li").first();
  await expect(top).toContainText("無敵家");
  await expect(top.locator(".ticket__num")).toHaveText("4.3");
});

test("エリアの台紙にハンコが押される", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^ぜんぶ/ }).click();
  await page.locator('#view-all .ticket[data-id="mutekiya"]').click();
  await page.locator('.axis__star[data-axis="taste"][data-n="4"]').click();
  await page.locator(".editor__close").click();

  await page.getByRole("button", { name: "制覇" }).click();
  await expect(page.locator('.dot.is-visited[data-id="mutekiya"]')).toBeVisible();
});

test("絞り込みが効く", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^ぜんぶ/ }).click();
  await page.locator('.chip[data-genre="curry"]').click();
  const cards = page.locator("#view-all .ticket");
  await expect(cards).toHaveCount(15);
});

test("地図が開く", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "地図" }).click();
  await expect(page.locator("#map .leaflet-marker-icon").first()).toBeVisible();
});
