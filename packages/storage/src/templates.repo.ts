/** OWNER: packages/storage — templates repository */
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
  /** Catalog bind — consume in Template mode, not a device shell */
  deviceId?: string;
  defaultOrientation?: "portrait" | "landscape";
  /** Strip / generated recipes hydrate a typed TemplateRecord */
  composition?: "isolated" | "strip";
  layout?: unknown;
};

const SEED: SavedTemplate[] = [
  {
    id: "sys-ios-story",
    name: "iOS Story Spine",
    tags: ["ios", "screenshots", "sequence"],
    platform: "ios",
    kind: "system",
    style: "premium",
    frames: 8,
    deviceId: "apple.iphone-16-pro-max",
    defaultOrientation: "portrait",
    updated: "2026-08-01",
  },
  {
    id: "sys-play-bold",
    name: "Play Bold Stack",
    tags: ["android", "screenshots", "bold"],
    platform: "android",
    kind: "system",
    style: "bold",
    frames: 7,
    deviceId: "google.pixel-9",
    defaultOrientation: "portrait",
    updated: "2026-08-01",
  },
  {
    id: "sys-ig-organic",
    name: "IG Organic Vertical",
    tags: ["social", "instagram", "organic"],
    platform: "social",
    kind: "system",
    style: "minimal",
    frames: 4,
    updated: "2026-07-20",
  },
  {
    id: "sys-tiktok-cut",
    name: "TikTok Cut Reel",
    tags: ["social", "tiktok", "video"],
    platform: "social",
    kind: "system",
    style: "playful",
    frames: 6,
    updated: "2026-07-20",
  },
  {
    id: "sys-iab-mpu",
    name: "IAB MPU 300×250",
    tags: ["ads", "iab", "display"],
    platform: "ads",
    kind: "system",
    style: "realistic",
    frames: 1,
    updated: "2026-06-12",
  },
  {
    id: "sys-feature-ios",
    name: "iOS Feature Plate",
    tags: ["ios", "feature"],
    platform: "ios",
    kind: "system",
    style: "premium",
    frames: 1,
    deviceId: "apple.iphone-16-pro-max",
    defaultOrientation: "portrait",
    updated: "2026-08-01",
  },
  {
    id: "seed-strip-bleed-hook",
    name: "Strip · bleed hook",
    tags: ["strip", "bleed", "ios"],
    platform: "ios",
    kind: "system",
    style: "premium",
    frames: 5,
    composition: "strip",
    deviceId: "apple.iphone-16-pro-max",
    defaultOrientation: "portrait",
    updated: "2026-08-14",
  },
];

/** Device-shell seeds are catalog domain — never treat as layout recipes. */
export function isLayoutRecipe(t: SavedTemplate): boolean {
  const tags = (t.tags || []).map((x) => x.toLowerCase());
  if (tags.includes("device") && tags.includes("shell")) return false;
  return true;
}

export function listLayoutTemplates(): SavedTemplate[] {
  return getTemplates().filter(isLayoutRecipe);
}

export function getTemplates(): SavedTemplate[] {
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  return [...SEED, ...user];
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
