// Server only: reads content/ at build time (getStaticProps). Never import from a component.
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { imageSize } from 'image-size'
import type { Project } from './projects'
import { isShaderName, shaders } from './shaders'

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

// 01-tide.md → order "01", id "tide". Files without a number prefix are ignored (drafts).
const FILE_PATTERN = /^(\d+)-([a-z0-9-]+)\.md$/

function fail(file: string, message: string): never {
  throw new Error(`content/projects/${file}: ${message}`)
}

function requiredString(data: Record<string, unknown>, key: string, file: string): string {
  const value = data[key]
  if (typeof value !== 'string' || !value.trim()) fail(file, `"${key}" is required`)
  return value.trim()
}

function optionalSize(data: Record<string, unknown>, key: string, file: string): number | undefined {
  const value = data[key]
  if (value === undefined) return undefined
  if (typeof value !== 'number' || value <= 0) fail(file, `"${key}" must be a positive number`)
  return value
}

/** The gallery projects, in filename order. */
export function getProjects(): Project[] {
  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => FILE_PATTERN.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

  const seen = new Set<string>()

  return files.map((file) => {
    const id = file.match(FILE_PATTERN)![2]
    if (seen.has(id)) fail(file, `another file already uses the name "${id}"`)
    seen.add(id)

    const { data } = matter(fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8'))

    const src = requiredString(data, 'image', file)
    if (!src.startsWith('/')) fail(file, `"image" must be a path under /public, e.g. /gallery/${id}.png`)
    const imagePath = path.join(PUBLIC_DIR, src)
    if (!fs.existsSync(imagePath)) fail(file, `image not found at public${src}`)

    let width = optionalSize(data, 'width', file)
    let height = optionalSize(data, 'height', file)
    if ((width === undefined) !== (height === undefined)) fail(file, 'set both "width" and "height", or neither')
    if (width === undefined || height === undefined) {
      const size = imageSize(fs.readFileSync(imagePath))
      if (!size.width || !size.height) fail(file, `couldn't read the size of public${src}`)
      width = size.width
      height = size.height
    }

    const shader = data.shader
    if (shader !== undefined && !isShaderName(shader)) {
      fail(file, `unknown shader "${String(shader)}" — use one of: ${Object.keys(shaders).join(', ')}`)
    }

    const project: Project = {
      id,
      name: requiredString(data, 'name', file),
      description: requiredString(data, 'description', file),
      src,
      width,
      height,
    }
    if (shader) project.shader = shader
    return project
  })
}
