/** OWNER: packages/template-engine — batch generation stub */
export function batchFromTemplate(templateId: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${templateId}::batch-${i + 1}`);
}
