/** OWNER: stages/export — slideshow motion via MediaRecorder (WebM / MP4 if supported) */
import { currentSet, state } from "../../app/app-state";
import { downloadBlob } from "../../shared/download";
import { paintExportFrame, EXPORT_W, EXPORT_H } from "./frame-render";

const TARGET_SECONDS = 15;

function pickMime(): { mime: string; ext: string } {
  const candidates = [
    { mime: "video/mp4;codecs=avc1.42E01E", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) {
      return c;
    }
  }
  return { mime: "", ext: "webm" };
}

/** Record ~15s slideshow from current set frames. Returns filename + blob. */
export async function recordSlideshowVideo(
  onStatus?: (msg: string) => void
): Promise<{ filename: string; blob: Blob; mime: string }> {
  const set = currentSet();
  if (!set?.frames.length) throw new Error("No frames to record");
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder unavailable in this browser");
  }

  const { mime, ext } = pickMime();
  if (!mime) throw new Error("No supported video MIME type (try Chrome/Edge/Firefox)");

  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
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
  const perFrameMs = Math.max(800, Math.floor((TARGET_SECONDS * 1000) / n));

  for (let i = 0; i < n; i++) {
    onStatus?.(`Recording frame ${i + 1}/${n}…`);
    await paintExportFrame(canvas, i);
    // Hold frame for dwell time (captureStream picks up canvas updates)
    await new Promise((r) => setTimeout(r, perFrameMs));
  }

  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  const blob = await done;
  const slug = (state.inference?.name || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `${slug}-slideshow-${stamp}.${ext}`,
    blob,
    mime,
  };
}

export async function downloadSlideshowVideo(
  onStatus?: (msg: string) => void
): Promise<string> {
  const { filename, blob } = await recordSlideshowVideo(onStatus);
  downloadBlob(filename, blob);
  return filename;
}
