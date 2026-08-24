/** OWNER: stages/export — shellPx → local map */
import { shellRectToLocal, shellUv } from "./shell-chrome-map";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

{
  const r = shellRectToLocal(
    { x: 100, y: 50, w: 50, h: 25 },
    { w: 400, h: 800 },
    200,
    400,
    -100,
    -200
  );
  assert(Math.abs(r.x - (-50)) < 1e-9, `x ${r.x}`);
  assert(Math.abs(r.y - (-175)) < 1e-9, `y ${r.y}`);
  assert(Math.abs(r.w - 25) < 1e-9, `w ${r.w}`);
  assert(Math.abs(r.h - 12.5) < 1e-9, `h ${r.h}`);
}

{
  const uv = shellUv(195, 42, { w: 390, h: 844 });
  assert(Math.abs(uv.u - 195 / 390) < 1e-9, "u");
  assert(Math.abs(uv.v - 42 / 844) < 1e-9, "v");
}

console.log("shell-chrome-map.test ok");
