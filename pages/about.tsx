import type { GetStaticProps } from 'next'
import Head from 'next/head'
import About from '../components/About'
import { getProjects } from '../lib/content'
import type { SiteProps } from './_app'

// /about also loads the projects, so the gallery is behind it on a direct visit.
export const getStaticProps: GetStaticProps<SiteProps> = async () => ({ props: { projects: getProjects() } })

// Rendered on top of the home page (SiteShell in _app).
export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About — Kish Patel</title>
      </Head>
      <About />
    </>
  )
}
