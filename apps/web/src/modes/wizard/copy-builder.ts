/** OWNER: generate — store copy builder (rule-based; Advanced tone/donot wired) */
import { FRAME_ROLES, clip, type InferenceBrief, type StoreCopy, META_LIMITS } from "@take/core";

function goalCta(goal: string) {
  return (
    {
      install: "Get the app",
      trial: "Start free trial",
      subscribe: "Subscribe",
      engage: "Open again",
    }[goal] || "Get started"
  );
}

function toneHint(inf: InferenceBrief): string {
  const t = (inf.tone || "").trim();
  if (!t) return "";
  return t.slice(0, 80);
}

/** Prefix `name — line`, unless line already opens with the name (captured
 *  subtitles/descriptions often do) — avoids "Aurabase — Aurabase — ...". */
function leadWithName(name: string, line: string): string {
  const trimmed = line.trim();
  if (trimmed.toLowerCase().startsWith(name.toLowerCase())) return trimmed;
  return `${name} — ${trimmed}`;
}

function buildPlayFull(inf: InferenceBrief) {
  const lines = [
    leadWithName(inf.name, inf.positioning || inf.value || inf.category),
    "",
    "WHAT IT DOES",
    inf.value || inf.positioning || "—",
    "",
    "WHO IT'S FOR",
    inf.audience || "— (fill Advanced → Audience)",
    "",
    "HOW IT WORKS",
    inf.how || inf.ux || "— (fill Advanced → UX or scan listing)",
    "",
    "KEY FEATURES",
    ...(inf.features.length ? inf.features.map((f) => `• ${f}`) : ["• —"]),
    "",
    "WHY IT'S DIFFERENT",
    ...(inf.differentiators.length
      ? inf.differentiators.map((d) => `• ${d}`)
      : inf.tone
        ? [`• Voice: ${inf.tone}`]
        : ["• —"]),
  ];
  if (inf.tone) {
    lines.push("", "TONE", inf.tone);
  }
  if (inf.ux) {
    lines.push("", "UX DIRECTION", inf.ux);
  }
  if (inf.donot) {
    lines.push("", "DO NOT", inf.donot);
  }
  lines.push(
    "",
    `Locale: ${inf.locale}. Screenshots tell a sequence — not isolated feature tiles.`
  );
  return lines.join("\n");
}

export function buildCopy(inf: InferenceBrief, conceptIndex: number): StoreCopy {
  const n = inf.name;
  const tone = toneHint(inf);
  const valueLine = inf.value || inf.positioning || `${n} for ${inf.category}`;
  const subTone = tone
    ? clip(tone, META_LIMITS.iosSubtitle)
    : clip(inf.positioning || "Clarity in one open", META_LIMITS.iosSubtitle);

  const variants: StoreCopy[] = [
    {
      iosTitle: clip(`${n}`, META_LIMITS.iosTitle),
      iosSubtitle: subTone,
      iosPromo: clip(
        tone
          ? `${tone}. ${valueLine}`
          : `New: a clearer way into ${inf.category.toLowerCase()}. Start in seconds.`,
        META_LIMITS.iosPromo
      ),
      iosKeywords: clip(
        `${n},${inf.category},${tone || "focus"},daily,progress`.replace(/\s+/g, ""),
        META_LIMITS.iosKeywords
      ),
      playTitle: clip(n, META_LIMITS.playTitle),
      playShort: clip(leadWithName(n, valueLine), META_LIMITS.playShort),
      playFull: buildPlayFull(inf),
      cta: goalCta(inf.goal),
    },
    {
      iosTitle: clip(`${n}: Show Up`, META_LIMITS.iosTitle),
      iosSubtitle: clip(tone || "Less noise. More proof.", META_LIMITS.iosSubtitle),
      iosPromo: clip(
        inf.audience
          ? `Built for ${inf.audience.split(",")[0]}. Open once. Leave clearer.`
          : valueLine,
        META_LIMITS.iosPromo
      ),
      iosKeywords: clip(`productivity,${inf.category},${n}`.toLowerCase(), META_LIMITS.iosKeywords),
      playTitle: clip(`${n}`, META_LIMITS.playTitle),
      playShort: clip(valueLine, META_LIMITS.playShort),
      playFull: buildPlayFull(inf),
      cta: goalCta(inf.goal),
    },
    {
      iosTitle: clip(`${n.slice(0, 20)} · Focus`, META_LIMITS.iosTitle),
      iosSubtitle: clip(inf.positioning || tone || "Your next honest take", META_LIMITS.iosSubtitle),
      iosPromo: clip(inf.positioning || valueLine, META_LIMITS.iosPromo),
      iosKeywords: clip(`focus,${inf.category.toLowerCase()},${n}`, META_LIMITS.iosKeywords),
      playTitle: clip(n, META_LIMITS.playTitle),
      playShort: clip(inf.positioning || valueLine, META_LIMITS.playShort),
      playFull: buildPlayFull(inf),
      cta: goalCta(inf.goal),
    },
  ];
  return variants[conceptIndex % variants.length];
}

export { goalCta, FRAME_ROLES };
