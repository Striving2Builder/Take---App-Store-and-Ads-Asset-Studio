/** OWNER: modes/replicator — ask Claude to read the panels the local reader could not.
 *
 *  Internal tool: the user's own API key is used straight from the browser.
 *  The screenshot is sent to Anthropic when this runs; only geometry and
 *  colour are asked for. */
import Anthropic from "@anthropic-ai/sdk";
import { VISION_PROMPT, VISION_SCHEMA, parseVision, type VisionRead } from "@take/template-engine";

const KEY_STORAGE = "take.anthropicKey";
const MODEL = "claude-opus-5";
const MAX_SIDE = 1568;

export function loadKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveKey(key: string): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage blocked: the key just isn't remembered */
  }
}

/** Downscale to the size the API reads well, as a PNG. */
function encodeImage(source: HTMLCanvasElement): string {
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  if (scale >= 1) return source.toDataURL("image/png").split(",")[1];
  const c = document.createElement("canvas");
  c.width = Math.round(source.width * scale);
  c.height = Math.round(source.height * scale);
  c.getContext("2d")?.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/png").split(",")[1];
}

export type ClaudeReadResult = { ok: true; read: VisionRead } | { ok: false; error: string };

export async function readWithClaude(
  apiKey: string,
  source: HTMLCanvasElement,
  panelCount: number
): Promise<ClaudeReadResult> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      output_config: { format: { type: "json_schema", schema: VISION_SCHEMA as unknown as Record<string, unknown> } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: encodeImage(source) } },
            {
              type: "text",
              text: `${VISION_PROMPT}\n\nThe local reader counted ${panelCount} panels; report the panels you actually see.`,
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return { ok: false, error: "Claude declined to read this image." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "Claude's answer was cut off before it finished. Try again." };
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return { ok: false, error: "Claude returned no answer." };
    const parsed = parseVision(block.text);
    return parsed.ok ? { ok: true, read: parsed.read } : { ok: false, error: parsed.error };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "That API key was rejected. Check it and try again." };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Rate limited by the API. Wait a moment and try again." };
    }
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `The API returned an error (${err.status}): ${err.message}` };
    }
    return { ok: false, error: "Couldn't reach the API. Check your connection." };
  }
}
