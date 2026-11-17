import type { GalleryView } from './Gallery'
import styles from './ViewToggle.module.scss'

type Block = [left: number, top: number, width: number, height: number]

// Icon shapes from the Figma "View settings" frame (30 × 16).
const icons: Record<GalleryView, Block[]> = {
  gallery: [
    [0, 0, 16, 16],
    [17, 0, 9, 16],
    [27, 0, 3, 16],
  ],
  grid: [
    [0, 0, 6, 6],
    [8, 0, 6, 12],
    [8, 14, 6, 2],
    [16, 6, 6, 10],
    [16, 0, 6, 4],
    [0, 8, 6, 8],
    [24, 9, 6, 7],
    [24, 0, 6, 6],
  ],
}

const labels: Record<GalleryView, string> = { gallery: 'Gallery view', grid: 'Grid view' }

type Props = {
  view: GalleryView
  onChange: (view: GalleryView) => void
}

export default function ViewToggle({ view, onChange }: Props) {
  return (
    <div className={styles.toggle} role="group" aria-label="Layout">
      {(Object.keys(icons) as GalleryView[]).map((option) => (
        <button
          key={option}
          type="button"
          className={styles.option}
          aria-label={labels[option]}
          aria-pressed={view === option}
          onClick={() => onChange(option)}
        >
          {icons[option].map(([left, top, width, height], i) => (
            <span key={i} className={styles.block} style={{ left, top, width, height }} />
          ))}
        </button>
      ))}
    </div>
  )
}
