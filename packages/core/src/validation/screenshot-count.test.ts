/** OWNER: packages/core — Play max 8, App Store max 10 */
import { screenshotCountOk } from "./screenshot-count";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(screenshotCountOk("ios", 1).ok, "iOS allows 1");
assert(screenshotCountOk("ios", 10).ok, "iOS allows 10");
assert(!screenshotCountOk("ios", 11).ok, "iOS rejects 11");
assert(screenshotCountOk("android", 2).ok, "Play min 2");
assert(screenshotCountOk("android", 8).ok, "Play allows 8");
assert(!screenshotCountOk("android", 9).ok, "Play rejects 9");
assert(!screenshotCountOk("android", 1).ok, "Play rejects 1");
assert(screenshotCountOk("play", 8).frameMax === 8, "play alias");

console.log("screenshot-count.test ok");
