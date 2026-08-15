/** OWNER: packages/storage — public API */
export { STORAGE_KEYS } from "./keys";
export { loadJSON, saveJSON } from "./local-json";
export { getTemplates, saveUserTemplate, type SavedTemplate } from "./templates.repo";
export { pushHistory } from "./history.repo";
export {
  listProjects,
  saveProject,
  getProject,
  deleteProject,
  type ProjectRecord,
} from "./projects.repo";
export {
  loadScanSession,
  saveScanSession,
  clearScanSession,
  type ScanSessionSnapshot,
  type ScanSourceSnapshot,
  type AdvancedSnapshot,
} from "./scan-session.repo";
