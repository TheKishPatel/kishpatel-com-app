import type { GetStaticProps } from 'next'
import Head from 'next/head'
import { getProjects } from '../lib/content'
import type { SiteProps } from './_app'

// /about also loads the projects, so the gallery is behind it on a direct visit.
export const getStaticProps: GetStaticProps<SiteProps> = async () => ({ props: { projects: getProjects() } })

// The overlay itself is rendered by SiteShell (in _app), which shows it on this
// route and fades it out after leaving — this page only sets the title.
export default function AboutPage() {
  return (
    <Head>
      <title>About — Kish Patel</title>
    </Head>
  )
}
