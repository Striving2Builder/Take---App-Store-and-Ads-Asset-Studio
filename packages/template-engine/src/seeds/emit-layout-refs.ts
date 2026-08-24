/** OWNER: packages/template-engine — write layout-ref JSON (no load-recipes import) */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listLayoutRefRecipes } from "./layout-refs";

const recipesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../catalogs/templates/2026.08/recipes"
);

const recipes = listLayoutRefRecipes();
mkdirSync(recipesDir, { recursive: true });
for (const recipe of recipes) {
  writeFileSync(join(recipesDir, `${recipe.id}.json`), `${JSON.stringify(recipe, null, 2)}\n`);
}
console.log(`wrote ${recipes.length} mobile layout-refs → ${recipesDir}`);
