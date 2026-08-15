/**
 * OWNER: services/scan-api — HTTP server for Real App Scan
 * Dev default: http://localhost:8787
 */
import http from "node:http";
import { registerBuiltinAdapters } from "./adapters/register-adapters";
import { listAdapters } from "./adapters/registry";
import { runScan, type ScanBody } from "./routes/scan.route";
import { runScanPack, type ScanPackBody } from "./routes/scan-pack.route";
import { runPalette, type PaletteBody } from "./routes/palette.route";
import { emptyCapture } from "@take/scan-client";

registerBuiltinAdapters();

const PORT = Number(process.env.SCAN_API_PORT || 8787);
/** Set SCAN_API_CORS_ORIGIN to a concrete origin when hosting publicly (F10). Default * for local. */
const CORS_ORIGIN = process.env.SCAN_API_CORS_ORIGIN || "*";

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": CORS_ORIGIN,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(payload);
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, {
        ok: true,
        service: "scan-api",
        version: "0.3.0",
        adapters: listAdapters().map((a) => ({ id: a.id, kinds: a.kinds })),
        routes: ["/health", "/scan", "/scan/pack", "/palette"],
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/scan") {
      const body = (await readJson(req)) as ScanBody;
      try {
        const capture = await runScan(body);
        sendJson(res, 200, capture);
      } catch (err) {
        const message = err instanceof Error ? err.message : "scan error";
        sendJson(
          res,
          400,
          emptyCapture({ inputUrl: body.url || "", adapter: "error", errors: [message] })
        );
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/scan/pack") {
      const body = (await readJson(req)) as ScanPackBody;
      try {
        const pack = await runScanPack(body);
        sendJson(res, 200, pack);
      } catch (err) {
        sendJson(res, 400, {
          error: err instanceof Error ? err.message : "pack error",
        });
      }
      return;
    }

    if (req.method === "POST" && url.pathname === "/palette") {
      const body = (await readJson(req)) as PaletteBody;
      try {
        const palette = await runPalette(body);
        sendJson(res, 200, palette);
      } catch (err) {
        sendJson(res, 400, {
          error: err instanceof Error ? err.message : "palette error",
        });
      }
      return;
    }

    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`[scan-api] listening on http://localhost:${PORT}`);
  console.log(
    `[scan-api] adapters: ${listAdapters()
      .map((a) => a.id)
      .join(", ")}`
  );
});
