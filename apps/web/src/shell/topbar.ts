/** OWNER: UX Shell — topbar helpers (brand sticky chrome) */
export function setTopbarLabel(label: string) {
  const el = document.querySelector(".stage-label");
  if (el) el.textContent = label;
}
