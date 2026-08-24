/** OWNER: packages/template-engine — ExtraSlot copy mark parser */
import { parseCopyMarks, stripCopyMarks } from "./copy-marks";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const runs = parseCopyMarks("Build **habits** that stick");
  assert(runs.length === 3, "pill splits three runs");
  assert(runs[0].text === "Build " && runs[0].mark === "none", "lead");
  assert(runs[1].text === "habits" && runs[1].mark === "pill", "pill");
  assert(runs[2].text === " that stick" && runs[2].mark === "none", "tail");
}

{
  const runs = parseCopyMarks("++Every morning++ starts here");
  assert(runs[0].mark === "underline" && runs[0].text === "Every morning", "underline span");
  assert(runs[1].text === " starts here", "after underline");
}

{
  const runs = parseCopyMarks("Make **time** ++for you++");
  assert(runs.map((r) => r.mark).join(",") === "none,pill,none,underline", "both marks");
  assert(stripCopyMarks("Make **time** ++for you++") === "Make time for you", "strip");
}

{
  const raw = "unclosed **still here";
  const runs = parseCopyMarks(raw);
  assert(runs.every((r) => r.mark === "none"), "unclosed is not a pill");
  assert(stripCopyMarks(raw) === raw, "unclosed text preserved");
}

{
  assert(parseCopyMarks("").length === 0, "empty");
  assert(parseCopyMarks("plain").every((r) => r.mark === "none"), "plain is none");
}

console.log("copy-marks.test ok");
