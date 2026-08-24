/** OWNER: packages/template-engine — bind layout geometry to iOS or Play shell */
import type { DeviceInstance, TemplateRecord } from "../template.types";

export const IOS = "apple.iphone-16-pro-max";
/** iPhone 16 Pro Max shellPx 390×844 */
export const IOS_ASPECT = 844 / 390;

export const PLAY = "google.pixel-9";
/** Pixel 9 shellPx 384×832 */
export const PLAY_ASPECT = 832 / 384;

export type StoreShell = "ios" | "android";

/** Map intake/brief platform (+ optional device) to a concrete store shell. */
export function storeShellFromPlatform(platform?: string, deviceId?: string): StoreShell {
  if (platform === "android") return "android";
  if (platform === "ios") return "ios";
  if (deviceId?.startsWith("google.")) return "android";
  return "ios";
}

export function shellAspect(platform: StoreShell): number {
  return platform === "android" ? PLAY_ASPECT : IOS_ASPECT;
}

export function defaultShellDeviceId(platform: StoreShell): string {
  return platform === "android" ? PLAY : IOS;
}

function remapDevice(d: DeviceInstance, aspect: number): DeviceInstance {
  const landscape = d.orientation === "landscape";
  return {
    ...d,
    h: landscape ? d.w / aspect : d.w * aspect,
  };
}

function cloneExtras(recipe: TemplateRecord): TemplateRecord["extras"] {
  return recipe.extras?.map((e) => ({ ...e, pills: e.pills ? [...e.pills] : undefined }));
}

/** Same layout geometry, shell + aspect for App Store or Play. Does not change recipe id. */
export function bindRecipeShell(
  recipe: TemplateRecord,
  platform: StoreShell
): TemplateRecord {
  const aspect = shellAspect(platform);
  return {
    ...recipe,
    deviceId: defaultShellDeviceId(platform),
    devices: recipe.devices.map((d) => remapDevice(d, aspect)),
    extras: cloneExtras(recipe),
    background: { ...recipe.background },
    typeBand: recipe.typeBand ? [...recipe.typeBand] : undefined,
    palette: recipe.palette ? [...recipe.palette] : undefined,
    tags: [...(recipe.tags || [])],
  };
}

/** Mutate an attached recipe in place (Edit toggle / device switch). */
export function applyShellBind(recipe: TemplateRecord, platform: StoreShell): void {
  const bound = bindRecipeShell(recipe, platform);
  recipe.deviceId = bound.deviceId;
  recipe.devices = bound.devices;
}

/**
 * @deprecated Twin Play Library cards — prefer bindRecipeShell + mobile tags.
 * Kept for one-off catalog migration tests only.
 */
export function forAndroid(recipe: TemplateRecord): TemplateRecord {
  const bound = bindRecipeShell(recipe, "android");
  const id = recipe.id.includes("-play-")
    ? recipe.id
    : recipe.id.endsWith("-5")
      ? `${recipe.id.slice(0, -2)}-play-5`
      : `${recipe.id}-play`;
  const name = /play/i.test(recipe.name)
    ? recipe.name
    : recipe.name.startsWith("Layout · ")
      ? `Layout · Play · ${recipe.name.slice("Layout · ".length)}`
      : `Play · ${recipe.name}`;
  return {
    ...bound,
    id,
    name,
    tags: ["android", ...recipe.tags.filter((t) => t !== "ios" && t !== "android" && t !== "mobile")],
  };
}

export function listAndroidLayoutPorts(iosLayouts: TemplateRecord[]): TemplateRecord[] {
  return iosLayouts.map(forAndroid);
}
