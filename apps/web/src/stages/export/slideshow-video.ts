/** OWNER: stages/export — slideshow motion via MediaRecorder (WebM / MP4 if supported) */
import type { ExportFit } from "@take/export-presets";
import { currentSet, state } from "../../app/app-state";
import { downloadBlob } from "../../shared/download";
import { currentExportSize, paintExportFrame } from "./frame-render";
import { fitCanvas } from "./fit-canvas";
import { pickVideoMime } from "./video-mime";
import { frameDwellMs } from "../../modes/slideshow/slideshow-builder";

const TARGET_SECONDS = 15;

export type SlideshowRecordOpts = {
  dest?: { w: number; h: number; fit: ExportFit };
  tag?: string;
};

/** Record ~15s slideshow from current set frames. Returns filename + blob. */
export async function recordSlideshowVideo(
  onStatus?: (msg: string) => void,
  opts: SlideshowRecordOpts = {}
): Promise<{ filename: string; blob: Blob; mime: string }> {
  const set = currentSet();
  if (!set?.frames.length) throw new Error("No frames to record");
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder unavailable in this browser");
  }

  const { mime, ext } = pickVideoMime();
  if (!mime) throw new Error("No supported video MIME type (try Chrome/Edge/Firefox)");

  const catalog = currentExportSize();
  const dest = opts.dest;
  const canvas = document.createElement("canvas");
  canvas.width = dest?.w ?? catalog.w;
  canvas.height = dest?.h ?? catalog.h;
  const source = dest ? document.createElement("canvas") : canvas;
  if (source !== canvas) {
    source.width = catalog.w;
    source.height = catalog.h;
  }
  const padColor = set.palette[1] || "#0c0d10";
  const stream = canvas.captureStream(30);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mime.split(";")[0] }));
    };
    recorder.onerror = () => reject(new Error("MediaRecorder failed"));
  });

  recorder.start(200);
  const n = set.frames.length;

  for (let i = 0; i < n; i++) {
    onStatus?.(`Recording frame ${i + 1}/${n}…`);
    await paintExportFrame(source, i);
    if (dest && source !== canvas) {
      fitCanvas(source, canvas, dest.fit, padColor);
    }
    const perFrameMs = frameDwellMs(set.frames[i].dwellMs, n, TARGET_SECONDS * 1000);
    await new Promise((r) => setTimeout(r, perFrameMs));
  }

  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = await done;
  const slug = (state.inference?.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const stamp = new Date().toISOString().slice(0, 10);
  const tag = opts.tag || "slideshow";
  return {
    filename: `${slug}-${tag}-${stamp}.${ext}`,
    blob,
    mime,
  };
}

export async function downloadSlideshowVideo(
  onStatus?: (msg: string) => void,
  opts: SlideshowRecordOpts = {}
): Promise<string> {
  const { filename, blob } = await recordSlideshowVideo(onStatus, opts);
  downloadBlob(filename, blob);
  return filename;
}
