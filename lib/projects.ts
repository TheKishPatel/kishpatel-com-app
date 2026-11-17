/** One gallery item. Written in content/projects/*.md and loaded by lib/content.ts. */
export type Project = {
  /** From the filename, without its number prefix: 01-tide.md → "tide". */
  id: string
  name: string
  /** One short sentence, shown under the image in the lightbox. */
  description: string
  /** Path under /public, e.g. /gallery/tide.png */
  src: string
  /** Display size — only the ratio matters. Defaults to the image's own size. */
  width: number
  height: number
}
