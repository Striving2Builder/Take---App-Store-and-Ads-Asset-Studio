/** OWNER: packages/core — App Store / Play character limits */
export const META_LIMITS = {
  iosTitle: 30,
  iosSubtitle: 30,
  iosPromo: 170,
  iosKeywords: 100,
  playTitle: 30,
  playShort: 80,
  playFull: 4000,
} as const;

export type MetaLimitKey = keyof typeof META_LIMITS;
