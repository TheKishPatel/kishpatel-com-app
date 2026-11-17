import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { TextMorph } from 'torph/react'
import { DURATION, EASE } from '../lib/motion'
import type { Project } from '../lib/projects'
import { prefersReducedMotion } from '../lib/hooks'
import Gallery, { projectElement } from './Gallery'
import type { GalleryView } from './Gallery'
import Lightbox from './Lightbox'
import type { LightboxHandle } from './Lightbox'
import ViewToggle from './ViewToggle'
import LogoMark from './LogoMark'
import About, { closeAbout, markAboutOpenedInApp, socials } from './About'
import styles from './SiteShell.module.scss'

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

/**
 * The home page — logo, nav, gallery and footer. It lives in _app so it stays
 * mounted (gallery position and all) while /about opens on top of it.
 */
export default function SiteShell({ projects, children }: { projects: Project[]; children: ReactNode }) {
  const router = useRouter()
  const aboutOpen = router.pathname === '/about'
  // Stays mounted after the URL leaves /about, until its fade-out finishes.
  const [aboutMounted, setAboutMounted] = useState(aboutOpen)
  if (aboutOpen && !aboutMounted) setAboutMounted(true)
  const onAboutExited = useCallback(() => setAboutMounted(false), [])

  const [view, setView] = useState<GalleryView>('gallery')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  // False as soon as the lightbox starts closing, so the nav morphs back with it.
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const lightboxRef = useRef<LightboxHandle>(null)

  const changeView = (next: GalleryView) => {
    if (next === view) return
    const doc = document as ViewTransitionDocument
    if (!doc.startViewTransition || prefersReducedMotion()) return setView(next)
    // Each item has a view-transition-name, so they morph between layouts.
    doc.startViewTransition(() => flushSync(() => setView(next)))
  }

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])
  const onLightboxClose = useCallback(() => setLightboxOpen(false), [])
  const onLightboxClosed = useCallback(() => setLightboxIndex(null), [])

  // One link that morphs About ↔ Close, and is the Close for About and the lightbox.
  const overlayOpen = aboutOpen || lightboxOpen
  const navRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (overlayOpen) navRef.current?.focus({ preventScroll: true })
  }, [overlayOpen])

  // While an overlay is open, everything behind it except the Close link is inert,
  // so Tab and screen readers stay with the overlay.
  const logoRef = useRef<HTMLAnchorElement>(null)
  // Mouse hover or keyboard focus only, so a tap doesn't leave it morphed on touch screens.
  const [logoHovered, setLogoHovered] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    for (const el of [logoRef.current, mainRef.current, footerRef.current]) {
      if (el) el.inert = overlayOpen
    }
  }, [overlayOpen])

  const navLabel = overlayOpen ? 'Close' : 'About'

  const onNavClick = (e: MouseEvent) => {
    if (!overlayOpen) return markAboutOpenedInApp()
    e.preventDefault()
    if (lightboxOpen) lightboxRef.current?.close()
    else closeAbout(router)
  }

  return (
    <div className={styles.shell}>
      <header>
        <Link
          ref={logoRef}
          href="/"
          scroll={false}
          className={styles.logo}
          aria-label="Kish Patel — home"
          onPointerEnter={(e) => e.pointerType === 'mouse' && setLogoHovered(true)}
          onPointerLeave={() => setLogoHovered(false)}
          onFocus={(e) => e.currentTarget.matches(':focus-visible') && setLogoHovered(true)}
          onBlur={() => setLogoHovered(false)}
        >
          <LogoMark active={logoHovered && !overlayOpen} />
        </Link>
        <nav className={styles.nav} data-open={overlayOpen || undefined}>
          <Link
            ref={navRef}
            href={overlayOpen ? '/' : '/about'}
            scroll={false}
            className={styles.aboutLink}
            onClick={onNavClick}
          >
            <TextMorph ease={EASE} duration={DURATION.slow}>{navLabel}</TextMorph>
          </Link>
        </nav>
      </header>

      <main ref={mainRef}>
        <h1 className="visually-hidden">Kish Patel — selected work</h1>
        <Gallery
          projects={projects}
          view={view}
          interactive={!aboutOpen && lightboxIndex === null}
          hiddenIndex={lightboxIndex}
          onOpen={openLightbox}
        />
      </main>

      <footer ref={footerRef} className={styles.footer}>
        <ul className={styles.socials}>
          {socials.map((s) => (
            <li key={s.label}>
              <a className={styles.navLink} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                {s.short}
              </a>
            </li>
          ))}
        </ul>
        <ViewToggle view={view} onChange={changeView} />
      </footer>

      {lightboxIndex !== null && (
        <Lightbox
          ref={lightboxRef}
          projects={projects}
          index={lightboxIndex}
          getOrigin={projectElement}
          onIndexChange={setLightboxIndex}
          onClose={onLightboxClose}
          onClosed={onLightboxClosed}
        />
      )}

      {aboutMounted && <About open={aboutOpen} onExited={onAboutExited} />}

      {children}
    </div>
  )
}
