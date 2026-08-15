/** OWNER: stages/intake — Scan + Generate button wiring */
import { clearScanSession, pushHistory } from "@take/storage";
import { state } from "../../app/app-state";
import { toast } from "../../shell/toast";
import { $, $$ } from "../../shared/dom";
import { syncDevicePickerToPlatform, syncDevicePickerValue } from "../../editor/device/device-picker";
import { syncOrientationUi } from "../../editor/device/orientation-control";
import { runScanTheater } from "../generate/generate.controller";
import { collectIntake } from "./intake.form";
import { updateMissing } from "./intake.missing";
import { clearScanReceipt, renderScanReceipt } from "./scan-receipt";
import { getScanSources, syncCompetitorsFromText } from "./scan-sources";
import { persistScanSession } from "./persist-scan-session";
import { finalizeScan, runIntakeScan } from "./scan-pipeline";
import { applyModeRunResult, runActiveMode } from "../../modes/run-active-mode";
import { syncTemplateArm } from "../../modes/template/template-arm";

let scanInFlight = false;

export function bindIntakeActions() {
  $("#f-competitors")?.addEventListener("blur", () => {
    const el = $("#f-competitors") as HTMLInputElement | null;
    if (el?.value.trim()) {
      syncCompetitorsFromText(el.value);
      toast("Competitor URLs synced to Extra Sources");
    }
  });

  $("#btn-scan")?.addEventListener("click", async () => {
    updateMissing();
    const d = collectIntake();
    if (d.competitors) syncCompetitorsFromText(d.competitors);
    const extras = getScanSources().filter((s) => s.url);
    if (extras.length && !d.url) {
      toast("Primary App URL required when extra sources are set");
      ($("#app-url") as HTMLInputElement | null)?.focus();
      return;
    }
    if (!d.url && d.uploads === 0) {
      toast("Paste a URL or upload screenshots first");
      ($("#app-url") as HTMLInputElement | null)?.focus();
      return;
    }

    const btn = $("#btn-scan") as HTMLButtonElement | null;
    const genBtn = $("#btn-generate") as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    if (genBtn) genBtn.disabled = true;
    scanInFlight = true;
    const prevCapture = state.lastScan?.capture ?? null;
    clearScanReceipt();
    clearScanSession();
    toast("Scanning…");
    const hint = $("#scan-hint");

    try {
      const scanned = await runIntakeScan(d);
      const { result, pack, palette } = await finalizeScan(
        scanned.result,
        scanned.pack,
        prevCapture
      );
      renderScanReceipt(result, { pack, palette });
      persistScanSession();

      const live = result.source === "live" && result.capture?.ok;
      if (hint) {
        const packNote = pack?.sources.length ? ` · pack +${pack.sources.length}` : "";
        const palNote = palette?.swatches.length ? ` · ${palette.swatches.length} colors` : "";
        const upNote = state.uploads.length ? ` · ${state.uploads.length} uploads` : "";
        hint.textContent = live
          ? `Live capture via ${result.capture?.adapter}${packNote}${palNote}${upNote} · ${result.capture?.assets.length || 0} assets`
          : `Scan finished with gaps — see receipt. ${result.warnings[0] || ""}`;
      }
      toast(live ? "Live scan complete — review receipt" : "Scan partial/fallback — check receipt");
      pushHistory("scan", d.url || "uploads");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Scan failed");
    } finally {
      scanInFlight = false;
      if (btn) btn.disabled = false;
      if (genBtn) genBtn.disabled = false;
    }
  });

  $("#btn-generate")?.addEventListener("click", async () => {
    if (scanInFlight) {
      toast("Wait for scan to finish");
      return;
    }
    const d = collectIntake();
    if (d.competitors) syncCompetitorsFromText(d.competitors);
    const extras = getScanSources().filter((s) => s.url);
    if (extras.length && !d.url && !state.lastScan) {
      toast("Primary App URL required when extra sources are set");
      return;
    }
    if (!d.url && d.uploads === 0 && !state.lastScan) {
      toast("Need a URL, uploads, or a completed scan");
      return;
    }
    state.platform = d.platform;
    state.mode = d.mode;
    state.qty = d.qty;
    syncDevicePickerToPlatform(d.platform);

    if (!state.lastScan?.brief && (d.url || d.uploads > 0)) {
      toast(extras.length ? "Scanning pack before generate…" : "Scanning before generate…");
      try {
        const prevCapture = state.lastScan?.capture ?? null;
        const scanned = await runIntakeScan(d);
        const { result, pack, palette } = await finalizeScan(
          scanned.result,
          scanned.pack,
          prevCapture
        );
        renderScanReceipt(result, { pack, palette });
        persistScanSession();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Scan failed");
        return;
      }
    }

    try {
      const result = await runActiveMode();
      applyModeRunResult(result);
      syncDevicePickerValue();
      syncOrientationUi();
      await runScanTheater(state.inference!);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Generate failed");
    }
  });

  $("#qty-control")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-qty]") as HTMLElement | null;
    if (!btn) return;
    state.qty = Math.min(5, Math.max(1, state.qty + Number(btn.dataset.qty)));
    const out = $("#qty-value");
    if (out) out.textContent = String(state.qty);
  });

  document.querySelectorAll<HTMLInputElement>('input[name="platform"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (el.checked) syncDevicePickerToPlatform(el.value);
    });
  });

  $$<HTMLInputElement>('input[name="mode"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (!el.checked) return;
      state.mode = el.value;
      syncTemplateArm();
      updateMissing();
    });
  });
}
