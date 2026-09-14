/** OWNER: stages/catalog — customer-facing catalog copy (not CLI jargon) */
import type { DeviceProfile } from "@take/device-catalog";
import type { DeviceProposal } from "@take/device-sync";

export type CatalogHeroState = "idle" | "current" | "updates" | "added";

export function familyLabel(d: Pick<DeviceProfile, "platform" | "formFactor">): string {
  if (d.platform === "ios") return d.formFactor === "tablet" ? "iPad" : "iPhone";
  if (d.formFactor === "foldable") return "Foldable";
  if (d.formFactor === "tablet") return "Android tablet";
  return "Android";
}

export function sizeLine(d: Pick<DeviceProfile, "exportPx" | "storeSizeClass">): string {
  const px = `${d.exportPx.w}×${d.exportPx.h}`;
  const cls = (d.storeSizeClass || "").replace(/^iphone-/, "").replace(/^play-/, "");
  if (cls.startsWith("6.") || cls.startsWith("5.")) return `${cls.replace("-", ".")}″ · ${px}`;
  return px;
}

export function inheritNote(source: string | undefined): string {
  const m = (source || "").match(/inferredFrom:\s*([a-z0-9.-]+)/i);
  if (!m) return "";
  const id = m[1];
  if (id.includes("iphone-16-pro-max")) return "Uses the iPhone 16 Pro Max frame";
  if (id.includes("iphone-16-pro")) return "Uses the iPhone 16 Pro frame";
  if (id.includes("iphone-15-plus")) return "Uses the iPhone 15 Plus frame";
  if (id.includes("iphone-15-pro")) return "Uses the iPhone 15 Pro frame";
  if (id.includes("pixel-9")) return "Uses the Pixel 9 frame";
  if (id.includes("galaxy-s24")) return "Uses the Galaxy S24 frame";
  return "Uses an existing device frame";
}

export function changeLine(kind: string, summary: string): string {
  if (kind === "new") return "New device";
  if (summary.includes("exportPx")) return "Updated screenshot size";
  if (summary.includes("status")) return "Status change";
  return "Update available";
}

export function heroCopy(
  state: CatalogHeroState,
  opts: { updateCount?: number; addedCount?: number; deviceCount?: number }
): { kicker: string; title: string; body: string; action: string } {
  if (state === "current") {
    return {
      kicker: "Bundled research",
      title: "You have everything from this research pass",
      body: "Your catalog already has every phone in TAKE's current research pack — including iPhone 17, Pixel 10, and Galaxy S25. New research ships in app updates, not live checks.",
      action: "Browse again",
    };
  }
  if (state === "updates") {
    const n = opts.updateCount || 0;
    return {
      kicker: "From the research pack",
      title: n === 1 ? "1 device you can add" : `${n} devices you can add`,
      body: "These are researched store sizes with an existing TAKE frame, bundled with this version of the app. Add the ones you want — they show up in the device picker.",
      action: "Browse again",
    };
  }
  if (state === "added") {
    const n = opts.addedCount || 0;
    return {
      kicker: "Added",
      title: n === 1 ? "Device added" : `${n} devices added`,
      body: "They’re in this project now. Open Preview or Edit and pick them from the device list.",
      action: "Browse again",
    };
  }
  return {
    kicker: "Your devices",
    title: "Phones for store screenshots",
    body: "TAKE frames your art on App Store and Play sizes. Browse iPhones, Pixels, and Galaxies bundled with this version of the app — this reads the research pack shipped with TAKE, not a live check.",
    action: "Browse researched devices",
  };
}

export function proposalHeadline(p: DeviceProposal): string {
  return p.proposed.name || p.proposed.id;
}
