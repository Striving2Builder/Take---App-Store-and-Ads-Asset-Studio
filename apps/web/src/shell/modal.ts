/** OWNER: UX Shell — modal open/close helpers */
export function openDialog(id: string) {
  (document.getElementById(id) as HTMLDialogElement | null)?.showModal();
}

export function closeDialog(id: string) {
  (document.getElementById(id) as HTMLDialogElement | null)?.close();
}
