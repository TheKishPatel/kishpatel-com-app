import Image from 'next/image'
import { ShaderFill } from '@figma/expressive-components'
import type { Project } from '../lib/projects'
import { shaders } from '../lib/shaders'
import styles from './ProjectMedia.module.scss'

type Props = {
  project: Project
  sizes: string
  priority?: boolean
}

/** A project's image, with its shader (if any) drawn on top. Fills its positioned parent. */
export default function ProjectMedia({ project, sizes, priority }: Props) {
  return (
    <>
      <Image
        className={styles.image}
        src={project.src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
      />
      {project.shader && <ShaderFill className={styles.shader} shader={shaders[project.shader]} />}
    </>
  )
}
