/** OWNER: stages/export — shared MediaRecorder MIME probing (slideshow + ad video export) */
export function pickVideoMime(): { mime: string; ext: string } {
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
