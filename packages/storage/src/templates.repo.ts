/** OWNER: packages/storage — templates repository */
import { listSystemRecipes } from "@take/template-engine";
import type { TemplateRecord } from "@take/template-engine";
import { STORAGE_KEYS } from "./keys";
import { loadJSON, saveJSON } from "./local-json";

export type SavedTemplate = {
  id: string;
  name: string;
  tags: string[];
  platform: string;
  kind: "system" | "user";
  style: string;
  frames: number;
  lockBrand?: boolean;
  palette?: string[];
  copy?: unknown;
  frameData?: unknown;
  prompt?: unknown;
  updated: string;
  version?: number;
  /** Catalog bind — consume in Library apply, not a device shell */
  deviceId?: string;
  defaultOrientation?: "portrait" | "landscape";
  /** Strip / generated recipes hydrate a typed TemplateRecord */
  composition?: "isolated" | "strip";
  layout?: unknown;
};

function platformOf(recipe: TemplateRecord): string {
  if (recipe.tags.includes("mobile")) return "mobile";
  if (recipe.tags.includes("android") || recipe.deviceId?.startsWith("google.")) return "android";
  if (recipe.tags.includes("ios")) return "ios";
  return "ios";
}

function recipeToCard(recipe: TemplateRecord): SavedTemplate {
  return {
    id: recipe.id,
    name: recipe.name,
    tags: recipe.tags,
    platform: platformOf(recipe),
    kind: "system",
    style: recipe.style || "premium",
    frames: recipe.frameCount,
    lockBrand: recipe.lockBrand,
    palette: recipe.palette,
    updated: "2026-08-15",
    version: recipe.version,
    deviceId: recipe.deviceId,
    defaultOrientation: recipe.defaultOrientation,
    composition: recipe.composition,
    layout: recipe,
  };
}

/** Device-shell seeds are catalog domain — never treat as layout recipes. */
export function isLayoutRecipe(t: SavedTemplate): boolean {
  const tags = (t.tags || []).map((x) => x.toLowerCase());
  if (tags.includes("device") && tags.includes("shell")) return false;
  const rec = t.layout as { devices?: unknown[]; extras?: unknown[]; frameCount?: number } | undefined;
  // Same "has real content" test as template-engine's hasRealLayout() — a
  // device, or a real extra (full-bleed screenshot, award badge, ...) —
  // reimplemented loosely here since this operates on raw untyped JSON,
  // not a hydrated TemplateRecord.
  const hasContent = !!(rec?.devices?.length || rec?.extras?.length);
  return !!(rec && Array.isArray(rec.devices) && rec.frameCount && hasContent);
}

export function listLayoutTemplates(): SavedTemplate[] {
  return getTemplates().filter(isLayoutRecipe);
}

export function getTemplates(): SavedTemplate[] {
  const system = listSystemRecipes().map(recipeToCard);
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  return [...system, ...user];
}

export function saveUserTemplate(tpl: SavedTemplate): void {
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  user.unshift(tpl);
  saveJSON(STORAGE_KEYS.templates, user);
}

export function updateUserTemplate(tpl: SavedTemplate): boolean {
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  const i = user.findIndex((t) => t.id === tpl.id);
  if (i < 0) return false;
  user[i] = tpl;
  saveJSON(STORAGE_KEYS.templates, user);
  return true;
}
