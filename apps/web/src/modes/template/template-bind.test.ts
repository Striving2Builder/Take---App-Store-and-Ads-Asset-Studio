/** OWNER: modes/template — bind tests (catalog consume) */
import { resolveTemplateBind } from "./template-bind";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const bound = resolveTemplateBind({
  id: "sys-ios-isolated-5",
  name: "iOS · isolated 5",
  tags: ["ios"],
  platform: "ios",
  kind: "system",
  style: "premium",
  frames: 5,
  deviceId: "apple.iphone-16-pro-max",
  defaultOrientation: "portrait",
  updated: "2026-08-15",
});
assert(bound?.deviceId === "apple.iphone-16-pro-max", "known device binds");
assert(bound?.orientation === "portrait", "orientation binds");
assert(bound?.frameHint === 5, "frame hint");

const unknown = resolveTemplateBind({
  id: "x",
  name: "X",
  tags: [],
  platform: "ios",
  kind: "user",
  style: "minimal",
  frames: 3,
  deviceId: "not.a.device",
  updated: "2026-08-01",
});
assert(unknown?.deviceId === undefined, "unknown deviceId dropped");
assert(resolveTemplateBind(null) === null, "null template");

console.log("template-bind.test ok");
