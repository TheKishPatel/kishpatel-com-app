import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import type { Project } from '../lib/projects'
import { prefersReducedMotion, useScrollLock } from '../lib/hooks'
import ProjectMedia from './ProjectMedia'
import styles from './Lightbox.module.scss'

type Props = {
  projects: Project[]
  index: number
  /** The gallery item the image zooms out of and back into. */
  getOrigin: (index: number) => HTMLElement | null
  onIndexChange: (index: number) => void
  /** Called as the close animation starts. */
  onClose: () => void
  /** Called once the close animation has finished. */
  onClosed: () => void
}

/** Lets the site nav's Close link (SiteShell) run the zoom-back close. */
export type LightboxHandle = { close: () => void }

type Rect = { left: number; top: number; width: number; height: number }

const OPEN_MS = 420
const CLOSE_MS = 340
const SWIPE_DISTANCE = 60
const DISMISS_DISTANCE = 100
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'

/** Largest rect with the project's ratio that fits the gallery's own constraints. */
function fitRect(project: Project): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const phone = vw < 600
  const padX = phone ? 20 : 36
  const top = phone ? 72 : 96
  const bottom = phone ? 112 : 96
  const ratio = project.width / project.height
  const maxW = vw - padX * 2
  const maxH = vh - top - bottom
  let width = maxW
  let height = width / ratio
  if (height > maxH) {
    height = maxH
    width = height * ratio
  }
  return { left: (vw - width) / 2, top: top + (maxH - height) / 2, width, height }
}

/** Transform that makes an element laid out at `to` appear at `from`. */
function flip(from: DOMRect, to: Rect): string {
  const dx = from.left - to.left
  const dy = from.top - to.top
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`
}

const Lightbox = forwardRef<LightboxHandle, Props>(function Lightbox(
  { projects, index, getOrigin, onIndexChange, onClose, onClosed },
  ref,
) {
  const project = projects[index]
  const frameRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  const [rect, setRect] = useState<Rect | null>(null)
  const closing = useRef(false)
  const enterFrom = useRef<number>(0) // -1 / 1 when arriving from a swipe, 0 on first open
  const leaveAnim = useRef<Animation | null>(null)
  const gesture = useRef({ id: -1, x: 0, y: 0, t: 0, axis: null as 'x' | 'y' | null, dx: 0, dy: 0 })

  useScrollLock(true)

  // Size to the viewport (and re-fit on resize / when the project changes).
  useLayoutEffect(() => {
    const update = () => setRect(fitRect(project))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [project])

  // Zoom in from the gallery item on open; slide in after a swipe.
  const opened = useRef(false)
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!rect || !frame) return
    const reduce = prefersReducedMotion()

    if (!opened.current) {
      opened.current = true
      const origin = getOrigin(index)?.getBoundingClientRect()
      if (origin && !reduce) {
        frame.animate([{ transform: flip(origin, rect) }, { transform: 'none' }], { duration: OPEN_MS, easing: EASING })
      }
      backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 0 : OPEN_MS, easing: EASING })
      captionRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduce ? 0 : 250,
        delay: reduce ? 0 : OPEN_MS * 0.6,
        fill: 'backwards',
      })
      return
    }

    if (enterFrom.current !== 0) {
      const offset = enterFrom.current * 48
      enterFrom.current = 0
      leaveAnim.current?.cancel()
      leaveAnim.current = null
      frame.style.transform = ''
      if (reduce) return
      frame.animate(
        [
          { transform: `translateX(${offset}px)`, opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 260, easing: EASING },
      )
      captionRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 })
    }
    // Only re-run when the project changes, not on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect && project.id])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    onClose()
    const frame = frameRef.current
    const target = rect
    const originEl = getOrigin(index)
    const reduce = prefersReducedMotion()

    originEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const origin = originEl?.getBoundingClientRect()
    const current = frame ? getComputedStyle(frame).transform : 'none'
    const duration = reduce ? 0 : CLOSE_MS

    backdropRef.current?.animate([{ opacity: getComputedStyle(backdropRef.current).opacity }, { opacity: 0 }], {
      duration,
      easing: EASING,
      fill: 'forwards',
    })
    captionRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration / 2, fill: 'forwards' })

    const finish = () => {
      // The item is visibility: hidden until onClosed renders, and hidden elements
      // can't take focus — so render that first.
      flushSync(onClosed)
      originEl?.focus({ preventScroll: true })
    }

    if (!frame || !target || !origin || reduce) {
      frame?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' })
      window.setTimeout(finish, duration)
      return
    }
    const anim = frame.animate(
      [{ transform: current === 'none' ? 'none' : current }, { transform: flip(origin, target) }],
      { duration, easing: EASING, fill: 'forwards' },
    )
    anim.onfinish = finish
  }, [rect, index, getOrigin, onClose, onClosed])

  useImperativeHandle(ref, () => ({ close }), [close])

  const go = useCallback(
    (direction: 1 | -1) => {
      if (closing.current || projects.length < 2) return
      const next = (index + direction + projects.length) % projects.length
      const frame = frameRef.current
      const leave = () => {
        enterFrom.current = direction
        onIndexChange(next)
      }
      if (!frame || prefersReducedMotion()) return leave()
      const current = getComputedStyle(frame).transform
      const anim = frame.animate(
        [
          { transform: current === 'none' ? 'none' : current, opacity: 1 },
          { transform: `translateX(${-direction * 48}px)`, opacity: 0 },
        ],
        { duration: 160, easing: 'ease-in', fill: 'forwards' },
      )
      // Held (fill: forwards) until the next project renders; the enter effect cancels it.
      leaveAnim.current = anim
      anim.onfinish = leave
    },
    [index, projects.length, onIndexChange],
  )

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  // --- Swipe: sideways for next / previous, up or down to dismiss, tap to close ---

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (closing.current || !e.isPrimary) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null, dx: 0, dy: 0 }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (g.id !== e.pointerId || closing.current) return
    g.dx = e.clientX - g.x
    g.dy = e.clientY - g.y
    if (!g.axis) {
      if (Math.hypot(g.dx, g.dy) < 8) return
      g.axis = Math.abs(g.dx) > Math.abs(g.dy) ? 'x' : 'y'
    }
    const frame = frameRef.current
    if (!frame) return
    if (g.axis === 'x') {
      frame.style.transform = `translateX(${g.dx}px)`
    } else {
      frame.style.transform = `translateY(${g.dy}px)`
      if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, 1 - Math.abs(g.dy) / 400))
    }
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (g.id !== e.pointerId) return
    g.id = -1
    if (closing.current) return
    const frame = frameRef.current
    const fast = e.timeStamp - g.t < 250

    if (!g.axis) return close() // a tap anywhere closes, like Medium

    if (g.axis === 'x' && (Math.abs(g.dx) > SWIPE_DISTANCE || (fast && Math.abs(g.dx) > 20))) {
      return go(g.dx < 0 ? 1 : -1)
    }
    if (g.axis === 'y' && (Math.abs(g.dy) > DISMISS_DISTANCE || (fast && Math.abs(g.dy) > 30))) {
      return close()
    }

    // Not far enough — spring back.
    if (frame) {
      const from = frame.style.transform
      frame.style.transform = ''
      frame.animate([{ transform: from }, { transform: 'none' }], { duration: 220, easing: EASING })
    }
    if (backdropRef.current) {
      const from = backdropRef.current.style.opacity || '1'
      backdropRef.current.style.opacity = ''
      backdropRef.current.animate([{ opacity: from }, { opacity: 1 }], { duration: 220 })
    }
  }

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current.id !== e.pointerId) return
    gesture.current.id = -1
    if (frameRef.current) frameRef.current.style.transform = ''
    if (backdropRef.current) backdropRef.current.style.opacity = ''
  }

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-labelledby="lightbox-title"
      aria-describedby="lightbox-description"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div ref={backdropRef} className={styles.backdrop} />

      {rect && (
        <>
          <div
            ref={frameRef}
            className={styles.frame}
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          >
            <ProjectMedia key={project.id} project={project} sizes="100vw" priority />
          </div>

          <div
            ref={captionRef}
            className={styles.caption}
            style={{ left: rect.left, top: rect.top + rect.height + 12, width: rect.width }}
          >
            <h2 id="lightbox-title">{project.name}</h2>
            <p id="lightbox-description" className={styles.description}>
              {project.description}
            </p>
          </div>
        </>
      )}
    </div>
  )
})

export default Lightbox
