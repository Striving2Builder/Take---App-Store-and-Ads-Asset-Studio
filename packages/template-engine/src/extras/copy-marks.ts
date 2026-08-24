/** OWNER: packages/template-engine — ExtraSlot copy marks (`**pill**` / `++underline++`) */
export type CopyMark = "none" | "pill" | "underline";
export type CopyRun = { text: string; mark: CopyMark };

/** Split ExtraSlot.text into paint runs. Unclosed markers stay literal. */
export function parseCopyMarks(src: string): CopyRun[] {
  const out: CopyRun[] = [];
  let i = 0;
  const push = (text: string, mark: CopyMark) => {
    if (text) out.push({ text, mark });
  };
  while (i < src.length) {
    if (src.startsWith("**", i)) {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2) {
        push(src.slice(i + 2, end), "pill");
        i = end + 2;
        continue;
      }
    }
    if (src.startsWith("++", i)) {
      const end = src.indexOf("++", i + 2);
      if (end > i + 2) {
        push(src.slice(i + 2, end), "underline");
        i = end + 2;
        continue;
      }
    }
    let j = i + 1;
    while (j < src.length && !src.startsWith("**", j) && !src.startsWith("++", j)) j += 1;
    push(src.slice(i, j), "none");
    i = j;
  }
  return out;
}

/** Visible string with markers stripped (hit-test / plain fallback). */
export function stripCopyMarks(src: string): string {
  return parseCopyMarks(src)
    .map((r) => r.text)
    .join("");
}
