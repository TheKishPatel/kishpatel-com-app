import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/hooks'
import { DURATION, ease } from '../lib/motion'
import styles from './LogoMark.module.scss'

// The K from public/logo.svg (24.75 × 24): a 70% "arm" triangle along the top, and a solid
// "leg" triangle under it. On hover the K stands upright against the left edge, with square
// top-left and bottom-left corners, and the arm reaching the top-left corner.
//
// Corners are listed flat (x, y, x, y…): 3 for the arm, then 4 for the leg. The leg's second
// corner sits halfway down its long edge, in line at rest, so the K's point can bend out from it.
const W = 24.75
const POINT = 12.4 // x of the K's point on hover, at half height
const ARM = 6

const REST = [24.75, 0, 3.75, 0, 12, 12, 3.75, 0, 13.875, 12, 24, 24, 0, 24]
const HOVER = [
  // Arm: its tip runs on past the point, tucked under the leg, so the shared edge has no seam.
  W, 0, 0, 0, POINT - (W - POINT) / 2, 18,
  // Leg
  0, 0, POINT, 12, W, 24, 0, 24,
]

function points(corners: number[]): string {
  let out = ''
  for (let i = 0; i < corners.length; i += 2) out += `${i ? ' ' : ''}${corners[i]},${corners[i + 1]}`
  return out
}

/** The logo. `active` morphs it to the upright K (the logo link's hover). */
export default function LogoMark({ active }: { active: boolean }) {
  const armRef = useRef<SVGPolygonElement>(null)
  const legRef = useRef<SVGPolygonElement>(null)
  const current = useRef(REST)

  useEffect(() => {
    const from = current.current
    const to = active ? HOVER : REST
    if (from === to) return
    // Quick to stand up, slower to settle back.
    const duration = prefersReducedMotion() ? 0 : active ? DURATION.base : DURATION.slow
    const start = performance.now()
    let frame = 0
    // Tweens from wherever it is, so leaving mid-morph turns straight back.
    const tick = (now: number) => {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1
      const e = ease(progress)
      const next = progress === 1 ? to : from.map((v, i) => v + (to[i] - v) * e)
      current.current = next
      armRef.current?.setAttribute('points', points(next.slice(0, ARM)))
      legRef.current?.setAttribute('points', points(next.slice(ARM)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  return (
    <svg className={styles.mark} width={W} height={24} viewBox={`0 0 ${W} 24`} aria-hidden="true">
      <polygon ref={armRef} className={styles.arm} points={points(REST.slice(0, ARM))} />
      <polygon ref={legRef} className={styles.leg} points={points(REST.slice(ARM))} />
    </svg>
  )
}
