import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import localFont from 'next/font/local'
import SiteShell from '../components/SiteShell'
import type { Project } from '../lib/projects'

// Geist Mono by Vercel (SIL Open Font License) — fonts/GeistMono/OFL.txt
const geistMono = localFont({
  src: '../fonts/GeistMono/GeistMono-Medium.woff2',
  weight: '500',
  style: 'normal',
  variable: '--font-geist-mono',
  display: 'swap',
})

/** Props every page passes to the shell (from getStaticProps). */
export type SiteProps = { projects: Project[] }

const description = 'British Software Designer with over a decade of experience designing emerging consumer fintech.'

export default function App({ Component, pageProps }: AppProps<Partial<SiteProps>>) {
  return (
    <>
      <Head>
        <title>Kish Patel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <meta property="og:title" content="Kish Patel" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kish Patel" />
        <meta name="twitter:description" content={description} />
      </Head>
      <style jsx global>{`
        :root {
          --font-geist-mono: ${geistMono.style.fontFamily};
        }
      `}</style>
      {/* Pages without getStaticProps (404, error) get an empty gallery. */}
      <SiteShell projects={pageProps.projects ?? []}>
        <Component {...pageProps} />
      </SiteShell>
    </>
  )
}
