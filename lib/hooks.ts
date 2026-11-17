import { useEffect, useState } from 'react'

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

/** Stops the page behind an overlay from scrolling (only matters on phones, where the page scrolls). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [active])
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
