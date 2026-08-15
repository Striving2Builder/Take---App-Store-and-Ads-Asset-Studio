/** OWNER: packages/core — screenshot count guidance */
export function screenshotCountOk(platform: string, count: number) {
  const frameMin = platform === "android" ? 2 : 1;
  const frameMax = 10;
  return {
    ok: count >= frameMin && count <= frameMax,
    frameMin,
    frameMax,
    count,
  };
}
