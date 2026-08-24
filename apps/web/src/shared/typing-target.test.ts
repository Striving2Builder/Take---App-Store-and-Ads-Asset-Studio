/** OWNER: shared — arrow keys must not steal caret from fields */
import { isTypingTarget } from "./typing-target";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(!isTypingTarget(null), "null is not typing");
assert(!isTypingTarget({ tagName: "DIV" }), "div is not typing");
assert(isTypingTarget({ tagName: "TEXTAREA" }), "textarea is typing");
assert(isTypingTarget({ tagName: "INPUT" }), "input is typing");
assert(isTypingTarget({ tagName: "SELECT" }), "select is typing");
assert(isTypingTarget({ isContentEditable: true, tagName: "DIV" }), "contenteditable is typing");
assert(isTypingTarget({ tagName: "textarea" }), "tagName is case-insensitive");

console.log("typing-target.test ok");
