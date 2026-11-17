import { useEffect } from 'react'
import { useRouter } from 'next/router'
import type { NextRouter } from 'next/router'
import { useScrollLock } from '../lib/hooks'
import styles from './About.module.scss'

type LinkItem = { label: string; href?: string }

const roles: { years: string; company: LinkItem }[] = [
  { years: '2021-', company: { label: 'Lightyear', href: 'https://lightyear.com' } },
  { years: '2018-2021', company: { label: 'Plum', href: 'https://withplum.com' } },
  { years: '2014-2018', company: { label: 'Wise', href: 'https://wise.com' } },
]

const founders: LinkItem[] = [
  { label: 'Sunsave', href: 'https://www.sunsave.energy' },
  { label: 'Marloo' }, // TODO: add URL
  { label: 'Sophic' }, // TODO: add URL
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

export default function About() {
  const router = useRouter()

  useScrollLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAbout(router)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  // The Close control is the site nav link (SiteShell), so this isn't aria-modal.
  return (
    <div className={styles.about} role="dialog" aria-labelledby="about-title">
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
