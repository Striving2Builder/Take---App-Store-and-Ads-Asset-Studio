/** OWNER: UX Shell — progress pips (Scan → Generate → Edit → Export) */
export function setPipState(active: "scan" | "generate" | "edit" | "export") {
  const order = ["scan", "generate", "edit", "export"];
  const idx = order.indexOf(active);
  document.querySelectorAll(".progress-pips .pip").forEach((pip, i) => {
    pip.classList.toggle("on", i === idx);
    pip.classList.toggle("done", i < idx);
  });
}
