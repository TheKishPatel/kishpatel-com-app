import { useEffect, useLayoutEffect, useState } from 'react'

export const PHONE_QUERY = '(max-width: 599px)'
export const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)'

/** Live result of a media query. `false` during SSR and the first client render. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}

/** useLayoutEffect in the browser, useEffect on the server (where layout effects can't run and React warns). */
export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Overlays can stack (e.g. the lightbox over About after a Back press) and close in
// any order, so locks are counted and the page's own value is restored only at zero.
let scrollLocks = 0
let unlockedOverflow = ''

/** Stops the page behind an overlay from scrolling (only matters on phones, where the page scrolls). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    if (scrollLocks++ === 0) {
      unlockedOverflow = root.style.overflow
      root.style.overflow = 'hidden'
    }
    return () => {
      if (--scrollLocks === 0) root.style.overflow = unlockedOverflow
    }
  }, [active])
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
