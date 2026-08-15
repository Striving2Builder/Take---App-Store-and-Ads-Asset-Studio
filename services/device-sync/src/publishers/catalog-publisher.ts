/** OWNER: services/device-sync — publisher interface (disk write is Node CLI) */
import { devicesForApprovedPack } from "../publish-check";
import type { CatalogPack } from "../types";

export type CatalogPublisher = {
  publish(pack: CatalogPack): Promise<{ ok: boolean; message: string }>;
};

/**
 * Browser-safe publisher — always refuses disk. Session apply is replaceCatalog() in the wizard.
 */
export function createNoopCatalogPublisher(): CatalogPublisher {
  return {
    async publish(pack) {
      const check = devicesForApprovedPack(pack);
      if (!check.ok) {
        return { ok: false, message: check.message };
      }
      return {
        ok: false,
        message: `Publisher refused disk write (${check.devices.length} approved). Use npm run catalog:publish — session Apply is not git.`,
      };
    },
  };
}
