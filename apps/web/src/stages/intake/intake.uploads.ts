/** OWNER: stages/intake — local upload previews (data URLs so refresh survives) */
import {
  matchDeviceToScreenshots,
  screenshotUpscaleFactor,
  MAX_SCREENSHOT_UPSCALE,
} from "@take/device-catalog";
import { state } from "../../app/app-state";
import { $ } from "../../shared/dom";
import { escapeHtml } from "../../shared/escape";
import { toast } from "../../shell/toast";
import { updateMissing } from "./intake.missing";

const MAX_VIDEO_BYTES = 60_000_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error || new Error("read failed"));
    r.readAsDataURL(file);
  });
}

type VideoMeta = { durationMs: number; width: number; height: number; posterUrl: string };

/** Reads real pixel dimensions off the file — used to auto-match a device template. */
function readImageSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Reads real duration/dimensions off the file and captures a poster frame — nothing invented. */
function readVideoMeta(url: string): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    const cleanup = () => {
      v.onloadedmetadata = null;
      v.onseeked = null;
      v.onerror = null;
    };
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.15, (v.duration || 0) / 2);
    };
    v.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 320;
      canvas.height = v.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(v, 0, 0, canvas.width, canvas.height);
      const meta: VideoMeta = {
        durationMs: Math.round((v.duration || 0) * 1000),
        width: v.videoWidth,
        height: v.videoHeight,
        posterUrl: canvas.toDataURL("image/jpeg", 0.82),
      };
      cleanup();
      resolve(meta);
    };
    v.onerror = () => {
      cleanup();
      reject(new Error("video metadata read failed"));
    };
    v.src = url;
  });
}

/** Auto-pick the device template that fits what the user actually uploaded, instead
 *  of always defaulting to the biggest store slot and letting mismatches upscale
 *  silently. Runs on every upload — no manual "pick a device first" step required. */
function applyAutoDeviceMatch() {
  const sizes: { w: number; h: number }[] = [];
  for (const u of state.uploads) {
    if (u.kind === "image" && u.width && u.height) sizes.push({ w: u.width, h: u.height });
  }
  if (!sizes.length) return;
  const match = matchDeviceToScreenshots(sizes, state.platform);
  if (match) state.deviceId = match.id;
}

function qualityBadge(u: (typeof state.uploads)[number]): string {
  if (u.kind !== "image" || !u.width || !u.height) return "";
  const factor = screenshotUpscaleFactor(state.deviceId, state.platform, u.width, u.height);
  if (factor <= MAX_SCREENSHOT_UPSCALE) return "";
  return `<em class="upload-thumb-warn" title="${escapeHtml(u.name)} is lower-res than the store frame (${u.width}×${u.height}) — it'll be shown padded, not stretched blurry">low-res</em>`;
}

function paintUploadPreview() {
  const prev = $("#upload-preview") as HTMLElement | null;
  if (!prev) return;
  if (!state.uploads.length) {
    prev.hidden = true;
    prev.innerHTML = "";
    return;
  }
  prev.hidden = false;
  prev.innerHTML = state.uploads
    .map((u) => {
      if (u.kind === "video") {
        const dur = u.durationMs ? `${(u.durationMs / 1000).toFixed(1)}s` : "";
        const playIcon =
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg>';
        return `<span class="upload-thumb-video" title="${escapeHtml(u.name)}"><img src="${u.posterUrl || ""}" alt="${escapeHtml(u.name)}" /><em>${playIcon} ${dur}</em></span>`;
      }
      return `<span class="upload-thumb-wrap"><img class="upload-thumb" src="${u.url}" alt="${escapeHtml(u.name)}" />${qualityBadge(u)}</span>`;
    })
    .join("");
}

async function handleImageFiles(files: File[]) {
  for (const file of files) {
    try {
      const url = await fileToDataUrl(file);
      const size = await readImageSize(url);
      state.uploads.push({
        name: file.name,
        url,
        kind: "image",
        width: size?.width,
        height: size?.height,
      });
    } catch {
      toast(`Could not read ${file.name}`);
    }
  }
}

async function handleVideoFiles(files: File[]) {
  for (const file of files) {
    if (file.size > MAX_VIDEO_BYTES) {
      toast(`${file.name} is over ${Math.round(MAX_VIDEO_BYTES / 1_000_000)}MB — pick a smaller clip`);
      continue;
    }
    try {
      const url = await fileToDataUrl(file);
      const meta = await readVideoMeta(url);
      state.uploads.push({ name: file.name, url, kind: "video", bytes: file.size, ...meta });
    } catch {
      toast(`Could not read ${file.name}`);
    }
  }
}

export async function handleFiles(files: FileList | null) {
  if (!files) return;
  const list = [...files];
  const images = list.filter((f) => f.type.startsWith("image/"));
  const videos = list.filter((f) => f.type.startsWith("video/"));
  await handleImageFiles(images);
  await handleVideoFiles(videos);
  applyAutoDeviceMatch();
  paintUploadPreview();
  updateMissing();
}

export function bindUploads() {
  ["#upload-shots", "#upload-icon", "#upload-brand", "#upload-comp", "#upload-video"].forEach((sel) => {
    $(sel)?.addEventListener("change", (e) => {
      void handleFiles((e.target as HTMLInputElement).files);
    });
  });
}
