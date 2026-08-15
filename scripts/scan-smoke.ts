/**
 * OWNER: scripts — gold-set smoke for scan-api
 * Rows 1–5 automated against live scan-api. Run: npm run test:smoke
 */
const BASE = process.env.SCAN_API_URL || "http://localhost:8787";

type RowResult = { n: number; name: string; ok: boolean; detail: string };

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function fieldName(json: unknown): string | null {
  const j = json as { fields?: { name?: { value?: string | null } }; ok?: boolean };
  return j?.fields?.name?.value ?? null;
}

async function main() {
  const rows: RowResult[] = [];

  const healthRes = await fetch(`${BASE}/health`);
  const health = await healthRes.json();
  console.log("health", health);
  if (!healthRes.ok) {
    console.error("scan-api health failed");
    process.exitCode = 1;
    return;
  }

  // 1 Apple LIVE
  const apple = await post("/scan", {
    url: "https://apps.apple.com/us/app/whatsapp-messenger/id310633997",
    locale: "en-US",
    language: "en",
    country: "us",
  });
  const appleName = fieldName(apple.json);
  const appleAssets = (apple.json as { assets?: { kind: string; url: string }[] })?.assets || [];
  const appleOk =
    apple.status === 200 &&
    Boolean(appleName) &&
    appleAssets.some((a) => a.kind === "icon") &&
    appleAssets.some((a) => a.kind === "screenshot");
  rows.push({
    n: 1,
    name: "Apple WhatsApp",
    ok: appleOk,
    detail: `${apple.status} name=${appleName || "—"} assets=${appleAssets.length}`,
  });

  // 2 Pack soft-fail
  const pack = await post("/scan/pack", {
    primaryUrl: "https://apps.apple.com/us/app/whatsapp-messenger/id310633997",
    sources: [{ url: "http://127.0.0.1/evil", role: "marketing" }],
    locale: "en-US",
  });
  const pj = pack.json as {
    primary?: { ok?: boolean; fields?: { name?: { value?: string } } };
    sources?: { ok?: boolean }[];
  };
  const packOk =
    pack.status === 200 &&
    Boolean(pj.primary?.fields?.name?.value) &&
    pj.sources?.[0]?.ok === false;
  rows.push({
    n: 2,
    name: "Pack soft-fail",
    ok: packOk,
    detail: `primary=${pj.primary?.fields?.name?.value || "—"} src0ok=${pj.sources?.[0]?.ok}`,
  });

  // 3 Palette
  const icon = appleAssets.find((a) => a.kind === "icon")?.url;
  let palOk = false;
  let palDetail = "no icon";
  if (icon) {
    const pal = await post("/palette", { imageUrls: [icon], maxColors: 4 });
    const n = (pal.json as { swatches?: unknown[] })?.swatches?.length || 0;
    palOk = pal.status === 200 && n >= 1;
    palDetail = `${pal.status} swatches=${n}`;
  }
  rows.push({ n: 3, name: "Palette from icon", ok: palOk, detail: palDetail });

  // 4 Play (LIVE or PARTIAL acceptable — F07 watch)
  const play = await post("/scan", {
    url: "https://play.google.com/store/apps/details?id=com.whatsapp",
    locale: "en-US",
    language: "en",
    country: "us",
  });
  const playJ = play.json as {
    ok?: boolean;
    fields?: { name?: { value?: string | null } };
    warnings?: string[];
  };
  const playName = playJ?.fields?.name?.value;
  const playPartial = play.status === 200 && (!playJ.ok || !playName);
  const playLive = play.status === 200 && Boolean(playJ.ok && playName);
  const playOk = playLive || playPartial;
  const playPath = (playJ.warnings || []).find((w) => /Play fetch path/i.test(w)) || "";
  rows.push({
    n: 4,
    name: "Play WhatsApp",
    ok: playOk,
    detail: playLive
      ? `LIVE ${playName} ${playPath}`
      : `PARTIAL/FAIL ok=${playJ.ok} ${playPath || (playJ.warnings || [])[0] || "—"}`,
  });

  // 5 Marketing OG
  const og = await post("/scan", {
    url: "https://www.whatsapp.com/",
    locale: "en-US",
  });
  const ogJ = og.json as {
    ok?: boolean;
    adapter?: string;
    fields?: { name?: { value?: string | null }; description?: { value?: string | null } };
  };
  const ogOk =
    og.status === 200 &&
    Boolean(ogJ.ok) &&
    Boolean(ogJ.fields?.name?.value || ogJ.fields?.description?.value);
  rows.push({
    n: 5,
    name: "Marketing OG whatsapp.com",
    ok: ogOk,
    detail: `${og.status} adapter=${ogJ.adapter || "—"} title=${ogJ.fields?.name?.value || "—"}`,
  });

  console.log("\n--- gold-set API rows ---");
  for (const r of rows) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  #${r.n} ${r.name} — ${r.detail}`);
  }

  const failed = rows.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} row(s) failed`);
    process.exitCode = 1;
  } else {
    console.log("\nAPI gold-set rows 1–5 PASS");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
