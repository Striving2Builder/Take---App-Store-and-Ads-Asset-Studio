/** OWNER: generate — frame sequence builder (Advanced ux/tone influence captions) */
import { clip, FRAME_ROLES, type InferenceBrief, type StoryFrame } from "@take/core";
import { goalCta } from "./copy-builder";

function softUx(inf: InferenceBrief): boolean {
  return /soft|large type|breath|calm|quiet|spacious|minimal/i.test(inf.ux || "");
}

/** The real, brief-derived headline/caption pairs — every line here reads
 *  from the actual scan/intake brief (name, audience, value, tone, ...),
 *  never a fixed phrase unrelated to the app being marketed. Shared by the
 *  sequence builder below and by single-frame regeneration. */
function headlineBank(inf: InferenceBrief): [string, string][] {
  const soft = softUx(inf);
  const who = inf.audience || "Your people";
  const whenBit = inf.when || (soft ? "When you need a quiet open" : "When you reach for it");
  const howBit = inf.how || inf.ux || "One clear action";
  const valueBit = inf.value || inf.positioning || "Leave with proof";

  return [
    [`Meet ${inf.name}`, soft ? "Room to breathe before the scroll" : "Before the scroll takes you"],
    ["The usual clutter", soft ? "Too much noise. Soften the path." : "Too many taps. Too little signal."],
    ["A cleaner cut", inf.positioning || valueBit],
    ["Proof in minutes", soft ? "Progress without the dashboard theater" : "Progress you can feel"],
    [inf.features[0] || howBit, soft ? "Large type. One action." : "Designed for short sessions"],
    [whenBit.split("·")[0].trim(), whenBit],
    ["Built for real days", who],
    [
      soft ? "Details that stay quiet" : "Details that stay sharp",
      inf.tone || (soft ? "No neon noise. No gimmicks." : "Platform-native. Direct."),
    ],
    ["Leave with something", valueBit],
    ["Trusted by design", "Platform-native. Store-compliant."],
    [goalCta(inf.goal), "Your next honest take"],
    [`${inf.name}`, inf.refs ? `Structure: ${clip(inf.refs, 48)}` : "Ship the story."],
  ];
}

/** Draw one real headline/caption pair for "Regenerate frame" — a genuinely
 *  different line from the same brief-derived bank buildFrames() uses, not
 *  a fixed phrase disconnected from the app being marketed. */
export function pickHeadline(inf: InferenceBrief, avoidHeadline?: string): [string, string] {
  const bank = headlineBank(inf);
  const candidates = avoidHeadline ? bank.filter(([h]) => h !== avoidHeadline) : bank;
  const pool = candidates.length ? candidates : bank;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** A real, role-appropriate eyebrow line — reads as marketing copy, not the
 *  frame's internal position/role label. Pulls in real brief fields
 *  (category, features, name) where they exist rather than inventing
 *  specifics; the role-only fallback is a genuine, common marketing eyebrow
 *  pattern (short category/status words), not fabricated content. */
export function kickerFor(role: string, inf: InferenceBrief): string {
  const category = (inf.category || "").trim().toUpperCase();
  const feature = (inf.features[0] || "").trim().toUpperCase();
  const name = (inf.name || "").trim().toUpperCase();
  switch (role) {
    case "HOOK":
      return category || "NEW";
    case "VALUE":
      return "WHY IT MATTERS";
    case "PROBLEM":
      return "THE PROBLEM";
    case "SHIFT":
      return "A BETTER WAY";
    case "PROOF":
      return "REAL RESULTS";
    case "FEATURE":
      return feature ? clip(feature, 28) : "HOW IT WORKS";
    case "RITUAL":
      return "YOUR ROUTINE";
    case "SOCIAL":
      return "LOVED BY USERS";
    case "DETAIL":
      return "THE DETAILS";
    case "OUTCOME":
      return "THE OUTCOME";
    case "TRUST":
      return "WHY TRUST IT";
    case "CTA":
      return "GET STARTED";
    case "CLOSE":
      return name || "READY?";
    default:
      return category || "NEW";
  }
}

export function buildFrames(
  inf: InferenceBrief,
  conceptIndex: number,
  count: number
): StoryFrame[] {
  const n = Math.min(12, Math.max(5, count));
  const headlines = headlineBank(inf);

  return Array.from({ length: n }, (_, i) => {
    const role = FRAME_ROLES[i] || `FRAME ${i + 1}`;
    const shift = (conceptIndex * 2 + i) % headlines.length;
    const [h, c] = headlines[conceptIndex % 2 === 0 ? i % headlines.length : shift];
    return {
      id: `f-${conceptIndex}-${i}`,
      index: i,
      role,
      kicker: kickerFor(role, inf),
      headline: h,
      caption: c,
      cta: goalCta(inf.goal),
    };
  });
}
