/** OWNER: stages/intake — secondary scan sources (marketing / competitor) */
export type SourceRow = {
  id: string;
  role: "marketing" | "competitor";
  url: string;
};

const MAX_SOURCES = 2;
let sources: SourceRow[] = [];
let renderFn: (() => void) | null = null;

export function getScanSources(): SourceRow[] {
  return sources.map((s) => ({ ...s }));
}

export function setScanSources(next: SourceRow[]) {
  sources = next.slice(0, MAX_SOURCES).map((s) => ({ ...s }));
  renderFn?.();
}

/** Parse comma/whitespace-separated competitor URLs into Extra Sources rows. */
export function syncCompetitorsFromText(raw: string) {
  const urls = raw
    .split(/[,;\s]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u) || /\./.test(u))
    .slice(0, MAX_SOURCES);
  if (!urls.length) return;

  const existing = new Set(sources.map((s) => s.url.replace(/^https?:\/\//i, "")));
  for (const url of urls) {
    if (sources.length >= MAX_SOURCES) break;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const key = normalized.replace(/^https?:\/\//i, "");
    if (existing.has(key)) continue;
    sources.push({
      id: `comp-${Date.now()}-${sources.length}`,
      role: "competitor",
      url: normalized,
    });
    existing.add(key);
  }
  renderFn?.();
}

export function mountScanSources() {
  const host = document.getElementById("scan-sources");
  if (!host) return;

  const render = () => {
    const atCap = sources.length >= MAX_SOURCES;
    host.innerHTML = `
      <div class="scan-sources-head">
        <span class="mono">EXTRA SOURCES</span>
        <button type="button" class="btn ghost small" data-add="marketing" ${atCap ? "disabled" : ""}>+ Marketing URL</button>
        <button type="button" class="btn ghost small" data-add="competitor" ${atCap ? "disabled" : ""}>+ Competitor URL</button>
      </div>
      <div class="scan-sources-list">
        ${
          sources.length
            ? sources
                .map(
                  (s) => `
          <div class="scan-source-row" data-id="${s.id}">
            <span class="mono source-role">${s.role}</span>
            <input type="url" data-source-url="${s.id}" placeholder="https://…" value="${s.url.replace(/"/g, "&quot;")}" />
            <button type="button" class="icon-btn" data-remove="${s.id}" title="Remove" aria-label="Remove source"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>
          </div>`
                )
                .join("")
            : `<p class="hint tight">Optional. Adds site/competitor captures into one pack (primary wins). Max ${MAX_SOURCES} extras. Advanced “Competitor URLs” also sync here.</p>`
        }
        ${atCap ? `<p class="hint tight">Maximum ${MAX_SOURCES} extra sources.</p>` : ""}
      </div>
    `;
  };
  renderFn = render;

  host.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const add = t.closest("[data-add]") as HTMLElement | null;
    if (add) {
      if (sources.length >= MAX_SOURCES) return;
      sources.push({
        id: `src-${Date.now()}`,
        role: (add.dataset.add as "marketing" | "competitor") || "marketing",
        url: "",
      });
      render();
      return;
    }
    const rem = t.closest("[data-remove]") as HTMLElement | null;
    if (rem) {
      sources = sources.filter((s) => s.id !== rem.dataset.remove);
      render();
    }
  });

  host.addEventListener("input", (e) => {
    const input = (e.target as HTMLElement).closest("[data-source-url]") as HTMLInputElement | null;
    if (!input) return;
    const row = sources.find((s) => s.id === input.dataset.sourceUrl);
    if (row) row.url = input.value.trim();
  });

  render();
}
