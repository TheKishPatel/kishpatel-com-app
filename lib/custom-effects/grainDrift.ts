// Figma shader module "Grain drift" (CodeComponentId_32b6abe39f691273b6e27b92dc02ea53f4a1e1f9_2d9a674b40085809da46b6d12bc4b43ba1a9168b).
// Exported verbatim from the Figma design — do not hand-edit.
// @ts-nocheck

// Property metadata is only used in Figma Design, so this is a no-op.
function defineProperties(
  _component: unknown,
  _properties: unknown,
): void {}

export default function Effect() { }
export function setup(device, frame) {
    var wgsl = `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  frameData: vec4f,
  inputDimsData: vec4f,
  preset: vec4f,
  stop1: vec4f,
  stop2: vec4f,
  stop3: vec4f,
  stop4: vec4f,
  stop5: vec4f,
  showBlooms: vec4f,
  showTrails: vec4f,
  showChannelSplit: vec4f,
  showGrain: vec4f,
  showStreaks: vec4f,
  showSurge: vec4f,
  count: vec4f,
  orbitX: vec4f,
  orbitY: vec4f,
  bloomSize: vec4f,
  sizeSpread: vec4f,
  alternate: vec4f,
  intensity: vec4f,
  baseTone: vec4f,
  bloomSpeed: vec4f,
  trailLength: vec4f,
  decay: vec4f,
  taps: vec4f,
  surgePeriod: vec4f,
  surgeAmount: vec4f,
  splitX: vec4f,
  splitY: vec4f,
  grainAmount: vec4f,
  grainSize: vec4f,
  grainFloor: vec4f,
  streakAmount: vec4f,
  streakLength: vec4f,
  streakWidth: vec4f,
  angleDeg: vec4f,
  swayDeg: vec4f,
  swaySpeed: vec4f,
  streakSpeed: vec4f,
  streakCrossSpeed: vec4f,
  streakEvolve: vec4f,
  saturation: vec4f,
  contrast: vec4f,
  noiseAmount: vec4f,
  timeScale: vec4f,
  paused: vec4f,
  timeOffset: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

fn hash21(pos: vec2f) -> f32 {

  var p = fract(pos * vec2f(123.34, 456.21));

  p += vec2f(dot(p, p + vec2f(45.32)));

  return fract(p.x * p.y);

}

fn vnoise(p: vec2f) -> f32 {

  let i = floor(p);

  let f0 = fract(p);

  let f = f0*f0*f0*(f0*(f0*6.0-vec2f(15.0))+vec2f(10.0));

  return mix(mix(hash21(i),hash21(i+vec2f(1.0,0.0)),f.x),mix(hash21(i+vec2f(0.0,1.0)),hash21(i+vec2f(1.0)),f.x),f.y);

}

fn rgb2lab(rgb: vec3f) -> vec3f {

  let c = pow(clamp(rgb,vec3f(0.0),vec3f(1.0)),vec3f(2.2));

  let l = pow(dot(c,vec3f(0.4122214708,0.5363325363,0.0514459929)),1.0/3.0);

  let m = pow(dot(c,vec3f(0.2119034982,0.6806995451,0.1073969566)),1.0/3.0);

  let s = pow(dot(c,vec3f(0.0883024619,0.2817188376,0.6299787005)),1.0/3.0);

  return vec3f(0.2104542553*l+0.793617785*m-0.0040720468*s,1.9779984951*l-2.428592205*m+0.4505937099*s,0.0259040371*l+0.7827717662*m-0.808675766*s);

}

fn lab2rgb(c: vec3f) -> vec3f {

  let l0 = c.x+0.3963377774*c.y+0.2158037573*c.z;

  let m0 = c.x-0.1055613458*c.y-0.0638541728*c.z;

  let s0 = c.x-0.0894841775*c.y-1.2914855480*c.z;

  let l = l0*l0*l0; let m = m0*m0*m0; let s = s0*s0*s0;

  return pow(clamp(vec3f(4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s),vec3f(0.0),vec3f(1.0)),vec3f(1.0/2.2));

}

fn brandRamp(value: f32, colors: array<vec3f,5>) -> vec3f {

  let a = abs(value);

  let t = (1.0-abs((a-2.0*floor(a/2.0))-1.0))*4.0;

  let i = u32(min(floor(t),3.0));

  return lab2rgb(mix(colors[i],colors[i+1u],t-f32(i)));

}

struct GrainConfig {

  bloom: vec4f,

  bloom2: vec4f,

  trail: vec4f,

  surgeSplit: vec4f,

  grain: vec4f,

  streak: vec4f,

  wind: vec4f,

  clock: f32,

  bloomsOn: f32,

  grainOn: f32,

  streakOn: f32,

}

fn mesh(p: vec2f, t: f32, c: GrainConfig) -> f32 {

  var v = 0.0;

  for(var i = 0; i < 8; i++) {

    if(f32(i)>=c.bloom.x) {break;}

    let k = f32(i);

    let center = vec2f(c.bloom.y*sin(t*(0.7+0.13*k)+k*2.1),c.bloom.z*cos(t*(0.5+0.17*k)+k*1.3));

    let sgn = select(1.0,-1.0,c.bloom2.y>0.5 && (i%2)==1);

    v += sgn*0.5*exp(-dot(p-center,p-center)/(c.bloom.w+c.bloom2.x*k));

  }

  return v;

}

fn shade(p: vec2f, frag: vec2f, ss: f32, px: f32, c: GrainConfig, colors: array<vec3f,5>) -> vec3f {

  var v = vec3f(0.0);

  var wsum = 0.0;

  let j = hash21(frag+vec2f(ss*7.31,3.17));

  for(var i = 0; i < 16; i++) {

    if(f32(i)>=c.trail.x) {break;}

    let oldTime = c.clock-(f32(i)+j)/c.trail.x*c.trail.y;

    let t = (oldTime+c.surgeSplit.x*c.trail.w/6.28318530718*sin(6.28318530718*oldTime/c.trail.w))*c.grain.w;

    let w = exp(-f32(i)*c.trail.z);

    let split = c.surgeSplit.yz;

    v += w*vec3f(mesh(p-split,t,c),mesh(p,t,c),mesh(p+split,t,c));

    wsum += w;

  }

  v *= c.bloomsOn/wsum;

  let cell = floor(p/(px*c.grain.y));

  let n = hash21(cell)+hash21(cell*1.7+vec2f(31.0))-1.0;

  let a = radians(c.wind.x+c.wind.y*sin(c.clock*c.wind.z));

  // GLSL mat2(cos,-sin,sin,cos) is column-major: clockwise rotation.

  let w2 = vec2f(cos(a)*p.x+sin(a)*p.y,-sin(a)*p.x+cos(a)*p.y);

  let sp = vec2f(w2.x/(c.streak.y*px)-c.clock*c.streak.w,w2.y/(c.streak.z*px)-c.clock*c.wind.w);

  let ev = c.clock*c.surgeSplit.w;

  let streak = mix(vnoise(sp+vec2f(floor(ev)*37.7)),vnoise(sp+vec2f((floor(ev)+1.0)*37.7)),smoothstep(0.0,1.0,fract(ev)))-0.5;

  let t3 = vec3f(c.bloom2.w)+v*c.bloom2.z+vec3f(n*c.grain.x*c.grainOn*(c.grain.z+smoothstep(0.0,0.3,abs(v.y)))+streak*c.streak.x*c.streakOn);

  return vec3f(brandRamp(t3.r,colors).r,brandRamp(t3.g,colors).g,brandRamp(t3.b,colors).b);

}

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment fn fs_main(@location(0) outputUv_in: vec2f) -> @location(0) vec4f {
  let time = u.frameData.x;
  let outputUv = outputUv_in;
  let dims = max(u.frameData.yz, vec2f(1.0));
  let inputDims = max(u.inputDimsData.xy, vec2f(1.0));
  let inputTexel = vec2f(1.0) / inputDims;
  let uv = outputUv;
  // texel and aspect are input-relative to match uv. Zoom fills rescale texel
  // alongside their uv redefinition below (see zoomLocal).
  let texel = inputTexel;
  let aspect = inputDims.x / max(inputDims.y, 1.0);
  // preset: 0=indigo, 1=orchid, 2=tide, 3=lagoon, 4=ember, 5=dusk
  let preset = i32(u.preset.x + 0.5);
  let stop1 = u.stop1;
  let stop2 = u.stop2;
  let stop3 = u.stop3;
  let stop4 = u.stop4;
  let stop5 = u.stop5;
  let showBlooms = u.showBlooms.x >= 0.5;
  let showTrails = u.showTrails.x >= 0.5;
  let showChannelSplit = u.showChannelSplit.x >= 0.5;
  let showGrain = u.showGrain.x >= 0.5;
  let showStreaks = u.showStreaks.x >= 0.5;
  let showSurge = u.showSurge.x >= 0.5;
  let count = u.count.x;
  let orbitX = u.orbitX.x;
  let orbitY = u.orbitY.x;
  let bloomSize = u.bloomSize.x;
  let sizeSpread = u.sizeSpread.x;
  let alternate = u.alternate.x >= 0.5;
  let intensity = u.intensity.x;
  let baseTone = u.baseTone.x;
  let bloomSpeed = u.bloomSpeed.x;
  let trailLength = u.trailLength.x;
  let decay = u.decay.x;
  let taps = u.taps.x;
  let surgePeriod = u.surgePeriod.x;
  let surgeAmount = u.surgeAmount.x;
  let splitX = u.splitX.x;
  let splitY = u.splitY.x;
  let grainAmount = u.grainAmount.x;
  let grainSize = u.grainSize.x;
  let grainFloor = u.grainFloor.x;
  let streakAmount = u.streakAmount.x;
  let streakLength = u.streakLength.x;
  let streakWidth = u.streakWidth.x;
  let angleDeg = u.angleDeg.x;
  let swayDeg = u.swayDeg.x;
  let swaySpeed = u.swaySpeed.x;
  let streakSpeed = u.streakSpeed.x;
  let streakCrossSpeed = u.streakCrossSpeed.x;
  let streakEvolve = u.streakEvolve.x;
  let saturation = u.saturation.x;
  let contrast = u.contrast.x;
  let noiseAmount = u.noiseAmount.x;
  let timeScale = u.timeScale.x;
  let paused = u.paused.x >= 0.5;
  let timeOffset = u.timeOffset.x;
  let colors = array<vec3f,5>(rgb2lab(stop1.rgb),rgb2lab(stop2.rgb),rgb2lab(stop3.rgb),rgb2lab(stop4.rgb),rgb2lab(stop5.rgb));
  let c = GrainConfig(vec4f(count,orbitX,orbitY,bloomSize),vec4f(sizeSpread,select(0.0,1.0,alternate),intensity,baseTone),vec4f(select(1.0,taps,showTrails),select(0.0,trailLength,showTrails),decay,surgePeriod),vec4f(select(0.0,surgeAmount,showSurge),select(0.0,splitX,showChannelSplit),select(0.0,splitY,showChannelSplit),streakEvolve),vec4f(grainAmount,grainSize,grainFloor,bloomSpeed),vec4f(streakAmount,streakLength,streakWidth,streakSpeed),vec4f(angleDeg,swayDeg,swaySpeed,streakCrossSpeed),time+timeOffset,select(0.0,1.0,showBlooms),select(0.0,1.0,showGrain),select(0.0,1.0,showStreaks));
  let p = vec2f((uv.x-0.5)*aspect,0.5-uv.y);
  let px = 1.0/dims.y;
  // Use point-space fragment positions for stable stipple and dither at all render scales.
  let frag = vec2f(uv.x*dims.x,(1.0-uv.y)*dims.y);
  var rgb = shade(p+vec2f(0.125,0.375)*px,frag,0.0,px,c,colors);
  rgb += shade(p+vec2f(-0.375,0.125)*px,frag,1.0,px,c,colors);
  rgb += shade(p+vec2f(0.375,-0.125)*px,frag,2.0,px,c,colors);
  rgb += shade(p+vec2f(-0.125,-0.375)*px,frag,3.0,px,c,colors);
  rgb *= 0.25;
  rgb = mix(vec3f(dot(rgb,vec3f(0.2126,0.7152,0.0722))),rgb,saturation);
  rgb = (rgb-vec3f(0.5))*contrast+vec3f(0.5);
  rgb += vec3f((hash21(frag)-0.5)*noiseAmount/255.0);
  return vec4f(clamp(rgb,vec3f(0.0),vec3f(1.0)),1.0);
}
`;
    frame.state.module = device.createShaderModule({ code: wgsl });
    frame.state.pipeline = null;
    frame.state.pipelineFormat = null;
    frame.state.quad = device.createBuffer({
        size: 6 * 4 * 4,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(frame.state.quad.getMappedRange()).set([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        -1, 1, 0, 0,
        1, -1, 1, 1,
        1, 1, 1, 0,
    ]);
    frame.state.quad.unmap();
    frame.state.uniformBuf = device.createBuffer({
        size: 768,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
}
export function render(device, frame) {
    var params = frame.params || {};
    function finiteNumber(value, fallback) {
        var num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }
    function numberParam(name, fallback) {
        return finiteNumber(params[name], fallback);
    }
    function boolParam(name, fallback) {
        if (typeof params[name] === 'boolean')
            return params[name] ? 1 : 0;
        return fallback ? 1 : 0;
    }
    function selectParam(name, count, fallbackIndex) {
        // A select is a numeric dropdown: params[name] is the chosen option's index.
        var index = Math.round(Number(params[name]));
        return Number.isFinite(index) && index >= 0 && index < count ? index : fallbackIndex;
    }
    function colorParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.r, fallback[0]),
            finiteNumber(value.g, fallback[1]),
            finiteNumber(value.b, fallback[2]),
            finiteNumber(value.a, fallback[3]),
        ];
    }
    function pointParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
        ];
    }
    function pointRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
        ];
    }
    function pointPointLineParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.x2, fallback[2]),
            finiteNumber(value.y2, fallback[3]),
        ];
    }
    function pointAngleRadiusParam(name, fallback) {
        var value = params[name] || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            finiteNumber(value.radius, fallback[2]),
            finiteNumber(value.angle, fallback[3]),
        ];
    }
    function colorPointParam(name, fallback) {
        var value = params[name] || {};
        var color = value.color || {};
        return [
            finiteNumber(value.x, fallback[0]),
            finiteNumber(value.y, fallback[1]),
            0,
            0,
            finiteNumber(color.r, fallback[2]),
            finiteNumber(color.g, fallback[3]),
            finiteNumber(color.b, fallback[4]),
            finiteNumber(color.a, fallback[5]),
        ];
    }
    function gradientParam(name, fallback) {
        var value = params[name] || {};
        var stops = Array.isArray(value.stops) && value.stops.length > 0 ? value.stops : fallback;
        // Layout: 8 stop colors (rgba), then 8 positions packed 4-per-vec4, then the live count.
        var out = new Array(44).fill(0);
        var count = Math.min(stops.length, 8);
        for (var i = 0; i < count; i++) {
            var stop = stops[i] || {};
            var color = stop.color || {};
            out[i * 4] = finiteNumber(color.r, 0);
            out[i * 4 + 1] = finiteNumber(color.g, 0);
            out[i * 4 + 2] = finiteNumber(color.b, 0);
            out[i * 4 + 3] = finiteNumber(color.a, 1);
            out[32 + i] = finiteNumber(stop.position, 0);
        }
        out[40] = count;
        return out;
    }
    var output = frame.output || {};
    var renderScale = Math.max(0.0001, finiteNumber(frame.renderScale, 1));
    var width = Math.max(1, finiteNumber(output.physicalWidth || output.width, 1) / renderScale);
    var height = Math.max(1, finiteNumber(output.physicalHeight || output.height, 1) / renderScale);
    // Accumulate a seconds clock so pause/resume and speed edits never jump.
    var now = finiteNumber(frame.time, 0);
    if (frame.state.playbackTime === undefined) {
        frame.state.playbackTime = 0;
        frame.state.lastClock = now;
    }
    var elapsed = Math.max(0, now - frame.state.lastClock) * 0.001;
    frame.state.lastClock = now;
    if (!boolParam("paused", false)) {
        frame.state.playbackTime += elapsed * Math.max(0, numberParam("timeScale", 1));
    }
    var time = frame.state.playbackTime;
    var inputWidth = width;
    var inputHeight = height;
    // Presets are deterministic across reloads. The extra Custom option makes
    // all five swatches editable without mutating host-owned property values.
    var palettes = [
        [0x614AF2, 0x422BC0, 0xD1CFFF, 0xACA7FF, 0x8377FF],
        [0x8E52DB, 0xA8145E, 0xEDE7FB, 0xE492AE, 0x996DDC],
        [0x4E8AD2, 0x410EBD, 0xE7F1FF, 0x92BEF6, 0x7D7DFD],
        [0x339995, 0x035838, 0xE0F5F3, 0xA6DCBE, 0x5CAFAA],
        [0xEEA737, 0xA53708, 0xFAEEDF, 0xF09F86, 0xD05A8B],
        [0x5226E5, 0xBC326F, 0xF3DBBD, 0xE98666, 0x996DDC],
    ];
    var paletteIndex = selectParam("preset", 7, 0);
    function paletteColor(index) {
        var hex = palettes[paletteIndex < 6 ? paletteIndex : 0][index];
        var rgb = [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, 1];
        return paletteIndex === 6 ? colorParam("stop" + (index + 1), rgb) : rgb;
    }
    device.queue.writeBuffer(frame.state.uniformBuf, 0, new Float32Array([
        time, width, height, 0,
        inputWidth, inputHeight, 0, 0,
        paletteIndex, 0, 0, 0,
        ...paletteColor(0),
        ...paletteColor(1),
        ...paletteColor(2),
        ...paletteColor(3),
        ...paletteColor(4),
        boolParam("showBlooms", true), 0, 0, 0,
        boolParam("showTrails", true), 0, 0, 0,
        boolParam("showChannelSplit", true), 0, 0, 0,
        boolParam("showGrain", true), 0, 0, 0,
        boolParam("showStreaks", true), 0, 0, 0,
        boolParam("showSurge", true), 0, 0, 0,
        numberParam("count", 5), 0, 0, 0,
        numberParam("orbitX", 0.28), 0, 0, 0,
        numberParam("orbitY", 0.3), 0, 0, 0,
        numberParam("bloomSize", 0.195), 0, 0, 0,
        numberParam("sizeSpread", 0.045), 0, 0, 0,
        boolParam("alternate", true), 0, 0, 0,
        numberParam("intensity", 0.86), 0, 0, 0,
        numberParam("baseTone", 0.2), 0, 0, 0,
        numberParam("bloomSpeed", 0.27), 0, 0, 0,
        numberParam("trailLength", 1.15), 0, 0, 0,
        numberParam("decay", 0.4), 0, 0, 0,
        numberParam("taps", 4), 0, 0, 0,
        numberParam("surgePeriod", 9.5), 0, 0, 0,
        numberParam("surgeAmount", 0.48), 0, 0, 0,
        numberParam("splitX", -0.145), 0, 0, 0,
        numberParam("splitY", 0), 0, 0, 0,
        numberParam("grainAmount", 0.03), 0, 0, 0,
        numberParam("grainSize", 1), 0, 0, 0,
        numberParam("grainFloor", 0.06), 0, 0, 0,
        numberParam("streakAmount", 0.39), 0, 0, 0,
        numberParam("streakLength", 305), 0, 0, 0,
        numberParam("streakWidth", 7), 0, 0, 0,
        numberParam("angleDeg", 90), 0, 0, 0,
        numberParam("swayDeg", 0), 0, 0, 0,
        numberParam("swaySpeed", 0), 0, 0, 0,
        numberParam("streakSpeed", 0.1), 0, 0, 0,
        numberParam("streakCrossSpeed", 0), 0, 0, 0,
        numberParam("streakEvolve", 0.09), 0, 0, 0,
        numberParam("saturation", 0.81), 0, 0, 0,
        numberParam("contrast", 1.02), 0, 0, 0,
        numberParam("noiseAmount", 0), 0, 0, 0,
        numberParam("timeScale", 1), 0, 0, 0,
        boolParam("paused", false), 0, 0, 0,
        numberParam("timeOffset", 0), 0, 0, 0,
    ]));
    var outputFormat = frame.output.format;
    if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
        frame.state.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: frame.state.module,
                entryPoint: 'vs_main',
                buffers: [{
                        arrayStride: 16,
                        attributes: [
                            { shaderLocation: 0, format: 'float32x2', offset: 0 },
                            { shaderLocation: 1, format: 'float32x2', offset: 8 },
                        ],
                    }],
            },
            fragment: {
                module: frame.state.module,
                entryPoint: 'fs_main',
                targets: [{ format: outputFormat }],
            },
            primitive: { topology: 'triangle-list' },
        });
        frame.state.pipelineFormat = outputFormat;
    }
    var bindGroup = device.createBindGroup({
        layout: frame.state.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: frame.state.uniformBuf } },
        ],
    });
    var encoder = device.createCommandEncoder();
    var pass = encoder.beginRenderPass({
        colorAttachments: [{
                view: frame.output.createView(),
                loadOp: 'clear',
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                storeOp: 'store',
            }],
    });
    pass.setPipeline(frame.state.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, frame.state.quad);
    pass.draw(6);
    pass.end();
    device.queue.submit([encoder.finish()]);
}
defineProperties(Effect, {
    "preset": {
        type: "number",
        label: "Color palette",
        defaultValue: 0,
        control: "select",
        options: [{ "value": 0, "label": "Indigo" }, { "value": 1, "label": "Orchid" }, { "value": 2, "label": "Tide" }, { "value": 3, "label": "Lagoon" }, { "value": 4, "label": "Ember" }, { "value": 5, "label": "Dusk" }, { "value": 6, "label": "Custom · use editable stops" }],
    },
    "stop1": {
        type: "color",
        label: "Custom stop 1",
        defaultValue: { "r": 0.3803921569, "g": 0.2901960784, "b": 0.9490196078, "a": 1 },
    },
    "stop2": {
        type: "color",
        label: "Custom stop 2",
        defaultValue: { "r": 0.2588235294, "g": 0.168627451, "b": 0.7529411765, "a": 1 },
    },
    "stop3": {
        type: "color",
        label: "Custom stop 3",
        defaultValue: { "r": 0.8196078431, "g": 0.8117647059, "b": 1, "a": 1 },
    },
    "stop4": {
        type: "color",
        label: "Custom stop 4",
        defaultValue: { "r": 0.6745098039, "g": 0.6549019608, "b": 1, "a": 1 },
    },
    "stop5": {
        type: "color",
        label: "Custom stop 5",
        defaultValue: { "r": 0.5137254902, "g": 0.4666666667, "b": 1, "a": 1 },
    },
    "showBlooms": {
        type: "boolean",
        label: "Layer · Blooms",
        defaultValue: true,
    },
    "showTrails": {
        type: "boolean",
        label: "Layer · Trails",
        defaultValue: true,
    },
    "showChannelSplit": {
        type: "boolean",
        label: "Layer · Channel split",
        defaultValue: true,
    },
    "showGrain": {
        type: "boolean",
        label: "Layer · Grain",
        defaultValue: true,
    },
    "showStreaks": {
        type: "boolean",
        label: "Layer · Streaks",
        defaultValue: true,
    },
    "showSurge": {
        type: "boolean",
        label: "Layer · Surge",
        defaultValue: true,
    },
    "count": {
        type: "number",
        label: "Bloom count",
        defaultValue: 5,
        control: "slider",
        min: 1,
        max: 8,
        step: 1,
    },
    "orbitX": {
        type: "number",
        label: "Orbit X",
        defaultValue: 0.28,
        control: "slider",
        min: 0,
        max: 1.2,
        step: 0.01,
    },
    "orbitY": {
        type: "number",
        label: "Orbit Y",
        defaultValue: 0.3,
        control: "slider",
        min: 0,
        max: 1.2,
        step: 0.01,
    },
    "bloomSize": {
        type: "number",
        label: "Bloom size",
        defaultValue: 0.195,
        control: "slider",
        min: 0.005,
        max: 0.5,
        step: 0.005,
    },
    "sizeSpread": {
        type: "number",
        label: "Size spread",
        defaultValue: 0.045,
        control: "slider",
        min: 0,
        max: 0.15,
        step: 0.005,
    },
    "alternate": {
        type: "boolean",
        label: "Alternate blooms",
        defaultValue: true,
    },
    "intensity": {
        type: "number",
        label: "Bloom intensity",
        defaultValue: 0.86,
        control: "slider",
        min: 0,
        max: 4,
        step: 0.01,
    },
    "baseTone": {
        type: "number",
        label: "Base tone",
        defaultValue: 0.2,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "bloomSpeed": {
        type: "number",
        label: "Bloom speed",
        defaultValue: 0.27,
        control: "slider",
        min: 0,
        max: 3,
        step: 0.01,
    },
    "trailLength": {
        type: "number",
        label: "Trail length",
        defaultValue: 1.15,
        control: "slider",
        min: 0,
        max: 6,
        step: 0.05,
    },
    "decay": {
        type: "number",
        label: "Trail decay",
        defaultValue: 0.4,
        control: "slider",
        min: 0,
        max: 1.5,
        step: 0.01,
    },
    "taps": {
        type: "number",
        label: "Trail taps",
        defaultValue: 4,
        control: "slider",
        min: 1,
        max: 16,
        step: 1,
    },
    "surgePeriod": {
        type: "number",
        label: "Surge period",
        defaultValue: 9.5,
        control: "slider",
        min: 2,
        max: 30,
        step: 0.5,
    },
    "surgeAmount": {
        type: "number",
        label: "Surge amount",
        defaultValue: 0.48,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "splitX": {
        type: "number",
        label: "Channel split X",
        defaultValue: -0.145,
        control: "slider",
        min: -0.2,
        max: 0.2,
        step: 0.005,
    },
    "splitY": {
        type: "number",
        label: "Channel split Y",
        defaultValue: 0,
        control: "slider",
        min: -0.2,
        max: 0.2,
        step: 0.005,
    },
    "grainAmount": {
        type: "number",
        label: "Grain amount",
        defaultValue: 0.03,
        control: "slider",
        min: 0,
        max: 0.6,
        step: 0.01,
    },
    "grainSize": {
        type: "number",
        label: "Grain size",
        defaultValue: 1,
        control: "slider",
        min: 1,
        max: 8,
        step: 0.5,
    },
    "grainFloor": {
        type: "number",
        label: "Grain floor",
        defaultValue: 0.06,
        control: "slider",
        min: 0,
        max: 1,
        step: 0.01,
    },
    "streakAmount": {
        type: "number",
        label: "Streak amount",
        defaultValue: 0.39,
        control: "slider",
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    "streakLength": {
        type: "number",
        label: "Streak length",
        defaultValue: 305,
        control: "slider",
        min: 5,
        max: 400,
        step: 5,
    },
    "streakWidth": {
        type: "number",
        label: "Streak width",
        defaultValue: 7,
        control: "slider",
        min: 0.5,
        max: 12,
        step: 0.1,
    },
    "angleDeg": {
        type: "number",
        label: "Streak angle",
        defaultValue: 90,
        control: "slider",
        min: -180,
        max: 180,
        step: 1,
    },
    "swayDeg": {
        type: "number",
        label: "Sway angle",
        defaultValue: 0,
        control: "slider",
        min: 0,
        max: 90,
        step: 1,
    },
    "swaySpeed": {
        type: "number",
        label: "Sway speed",
        defaultValue: 0,
        control: "slider",
        min: 0,
        max: 2,
        step: 0.01,
    },
    "streakSpeed": {
        type: "number",
        label: "Streak travel speed",
        defaultValue: 0.1,
        control: "slider",
        min: -6,
        max: 6,
        step: 0.01,
    },
    "streakCrossSpeed": {
        type: "number",
        label: "Streak cross speed",
        defaultValue: 0,
        control: "slider",
        min: -6,
        max: 6,
        step: 0.01,
    },
    "streakEvolve": {
        type: "number",
        label: "Streak evolution",
        defaultValue: 0.09,
        control: "slider",
        min: 0,
        max: 3,
        step: 0.01,
    },
    "saturation": {
        type: "number",
        label: "Finish saturation",
        defaultValue: 0.81,
        control: "slider",
        min: 0,
        max: 2,
        step: 0.01,
    },
    "contrast": {
        type: "number",
        label: "Finish contrast",
        defaultValue: 1.02,
        control: "slider",
        min: 0.5,
        max: 2,
        step: 0.01,
    },
    "noiseAmount": {
        type: "number",
        label: "Finish noise",
        defaultValue: 0,
        control: "slider",
        min: 0,
        max: 20,
        step: 0.5,
    },
    "timeScale": {
        type: "number",
        label: "Playback speed",
        defaultValue: 1,
        control: "slider",
        min: 0,
        max: 4,
        step: 0.05,
    },
    "paused": {
        type: "boolean",
        label: "Playback paused",
        defaultValue: false,
    },
    "timeOffset": {
        type: "number",
        label: "Playback time offset",
        defaultValue: 0,
        control: "input",
        unit: "s",
    },
});

export const manifest = {
  "version": 3,
  "name": "Grain drift",
  "isAnimated": true,
  "usesMouse": false,
  "renderScaleAware": true
}
