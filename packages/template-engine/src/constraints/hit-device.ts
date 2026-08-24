/** OWNER: packages/template-engine — pointer hit-test for device instances */
import type { DeviceInstance } from "../template.types";
import { hasPerspective, pointInQuad, projectDeviceBox } from "../project/perspective";
import { toWorldInstance } from "./world";

export function pointHitsDevice(
  inst: DeviceInstance,
  worldX: number,
  worldY: number,
  sliceW: number,
  sliceH: number
): boolean {
  if (hasPerspective(inst)) {
    const box = projectDeviceBox(inst, sliceW, sliceH);
    const p = { x: worldX, y: worldY };
    const front = box.faces.find((f) => f.kind === "front");
    if (front?.visible && pointInQuad(p, box.front)) return true;
    return box.faces.some((f) => f.kind === "side" && f.visible && pointInQuad(p, f.pts));
  }
  const world = toWorldInstance(inst, sliceW, sliceH);
  const dx = worldX - world.x;
  const dy = worldY - world.y;
  const rad = (-world.rotationDeg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= world.w / 2 && Math.abs(ly) <= world.h / 2;
}

/** nx, ny are 0–1 inside the focused slice. Topmost z wins. */
export function hitDevice(
  devices: DeviceInstance[],
  sliceIndex: number,
  nx: number,
  ny: number,
  sliceW: number,
  sliceH: number
): DeviceInstance | null {
  const worldX = (sliceIndex + nx) * sliceW;
  const worldY = ny * sliceH;
  const ordered = [...devices].sort((a, b) => b.z - a.z);
  for (const inst of ordered) {
    if (pointHitsDevice(inst, worldX, worldY, sliceW, sliceH)) return inst;
  }
  return null;
}
