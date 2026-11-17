---
name: import-gallery-images
description: Import images into the site's gallery (public/gallery + content/projects) — from Figma frames or local files. Use whenever the user asks to add, import, replace or update project images or gallery projects, or shares a Figma link "to add as projects".
---

# Importing gallery images

Every gallery image is a **WebP at quality 90, made from a 2x PNG**. Never ship the
PNG, a 1x export, or the WebP straight from Figma.

## 1. Get 2x PNGs

- **From Figma:** one export per project frame, in left-to-right order on the canvas.
  `create_session`, then `get_metadata` on the node to list the frames, then
  `download_assets` on each frame with `defaultScale: 2` (default format, PNG). Use the
  `export` URL (the whole frame), not `rawImages`. URLs expire, so download right away.
- **From local files:** use them as they are if they're already 2x the display size;
  otherwise ask for larger originals rather than upscaling.

Save to `public/gallery/<kebab-name>.png`, named after the project (not "image 3").

## 2. Convert to WebP 90, then delete the PNGs

```bash
cd public/gallery
for f in *.png; do cwebp -quiet -q 90 -m 6 -metadata none "$f" -o "${f%.png}.webp"; done
rm *.png
```

`cwebp` is at `/opt/homebrew/bin/cwebp` (`brew install webp` if it's missing). Look at
one result (Read the .webp) to check it.

## 3. Add a content file per project

`content/projects/NN-<id>.md` (format in `content/README.md`):

```md
---
name: Project Name
description: One short sentence.
image: /gallery/<kebab-name>.webp
---
```

- Leave out `width`/`height`; they're read from the image.
- Quote a `description` that contains `: ` (YAML), or rephrase it.
- Names come from the Figma frame names; tell the user which names and descriptions
  you wrote yourself so they can edit them.
- When replacing projects, delete the old `.md` files and their images.

## 4. Check

Reload the gallery (desktop 1512×843 and phone width), open one in the lightbox, and
confirm every image loads. `ProjectMedia` serves them through next/image at quality 90,
with `sizes` worked out from each image's ratio (`itemSizes` in Gallery.tsx).
