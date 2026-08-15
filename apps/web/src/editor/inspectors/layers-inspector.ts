/** OWNER: editor/inspectors — layers panel chrome (toggles live in layer-toggles.ts) */
export function focusLayersPanel() {
  document.querySelector<HTMLElement>('.meta-link[data-panel="layers"]')?.click();
}
