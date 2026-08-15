/** OWNER: modes/template — pick armed library card */
import { getTemplates, listLayoutTemplates } from "@take/storage";

export function pickTemplate(templateId?: string) {
  const layouts = listLayoutTemplates();
  if (templateId) {
    const hit = layouts.find((t) => t.id === templateId) || getTemplates().find((t) => t.id === templateId);
    if (hit) return hit;
  }
  return layouts.find((t) => t.kind === "user") || layouts[0];
}
