/** OWNER: shared — skip layout nudges while typing in fields */

export function isTypingTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as { isContentEditable?: boolean; tagName?: string };
  if (el.isContentEditable) return true;
  const tag = (el.tagName || "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
