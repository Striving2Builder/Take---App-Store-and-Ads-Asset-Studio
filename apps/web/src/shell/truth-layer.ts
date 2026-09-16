/** OWNER: shell — mount Real/Partial/Fake honesty badges
 *  Internal QA tool only. Under the zero-fake-features policy, a shipped
 *  build should have nothing left to badge as PARTIAL/FAKE — so this never
 *  mounts outside local dev, regardless of which of the functions below a
 *  caller invokes. */
import { TRUTH_LABEL, TRUTH_MARKS, type TruthStatus } from "../shared/truth";

const DEV_ONLY = import.meta.env.DEV;

function badgeEl(status: TruthStatus, why: string) {
  const el = document.createElement("span");
  el.className = `truth-badge truth-${status}`;
  el.dataset.truth = status;
  el.title = why;
  el.setAttribute("aria-label", `${TRUTH_LABEL[status]}: ${why}`);
  el.textContent = TRUTH_LABEL[status];
  return el;
}

export function mountTruthBadges() {
  if (!DEV_ONLY) return;
  TRUTH_MARKS.forEach((mark) => {
    const target = document.querySelector(mark.sel);
    if (!target) return;

    const existing = document.querySelector(`.truth-badge[data-for="${CSS.escape(mark.sel)}"]`);
    if (existing) return;

    const badge = badgeEl(mark.status, mark.why);
    badge.dataset.for = mark.sel;
    const place = mark.place || "after";

    if (place === "corner") {
      const host = target as HTMLElement;
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      badge.classList.add("truth-corner");
      host.appendChild(badge);
      return;
    }

    if (place === "before") {
      target.parentElement?.insertBefore(badge, target);
      return;
    }

    target.insertAdjacentElement("afterend", badge);
  });
}

export function mountTruthLegend() {
  if (!DEV_ONLY) return;
  if (document.getElementById("truth-legend")) return;

  const bar = document.createElement("aside");
  bar.id = "truth-legend";
  bar.className = "truth-legend";
  bar.innerHTML = `
    <div class="truth-legend-inner">
      <strong class="truth-legend-title">TRUTH LAYER</strong>
      <span class="truth-badge truth-real">REAL</span>
      <span class="truth-legend-def">works as claimed</span>
      <span class="truth-badge truth-partial">PARTIAL</span>
      <span class="truth-legend-def">UI exists · incomplete / simulated</span>
      <span class="truth-badge truth-fake">FAKE</span>
      <span class="truth-legend-def">placeholder · does not do the thing</span>
      <button type="button" class="truth-legend-toggle" id="truth-toggle" aria-pressed="true">Hide badges</button>
    </div>
  `;
  document.body.appendChild(bar);

  document.getElementById("truth-toggle")?.addEventListener("click", () => {
    const on = !document.body.classList.contains("truth-hidden");
    document.body.classList.toggle("truth-hidden", on);
    const btn = document.getElementById("truth-toggle");
    if (btn) {
      btn.textContent = on ? "Show badges" : "Hide badges";
      btn.setAttribute("aria-pressed", String(!on));
    }
  });
}

export function mountTruthLayer() {
  mountTruthLegend();
  mountTruthBadges();
}
