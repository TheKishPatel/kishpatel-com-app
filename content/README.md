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
description: One short sentence.   # shown under the image in the lightbox
image: /gallery/tide.png           # a file in /public
width: 850                         # optional: display size (only the ratio
height: 651                        # matters); defaults to the image's own size
---
```

- **Add a project:** put the image in `public/gallery/`, add a numbered file here.
- **Reorder:** renumber the files.
- **Hide one (draft):** drop the number prefix, e.g. `tide.md` — unnumbered files are skipped.

The site reads these at build time, so changes go live on the next deploy. In
`npm run dev`, refresh the page to see an edit. A missing field or image fails the
build with the file name and what's wrong.
