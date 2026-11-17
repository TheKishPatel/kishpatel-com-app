import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import type { NextRouter } from 'next/router'
import { prefersReducedMotion, useScrollLock } from '../lib/hooks'
import { DURATION, EASE } from '../lib/motion'
import styles from './About.module.scss'

type LinkItem = { label: string; href?: string }

const roles: { years: string; company: LinkItem }[] = [
  { years: '2021-', company: { label: 'Lightyear', href: 'https://lightyear.com' } },
  { years: '2018-2021', company: { label: 'Plum', href: 'https://withplum.com' } },
  { years: '2014-2018', company: { label: 'Wise', href: 'https://wise.com' } },
]

const founders: LinkItem[] = [
  { label: 'Sunsave', href: 'https://www.sunsave.energy' },
  { label: 'Marloo', href: 'https://www.marloo.com/' },
  { label: 'Sophic', href: 'https://www.usesophic.com/' },
]

export const socials: (LinkItem & { short: string })[] = [
  { label: 'X', short: 'X', href: 'https://x.com/TheKishPatel' },
  { label: 'Github', short: 'GH', href: 'https://github.com/TheKishPatel' },
  { label: 'Linkedin', short: 'LI', href: 'https://www.linkedin.com/in/kishpatel/' },
]

// Set when About is opened from the home page, so Close can step back in history
// instead of stacking another entry.
let openedInApp = false
export function markAboutOpenedInApp() {
  openedInApp = true
}

/** Used by the nav link (which morphs About → Close) and the Escape key. */
export function closeAbout(router: NextRouter) {
  if (openedInApp) {
    openedInApp = false
    router.back()
  } else {
    router.push('/', undefined, { scroll: false })
  }
}

function Item({ item }: { item: LinkItem }) {
  if (!item.href) return <span className={styles.link}>{item.label}</span>
  return (
    <a className={styles.link} href={item.href} target="_blank" rel="noopener noreferrer">
      {item.label}
    </a>
  )
}

type Props = {
  /** False once the URL has left /about — the overlay then fades out. */
  open: boolean
  /** Called when the fade-out has finished, so SiteShell can unmount it. */
  onExited: () => void
}

/** Rendered by SiteShell (not the /about page) so it can fade out after the route changes. */
export default function About({ open, onExited }: Props) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAbout(router)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, router])

  useEffect(() => {
    if (open) return
    const el = ref.current
    if (!el) return onExited()
    const anim = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: prefersReducedMotion() ? 0 : DURATION.base,
      easing: EASE,
      fill: 'forwards',
    })
    anim.onfinish = onExited
    // Reopened mid-fade: drop the fade and stay.
    return () => anim.cancel()
  }, [open, onExited])

  // The Close control is the site nav link (SiteShell), so this isn't aria-modal.
  return (
    <div
      ref={ref}
      className={styles.about}
      role="dialog"
      aria-labelledby="about-title"
      aria-hidden={!open || undefined}
      data-closing={!open || undefined}
    >
      <div className={styles.content}>
        <div className={styles.row}>
          <h1 id="about-title" className={styles.label}>
            Kish Patel
          </h1>
          <p>British Software Designer with over a decade of experience designing emerging consumer fintech.</p>
        </div>

        {roles.map(({ years, company }) => (
          <div key={company.label} className={styles.row}>
            <p className={styles.label}>{years}</p>
            <p>
              <Item item={company} />
            </p>
          </div>
        ))}

        <div className={styles.row}>
          <p className={styles.label}>
            Design help for
            <br />
            early-stage Founders
          </p>
          <ul>
            {founders.map((item) => (
              <li key={item.label}>
                <Item item={item} />
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.row}>
          <p className={styles.label}>Find me</p>
          <ul>
            {socials.map((item) => (
              <li key={item.label}>
                <Item item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
