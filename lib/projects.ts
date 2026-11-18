/** A run of plain text, or a link (written as [text](https://…) in the content file). */
export type TextPart = string | { text: string; href: string }

/** One gallery item. Written in content/projects/*.md and loaded by lib/content.ts. */
export type Project = {
  /** From the filename, without its number prefix: 01-tide.md → "tide". */
  id: string
  name: string
  /** One short sentence, shown under the image in the lightbox. May contain links; empty if none. */
  description: TextPart[]
  /** Path under /public, e.g. /gallery/tide.png */
  src: string
  /** An animated WebP or a GIF: served as-is, since next/image can't resize animations. */
  animated: boolean
  /** An .mp4: played muted on a loop with no controls. */
  video: boolean
  /** Display size — only the ratio matters. Defaults to the image's own size. */
  width: number
  height: number
}
