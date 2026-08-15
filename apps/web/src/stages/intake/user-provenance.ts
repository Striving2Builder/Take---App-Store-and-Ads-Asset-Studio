/** OWNER: stages/intake — mark user edits as provenance user on lastScan / brief */
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { persistScanSession } from "./persist-scan-session";

const CAPTURE_FIELD_MAP: Record<
  string,
  "name" | "category" | "audience" | "positioning" | "narrative"
> = {
  "#f-name": "name",
  "#f-category": "category",
  "#f-audience": "audience",
  "#f-positioning": "positioning",
  "#f-narrative": "narrative",
};

const BRIEF_ONLY: Record<string, "where" | "when" | "ux" | "tone" | "refs" | "donot"> = {
  "#f-where": "where",
  "#f-when": "when",
  "#f-ux": "ux",
  "#f-tone": "tone",
  "#f-refs": "refs",
  "#f-donot": "donot",
};

/** On blur of intake fields, stamp capture/brief so re-scan won't clobber guidance. */
export function bindUserProvenance() {
  Object.entries(CAPTURE_FIELD_MAP).forEach(([sel, key]) => {
    $(sel)?.addEventListener("blur", () => {
      const el = $(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el || !state.lastScan?.capture) return;
      const value = el.value.trim();
      if (!value) return;

      const fields = state.lastScan.capture.fields as Record<
        string,
        { value: unknown; provenance: string; source?: string }
      >;
      if (key in fields) {
        fields[key] = {
          value,
          provenance: "user",
          source: "intake-edit",
        };
      }
      if (key === "name") state.lastScan.brief.name = value;
      if (key === "category") state.lastScan.brief.category = value;
      if (key === "audience") state.lastScan.brief.audience = value;
      if (key === "positioning") state.lastScan.brief.positioning = value;
      if (key === "narrative") state.lastScan.brief.narrative = value;
      persistScanSession();
    });
  });

  Object.entries(BRIEF_ONLY).forEach(([sel, key]) => {
    $(sel)?.addEventListener("blur", () => {
      const el = $(sel) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) return;
      const value = el.value.trim();
      if (!value) return;
      if (state.lastScan?.brief) {
        state.lastScan.brief[key] = value;
      }
      if (state.inference) {
        state.inference[key] = value;
      }
      persistScanSession();
    });
  });
}
