import { test, expect } from "@playwright/test";

test("lists every shop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Everything/ }).click();
  await expect(page.locator("#view-all .ticket")).toHaveCount(119);
});

test("rating a shop puts it in the ranking", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Everything/ }).click();
  await page.locator('#view-all .ticket[data-id="mutekiya"]').click();

  // taste 5, ease 2 -> (5*3 + 2*1) / (3+1) = 4.25 -> 4.3
  await page.locator('.axis__star[data-axis="taste"][data-n="5"]').click();
  await page.locator('.axis__star[data-axis="ease"][data-n="2"]').click();
  await page.locator(".editor__close").click();

  await page.getByRole("button", { name: "Ranking" }).click();
  const top = page.locator("#rank-list > li").first();
  await expect(top).toContainText("無敵家");
  await expect(top.locator(".ticket__num")).toHaveText("4.3");
});

test("visiting a shop stamps its area sheet", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Everything/ }).click();
  await page.locator('#view-all .ticket[data-id="mutekiya"]').click();
  await page.locator('.axis__star[data-axis="taste"][data-n="4"]').click();
  await page.locator(".editor__close").click();

  await page.getByRole("button", { name: "Sheets" }).click();
  await expect(page.locator('.dot.is-visited[data-id="mutekiya"]')).toBeVisible();
});

test("genre filter narrows the list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Everything/ }).click();
  await page.locator('.chip[data-genre="curry"]').click();
  await expect(page.locator("#view-all .ticket")).toHaveCount(15);
});

test("map renders markers", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.locator("#map .leaflet-marker-icon").first()).toBeVisible();
});

test("language toggle switches the chrome to Japanese and back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Ranking" })).toBeVisible();

  await page.locator("#lang").click();
  await expect(page.getByRole("button", { name: "番付" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  await page.locator("#lang").click();
  await expect(page.getByRole("button", { name: "Ranking" })).toBeVisible();
});
