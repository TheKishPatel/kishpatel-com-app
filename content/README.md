# Content

## Gallery projects — `projects/`

One Markdown file per project. The number at the start of the filename sets the
order in the gallery; the rest becomes the project's id.

```
projects/
  01-tide.md
  02-lagoon.md
```

```md
---
name: Project One                  # shown above the cursor and in the lightbox
description: One short sentence.   # optional: shown under the image in the lightbox
image: /gallery/tide.webp          # a file in /public (WebP 90 from a 2x PNG)
width: 850                         # optional: display size (only the ratio
height: 651                        # matters); defaults to the image's own size
---
```

- **Link from a description:** write `[text](https://…)`, and wrap the whole
  description in double quotes:
  `description: "Shot for Lightyear's [earnings series](https://lightyear.com)."`
  Links open in a new tab. Only full `https://` addresses work; anything else fails the build.
- **Add a project:** put the image in `public/gallery/`, add a numbered file here.
  Images are WebP at quality 90, converted from a 2x PNG — see
  `.claude/skills/import-gallery-images/SKILL.md` for the steps.
- **Add a video:** an `.mp4` (H.264, no audio, `-crf 16 -preset veryslow -movflags +faststart`)
  works as `image`. It plays muted on a loop with no controls. Set `width` and `height`
  to its pixel size — they can't be read from the file.
- **Reorder:** renumber the files.
- **Hide one (draft):** drop the number prefix, e.g. `tide.md` — unnumbered files are skipped.

The site reads these at build time, so changes go live on the next deploy. In
`npm run dev`, refresh the page to see an edit. A missing field or image fails the
build with the file name and what's wrong.
