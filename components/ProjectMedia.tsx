import Image from 'next/image'
import type { Project } from '../lib/projects'
import styles from './ProjectMedia.module.scss'

type Props = {
  project: Project
  sizes: string
  priority?: boolean
  /** Called once the media has a frame ready to paint (decoded, not just downloaded). */
  onReady?: () => void
}

type FrameCallbackVideo = HTMLVideoElement & { requestVideoFrameCallback?: (callback: () => void) => number }

/** A project's image or video. Fills its positioned parent. */
export default function ProjectMedia({ project, sizes, priority, onReady }: Props) {
  if (project.video) {
    return (
      <video
        onLoadedData={
          onReady &&
          ((e) => {
            // loadeddata means a frame exists; wait until one is actually composited.
            const video = e.currentTarget as FrameCallbackVideo
            if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(onReady)
            else requestAnimationFrame(() => requestAnimationFrame(onReady))
          })
        }
        className={`${styles.image} ${styles.video}`}
        src={project.src}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        preload={priority ? 'auto' : 'metadata'}
        aria-hidden
      />
    )
  }

  return (
    <Image
      className={styles.image}
      src={project.src}
      alt=""
      fill
      sizes={sizes}
      // Above the default 75: flat colour and fine icon lines show compression blocks.
      quality={90}
      unoptimized={project.animated}
      priority={priority}
      draggable={false}
      onLoad={
        onReady &&
        ((e) => {
          e.currentTarget
            .decode()
            .catch(() => {})
            .then(onReady)
        })
      }
    />
  )
}
