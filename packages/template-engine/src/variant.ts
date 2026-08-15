/** OWNER: packages/template-engine — structural variant refresh (stub) */
export function refreshVariantId(templateId: string): string {
  return `${templateId}::v${Date.now()}`;
}
