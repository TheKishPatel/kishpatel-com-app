import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { TextMorph } from 'torph/react'
import type { Project } from '../lib/projects'
import { prefersReducedMotion } from '../lib/hooks'
import Gallery, { projectElement } from './Gallery'
import type { GalleryView } from './Gallery'
import Lightbox from './Lightbox'
import type { LightboxHandle } from './Lightbox'
import ViewToggle from './ViewToggle'
import { closeAbout, markAboutOpenedInApp, socials } from './About'
import styles from './SiteShell.module.scss'

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

/**
 * The home page — logo, nav, gallery and footer. It lives in _app so it stays
 * mounted (gallery position and all) while /about opens on top of it.
 */
export default function SiteShell({ projects, children }: { projects: Project[]; children: ReactNode }) {
  const router = useRouter()
  const aboutOpen = router.pathname === '/about'

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

  const onNavClick = (e: MouseEvent) => {
    if (!overlayOpen) return markAboutOpenedInApp()
    e.preventDefault()
    if (lightboxOpen) lightboxRef.current?.close()
    else closeAbout(router)
  }

  return (
    <div className={styles.shell}>
      <header>
        <Link href="/" scroll={false} className={styles.logo} aria-label="Kish Patel — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={24.75} height={24} />
        </Link>
        <nav className={styles.nav} data-open={overlayOpen || undefined}>
          <Link
            ref={navRef}
            href={overlayOpen ? '/' : '/about'}
            scroll={false}
            className={styles.aboutLink}
            onClick={onNavClick}
          >
            <TextMorph>{overlayOpen ? 'Close' : 'About'}</TextMorph>
          </Link>
        </nav>
      </header>

      <main>
        <h1 className="visually-hidden">Kish Patel — selected work</h1>
        <Gallery
          projects={projects}
          view={view}
          interactive={!aboutOpen && lightboxIndex === null}
          hiddenIndex={lightboxIndex}
          onOpen={openLightbox}
        />
      </main>

      <footer className={styles.footer}>
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

      {children}
    </div>
  )
}
