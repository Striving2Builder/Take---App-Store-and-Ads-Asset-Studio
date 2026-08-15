/** OWNER: services/device-sync/node — DNS resolve after host allowlist (do not import scan-api) */
import dns from "node:dns/promises";
import { assertAllowedSyncUrl, assertNoPrivateRecords } from "../allowlist";

export async function assertAllowedSyncUrlResolved(raw: string): Promise<URL> {
  const u = assertAllowedSyncUrl(raw);
  try {
    const records = await dns.lookup(u.hostname, { all: true });
    assertNoPrivateRecords(
      u.hostname,
      records.map((r) => r.address)
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error(`DNS resolve failed for ${u.hostname}`);
  }
  return u;
}
