/** OWNER: generate — frame sequence builder (Advanced ux/tone influence captions) */
import { FRAME_ROLES, type InferenceBrief, type StoryFrame } from "@take/core";
import { goalCta } from "./copy-builder";

function softUx(inf: InferenceBrief): boolean {
  return /soft|large type|breath|calm|quiet|spacious|minimal/i.test(inf.ux || "");
}

export function buildFrames(
  inf: InferenceBrief,
  conceptIndex: number,
  count: number
): StoryFrame[] {
  const n = Math.min(12, Math.max(5, count));
  const soft = softUx(inf);
  const who = inf.audience || "Your people";
  const whenBit = inf.when || (soft ? "When you need a quiet open" : "When you reach for it");
  const howBit = inf.how || inf.ux || "One clear action";
  const valueBit = inf.value || inf.positioning || "Leave with proof";

  const headlines: [string, string][] = [
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
    [`${inf.name}`, inf.refs ? `Structure: ${inf.refs.slice(0, 48)}` : "Ship the story."],
  ];

  return Array.from({ length: n }, (_, i) => {
    const role = FRAME_ROLES[i] || `FRAME ${i + 1}`;
    const shift = (conceptIndex * 2 + i) % headlines.length;
    const [h, c] = headlines[conceptIndex % 2 === 0 ? i % headlines.length : shift];
    return {
      id: `f-${conceptIndex}-${i}`,
      index: i,
      role,
      kicker: `${String(i + 1).padStart(2, "0")} · ${role}`,
      headline: h,
      caption: c,
      cta: goalCta(inf.goal),
    };
  });
}
