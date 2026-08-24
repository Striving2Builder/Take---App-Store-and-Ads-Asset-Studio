/** OWNER: packages/core — screenshot count guidance */
export function screenshotCountOk(platform: string, count: number) {
  const android = platform === "android" || platform === "play";
  const frameMin = android ? 2 : 1;
  const frameMax = android ? 8 : 10;
  return {
    ok: count >= frameMin && count <= frameMax,
    frameMin,
    frameMax,
    count,
  };
}
