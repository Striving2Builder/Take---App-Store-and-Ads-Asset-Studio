/** OWNER: packages/template-engine — write sample-five JSON only (layout refs use emit-layout-refs) */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listSystemRecipes as sampleFive } from "./sample-five";

const recipesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../catalogs/templates/2026.08/recipes"
);

mkdirSync(recipesDir, { recursive: true });
for (const recipe of sampleFive()) {
  writeFileSync(join(recipesDir, `${recipe.id}.json`), `${JSON.stringify(recipe, null, 2)}\n`);
}

console.log(`wrote ${sampleFive().length} sample-five recipes → ${recipesDir}`);
