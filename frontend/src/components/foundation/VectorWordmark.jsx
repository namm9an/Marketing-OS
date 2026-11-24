import { Fragment, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../lib/useMediaQuery';

// Vector Wordmark shader and two-channel atlas technique supplied from Originkit.
// Adaptation: existing typography/palette, pointer-only rendering and readable DOM fallback.
const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;

uniform sampler2D uMap;
uniform vec2 uRes;      // host box, css px
uniform vec2 uAtlas;    // drawn wordmark size, css px
uniform vec2 uPtr;      // eased pointer, screen uv
uniform float uReach;   // reveal radius, as a fraction of the host width
uniform vec3 uText;
uniform vec3 uShade;
uniform vec4 uAccent;   // rig colour; its alpha IS the rig intensity
uniform vec2 uV0;
uniform vec2 uV1;
uniform vec2 uV2;
uniform float uHalf;    // handle half-side, in y-normalised units

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// The source's blur: taps on a ring at even angles, each pushed out by a
// random amount, so six taps read as a soft disc rather than a hexagon.
vec2 blurRG(vec2 uv, float e) {
    vec4 sum = vec4(0.0);
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float th = radians(fi / 6.0 * 360.0);
        vec2 dir = vec2(cos(th), sin(th));
        vec2 off = dir * (hash(vec2(fi, uv.x + uv.y)) + e);
        sum += texture2D(uMap, uv + off * e);
    }
    return (sum / 6.0).rg;
}

// Perpendicular distance to a segment, plus the parameter along it — the
// parameter is what the dash pattern runs on.
vec2 segment(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    vec2 ap = p - a;
    float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
    return vec2(length(ap - ab * t), t);
}

// smoothstep with edge0 > edge1 is UNDEFINED in GLSL — the source's node
// graph writes it that way and gets away with it, raw GLSL does not, and the
// whole rig silently renders nothing. Written as 1 - smoothstep(lo, hi, x).
float stroke(float d, float lw, float px) {
    return 1.0 - smoothstep(lw, lw + px, d);
}

float dashedLine(vec2 p, vec2 a, vec2 b, float lw, float px) {
    vec2 s = segment(p, a, b);
    float dash = step(0.5, fract(s.y * length(b - a) * 100.0));
    return stroke(s.x, lw, px) * dash;
}

float boxEdge(vec2 p, vec2 c, float h, float lw, float px) {
    vec2 q = abs(p - c) - vec2(h);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    return stroke(abs(d), lw, px);
}

void main() {
    float aspect = uRes.x / uRes.y;

    // Centred on both axes.
    vec2 E = (vUv * uRes - (uRes - uAtlas) * 0.5) / uAtlas;
    float inside = step(0.0, E.x) * step(E.x, 1.0) * step(0.0, E.y) * step(E.y, 1.0);
    vec2 safeUv = clamp(E, 0.0, 1.0);

    float b = clamp(1.0 - E.y * 3.5, 0.0, 1.0) * 0.008;
    vec2 soft = blurRG(safeUv, b);
    vec2 sharp = blurRG(safeUv, b * 0.1);

    float d = length((vUv - uPtr) / vec2(1.0, aspect));
    float k = 1.0 - pow(smoothstep(0.0, max(uReach, 1e-4), d), 3.0);

    float mask = mix(soft.r, sharp.g, k) * inside;
    vec3 fill = mix(uShade, uText, smoothstep(0.0, 1.0, E.y));

    // Rig space: x scaled by aspect so a cell and a handle stay square.
    vec2 P = vec2(vUv.x * aspect, vUv.y);
    float px = 1.0 / uRes.y;
    float lw = px * 0.2;
    float lines = max(
        max(dashedLine(P, uV0, uV1, lw, px), dashedLine(P, uV1, uV2, lw, px)),
        dashedLine(P, uV2, uV0, lw, px)
    );
    float boxes = max(
        max(boxEdge(P, uV0, uHalf, lw, px), boxEdge(P, uV1, uHalf, lw, px)),
        boxEdge(P, uV2, uHalf, lw, px)
    );
    float A = max(lines, boxes) * uAccent.a * (1.0 - vUv.y);

    // Everything premultiplied from here, so the canvas composites cleanly
    // over the root background instead of fringing.
    vec4 card = vec4(fill * mask, mask);
    vec4 comp = vec4(uAccent.rgb * A, A) + card * (1.0 - A);

    // The source melts the wordmark's foot into the page by mixing toward an
    // 80%-opaque plate of the background colour. Bottom-anchored that plate
    // sat on the frame edge and was invisible; centred it would be a band of
    // flat colour under the wordmark. Fading the PREMULTIPLIED composite is
    // algebraically the same result over a background-coloured root — check
    // it at any weight — and needs no plate, so the background colour is now
    // only ever the root's CSS background.
    gl_FragColor = comp * pow(clamp(E.y, 0.0, 1.0), 0.7);
}`


function createRenderer(host, canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false,
      stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  } catch { return null; }
  if (!gl) return null;
  const shaders = [];
  let program, buffer, texture;
  function dispose() {
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  }
  try {
    function compile(type, code) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader unavailable');
      shaders.push(shader);
      gl.shaderSource(shader, code);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
      return shader;
    }
    program = gl.createProgram();
    if (!program) throw new Error('Program unavailable');
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
    buffer = gl.createBuffer();
    texture = gl.createTexture();
    if (!buffer || !texture) throw new Error('Graphics resource unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const bounds = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) throw new Error('Empty wordmark');
    const dpr = Math.min(2, window.devicePixelRatio || 1, 4096 / bounds.width, 4096 / bounds.height);
    const atlas = document.createElement('canvas');
    atlas.width = canvas.width = Math.max(1, Math.ceil(bounds.width * dpr));
    atlas.height = canvas.height = Math.max(1, Math.ceil(bounds.height * dpr));
    const ctx = atlas.getContext('2d');
    if (!ctx) throw new Error('Text atlas unavailable');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, atlas.width, atlas.height);
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = 'lighter';
    const font = getComputedStyle(host);
    const fontSize = parseFloat(font.fontSize);
    ctx.font = `${font.fontStyle} ${font.fontWeight} ${fontSize}px ${font.fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const letter of host.querySelectorAll('[data-letter]')) {
      const rect = letter.getBoundingClientRect();
      const metrics = ctx.measureText(letter.textContent);
      const ascent = metrics.fontBoundingBoxAscent || fontSize * .8;
      const descent = metrics.fontBoundingBoxDescent || fontSize * .2;
      const baseline = rect.top - bounds.top + (rect.height - ascent - descent) / 2 + ascent;
      const x = rect.left - bounds.left;
      ctx.fillStyle = '#ff0000';
      ctx.fillText(letter.textContent, x, baseline);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = Math.max(.7, (ascent + descent) * 4 / 440);
      ctx.setLineDash([0, Math.max(2, (ascent + descent) * 12 / 440)]);
      ctx.strokeText(letter.textContent, x, baseline);
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const uniforms = Object.fromEntries(['Map', 'Res', 'Atlas', 'Ptr', 'Reach', 'Text', 'Shade', 'Accent', 'V0', 'V1', 'V2', 'Half']
      .map(name => [name, gl.getUniformLocation(program, `u${name}`)]));
    const rgb = color => (color.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(value => Number(value) / 255);
    const ink = rgb(font.color);
    const accent = rgb(getComputedStyle(host.querySelector('.vector-wordmark-label')).color);

    return { dispose, draw(clientX, clientY) {
      if (gl.isContextLost()) throw new Error('Graphics context lost');
      const rect = host.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width, y = 1 - (clientY - rect.top) / rect.height;
      const aspect = bounds.width / bounds.height;
      // Scale the supplied source's lattice to our existing one-line hero footprint.
      const cw = fontSize * .9 / bounds.height, ch = cw * .6;
      const cx = Math.floor(x * aspect / cw), cy = Math.floor(y / ch);
      const cells = [];
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const vx = (cx + i + .5) * cw, vy = (cy + j + .5) * ch;
        cells.push({ x: vx, y: vy, d: Math.hypot(vx - x * aspect, vy - y) });
      }
      cells.sort((a, b) => a.d - b.d);
      const verts = cells.slice(1, 4);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform1i(uniforms.Map, 0);
      gl.uniform2f(uniforms.Res, bounds.width, bounds.height);
      gl.uniform2f(uniforms.Atlas, bounds.width, bounds.height);
      gl.uniform2f(uniforms.Ptr, x, y);
      gl.uniform1f(uniforms.Reach, Math.min(290, fontSize * 1.25) / bounds.width);
      gl.uniform3f(uniforms.Text, ...ink);
      gl.uniform3f(uniforms.Shade, ...ink);
      gl.uniform4f(uniforms.Accent, ...accent, .85);
      verts.forEach((vertex, index) => gl.uniform2f(uniforms[`V${index}`], vertex.x, vertex.y));
      const half = Math.max(16, Math.min(42, fontSize * .23)) / 2;
      gl.uniform1f(uniforms.Half, half / bounds.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return verts.map(vertex => ({ x: vertex.x / aspect * bounds.width - half,
        y: (1 - vertex.y) * bounds.height - half,
        text: `${Math.round(Math.max(0, Math.min(100, vertex.x / aspect * 100)))}, ${Math.round(Math.max(0, Math.min(100, vertex.y * 100)))}` }));
    } };
  } catch {
    dispose();
    return null;
  }
}

export default function VectorWordmark({ text }) {
  const host = useRef(null), canvas = useRef(null), labels = useRef([]);
  const renderer = useRef(null), frame = useRef(0), pointer = useRef(null);
  const blocked = useRef(false);
  const [state, setState] = useState('static');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  function stop() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    pointer.current = null;
    setState('static');
  }
  function release() {
    stop();
    renderer.current?.dispose();
    renderer.current = null;
  }

  useEffect(() => {
    const layer = canvas.current;
    let alive = true;
    blocked.current = false;
    release();
    function lost(event) {
      event.preventDefault();
      release();
      blocked.current = true;
      setState('unavailable');
    }
    function restored() {
      blocked.current = false;
      release();
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(release);
    observer?.observe(host.current);
    window.addEventListener('resize', release);
    window.addEventListener('scroll', stop, { passive: true });
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    layer.addEventListener('webglcontextlost', lost);
    layer.addEventListener('webglcontextrestored', restored);
    document.fonts?.ready.then(() => { if (alive) release(); }, () => {});
    return () => {
      alive = false;
      release();
      observer?.disconnect();
      window.removeEventListener('resize', release);
      window.removeEventListener('scroll', stop);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
      layer.removeEventListener('webglcontextlost', lost);
      layer.removeEventListener('webglcontextrestored', restored);
    };
  }, [reduced, text]);

  function move(event) {
    if (reduced || blocked.current || event.pointerType !== 'mouse' || document.hidden) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (!pointer.current) return;
      renderer.current ??= createRenderer(host.current, canvas.current);
      if (!renderer.current) {
        blocked.current = true;
        setState('unavailable');
        return;
      }
      try {
        const positions = renderer.current.draw(pointer.current.x, pointer.current.y);
        positions.forEach((position, index) => {
          const label = labels.current[index];
          label.style.transform = `translate(${position.x}px, ${position.y}px)`;
          label.textContent = position.text;
        });
        setState('active');
      } catch {
        release();
        blocked.current = true;
        setState('unavailable');
      }
    });
  }

  return <h1 ref={host} className="connected-identity vector-wordmark" aria-label={text} data-wordmark-state={state}
    onPointerMove={move} onPointerLeave={stop} onPointerCancel={stop}>
    {text.split(' ').map((word, wordIndex) => <Fragment key={`${word}-${wordIndex}`}>
      {wordIndex > 0 && ' '}
      <span className="connected-word" aria-hidden="true">
        {Array.from(word, (letter, index) => <span key={index} data-letter={letter}>{letter}</span>)}
      </span>
    </Fragment>)}
    <canvas ref={canvas} className="vector-wordmark-canvas" data-renderer="webgl" aria-hidden="true" />
    {[0, 1, 2].map(index => <span key={index} ref={node => { labels.current[index] = node; }}
      className="vector-wordmark-label" aria-hidden="true" />)}
  </h1>;
}
