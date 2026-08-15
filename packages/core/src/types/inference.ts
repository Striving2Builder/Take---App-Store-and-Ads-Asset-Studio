/** OWNER: packages/core — inference brief (captured + inferred fields later) */
export type InferenceBrief = {
  name: string;
  category: string;
  audience: string;
  where: string;
  when: string;
  how: string;
  features: string[];
  positioning: string;
  narrative: string;
  value: string;
  differentiators: string[];
  style: string;
  platform: string;
  locale: string;
  goal: string;
  host: string;
  mode: string;
  donot: string;
  /** Advanced guidance — creative direction */
  tone: string;
  ux: string;
  refs: string;
  /** Phase 1+: mark provenance */
  provenance?: {
    captured: string[];
    inferred: string[];
  };
};
