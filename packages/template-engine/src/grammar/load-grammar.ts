/** OWNER: packages/template-engine — load versioned grammar JSON */
import type { Grammar } from "./tokens";
import tokens from "../../../../catalogs/templates/2026.08/grammar/tokens.json";
import productions from "../../../../catalogs/templates/2026.08/grammar/productions.json";

export const GRAMMAR_VERSION = "2026.08";

export function loadGrammar(version = GRAMMAR_VERSION): Grammar {
  if (version !== GRAMMAR_VERSION) {
    return loadGrammar(GRAMMAR_VERSION);
  }
  return {
    tokens: tokens as Grammar["tokens"],
    productions: productions as Grammar["productions"],
  };
}
