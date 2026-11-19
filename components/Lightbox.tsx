import { Fragment, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import type { Project } from '../lib/projects'
import { PHONE_QUERY, prefersReducedMotion, useScrollLock } from '../lib/hooks'
import { DURATION, EASE } from '../lib/motion'
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

const OPEN_MS = DURATION.slow
const CLOSE_MS = DURATION.base
const SWIPE_DISTANCE = 60
const DISMISS_DISTANCE = 100

const PHONE_CAPTION_SPACE = 112 // below the image on phones, room for the caption

/** A px length token from styles/_tokens.scss, exposed on :root in globals.scss. */
function token(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
}

/** Largest rect with the project's ratio that fits the gallery's own constraints. */
function fitRect(project: Project): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const phone = window.matchMedia(PHONE_QUERY).matches
  const padX = token(phone ? '--phone-gutter' : '--gutter')
  const top = token(phone ? '--phone-chrome' : '--chrome')
  const bottom = phone ? PHONE_CAPTION_SPACE : token('--chrome')
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

type Media = HTMLImageElement | HTMLVideoElement

const mediaIn = (el: HTMLElement | null | undefined) => el?.querySelector<Media>('img, video') ?? null

/**
 * A still of the gallery item's media, which is already loaded and decoded. The lightbox
 * asks for a larger image (and mounts a fresh video), which can take a while the first
 * time each project opens — without this, the frame zooms in empty and the image flashes.
 */
function Snapshot({ getSource }: { getSource: () => HTMLElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    const canvas = ref.current
    const media = mediaIn(getSource())
    if (!canvas || !media) return
    const video = media instanceof HTMLVideoElement
    const width = video ? media.videoWidth : media.naturalWidth
    const height = video ? media.videoHeight : media.naturalHeight
    if (!width || !height) return // not loaded yet (a lazy item off screen)
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(media, 0, 0, width, height)
    // Only draw once, as the project appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <canvas ref={ref} className={styles.snapshot} aria-hidden />
}

const Lightbox = forwardRef<LightboxHandle, Props>(function Lightbox(
  { projects, index, getOrigin, onIndexChange, onClose, onClosed },
  ref,
) {
  const project = projects[index]
  const hasDescription = project.description.length > 0
  const frameRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  const [rect, setRect] = useState<Rect | null>(null)
  // The project whose full-size media has painted; until then its Snapshot shows.
  const [readyId, setReadyId] = useState<string | null>(null)
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

  // A video picks up where the gallery item's copy is, rather than restarting from 0
  // (which would also jump away from the Snapshot's frame).
  useLayoutEffect(() => {
    const from = mediaIn(getOrigin(index))
    const to = mediaIn(frameRef.current)
    if (from instanceof HTMLVideoElement && to instanceof HTMLVideoElement) to.currentTime = from.currentTime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect && project.id])

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
        frame.animate([{ transform: flip(origin, rect) }, { transform: 'none' }], { duration: OPEN_MS, easing: EASE })
      }
      backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 0 : OPEN_MS, easing: EASE })
      captionRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reduce ? 0 : DURATION.base,
        easing: EASE,
        delay: reduce ? 0 : DURATION.base, // lands with the end of the zoom
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
        { duration: DURATION.base, easing: EASE },
      )
      captionRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION.base, easing: EASE })
    }
    // Only re-run when the project changes, not on resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect && project.id])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    onClose()
    // Closing mid-swipe: drop the held slide-out (and its project change).
    leaveAnim.current?.cancel()
    leaveAnim.current = null
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
      easing: EASE,
      fill: 'forwards',
    })
    captionRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 0 : DURATION.fast, easing: EASE, fill: 'forwards' })

    const finish = () => {
      // The item is visibility: hidden until onClosed renders, and hidden elements
      // can't take focus — so render that first.
      flushSync(onClosed)
      originEl?.focus({ preventScroll: true })
    }

    if (!frame || !target || !origin || reduce) {
      frame?.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: EASE, fill: 'forwards' })
      window.setTimeout(finish, duration)
      return
    }
    const anim = frame.animate(
      [{ transform: current === 'none' ? 'none' : current }, { transform: flip(origin, target) }],
      { duration, easing: EASE, fill: 'forwards' },
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
        if (closing.current) return
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
        { duration: DURATION.fast, easing: EASE, fill: 'forwards' },
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
    // Primary button only: a right-click (context menu) shouldn't count as a tap-to-close.
    if (closing.current || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    // A link in the caption: let the click follow it rather than count as tap-to-close.
    if ((e.target as Element).closest('a')) return
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
      frame.animate([{ transform: from }, { transform: 'none' }], { duration: DURATION.base, easing: EASE })
    }
    if (backdropRef.current) {
      const from = backdropRef.current.style.opacity || '1'
      backdropRef.current.style.opacity = ''
      backdropRef.current.animate([{ opacity: from }, { opacity: 1 }], { duration: DURATION.base, easing: EASE })
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
      aria-describedby={hasDescription ? 'lightbox-description' : undefined}
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
            {readyId !== project.id && <Snapshot key={`snapshot-${project.id}`}getSource={() => getOrigin(index)} />}
            <ProjectMedia
              key={project.id}
              project={project}
              sizes="100vw"
              priority
              onReady={() => setReadyId(project.id)}
            />
          </div>

          <div
            ref={captionRef}
            className={styles.caption}
            style={{ left: rect.left, top: rect.top + rect.height + 12, width: rect.width }}
          >
            <h2 id="lightbox-title">{project.name}</h2>
            {hasDescription && (
              <p id="lightbox-description" className={styles.description}>
                {project.description.map((part, i) =>
                  typeof part === 'string' ? (
                    <Fragment key={i}>{part}</Fragment>
                  ) : (
                    <a key={i} className={styles.link} href={part.href} target="_blank" rel="noopener noreferrer">
                      {part.text}
                    </a>
                  ),
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
})

export default Lightbox
