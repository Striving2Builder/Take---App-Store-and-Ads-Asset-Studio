/** OWNER: services/device-sync — merge proposal onto current catalog row */
import { validateDevice, type DeviceProfile } from "@take/device-catalog";
import type { ProposedDevice } from "./types";

export function materializeDevice(
  proposed: ProposedDevice,
  current?: DeviceProfile
): { ok: true; device: DeviceProfile } | { ok: false; errors: string[] } {
  const merged = { ...(current || {}), ...proposed } as DeviceProfile;
  const v = validateDevice(merged);
  if (!v.ok) return { ok: false, errors: v.errors };
  return { ok: true, device: merged };
}
