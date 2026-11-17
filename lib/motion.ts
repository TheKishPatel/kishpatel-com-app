// Motion tokens — keep in sync with $ease / $duration-* in styles/_tokens.scss.

/** The site's one easing curve. */
export const EASE = 'cubic-bezier(0.2, 0.8, 0, 1)'

/**
 * EASE as a function of progress (0–1), for animations driven frame by frame
 * (like the logo's corners, which CSS and WAAPI can't animate).
 */
export const ease = cubicBezier(0.2, 0.8, 0, 1)

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (t: number) => ((ax * t + bx) * t + cx) * t
  const y = (t: number) => ((ay * t + by) * t + cy) * t
  return (progress: number) => {
    if (progress <= 0) return 0
    if (progress >= 1) return 1
    // Bisect for the t whose x is `progress` (x is monotonic for these control points).
    let lo = 0
    let hi = 1
    let t = progress
    for (let i = 0; i < 40; i++) {
      const diff = x(t) - progress
      if (Math.abs(diff) < 1e-6) break
      if (diff < 0) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return y(t)
  }
}

/** The three durations, in ms. */
export const DURATION = {
  /** Hovers, small fades, things leaving. */
  fast: 150,
  /** Overlays fading, slides, settling back. */
  base: 250,
  /** Big moves: the lightbox zoom, text morphs. */
  slow: 500,
} as const
