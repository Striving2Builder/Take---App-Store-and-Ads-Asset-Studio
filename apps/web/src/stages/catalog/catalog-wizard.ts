/** OWNER: stages/catalog — customer catalog: check → add. Disk publish stays CLI. */
import {
  getDevice,
  listDevices,
  replaceCatalog,
  sourceConfidenceOf,
  type DeviceProfile,
} from "@take/device-catalog";
import {
  classifyChange,
  createMemoryReviewGate,
  devicesForApprovedPack,
  hasEvidence,
  materializeDevice,
  parseProposalInput,
  proposeBundledSnapshots,
  type DeviceProposal,
  type ReviewGate,
} from "@take/device-sync";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { downloadText } from "../../shared/download";
import { toast } from "../../shell/toast";
import {
  changeLine,
  familyLabel,
  heroCopy,
  inheritNote,
  sizeLine,
  type CatalogHeroState,
} from "./catalog-copy";

const QUEUE_KEY = "take.catalog.review-queue";

const IOS_BADGE_ICON =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2.5"/></svg>';
const ANDROID_BADGE_ICON =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 8.5 12 4l7.5 4.5v7L12 20l-7.5-4.5z"/></svg>';

/** A device silhouette scaled to the real shellPx aspect ratio — not a
 *  stock image, the box's own proportions are the real device geometry. */
function deviceShapeHtml(d: DeviceProfile): string {
  const w = d.shellPx?.w || 1;
  const h = d.shellPx?.h || 1;
  const maxH = 84;
  const aspect = w / h;
  const shapeH = maxH;
  const shapeW = Math.max(18, Math.round(shapeH * aspect));
  const badge = d.platform === "android" ? ANDROID_BADGE_ICON : IOS_BADGE_ICON;
  return `<div class="catalog-shape-wrap">
    <span class="catalog-plat-badge">${badge}</span>
    <div class="catalog-shape" style="width:${shapeW}px;height:${shapeH}px"></div>
  </div>`;
}

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
let heroState: CatalogHeroState = "idle";

function setHero(state: CatalogHeroState, updateCount = 0) {
  heroState = state;
  const copy = heroCopy(state, {
    updateCount,
    addedCount: appliedCount,
    deviceCount: listDevices({ includeDeprecated: true }).length,
  });
  const hero = $<HTMLElement>("#catalog-hero");
  if (hero) hero.dataset.state = state;
  const kicker = $("#catalog-hero-kicker");
  const title = $("#catalog-hero-title");
  const body = $("#catalog-hero-body");
  const btn = $("#btn-catalog-snapshots");
  if (kicker) kicker.textContent = copy.kicker;
  if (title) title.textContent = copy.title;
  if (body) body.textContent = copy.body;
  if (btn) btn.textContent = copy.action;
}

function renderCatalogNow() {
  const el = $("#catalog-now");
  const count = $("#catalog-now-count");
  const devices = listDevices({ includeDeprecated: true }).slice().sort((a, b) => {
    const fa = familyLabel(a).localeCompare(familyLabel(b));
    return fa || a.name.localeCompare(b.name);
  });
  if (count) count.textContent = `In your catalog · ${devices.length}`;
  if (!el) return;
  el.innerHTML = devices
    .map((d) => {
      const confidence = sourceConfidenceOf(d.source);
      const inherit = inheritNote(d.source);
      return `<li class="catalog-device-card is-${confidence}">
        ${deviceShapeHtml(d)}
        <span class="catalog-device-family mono">${escapeHtml(familyLabel(d))}</span>
        ${confidence === "inherited" ? `<span class="catalog-confidence-badge" title="${escapeHtml(inherit || "Uses an existing device frame")}">INHERITED</span>` : `<span class="catalog-confidence-badge is-measured">MEASURED</span>`}
        <strong>${escapeHtml(d.name)}</strong>
        <span class="catalog-device-size">${escapeHtml(sizeLine(d))}</span>
        ${inherit ? `<span class="catalog-device-note">${escapeHtml(inherit)}</span>` : ""}
      </li>`;
    })
    .join("");
}

async function renderList() {
  const all = await gate.listAll();
  const open = all.filter((p) => p.reviewStatus !== "rejected");
  const box = $<HTMLElement>("#catalog-updates");
  const list = $("#catalog-proposal-list");
  const addAll = $("#btn-catalog-add-all") as HTMLButtonElement | null;
  if (box) box.hidden = open.length === 0;
  if (addAll) addAll.hidden = !open.some((p) => p.reviewStatus !== "approved");
  if (!list) return;
  if (!open.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = open
    .map((p) => {
      const current = getDevice(p.proposed.id);
      const mat = materializeDevice(p.proposed, current);
      const ev = hasEvidence(p);
      const { kind, summary } = classifyChange(current, {
        id: p.proposed.id,
        exportPx: mat.ok ? mat.device.exportPx : current?.exportPx || { w: 0, h: 0 },
        screenInset: mat.ok
          ? mat.device.screenInset
          : current?.screenInset || { x: 0, y: 0, w: 0, h: 0 },
        status: mat.ok ? mat.device.status : current?.status || "current",
      });
      const ok = ev && mat.ok;
      const added = p.reviewStatus === "approved";
      const proposalSource = mat.ok ? mat.device.source : p.proposed.source;
      const confidence = sourceConfidenceOf(proposalSource);
      const inherit = inheritNote(proposalSource);
      const size = mat.ok ? sizeLine(mat.device) : "";
      return `<li data-prop="${escapeHtml(p.id)}" class="catalog-update-card is-${confidence}">
        <span class="catalog-device-family mono">${escapeHtml(changeLine(kind, summary))}</span>
        ${confidence === "inherited" ? `<span class="catalog-confidence-badge" title="${escapeHtml(inherit || "Uses an existing device frame")}">INHERITED</span>` : ""}
        <strong>${escapeHtml(p.proposed.name)}</strong>
        <span class="catalog-device-size">${escapeHtml(size)}</span>
        ${inherit ? `<span class="catalog-device-note">${escapeHtml(inherit)}</span>` : ""}
        ${ok ? "" : `<p class="hint tight">This one needs a complete size before it can be added.</p>`}
        <div class="catalog-card-actions">
          ${
            added
              ? `<span class="catalog-added">Added</span>`
              : `<button type="button" class="btn small primary" data-add="${escapeHtml(p.id)}" ${ok ? "" : "disabled"}>Add</button>
                 <button type="button" class="btn small ghost" data-reject="${escapeHtml(p.id)}">Skip</button>`
          }
        </div>
      </li>`;
    })
    .join("");
}

async function updateChrome() {
  const all = await gate.listAll();
  const open = all.filter((p) => p.reviewStatus !== "rejected");
  const pending = open.filter((p) => p.reviewStatus === "pending").length;
  const exportBtn = $("#btn-catalog-export") as HTMLButtonElement | null;
  if (exportBtn) exportBtn.disabled = !all.some((p) => p.reviewStatus === "approved") && !appliedCount;
  if (appliedCount) setHero("added", open.length);
  else if (pending) setHero("updates", pending);
  else if (heroState === "current") setHero("current");
  else setHero(heroState === "idle" ? "idle" : heroState, open.length);
  await renderList();
  renderCatalogNow();
}

function mergeIntoCatalog(devices: DeviceProfile[]) {
  const byId = new Map(listDevices({ includeDeprecated: true }).map((d) => [d.id, d]));
  for (const d of devices) byId.set(d.id, d);
  replaceCatalog([...byId.values()]);
}

async function addProposal(id: string): Promise<boolean> {
  const next = await gate.approve(id);
  if (!next) {
    toast("This device isn’t ready to add yet.");
    return false;
  }
  const mat = materializeDevice(next.proposed, getDevice(next.proposed.id));
  if (!mat.ok) {
    toast(`Can’t add ${next.proposed.name}: missing size details.`);
    return false;
  }
  mergeIntoCatalog([mat.device]);
  appliedCount += 1;
  return true;
}

async function ingestRaw(raw: unknown) {
  const parsed = parseProposalInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  await gate.clear();
  await gate.ingest(parsed.pack.proposals || []);
  appliedCount = 0;
  heroState = (parsed.pack.proposals || []).length ? "updates" : "idle";
  await updateChrome();
  toast(`Loaded ${(parsed.pack.proposals || []).length} device update(s)`);
}

async function ingestSnapshots() {
  const current = listDevices({ includeDeprecated: true });
  const result = proposeBundledSnapshots(current);
  const proposals = result.pack.proposals || [];
  if (!proposals.length) {
    heroState = "current";
    await gate.clear();
    appliedCount = 0;
    await updateChrome();
    toast("Nothing new in the bundled research pack");
    return;
  }
  await gate.clear();
  await gate.ingest(proposals);
  appliedCount = 0;
  heroState = "updates";
  await updateChrome();
  toast(
    proposals.length === 1
      ? "1 device from the research pack is ready to add"
      : `${proposals.length} devices from the research pack are ready to add`
  );
}

export function mountCatalogWizard() {
  void updateChrome();

  $("#btn-catalog-snapshots")?.addEventListener("click", () => {
    void ingestSnapshots();
  });

  $("#btn-catalog-add-all")?.addEventListener("click", () => {
    void (async () => {
      const all = await gate.listAll();
      let n = 0;
      for (const p of all) {
        if (p.reviewStatus !== "pending") continue;
        if (await addProposal(p.id)) n += 1;
      }
      await updateChrome();
      toast(n ? (n === 1 ? "Device added" : `${n} devices added`) : "Nothing new to add");
    })();
  });

  $("#btn-catalog-parse")?.addEventListener("click", () => {
    const raw = ($("#catalog-pack-input") as HTMLTextAreaElement | null)?.value || "";
    try {
      void ingestRaw(JSON.parse(raw));
    } catch (err) {
      toast(err instanceof Error ? err.message : "That file isn’t valid JSON");
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
    } catch {
      toast("That file isn’t valid JSON");
    }
  });

  $("#catalog-proposal-list")?.addEventListener("click", (e) => {
    const add = (e.target as Element).closest("[data-add]") as HTMLButtonElement | null;
    const skip = (e.target as Element).closest("[data-reject]") as HTMLButtonElement | null;
    if (add) {
      void (async () => {
        const ok = await addProposal(add.dataset.add || "");
        await updateChrome();
        if (ok) toast("Added — it’s in your device picker");
      })();
      return;
    }
    if (!skip) return;
    void (async () => {
      await gate.reject(skip.dataset.reject || "", "skipped in wizard");
      await updateChrome();
      toast("Skipped");
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
        toast("Add at least one device first, then download.");
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
      toast("Pack downloaded");
    })();
  });
}
