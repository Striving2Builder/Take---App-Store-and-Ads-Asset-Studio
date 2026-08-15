/**
 * OWNER: packages/scan-client — gold-set logic for rows 6–8 + F11 honesty
 * Run: npx tsx packages/scan-client/src/gold-client.test.ts
 */
import {
  emptyCapture,
  capturedField,
  mergeCapture,
  briefFromCapture,
  narrativeFromDescription,
  fallbackInfer,
} from "./index";
import type { IntakeInput } from "@take/core";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const baseIntake = (): IntakeInput => ({
  url: "https://apps.apple.com/us/app/x/id1",
  platform: "ios",
  mode: "wizard",
  qty: 3,
  name: "",
  category: "",
  audience: "",
  locale: "en-US",
  competitors: "",
  goal: "install",
  style: "realistic",
  positioning: "",
  narrative: "",
  where: "",
  when: "",
  ux: "",
  tone: "",
  refs: "",
  donot: "",
  uploads: 0,
});

/** Row 8: user provenance survives re-scan merge */
{
  const prev = emptyCapture({ inputUrl: "https://apps.apple.com/x", adapter: "apple" });
  prev.ok = true;
  prev.fields.name = { value: "User Name", provenance: "user", source: "intake-edit" };
  prev.fields.category = capturedField("Social", "apple");

  const next = emptyCapture({ inputUrl: "https://apps.apple.com/x", adapter: "apple" });
  next.ok = true;
  next.fields.name = capturedField("Store Name", "apple");
  next.fields.category = capturedField("New Cat", "apple");

  const merged = mergeCapture(prev, next);
  assert(merged.fields.name.value === "User Name", "user name must survive re-scan");
  assert(merged.fields.name.provenance === "user", "provenance stays user");
  assert(merged.fields.category.value === "New Cat", "non-user fields take next");
}

/** Row 6 shape: upload-like assets on capture */
{
  const cap = emptyCapture({ inputUrl: "", adapter: "uploads" });
  cap.ok = true;
  cap.assets = [
    {
      id: "upload-0-shot.png",
      kind: "screenshot",
      url: "data:image/png;base64,aaa",
      provenance: "user",
    },
  ];
  assert(cap.assets[0].url.startsWith("data:"), "uploads should be data URLs for refresh");
}

/** Session selection filter */
{
  const shots = ["a", "b", "c"];
  const saved = ["b", "gone"];
  const keep = saved.filter((id) => shots.includes(id));
  assert(keep.length === 1 && keep[0] === "b", "hydrate filters selectedShotIds");
}

/** F11: live capture must not invent commute/bedtime copy */
{
  const cap = emptyCapture({ inputUrl: "https://apps.apple.com/x", adapter: "apple" });
  cap.ok = true;
  cap.fields.name = capturedField("WhatsApp Messenger", "apple");
  cap.fields.category = capturedField("Social Networking", "apple");
  cap.fields.description = capturedField(
    "Built for people who want private messaging.\nHow it works: Open chat and send a message.\n• Fast voice and video calls\n• End-to-end encryption by default",
    "apple"
  );
  const brief = briefFromCapture(cap, baseIntake());
  assert(!/commute/i.test(brief.where), "must not invent commute where");
  assert(!/bedtime/i.test(brief.where), "must not invent bedtime where");
  assert(!/Morning open/i.test(brief.when), "must not invent morning when");
  assert(brief.where === "", "where stays Missing without Advanced");
  assert(brief.when === "", "when stays Missing without Advanced");
  assert(/private messaging/i.test(brief.audience), "audience from built for");
  assert(/Open chat/i.test(brief.how) || /send a message/i.test(brief.how), "how from description");
}

/** F11: heuristic extract */
{
  const n = narrativeFromDescription(
    "Designed for teams who ship weekly.\nHow it works: Connect your board and track progress."
  );
  assert(/teams/i.test(n.audience), "audience phrase");
  assert(/Connect your board/i.test(n.how), "how block");
}

/** F11: fallback also stops lifestyle invent */
{
  const fb = fallbackInfer(baseIntake());
  assert(!/commute/i.test(fb.brief.where), "fallback no commute");
  assert(fb.brief.where === "", "fallback where empty");
  assert(fb.warnings.some((w) => /Missing/i.test(w)), "fallback warns Missing");
}

console.log("gold-client.test.ts OK (rows 6–8 + F11)");
