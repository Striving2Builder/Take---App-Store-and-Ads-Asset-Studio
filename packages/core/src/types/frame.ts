/** OWNER: packages/core — screenshot / story frame */
export type StoryFrame = {
  id: string;
  index: number;
  role: string;
  kicker: string;
  headline: string;
  caption: string;
  cta: string;
  /** Slideshow dwell in ms — ignored by still export */
  dwellMs?: number;
};
