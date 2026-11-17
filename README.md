# kishpatel.com

Kish Patel's portfolio: a side-scrolling gallery of projects (with a grid view), a
lightbox for each project, and an About page that opens over the gallery. Built with
Next.js 14 (pages router), React 18 and SCSS modules, from a Figma design.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build; also checks every project file
npm run lint
```

## Edit the projects

Projects are Markdown files in `content/projects/`, one per project, with images in
`public/gallery/`. The number in the filename sets the order. See
[content/README.md](content/README.md) for the fields, links in descriptions, drafts
and reordering.

Images are **WebP at quality 90, converted from a 2x PNG export**. The steps (export
from Figma, convert with `cwebp`, add the file) are in
[.claude/skills/import-gallery-images/SKILL.md](.claude/skills/import-gallery-images/SKILL.md),
which Claude Code follows when asked to import images.

A mistake in a project file (missing field, bad link, missing image, misnamed file)
stops the build with the file name and what to fix.

## Where things are

| Path | What |
| --- | --- |
| `components/SiteShell.tsx` | Logo, nav (About ↔ Close), gallery, footer; owns the overlays |
| `components/Gallery.tsx` | Side-scrolling strip and grid, drag and wheel scrolling, hover label |
| `components/Lightbox.tsx` | Zoom-in viewer with swipe, keyboard and tap-to-close |
| `components/About.tsx` | About overlay content (roles, founders, socials) |
| `components/LogoMark.tsx` | The K logo and its hover morph |
| `lib/content.ts` | Reads and checks `content/projects/` at build time |
| `lib/motion.ts`, `styles/_tokens.scss` | Easing, durations, colours, spacing |

## Motion

One easing curve, `cubic-bezier(0.2, 0.8, 0, 1)`, and three durations: 150ms, 250ms
and 500ms. They're defined twice, in `lib/motion.ts` for JavaScript and in
`styles/_tokens.scss` for CSS, so change both together. Everything respects
`prefers-reduced-motion`.

## Font

Paper Mono, under the SIL Open Font License (`fonts/PaperMono/OFL.txt`).
