/** OWNER: stages/export — video ad units: MediaRecorder from the uploaded clip itself,
 *  not a re-recording of static frames. End-card chrome burns in for the closing window. */
import type { AdCopy } from "@take/core";
import type { AdUnit } from "@take/ad-unit-catalog";
import type { AdWireframe } from "@take/template-engine";
import { pickVideoMime } from "./video-mime";
import { paintAdOverlayZones, paintVideoFrameIntoZones } from "./paint-ad-frame";

export type AdVideoResult = { blob: Blob; ext: string; mime: string; durationMs: number };

function loadVideoEl(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("video load failed"));
    v.src = url;
  });
}

/** captureStream() on HTMLMediaElement is widely supported (Chrome/Firefox) but not part of
 *  every TS DOM lib snapshot — narrow locally rather than assuming a global declaration. */
function audioTracksOf(video: HTMLVideoElement): MediaStreamTrack[] {
  try {
    const withCapture = video as HTMLVideoElement & { captureStream?: () => MediaStream };
    return withCapture.captureStream?.().getAudioTracks() ?? [];
  } catch {
    return [];
  }
}

/** Records the ad unit's video: draws the uploaded clip cover-fit into the wireframe's image
 *  zone(s) in real time, then burns in the end-card overlay (logo/headline/CTA/legal) for the
 *  closing window so the CTA is never solely a platform button the ad itself doesn't carry. */
export async function recordAdVideo(
  clipUrl: string,
  unit: AdUnit,
  wireframe: AdWireframe,
  copy: AdCopy,
  logo: HTMLImageElement | HTMLCanvasElement | null,
  palette: string[],
  onStatus?: (msg: string) => void
): Promise<AdVideoResult> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder unavailable in this browser");
  }
  const { mime, ext } = pickVideoMime();
  if (!mime) throw new Error("No supported video MIME type (try Chrome/Edge/Firefox)");

  onStatus?.("Loading clip…");
  const video = await loadVideoEl(clipUrl);
  const clipMs = (video.duration || 0) * 1000;
  // Real per-platform cap first (TikTok 10min, YouTube bumper 6s…); some platforms (YouTube
  // skippable in-stream) genuinely have no hard cap, so fall back to the recommended sweet
  // spot's ceiling, then a plain 15s default only if neither field is set.
  const cap = unit.maxDurationMs ?? unit.recommendedDurationMs?.max ?? 15000;
  const targetMs = clipMs > 0 ? Math.min(clipMs, cap) : cap;
  const overlayWindowMs = Math.min(2500, targetMs * 0.3);

  const canvas = document.createElement("canvas");
  canvas.width = unit.exportPx.w;
  canvas.height = unit.exportPx.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const canvasStream = canvas.captureStream(30);
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracksOf(video)]);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] }));
    recorder.onerror = () => reject(new Error("MediaRecorder failed"));
  });

  let raf = 0;
  const draw = () => {
    paintVideoFrameIntoZones(ctx, wireframe, unit.exportPx, video);
    if (video.currentTime * 1000 >= targetMs - overlayWindowMs) {
      paintAdOverlayZones(ctx, { size: unit.exportPx, wireframe, copy, logo, palette });
    }
    raf = requestAnimationFrame(draw);
  };

  onStatus?.(`Recording ${unit.label}…`);
  recorder.start(200);
  video.currentTime = 0;
  await video.play();
  draw();

  await new Promise((resolve) => setTimeout(resolve, targetMs + 250));

  cancelAnimationFrame(raf);
  video.pause();
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  canvasStream.getTracks().forEach((t) => t.stop());

  const blob = await done;
  return { blob, ext, mime, durationMs: Math.round(targetMs) };
}
