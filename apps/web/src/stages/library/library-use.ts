/** OWNER: stages/library — Use applies a recipe; New layout is grammar */
import {
  getTemplates,
  listLayoutTemplates,
  pushHistory,
  type SavedTemplate,
} from "@take/storage";
import { bindRecipeShell, generateLayout, recipeFromSaved } from "@take/template-engine";
import { screenshotCountOk } from "@take/core";
import { state } from "../../app/app-state";
import { showStage } from "../../app/stage-machine";
import { toast } from "../../shell/toast";
import { renderEditor } from "../../editor/canvas/edit-canvas";
import { mountModePlugins } from "../../modes/mode-plugins";
import {
  refreshDevicePickerForPlatform,
  syncDevicePickerValue,
} from "../../editor/device/device-picker";
import { syncOrientationUi } from "../../editor/device/orientation-control";
import {
  defaultDeviceIdForShell,
  resolveApplyStoreShell,
  syncStoreTargetUi,
} from "../../editor/device/store-target-control";
import { projectSetFromRecipe } from "../../modes/template/template-set";
import { resolveTemplateBind } from "../../modes/template/template-bind";
import { syncTemplateArm } from "../../modes/template/template-arm";
import { $ } from "../../shared/dom";

function armWizardRadio(): void {
  const radio = $<HTMLInputElement>('input[name="mode"][value="wizard"]');
  if (radio) radio.checked = true;
  state.mode = "wizard";
}

function briefForApply() {
  return state.inference || state.lastScan?.brief || (state.uploads.length ? {
    name: "Your App",
    category: "app",
    audience: "your audience",
    where: "anywhere",
    when: "every day",
    how: "simply",
    features: [],
    positioning: "A clearer way to get things done.",
    narrative: "",
    value: "Make progress with less effort.",
    differentiators: [],
    style: "minimal",
    platform: state.platform,
    locale: "en-US",
    goal: "install",
    host: "",
    mode: "template",
    donot: "",
    tone: "clear",
    ux: "",
    refs: "",
  } : null);
}

function isMobileCard(recipeTags: string[] | undefined, platform?: string): boolean {
  return (recipeTags || []).includes("mobile") || platform === "mobile";
}

function warnPlayIfNeeded(shell: "ios" | "android", frameCount: number): void {
  if (shell !== "android") return;
  const check = screenshotCountOk("android", frameCount);
  if (!check.ok) {
    toast(
      `Play Store allows max ${check.frameMax} screens — this set has ${frameCount}. Trim frames before a Play ZIP.`
    );
  }
}

function goEditApplied(name: string, msg?: string): void {
  syncDevicePickerValue();
  syncStoreTargetUi();
  syncOrientationUi();
  // Show before painting — renderEditor() measures on-screen canvas sizes to
  // raster sharply; while the stage is still hidden, that reads 0.
  showStage("edit");
  renderEditor();
  mountModePlugins();
  toast(msg || `Applied “${name}”`);
}

export function useLibraryRecipe(id: string): void {
  const tpl = getTemplates().find((t) => t.id === id);
  if (!tpl) {
    toast("Recipe not found");
    return;
  }
  let recipe = recipeFromSaved({ ...tpl, layout: tpl.layout });
  if (!recipe.devices.length) {
    toast("That card has no layout");
    return;
  }
  armWizardRadio();
  state.templateId = id;
  const brief = briefForApply();
  if (!brief) {
    showStage("intake");
    syncTemplateArm();
    toast(`Scan or upload screenshots to fill “${tpl.name}”`);
    pushHistory("template.use", id);
    return;
  }

  if (isMobileCard(recipe.tags, tpl.platform)) {
    const shell = resolveApplyStoreShell(brief.platform);
    recipe = bindRecipeShell(recipe, shell);
    state.platform = shell;
    state.deviceId = recipe.deviceId || state.deviceId;
    refreshDevicePickerForPlatform(shell);
    warnPlayIfNeeded(shell, recipe.frameCount);
  } else if (recipe.deviceId) {
    state.deviceId = recipe.deviceId;
    if ((recipe.tags || []).includes("android") || tpl.platform === "android") {
      state.platform = "android";
    } else if ((recipe.tags || []).includes("ios") || tpl.platform === "ios") {
      state.platform = "ios";
    }
  }

  const set = projectSetFromRecipe(recipe, brief, {
    deviceId: recipe.deviceId || state.deviceId,
    seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
  });
  state.sets = [set];
  state.selectedSet = 0;
  state.activeFrame = 0;
  if (set.deviceId) state.deviceId = set.deviceId;
  if (recipe.defaultOrientation) state.orientation = recipe.defaultOrientation;
  goEditApplied(tpl.name);
  pushHistory("template.use", id);
}

/** Grammar combinatorics — not a Library look. */
export function newLayoutFromLibrary(id: string): void {
  const tpl = listLayoutTemplates().find((t) => t.id === id) || getTemplates().find((t) => t.id === id);
  const brief = briefForApply();
  if (!brief) {
    toast("Scan first, then New layout");
    return;
  }
  const bind = resolveTemplateBind(tpl ?? null);
  const shell = resolveApplyStoreShell(brief.platform);
  const mobile = isMobileCard(tpl?.tags, tpl?.platform);
  const deviceId = mobile
    ? defaultDeviceIdForShell(shell)
    : bind?.deviceId || state.deviceId;
  const orientation = bind?.orientation || state.orientation;
  const recipe = generateLayout({
    deviceId,
    orientation,
    platform: shell,
    shotCount: tpl?.frames || 5,
    seed: `${Date.now().toString(16)}-${Math.floor(Math.random() * 0xffffffff).toString(16)}`,
    palette: state.scanPalette?.swatches.map((s) => s.hex),
    name: brief.name,
  });
  const set = projectSetFromRecipe(recipe, brief, {
    deviceId,
    seedPalette: state.scanPalette?.swatches.map((s) => s.hex),
  });
  armWizardRadio();
  state.templateId = "";
  state.sets = [set];
  state.selectedSet = 0;
  state.activeFrame = 0;
  if (set.deviceId) state.deviceId = set.deviceId;
  if (recipe.defaultOrientation) state.orientation = recipe.defaultOrientation;
  state.platform = shell;
  refreshDevicePickerForPlatform(shell);
  warnPlayIfNeeded(shell, recipe.frameCount);
  goEditApplied(recipe.name || "New layout", "New layout from grammar — not a saved Library look");
  pushHistory("template.new-layout", (tpl as SavedTemplate | undefined)?.id || "grammar");
}
