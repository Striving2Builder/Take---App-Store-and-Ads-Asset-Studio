/** OWNER: editor/inspectors — default export-format preference
 *  "Video" makes runExport() also record a real MediaRecorder motion file
 *  via recordSlideshowVideo (mode-agnostic despite its name — it only reads
 *  currentSet().frames + paintExportFrame, no Slideshow-only state) even for
 *  modes that wouldn't otherwise trigger motion. The PNG ZIP is never
 *  skipped either way — this sets emphasis, matching Export's real
 *  one-button flow where the other format is still one click away. */
import { currentSet } from "../../app/app-state";
import { $ } from "../../shared/dom";

export function syncExportFormatControl() {
  const set = currentSet();
  const isVideo = set?.exportFormat === "video";
  const btnPng = $("#export-format-png") as HTMLButtonElement | null;
  const btnVideo = $("#export-format-video") as HTMLButtonElement | null;
  if (btnPng) {
    btnPng.classList.toggle("is-active", !isVideo);
    btnPng.setAttribute("aria-pressed", (!isVideo).toString());
  }
  if (btnVideo) {
    btnVideo.classList.toggle("is-active", isVideo);
    btnVideo.setAttribute("aria-pressed", isVideo.toString());
  }
}

export function bindExportFormatControl() {
  const btnPng = $("#export-format-png") as HTMLButtonElement | null;
  const btnVideo = $("#export-format-video") as HTMLButtonElement | null;
  if (!btnPng || !btnVideo) return;

  function setFormat(format: "png" | "video") {
    const set = currentSet();
    if (!set) return;
    set.exportFormat = format;
    syncExportFormatControl();
  }

  btnPng.addEventListener("click", () => setFormat("png"));
  btnVideo.addEventListener("click", () => setFormat("video"));
}
