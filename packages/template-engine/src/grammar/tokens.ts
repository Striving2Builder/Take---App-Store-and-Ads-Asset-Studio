/** OWNER: packages/template-engine — grammar token types */
import type { CompositionKind, DevicePlacement, TypeFamily, TypeScale } from "../template.types";

export type TokenRange = {
  x: [number, number];
  y: [number, number];
  w: [number, number];
  rot: [number, number];
};

export type GrammarTokens = {
  grammarVersion: string;
  placements: Record<DevicePlacement, TokenRange>;
  /** Optional 3-phone fan (isolated). Missing = generator never fans. */
  fan3?: {
    backLeft: TokenRange;
    front: TokenRange;
    backRight: TokenRange;
  };
};

export type GrammarProductions = {
  grammarVersion: string;
  composition: Record<CompositionKind, number>;
  typeFamily: Record<TypeFamily, number>;
  typeScale: Record<TypeScale, number>;
  bleedBudget: Record<"0" | "1" | "2", number>;
  isolatedPlacement: Record<"center" | "left" | "right", number>;
  stripLocalPlacement: Record<"center" | "left" | "right", number>;
  /** "1" = one isolated slice gets three phones. */
  fan3?: Record<"0" | "1", number>;
};

export type Grammar = {
  tokens: GrammarTokens;
  productions: GrammarProductions;
};
