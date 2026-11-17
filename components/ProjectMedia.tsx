import Image from 'next/image'
import type { Project } from '../lib/projects'
import styles from './ProjectMedia.module.scss'

type Props = {
  project: Project
  sizes: string
  priority?: boolean
}

/** A project's image. Fills its positioned parent. */
export default function ProjectMedia({ project, sizes, priority }: Props) {
  return (
    <Image
      className={styles.image}
      src={project.src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
    />
  )
}
