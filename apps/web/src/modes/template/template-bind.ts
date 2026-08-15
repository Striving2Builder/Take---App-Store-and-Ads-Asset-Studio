/** OWNER: modes/template — bind library recipe to catalog device (consume, not author) */
import { getDevice } from "@take/device-catalog";
import type { SavedTemplate } from "@take/storage";

export type TemplateBind = {
  deviceId?: string;
  orientation?: "portrait" | "landscape";
  frameHint?: number;
  name: string;
  style?: string;
};

export function resolveTemplateBind(tpl?: SavedTemplate | null): TemplateBind | null {
  if (!tpl) return null;
  const deviceId = tpl.deviceId && getDevice(tpl.deviceId) ? tpl.deviceId : undefined;
  const orientation =
    tpl.defaultOrientation === "landscape" || tpl.defaultOrientation === "portrait"
      ? tpl.defaultOrientation
      : undefined;
  return {
    deviceId,
    orientation,
    frameHint: tpl.frames > 0 ? tpl.frames : undefined,
    name: tpl.name,
    style: tpl.style,
  };
}
