// Motion tokens — keep in sync with $ease / $duration-* in styles/_tokens.scss.

/** The site's one easing curve. */
export const EASE = 'cubic-bezier(0.2, 0.8, 0, 1)'

/** The three durations, in ms. */
export const DURATION = {
  /** Hovers, small fades, things leaving. */
  fast: 150,
  /** Overlays fading, slides, settling back. */
  base: 250,
  /** Big moves: the lightbox zoom, text morphs. */
  slow: 500,
} as const
