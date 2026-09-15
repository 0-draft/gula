// Lists the shop photos that actually exist so the app never requests a 404.
// Run after adding files to assets/shops/ : npm run photos
import { readdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const DIR = "assets/shops";
const ids = new Set(JSON.parse(readFileSync("data/shops.json", "utf8")).map((s) => s.id));

const found = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .map((f) => f.replace(/\.[^.]+$/, ""))
  : [];

const unknown = found.filter((id) => !ids.has(id));
if (unknown.length) {
  console.error(`photos with no matching shop id: ${unknown.join(", ")}`);
  process.exit(1);
}

found.sort();
writeFileSync("data/photos.json", `${JSON.stringify(found, null, 2)}\n`);
console.log(`ok: ${found.length} photo${found.length === 1 ? "" : "s"} indexed`);
