/** OWNER: stages/intake — local upload previews (data URLs so refresh survives) */
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
        return `<span class="upload-thumb-video" title="${escapeHtml(u.name)}"><img src="${u.posterUrl || ""}" alt="${escapeHtml(u.name)}" /><em>▶ ${dur}</em></span>`;
      }
      return `<img class="upload-thumb" src="${u.url}" alt="${escapeHtml(u.name)}" />`;
    })
    .join("");
}

async function handleImageFiles(files: File[]) {
  for (const file of files) {
    try {
      const url = await fileToDataUrl(file);
      state.uploads.push({ name: file.name, url, kind: "image" });
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
