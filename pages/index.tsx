import type { GetStaticProps } from 'next'
import { getProjects } from '../lib/content'
import type { SiteProps } from './_app'

export const getStaticProps: GetStaticProps<SiteProps> = async () => ({ props: { projects: await getProjects() } })

// The home page is SiteShell (rendered in _app), so it persists under /about.
export default function Home() {
  return null
}
