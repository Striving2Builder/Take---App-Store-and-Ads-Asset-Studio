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
};

const SEED: SavedTemplate[] = [
  { id: "sys-ios-story", name: "iOS Story Spine", tags: ["ios", "screenshots", "sequence"], platform: "ios", kind: "system", style: "premium", frames: 8, updated: "2026-08-01" },
  { id: "sys-play-bold", name: "Play Bold Stack", tags: ["android", "screenshots", "bold"], platform: "android", kind: "system", style: "bold", frames: 7, updated: "2026-08-01" },
  { id: "sys-ig-organic", name: "IG Organic Vertical", tags: ["social", "instagram", "organic"], platform: "social", kind: "system", style: "minimal", frames: 4, updated: "2026-07-20" },
  { id: "sys-tiktok-cut", name: "TikTok Cut Reel", tags: ["social", "tiktok", "video"], platform: "social", kind: "system", style: "playful", frames: 6, updated: "2026-07-20" },
  { id: "sys-iab-mpu", name: "IAB MPU 300×250", tags: ["ads", "iab", "display"], platform: "ads", kind: "system", style: "realistic", frames: 1, updated: "2026-06-12" },
  { id: "sys-feature-ios", name: "iOS Feature Plate", tags: ["ios", "feature"], platform: "ios", kind: "system", style: "premium", frames: 1, updated: "2026-08-01" },
  { id: "sys-device-16pro", name: "iPhone 16 Pro Shell", tags: ["ios", "device", "shell"], platform: "ios", kind: "system", style: "realistic", frames: 1, updated: "2026-08-10" },
  { id: "sys-pixel9", name: "Pixel 9 Shell", tags: ["android", "device", "shell"], platform: "android", kind: "system", style: "realistic", frames: 1, updated: "2026-08-10" },
];

export function getTemplates(): SavedTemplate[] {
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  return [...SEED, ...user];
}

export function saveUserTemplate(tpl: SavedTemplate): void {
  const user = loadJSON<SavedTemplate[]>(STORAGE_KEYS.templates, []);
  user.unshift(tpl);
  saveJSON(STORAGE_KEYS.templates, user);
}
