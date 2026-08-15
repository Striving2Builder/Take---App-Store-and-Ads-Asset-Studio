/** OWNER: packages/device-catalog — public API */
export type { DevicePlatform, DeviceProfile, FormFactor } from "./device.types";
export { listDevices, getDevice, listDevicesByPlatform, replaceCatalog } from "./catalog";
export { resolveDefaultDevice } from "./resolve-default";
