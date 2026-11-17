import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react'
import { TextMorph } from 'torph/react'
import { DURATION, EASE } from '../lib/motion'
import type { Project } from '../lib/projects'
import { FINE_HOVER_QUERY, PHONE_QUERY, useIsomorphicLayoutEffect, useMediaQuery } from '../lib/hooks'
import ProjectMedia from './ProjectMedia'
import styles from './Gallery.module.scss'

export type GalleryView = 'gallery' | 'grid'

type Props = {
  projects: Project[]
  view: GalleryView
  /** False while an overlay (About, lightbox) is open. */
  interactive: boolean
  /** Item currently lifted into the lightbox. */
  hiddenIndex: number | null
  onOpen: (index: number) => void
}

const GLIDE = 0.12 // mouse wheel: fraction of the remaining distance covered per 60Hz frame
const DRAG_THRESHOLD = 5 // px before a press becomes a drag (and stops being a click)
const INERTIA = 280 // ms of release velocity carried into the glide

// The strip's height: the viewport minus the header and footer bands ($chrome × 2).
const STRIP_INSET = 96 * 2

/**
 * How wide an item is drawn, so the browser fetches a sharp enough image: full width on
 * phones, otherwise as tall as the strip and as wide as its ratio (often wider than the
 * viewport's half). The grid draws them smaller, so this covers both views.
 */
const itemSizes = (project: Project) =>
  `${PHONE_QUERY} 100vw, calc((100vh - ${STRIP_INSET}px) * ${+(project.width / project.height).toFixed(4)})`

/**
 * Trackpads and smooth mice (Magic Mouse) send pixel deltas with their own momentum;
 * notched wheels send big fixed steps. Chrome and Safari's legacy wheelDeltaY is exactly
 * -3 × deltaY for the first kind; elsewhere, fall back to the shape of the delta.
 */
function isTrackpad(e: WheelEvent): boolean {
  const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY
  if (typeof legacy === 'number' && legacy !== 0) return legacy === -3 * e.deltaY
  if (e.deltaMode !== 0) return false // lines or pages: a notched wheel
  return e.deltaX !== 0 || !Number.isInteger(e.deltaY) || Math.abs(e.deltaY) < 50
}

const clampScroll = (el: HTMLElement, value: number) =>
  Math.max(0, Math.min(el.scrollWidth - el.clientWidth, value))

export function projectElement(index: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-project-index="${index}"]`)
}

export default function Gallery({ projects, view, interactive, hiddenIndex, onOpen }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  const isPhone = useMediaQuery(PHONE_QUERY)
  const canHover = useMediaQuery(FINE_HOVER_QUERY)
  const horizontal = view === 'gallery' && !isPhone

  const [hovered, setHovered] = useState<number | null>(null)
  const [labelText, setLabelText] = useState('')
  const [dragging, setDragging] = useState(false)

  // Eased horizontal scroll. `current` is kept as a float so the easing stays smooth.
  const motion = useRef({ current: 0, target: 0, raf: 0, time: 0 })
  const drag = useRef({ down: false, active: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, velocity: 0 })
  const suppressClick = useRef(false)
  const pointer = useRef<{ x: number; y: number } | null>(null)

  const stopGlide = () => {
    cancelAnimationFrame(motion.current.raf)
    motion.current.raf = 0
  }

  const tick = useCallback((now: number) => {
    const el = scrollerRef.current
    const m = motion.current
    if (!el) return
    const remaining = m.target - m.current
    if (Math.abs(remaining) < 0.5) {
      m.current = m.target
      el.scrollLeft = m.current
      m.raf = 0
      return
    }
    // GLIDE per 60Hz frame, scaled to the real frame time so 120Hz screens feel the same.
    const frames = m.time ? Math.min(4, (now - m.time) / (1000 / 60)) : 1
    m.time = now
    m.current += remaining * (1 - Math.pow(1 - GLIDE, frames))
    el.scrollLeft = m.current
    m.raf = requestAnimationFrame(tick)
  }, [])

  const glideTo = useCallback(
    (target: number) => {
      const el = scrollerRef.current
      const m = motion.current
      if (!el) return
      if (!m.raf) m.current = el.scrollLeft
      m.target = clampScroll(el, target)
      if (!m.raf) {
        m.time = 0
        m.raf = requestAnimationFrame(tick)
      }
    },
    [tick],
  )

  // Vertical wheel (anywhere on the page) scrolls the gallery sideways.
  useEffect(() => {
    if (!horizontal || !interactive) return
    const onWheel = (e: WheelEvent) => {
      const el = scrollerRef.current
      if (!el || e.ctrlKey) return // ctrl+wheel is pinch-zoom
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY)

      if (isTrackpad(e)) {
        // Sideways swipes over the strip: let the browser scroll it natively.
        if (sideways && el.contains(e.target as Node)) return
        // Otherwise move it by exactly what macOS sends — its momentum is already smooth,
        // and easing it again makes it judder.
        const delta = sideways ? e.deltaX : e.deltaY
        if (!delta) return
        e.preventDefault()
        stopGlide()
        el.scrollLeft = clampScroll(el, el.scrollLeft + delta)
        motion.current.current = motion.current.target = el.scrollLeft
        return
      }

      // A notched mouse wheel jumps in steps, so glide between them.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1
      const delta = (sideways ? e.deltaX : e.deltaY) * unit
      if (!delta) return
      e.preventDefault()
      const from = motion.current.raf ? motion.current.target : el.scrollLeft
      glideTo(from + delta)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [horizontal, interactive, glideTo])

  // Switching layouts starts from the top / left.
  useIsomorphicLayoutEffect(() => {
    stopGlide()
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = 0
    el.scrollTop = 0
    motion.current.current = motion.current.target = 0
  }, [view, isPhone])

  useEffect(() => stopGlide, [])

  // --- Hover label -----------------------------------------------------------

  const updateHover = useCallback(() => {
    const p = pointer.current
    if (!p) return setHovered(null)
    const hit = document.elementFromPoint(p.x, p.y)
    const item = hit?.closest<HTMLElement>('[data-project-index]')
    if (item && trackRef.current?.contains(item)) {
      const index = Number(item.dataset.projectIndex)
      setHovered(index)
      setLabelText(projects[index].name)
    } else if (hit && trackRef.current?.contains(hit)) {
      // In a gap between items: keep the label up (and its text), so moving from one
      // image to the next morphs the name instead of hiding and reshowing it.
    } else {
      setHovered(null)
    }
  }, [projects])

  // An overlay just closed: re-check what's under the (possibly unmoved) pointer.
  useEffect(() => {
    if (interactive && canHover) updateHover()
  }, [interactive, canHover, updateHover])

  useEffect(() => {
    if (!canHover) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.current = { x: e.clientX, y: e.clientY }
      if (labelRef.current) labelRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      updateHover()
    }
    const onLeave = () => {
      pointer.current = null
      setHovered(null)
    }
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [canHover, updateHover])

  // --- Drag to scroll (mouse only — touch and trackpads scroll natively) -----

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    suppressClick.current = false
    if (!horizontal || e.pointerType !== 'mouse' || e.button !== 0) return
    const el = scrollerRef.current!
    stopGlide()
    drag.current = {
      down: true,
      active: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.down) return
    // Released outside the scroller before the drag captured the pointer — the
    // pointerup never reached us, so end it here rather than drag a buttonless mouse.
    if (!(e.buttons & 1)) return endDrag(e)
    const el = scrollerRef.current!
    const dx = e.clientX - d.startX
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      d.active = true
      suppressClick.current = true
      // Capture only once it's a real drag, so a plain click still reaches the item.
      el.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.velocity = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.velocity
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    const next = clampScroll(el, d.startScroll - dx)
    motion.current.current = motion.current.target = next
    el.scrollLeft = next
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.down) return
    d.down = false
    if (!d.active) return
    d.active = false
    setDragging(false)
    const el = scrollerRef.current!
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    // Ignore velocity if the pointer paused before release.
    const velocity = e.timeStamp - d.lastT > 80 ? 0 : d.velocity
    glideTo(el.scrollLeft - velocity * INERTIA)
  }

  const onClickCapture = (e: ReactMouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  const onScroll = () => {
    // Keep the easing in sync with native scrolling (keyboard, scrollbar, touch).
    if (!motion.current.raf && !drag.current.active) {
      motion.current.current = motion.current.target = scrollerRef.current!.scrollLeft
    }
    if (canHover) updateHover()
  }

  const labelVisible = canHover && interactive && !dragging && hovered !== null

  return (
    <>
      <div
        ref={scrollerRef}
        className={[styles.scroller, view === 'grid' ? styles.grid : styles.gallery, dragging && styles.dragging]
          .filter(Boolean)
          .join(' ')}
        role="region"
        aria-label="Projects"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onScroll={onScroll}
      >
        <ul ref={trackRef} className={styles.track}>
          {projects.map((project, index) => (
            <li
              key={project.id}
              className={styles.item}
              style={
                {
                  aspectRatio: `${project.width} / ${project.height}`,
                  viewTransitionName: `project-${project.id}`,
                  visibility: hiddenIndex === index ? 'hidden' : undefined,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className={styles.button}
                data-project-index={index}
                aria-label={`${project.name} — open`}
                onClick={() => onOpen(index)}
              >
                <ProjectMedia project={project} priority={index < 3} sizes={itemSizes(project)} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div ref={labelRef} className={styles.cursorLabel} aria-hidden>
        <span className={styles.cursorLabelText} data-visible={labelVisible}>
          <TextMorph ease={EASE} duration={DURATION.slow}>{labelText}</TextMorph>
        </span>
      </div>
    </>
  )
}
