/** OWNER: modes — register all creation modes at boot */
import { registerMode } from "@take/modes-sdk";
import { wizardMode } from "./wizard/wizard.adapter";
import { templateMode } from "./template/template.adapter";
import { replicatorMode } from "./replicator/replicator.adapter";
import { slideshowMode } from "./slideshow/slideshow.adapter";
import { adsMode } from "./ads/ads.adapter";

export function registerModes() {
  registerMode(wizardMode);
  registerMode(templateMode);
  registerMode(replicatorMode);
  registerMode(slideshowMode);
  registerMode(adsMode);
}
