/** OWNER: packages/device-catalog — platform → default device */
import { getDevice, listDevices } from "./catalog";
import type { DeviceProfile } from "./device.types";

const IOS_DEFAULT_ID = "apple.iphone-16-pro-max";
const ANDROID_DEFAULT_ID = "google.pixel-9";

export function resolveDefaultDevice(platform: string): DeviceProfile | undefined {
  if (platform === "android") {
    return (
      getDevice(ANDROID_DEFAULT_ID) ||
      listDevices({ platform: "android", status: "current" }).find((d) => d.formFactor === "phone") ||
      listDevices({ platform: "android" })[0]
    );
  }
  // ios / both / other → iPhone 6.9" class default
  return (
    getDevice(IOS_DEFAULT_ID) ||
    listDevices({ platform: "ios", status: "current" }).find((d) => d.formFactor === "phone") ||
    listDevices({ platform: "ios" })[0]
  );
}
