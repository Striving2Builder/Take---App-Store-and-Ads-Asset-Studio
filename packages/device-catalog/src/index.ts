/** OWNER: packages/device-catalog — public API */
export type {
  DeviceFitMode,
  DeviceOrientation,
  DevicePlatform,
  DeviceProfile,
  DeviceStatus,
  FormFactor,
  HardwareHotspots,
  ListDevicesOpts,
  PxSize,
  SafeArea,
  ScreenInset,
  ShellKind,
  ShellView,
} from "./device.types";
export {
  listDevices,
  getDevice,
  listDevicesByPlatform,
  replaceCatalog,
  resetCatalogFromDisk,
} from "./catalog";
export { resolveDefaultDevice } from "./resolve-default";
export { resolveExportSize } from "./resolve-export-size";
export type { ResolveExportSizeResult } from "./resolve-export-size";
export { resolveShellAsset } from "./resolve-shell-asset";
export { fitScreenshot, fullCanvasInset } from "./fit-screenshot";
export type { FitInput, FitRect } from "./fit-screenshot";
export {
  CATALOG_CUTOFF_YEARS,
  PICKER_CURRENT_YEARS,
  resolvePickerGroup,
  isWithinYears,
  filterByCatalogWindow,
} from "./filter-age";
export { validateDevice, assertValidDevice } from "./validate-device";
export type { ValidateDeviceResult } from "./validate-device";
export { loadCatalogDevices } from "./load-catalog";
