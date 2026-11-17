import type { Shader } from '@figma/expressive-components'
import {
  setup as grainDriftSetup,
  render as grainDriftRender,
  manifest as grainDriftManifest,
} from './custom-effects/grainDrift'

// Defined once at module level: ShaderFill re-initialises the WebGPU pipeline
// whenever the shader object's identity changes.
const grainDrift: Shader = {
  setup: grainDriftSetup,
  render: grainDriftRender,
  manifest: grainDriftManifest,
  params: {
    contrast: 1.0199999809265137,
    streakCrossSpeed: 0,
    grainFloor: 0.05999999865889549,
    streakEvolve: 0.09000000357627869,
    bloomSize: 0.5,
    grainAmount: 0.029999999329447746,
    swaySpeed: 0,
    streakLength: 355,
    timeScale: 1,
    showSurge: true,
    saturation: 0.8100000023841858,
    showGrain: true,
    orbitX: 0.699999988079071,
    stop4: { r: 0.6745098233222961, g: 0.6549019813537598, b: 1, a: 1 },
    stop5: { r: 0.5137255191802979, g: 0.46666666865348816, b: 1, a: 1 },
    sizeSpread: 0.15000000596046448,
    stop2: { r: 0.25882354378700256, g: 0.16862745583057404, b: 0.7529411911964417, a: 1 },
    intensity: 0.9599999785423279,
    surgePeriod: 9.5,
    splitY: 0.14499999582767487,
    trailLength: 1.149999976158142,
    paused: false,
    orbitY: 0.3799999952316284,
    angleDeg: 90,
    count: 5,
    surgeAmount: 0.47999998927116394,
    streakWidth: 8,
    preset: 2,
    swayDeg: 0,
    showTrails: true,
    showBlooms: true,
    grainSize: 1,
    timeOffset: 0,
    splitX: -0.14499999582767487,
    stop1: { r: 0.3803921639919281, g: 0.29019609093666077, b: 0.9490196108818054, a: 1 },
    baseTone: 0.20000000298023224,
    decay: 0.4000000059604645,
    alternate: true,
    noiseAmount: 0,
    stop3: { r: 0.8196078538894653, g: 0.8117647171020508, b: 1, a: 1 },
    showStreaks: true,
    showChannelSplit: true,
    streakSpeed: 0.10000000149011612,
    streakAmount: 0.14999999105930328,
    taps: 4,
    bloomSpeed: 0.27000001072883606,
  },
}

/**
 * Shaders a project can name in its frontmatter (`shader: grain-drift`).
 * Shaders hold functions, so pages pass the name and the client looks it up here.
 */
export const shaders = {
  'grain-drift': grainDrift,
} satisfies Record<string, Shader>

export type ShaderName = keyof typeof shaders

export const isShaderName = (value: unknown): value is ShaderName =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(shaders, value)
