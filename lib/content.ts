// Server only: reads content/ at build time (getStaticProps). Never import from a component.
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { imageSizeFromFile } from 'image-size/fromFile'
import type { Project, TextPart } from './projects'

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

// 01-tide.md → order "01", id "tide". Files without a number prefix are drafts and skipped.
const NUMBERED = /^\d+-/
const FILE_PATTERN = /^(\d+)-([a-z0-9-]+)\.md$/

function fail(file: string, message: string): never {
  throw new Error(`content/projects/${file}: ${message}`)
}

function requiredString(data: Record<string, unknown>, key: string, file: string): string {
  const value = data[key]
  if (typeof value !== 'string' || !value.trim()) fail(file, `"${key}" is required`)
  return value.trim()
}

/** GIFs, and WebPs whose header sets the animation flag (VP8X chunk, bit 1 of byte 20). */
function isAnimated(imagePath: string): boolean {
  if (imagePath.endsWith('.gif')) return true
  if (!imagePath.endsWith('.webp')) return false
  const header = Buffer.alloc(21)
  const fd = fs.openSync(imagePath, 'r')
  try {
    fs.readSync(fd, header, 0, header.length, 0)
  } finally {
    fs.closeSync(fd)
  }
  return header.toString('ascii', 12, 16) === 'VP8X' && (header[20] & 0x02) !== 0
}

/** Empty or missing → "". */
function optionalString(data: Record<string, unknown>, key: string, file: string): string {
  const value = data[key]
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') fail(file, `"${key}" must be text — wrap it in double quotes`)
  return value.trim()
}

// [text](url) — the only markup descriptions support.
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Splits a description into plain text and links. Anything else stays as written. */
function parseLinks(value: string, file: string): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const match of Array.from(value.matchAll(LINK))) {
    const [whole, text, href] = match
    const start = match.index ?? 0
    if (start > last) parts.push(value.slice(last, start))
    let url: URL | undefined
    try {
      url = new URL(href)
    } catch {
      // handled below
    }
    if (!url || url.protocol !== 'https:') {
      fail(file, `the link "${href}" in "description" must be a full https:// address`)
    }
    parts.push({ text: text.trim(), href })
    last = start + whole.length
  }
  if (last < value.length) parts.push(value.slice(last))
  // A "](" left in the plain text is a link that didn't parse (e.g. a space in the URL).
  if (parts.some((p) => typeof p === 'string' && p.includes(']('))) {
    fail(file, 'a link in "description" is malformed — write it as [text](https://example.com)')
  }
  return parts
}

function optionalSize(data: Record<string, unknown>, key: string, file: string): number | undefined {
  const value = data[key]
  if (value === undefined) return undefined
  if (typeof value !== 'number' || value <= 0) fail(file, `"${key}" must be a positive number`)
  return value
}

/** The gallery projects, in filename order. */
export async function getProjects(): Promise<Project[]> {
  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => NUMBERED.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

  // A numbered file is meant to be live — don't let a typo in its name hide it.
  for (const file of files) {
    if (!FILE_PATTERN.test(file)) {
      fail(file, 'name must be a number, a dash, then lowercase letters, numbers and dashes, e.g. 07-new-project.md')
    }
  }

  const seen = new Set<string>()

  return Promise.all(files.map(async (file) => {
    const id = file.match(FILE_PATTERN)![2]
    if (seen.has(id)) fail(file, `another file already uses the name "${id}"`)
    seen.add(id)

    let data: Record<string, unknown>
    try {
      data = matter(fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8')).data
    } catch (error) {
      const line = (error as { mark?: { line?: number } }).mark?.line
      fail(
        file,
        `couldn't read the fields${line === undefined ? '' : ` (around line ${line + 1})`}. ` +
          'Wrap a value in double quotes if it starts with [ or contains ": " — ' +
          'e.g. description: "[Go](https://lightyear.com)"',
      )
    }

    const src = requiredString(data, 'image', file)
    if (!src.startsWith('/')) fail(file, `"image" must be a path under /public, e.g. /gallery/${id}.png`)
    const imagePath = path.join(PUBLIC_DIR, src)
    if (!fs.existsSync(imagePath)) fail(file, `image not found at public${src}`)

    let width = optionalSize(data, 'width', file)
    let height = optionalSize(data, 'height', file)
    if ((width === undefined) !== (height === undefined)) fail(file, 'set both "width" and "height", or neither')
    if (width === undefined || height === undefined) {
      // Reads only the file's header.
      const size = await imageSizeFromFile(imagePath)
      if (!size.width || !size.height) fail(file, `couldn't read the size of public${src}`)
      width = size.width
      height = size.height
    }

    return {
      id,
      name: requiredString(data, 'name', file),
      description: parseLinks(optionalString(data, 'description', file), file),
      src,
      animated: isAnimated(imagePath),
      width,
      height,
    }
  }))
}
