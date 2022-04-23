import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.scss'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Kish Patel</title>
        <link rel="icon" href="/favicon.ico" />
        <meta content="Hey! I'm Kish, a Designer, Design Leader and wannabe Software Engineer from London, UK." name="description" />
        <meta content="Kish Patel" property="og:title" />
        <meta content="Hey! I'm Kish, a Designer, Design Leader and wannabe Software Engineer from London, UK." property="og:description" />
        <meta content="Kish Patel" property="twitter:title" />
        <meta content="Hey! I'm Kish, a Designer, Design Leader and wannabe Software Engineer from London, UK." property="twitter:description" />
        <meta property="og:type" content="website" />
        <meta content="summary_large_image" name="twitter:card" />
      </Head>

      <main className={styles.main}>

        <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M33 0L5 0L16 16L33 0Z" fill="#0019BF" fillOpacity="0.7"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M5 0L0 32H32L5 0Z" fill="#0019BF"/>
        </svg>


        <h1 className={`${styles.title_lead} ${styles.container}`}>
          Design, product craft &amp; leadership in both
        </h1>

        <div className={`${styles.container} ${styles.container_grid}`}>
          <div className={styles.col_photo}>
            <Image 
              src="/us.jpg" 
              alt="Vercel Logo" 
              layout="intrinsic"
              width={736}
              height={982}
            />
          </div>

          <div className={styles.col_spacer}>
            
          </div>

          <div className={styles.col_content}>
            <p>
              Hi there! I&apos;m <a href="https://twitter.com/TheKishPatel/" target="_blank" rel="noopener noreferrer">Kish</a> — a Designer, Design Leader and wannabe Software Engineer born, raised and based in London, UK. 
            </p>

            <p>
              I&apos;m currently leading Design at <a href="https://golightyear.com/" target="_blank" rel="noopener noreferrer">Lightyear</a>, a new investment brokerage in Europe — one without all the unnecessary fees and barriers and that actually helps it&apos;s customers become better investors.
            </p>

            <p>
              Before Lightyear, I was the first Designer then Head of Design at <a href="https://withplum.com/" target="_blank" rel="noopener noreferrer">Plum</a>, launching them on the App Stores, establishing a Design Culture, creating a Design System, building a team and all the million other things you do when you&apos;re part of company that goes from 10 to 110 people in three years.
            </p>

            <p>
              Prior to that, I joined <a href="https://wise.com/" target="_blank" rel="noopener noreferrer">Wise</a> (formerly TransferWise) in 2014 as their first Product Designer, spending four years working across most, if not all of the consumer product across Web and Mobile.
            </p>

            <p>
              So yeah — <i>a lottttt</i> of design for fintech products. 
            </p>

            <p>
              Recently, I&apos;ve started to automate much of the monkey work involved in the process and sharing it with the community, starting with Amountify — a Figma plugin for entering random currency amounts into your designs. 
            </p>

            <p>
            When I had a lot more free time, I had a few side projects on the go. One that&apos;s still out there and used by many is <a href="https://apps.apple.com/gb/app/dubbledecker/id806904237" target="_blank" rel="noopener noreferrer">Dubbledecker</a> — an app I built to learn Objective-C and iOS development back in 2014. I later made a very small and pointless app called <a href="https://apps.apple.com/gb/app/random-generate-random-hex-colours/id1046225555" target="_blank" rel="noopener noreferrer">Random</a>, to learn Swift and how to build custom page transitions. 5 years on, I&apos;ve found it to be an effective sensory toy for young children <i>(don&apos;t ask)</i>.
            </p>
          </div>
        </div>

      </main>

      <footer className={`${styles.footer} ${styles.container}`}>
        <small>
          You can find me in other places on the internet, such as <a href="http://twitter.com/TheKishPatel" target="_blank" rel="noopener noreferrer">Twitter</a>, Figma, Github or LinkedIn. Alternatively, reach out to me directly at contact@kishpatel.com.
        </small>

        <small>
          This site was built with Next.js/React and deployed to Vercel. Overkill? Probably. Take a look at the code here.
        </small>
      </footer>
    </div>
  )
}

export default Home
