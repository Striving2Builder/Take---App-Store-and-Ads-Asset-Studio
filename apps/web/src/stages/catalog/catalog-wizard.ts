/** OWNER: stages/catalog — Propose → Review → Apply (session). Disk = CLI. */
import { getDevice, listDevices, replaceCatalog, type DeviceProfile } from "@take/device-catalog";
import {
  classifyChange,
  createMemoryReviewGate,
  devicesForApprovedPack,
  hasEvidence,
  materializeDevice,
  parseProposalInput,
  type DeviceProposal,
  type ReviewGate,
} from "@take/device-sync";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { downloadText } from "../../shared/download";
import { toast } from "../../shell/toast";

const QUEUE_KEY = "take.catalog.review-queue";

function loadQueue(): DeviceProposal[] {
  try {
    const raw = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as unknown;
    return Array.isArray(raw) ? (raw as DeviceProposal[]) : [];
  } catch {
    return [];
  }
}

const gate: ReviewGate = createMemoryReviewGate(loadQueue(), (all) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(all));
});

let appliedCount = 0;
let downloaded = false;

function setStep(step: "import" | "review" | "apply") {
  document.querySelectorAll<HTMLElement>("[data-cat-step]").forEach((el) => {
    el.classList.toggle("is-on", el.dataset.catStep === step);
  });
}

function honestyLine(pending: number, approved: number, missingEv: number): string {
  if (downloaded) {
    return "Pack downloaded — run npm run catalog:publish -- <file> to write catalogs/devices/. Not live sync.";
  }
  if (appliedCount) {
    return `Applied (session) — ${appliedCount} device(s) in this browser. Download pack for CLI publish. Not written to disk.`;
  }
  if (pending || approved) {
    return `Awaiting review — ${pending} pending, ${approved} approved, ${missingEv} missing evidence. Never auto-published.`;
  }
  return "Proposed — paste or open a proposal pack. Apply is session-only. Not live web sync.";
}

async function renderList() {
  const all = await gate.listAll();
  const list = $("#catalog-proposal-list");
  if (!list) return;
  if (!all.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = all
    .map((p) => {
      const current = getDevice(p.proposed.id);
      const mat = materializeDevice(p.proposed, current);
      const ev = hasEvidence(p);
      const { summary } = classifyChange(current, {
        id: p.proposed.id,
        exportPx: mat.ok ? mat.device.exportPx : current?.exportPx || { w: 0, h: 0 },
        screenInset: mat.ok
          ? mat.device.screenInset
          : current?.screenInset || { x: 0, y: 0, w: 0, h: 0 },
        status: mat.ok ? mat.device.status : current?.status || "current",
      });
      const errors = [
        ev ? "" : "evidence URL required",
        mat.ok ? "" : mat.errors.join("; "),
      ].filter(Boolean);
      const ok = ev && mat.ok;
      const badge = ok
        ? `<span class="truth-badge truth-partial">${escapeHtml(p.reviewStatus.toUpperCase())}</span>`
        : `<span class="truth-badge truth-fake">INVALID</span>`;
      const checked = p.reviewStatus === "approved" && ok ? "checked" : "";
      return `<li data-prop="${escapeHtml(p.id)}">
        <label>
          <input type="checkbox" data-approve="${escapeHtml(p.id)}" ${checked} ${ok ? "" : "disabled"} />
          <strong>${escapeHtml(p.proposed.name)}</strong>
          <span class="mono">${escapeHtml(p.proposed.id)} · ${escapeHtml(p.confidence)}</span>
          ${badge}
        </label>
        <p class="catalog-diff mono">${escapeHtml(summary)}</p>
        <p class="catalog-evidence mono">${
          ev
            ? escapeHtml(p.evidence.map((e) => e.url).join(" · "))
            : "No evidence URL — cannot approve"
        }</p>
        ${errors.length ? `<p class="hint tight">${escapeHtml(errors.join("; "))}</p>` : ""}
        <button type="button" class="btn ghost small" data-reject="${escapeHtml(p.id)}">Reject</button>
      </li>`;
    })
    .join("");
}

async function updateChrome() {
  const all = await gate.listAll();
  const pending = all.filter((p) => p.reviewStatus === "pending").length;
  const approved = all.filter((p) => p.reviewStatus === "approved").length;
  const missingEv = all.filter((p) => !hasEvidence(p)).length;
  const approveBtn = $("#btn-catalog-approve-all") as HTMLButtonElement | null;
  const applyBtn = $("#btn-catalog-apply") as HTMLButtonElement | null;
  const exportBtn = $("#btn-catalog-export") as HTMLButtonElement | null;
  if (approveBtn) approveBtn.disabled = !all.some((p) => hasEvidence(p) && p.reviewStatus !== "approved");
  if (applyBtn) applyBtn.disabled = approved < 1;
  if (exportBtn) exportBtn.disabled = approved < 1 && !appliedCount;
  const status = $("#catalog-status");
  if (status) status.textContent = honestyLine(pending, approved, missingEv);
  if (all.length) setStep(appliedCount ? "apply" : "review");
  else setStep("import");
}

async function ingestRaw(raw: unknown) {
  const parsed = parseProposalInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  await gate.clear();
  await gate.ingest(parsed.pack.proposals || []);
  appliedCount = 0;
  downloaded = false;
  await renderList();
  await updateChrome();
  toast(`Loaded ${(parsed.pack.proposals || []).length} proposal(s)`);
}

export function mountCatalogWizard() {
  void renderList().then(updateChrome);

  $("#btn-catalog-parse")?.addEventListener("click", () => {
    const raw = ($("#catalog-pack-input") as HTMLTextAreaElement | null)?.value || "";
    try {
      void ingestRaw(JSON.parse(raw));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Invalid JSON");
    }
  });

  $("#catalog-pack-file")?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ta = $("#catalog-pack-input") as HTMLTextAreaElement | null;
      if (ta) ta.value = text;
      await ingestRaw(JSON.parse(text));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Invalid JSON file");
    }
  });

  $("#catalog-proposal-list")?.addEventListener("change", (e) => {
    const input = (e.target as Element).closest("[data-approve]") as HTMLInputElement | null;
    if (!input) return;
    const id = input.dataset.approve || "";
    void (async () => {
      if (input.checked) {
        const next = await gate.approve(id);
        if (!next) {
          input.checked = false;
          toast("Cannot approve — evidence URL required");
        }
      } else {
        await gate.reset(id);
      }
      await renderList();
      await updateChrome();
    })();
  });

  $("#catalog-proposal-list")?.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest("[data-reject]") as HTMLButtonElement | null;
    if (!btn) return;
    void (async () => {
      await gate.reject(btn.dataset.reject || "", "rejected in wizard");
      await renderList();
      await updateChrome();
      toast("Rejected");
    })();
  });

  $("#btn-catalog-approve-all")?.addEventListener("click", () => {
    void (async () => {
      const all = await gate.listAll();
      let n = 0;
      for (const p of all) {
        if (p.reviewStatus === "rejected") continue;
        const next = await gate.approve(p.id);
        if (next) n += 1;
      }
      await renderList();
      await updateChrome();
      toast(n ? `Approved ${n}` : "Nothing approved — evidence URL required");
    })();
  });

  $("#btn-catalog-apply")?.addEventListener("click", () => {
    void (async () => {
      const all = await gate.listAll();
      const approved = all.filter((p) => p.reviewStatus === "approved");
      const devices: DeviceProfile[] = [];
      for (const p of approved) {
        const mat = materializeDevice(p.proposed, getDevice(p.proposed.id));
        if (!mat.ok) {
          toast(`Cannot apply ${p.proposed.id}: ${mat.errors[0]}`);
          return;
        }
        devices.push(mat.device);
      }
      if (!devices.length) {
        toast("Approve at least one evidenced proposal");
        return;
      }
      const byId = new Map(listDevices({ includeDeprecated: true }).map((d) => [d.id, d]));
      for (const d of devices) byId.set(d.id, d);
      replaceCatalog([...byId.values()]);
      appliedCount = devices.length;
      downloaded = false;
      setStep("apply");
      await updateChrome();
      toast(`Applied ${devices.length} devices to session (not disk)`);
    })();
  });

  $("#btn-catalog-export")?.addEventListener("click", () => {
    void (async () => {
      const all = await gate.listAll();
      const check = devicesForApprovedPack({
        version: "wizard",
        updatedAt: new Date().toISOString(),
        devices: [],
        proposals: all,
      });
      if (!check.ok) {
        toast(check.message);
        return;
      }
      downloadText(
        `take-device-pack-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(
          {
            version: "wizard",
            updatedAt: new Date().toISOString(),
            devices: check.devices,
            proposals: all,
          },
          null,
          2
        )
      );
      downloaded = true;
      await updateChrome();
      toast("Pack downloaded — CLI publish writes disk, not this browser");
    })();
  });
}
